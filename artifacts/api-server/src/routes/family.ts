import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, familyMembersTable, invitesTable, babiesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import crypto from "crypto";

const router: IRouter = Router();

// GET /babies/:babyId/family — list family members
router.get("/babies/:babyId/family", requireAuth, async (req, res): Promise<void> => {
  const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
  const members = await db
    .select()
    .from(familyMembersTable)
    .where(eq(familyMembersTable.babyId, babyId));
  res.json(members);
});

// POST /babies/:babyId/invites — generate invite token
router.post("/babies/:babyId/invites", requireAuth, async (req, res): Promise<void> => {
  const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
  const { role, invitedEmail, canManageContent } = req.body ?? {};

  const token = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invite] = await db.insert(invitesTable).values({
    babyId,
    token,
    role: role ?? "Grandparent",
    canManageContent: canManageContent !== false, // default true
    invitedEmail: invitedEmail ?? null,
    expiresAt,
  }).returning();

  req.log.info({ inviteId: invite.id, token, canManageContent: invite.canManageContent }, "Invite created");
  res.status(201).json({
    ...invite,
    link: `tinylove.app/join/${token}`,
  });
});

// GET /invites/:token — look up invite (also returns babyName for the join screen)
router.get("/invites/:token", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const rows = await db
    .select({
      id: invitesTable.id,
      babyId: invitesTable.babyId,
      token: invitesTable.token,
      role: invitesTable.role,
      canManageContent: invitesTable.canManageContent,
      invitedEmail: invitesTable.invitedEmail,
      usedAt: invitesTable.usedAt,
      expiresAt: invitesTable.expiresAt,
      createdAt: invitesTable.createdAt,
      babyName: babiesTable.name,
      profilePhoto: babiesTable.profilePhoto,
    })
    .from(invitesTable)
    .innerJoin(babiesTable, eq(babiesTable.id, invitesTable.babyId))
    .where(eq(invitesTable.token, token))
    .limit(1);

  const invite = rows[0];
  if (!invite) {
    res.status(404).json({ error: "Invite not found or expired" });
    return;
  }
  if (invite.expiresAt < new Date()) {
    res.status(410).json({ error: "Invite has expired" });
    return;
  }
  if (invite.usedAt) {
    res.status(410).json({ error: "Invite has already been used" });
    return;
  }
  res.json({ ...invite, link: `tinylove.app/join/${token}` });
});

// POST /invites/:token/accept — accept an invite and join the family
router.post("/invites/:token/accept", requireAuth, async (req, res): Promise<void> => {
  try {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const userId = req.user!.userId;

  // Look up invite with baby name and owner in one query
  const rows = await db
    .select({
      id: invitesTable.id,
      babyId: invitesTable.babyId,
      role: invitesTable.role,
      canManageContent: invitesTable.canManageContent,
      usedAt: invitesTable.usedAt,
      expiresAt: invitesTable.expiresAt,
      babyName: babiesTable.name,
      babyOwnerId: babiesTable.parentId,
    })
    .from(invitesTable)
    .innerJoin(babiesTable, eq(babiesTable.id, invitesTable.babyId))
    .where(eq(invitesTable.token, token))
    .limit(1);

  const invite = rows[0];
  if (!invite) {
    res.status(404).json({ error: "Invite not found" });
    return;
  }
  if (invite.expiresAt < new Date()) {
    res.status(410).json({ error: "Invite has expired" });
    return;
  }
  if (invite.usedAt) {
    res.status(410).json({ error: "Invite has already been used" });
    return;
  }

  // Prevent a user from joining using their own invite code
  if (invite.babyOwnerId === userId) {
    res.status(403).json({ error: "You cannot join using your own invite code" });
    return;
  }

  // Get the joining user's display name
  const [user] = await db
    .select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Check user isn't already a member of this baby's family
  const [existing] = await db
    .select({ id: familyMembersTable.id })
    .from(familyMembersTable)
    .where(
      and(
        eq(familyMembersTable.babyId, invite.babyId),
        eq(familyMembersTable.userId, userId)
      )
    );
  if (existing) {
    res.status(409).json({ error: "You are already a member of this family" });
    return;
  }

  // Create the family member record — carry permission level from invite
  const [member] = await db.insert(familyMembersTable).values({
    babyId: invite.babyId,
    name: user.name,
    role: invite.role,
    canManageContent: invite.canManageContent,
    inviteStatus: "accepted",
    userId,
    invitedEmail: user.email,
  }).returning();

  // Mark invite as used
  await db
    .update(invitesTable)
    .set({ usedAt: new Date() })
    .where(eq(invitesTable.id, invite.id));

  req.log.info({ memberId: member.id, babyId: invite.babyId }, "Invite accepted");
  res.status(201).json({ ...member, babyName: invite.babyName });
  } catch (err: unknown) {
    req.log.error({ err }, "Invite accept failed");
    res.status(500).json({ error: "Failed to accept invite" });
  }
});

// PATCH /babies/:babyId/family/:memberId — update permission
router.patch("/babies/:babyId/family/:memberId", requireAuth, async (req, res): Promise<void> => {
  const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
  const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
  const userId = req.user!.userId;

  // Only the baby's owner may change permissions
  const [baby] = await db.select({ parentId: babiesTable.parentId }).from(babiesTable).where(eq(babiesTable.id, babyId));
  if (!baby) { res.status(404).json({ error: "Baby not found" }); return; }
  if (baby.parentId !== userId) { res.status(403).json({ error: "Only the child owner can update permissions" }); return; }

  const { canManageContent } = req.body ?? {};
  if (typeof canManageContent !== "boolean") {
    res.status(400).json({ error: "canManageContent must be a boolean" }); return;
  }

  const [updated] = await db
    .update(familyMembersTable)
    .set({ canManageContent })
    .where(eq(familyMembersTable.id, memberId))
    .returning();

  if (!updated) { res.status(404).json({ error: "Member not found" }); return; }

  req.log.info({ memberId, canManageContent }, "Member permission updated");
  res.json(updated);
});

// DELETE /babies/:babyId/family/:memberId — remove member
router.delete("/babies/:babyId/family/:memberId", requireAuth, async (req, res): Promise<void> => {
  const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
  const [deleted] = await db
    .delete(familyMembersTable)
    .where(eq(familyMembersTable.id, memberId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
