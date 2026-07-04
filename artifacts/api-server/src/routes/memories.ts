import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, memoriesTable, reactionsTable, usersTable, babiesTable, familyMembersTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { ObjectStorageService } from "../lib/objectStorage";
import { createNotification } from "./notifications";
import { notifyFamilyOfNewMemory, notifyFamilyOfMemoryEvent } from "../pushService";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// ── Helper: resolve a user's access level to a baby ──────────────────────────
// Returns null if user has no access at all.
// Returns { isOwner: true } for the baby's parent.
// Returns { isOwner: false, canManageContent: boolean } for accepted family members.
async function getBabyAccess(
  babyId: string,
  userId: string
): Promise<{ isOwner: true } | { isOwner: false; canManageContent: boolean } | null> {
  const [baby] = await db
    .select({ parentId: babiesTable.parentId })
    .from(babiesTable)
    .where(eq(babiesTable.id, babyId));

  if (!baby) return null;
  if (baby.parentId === userId) return { isOwner: true };

  const [member] = await db
    .select({ canManageContent: familyMembersTable.canManageContent })
    .from(familyMembersTable)
    .where(
      and(
        eq(familyMembersTable.babyId, babyId),
        eq(familyMembersTable.userId, userId),
        eq(familyMembersTable.inviteStatus, "accepted")
      )
    );

  if (!member) return null;
  return { isOwner: false, canManageContent: member.canManageContent };
}

// POST /memories — create a new memory
router.post("/memories", requireAuth, async (req, res): Promise<void> => {
  const { babyId, type, mediaUrl, thumbnailUrl, caption, category, visibility } = req.body ?? {};
  if (!babyId) {
    res.status(400).json({ error: "babyId is required" });
    return;
  }

  // Permission check: owner or accepted member with canManageContent = true
  const access = await getBabyAccess(babyId, req.user!.userId);
  if (!access) {
    res.status(403).json({ error: "You do not have access to this child's memories" });
    return;
  }
  if (!access.isOwner && !access.canManageContent) {
    res.status(403).json({ error: "You have view-only access and cannot add memories" });
    return;
  }

  // Get uploader name
  const [uploader] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  const contributorName = uploader?.name ?? "Parent";

  const [memory] = await db.insert(memoriesTable).values({
    babyId,
    uploaderId: req.user!.userId,
    type: type ?? "photo",
    mediaUrl: mediaUrl ?? null,
    thumbnailUrl: thumbnailUrl ?? null,
    caption: caption ?? "",
    category: category ?? "Daily Moment",
    visibility: visibility ?? "family",
    contributorName,
  }).returning();

  req.log.info({ memoryId: memory.id }, "Memory created");

  // In-app notification for the uploader only (family members handled inside notifyFamilyOfNewMemory)
  createNotification(
    req.user!.userId,
    "memory_added",
    `Memory saved`,
    memory.caption ? `"${memory.caption.slice(0, 80)}"` : "A new memory was saved",
    {
      memoryId: memory.id,
      babyId,
      mediaUrl: memory.mediaUrl || "",
      thumbnailUrl: memory.thumbnailUrl || "",
      memoryType: memory.type || "",
    }
  );

  // In-app DB notifications + push to all family members (fire-and-forget)
  notifyFamilyOfNewMemory(
    babyId,
    req.user!.userId,
    contributorName,
    memory.caption ?? "",
    memory.id,
    memory.type,
    memory.mediaUrl ?? undefined,
    memory.thumbnailUrl ?? undefined
  ).catch(() => { });

  res.status(201).json(memory);
});

// GET /memories/:id
router.get("/memories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [memory] = await db.select().from(memoriesTable).where(eq(memoriesTable.id, id));
  if (!memory) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }
  res.json(memory);
});

// PATCH /memories/:id — update caption / category
router.patch("/memories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [memory] = await db
    .select({ babyId: memoriesTable.babyId, uploaderId: memoriesTable.uploaderId })
    .from(memoriesTable)
    .where(eq(memoriesTable.id, id));
  if (!memory) { res.status(404).json({ error: "Memory not found" }); return; }

  // Owner of the baby, the memory's uploader, or an accepted member with canManageContent
  const access = await getBabyAccess(memory.babyId, req.user!.userId);
  const isUploader = memory.uploaderId === req.user!.userId;
  if (!access && !isUploader) {
    res.status(403).json({ error: "You do not have access to this child's memories" }); return;
  }
  if (access && !access.isOwner && !access.canManageContent && !isUploader) {
    res.status(403).json({ error: "You have view-only access and cannot edit memories" }); return;
  }

  const { caption, category } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (caption !== undefined) updates.caption = caption;
  if (category !== undefined) updates.category = category;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" }); return;
  }
  const [updated] = await db.update(memoriesTable).set(updates).where(eq(memoriesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Memory not found" }); return; }
  req.log.info({ memoryId: id }, "Memory updated");
  res.json(updated);
});

// DELETE /memories/:id
router.delete("/memories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [memory] = await db
    .select({ babyId: memoriesTable.babyId, uploaderId: memoriesTable.uploaderId })
    .from(memoriesTable)
    .where(eq(memoriesTable.id, id));
  if (!memory) { res.status(404).json({ error: "Memory not found" }); return; }

  // Owner of the baby, the memory's uploader, or an accepted member with canManageContent
  const access = await getBabyAccess(memory.babyId, req.user!.userId);
  const isUploader = memory.uploaderId === req.user!.userId;
  if (!access && !isUploader) {
    res.status(403).json({ error: "You do not have access to this child's memories" }); return;
  }
  if (access && !access.isOwner && !access.canManageContent && !isUploader) {
    res.status(403).json({ error: "You have view-only access and cannot delete memories" }); return;
  }

  const [deleted] = await db
    .delete(memoriesTable)
    .where(eq(memoriesTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Memory not found" }); return; }

  // Best-effort: delete associated media files from storage.
  const toDelete = [deleted.mediaUrl, deleted.thumbnailUrl].filter(Boolean) as string[];
  for (const storedPath of toDelete) {
    objectStorageService.deleteStoredObject(storedPath).catch((err) => {
      req.log.warn({ err, storedPath }, "Failed to delete media file from storage");
    });
  }

  res.sendStatus(204);
});

// POST /memories/:id/reactions — toggle: removes if user already has same emoji, adds otherwise
router.post("/memories/:id/reactions", requireAuth, async (req, res): Promise<void> => {
  const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { emoji = "❤️" } = req.body ?? {};
  const userId = req.user!.userId;

  const [existing] = await db
    .select()
    .from(reactionsTable)
    .where(
      and(
        eq(reactionsTable.memoryId, memoryId),
        eq(reactionsTable.userId, userId),
        eq(reactionsTable.emoji, emoji)
      )
    );

  if (existing) {
    await db.delete(reactionsTable).where(eq(reactionsTable.id, existing.id));
    res.json({ reacted: false });
    return;
  }

  const [reaction] = await db.insert(reactionsTable).values({ memoryId, userId, emoji }).returning();

  // Notify the full family circle (only on add, not remove)
  const [memory] = await db
    .select({ babyId: memoriesTable.babyId, uploaderId: memoriesTable.uploaderId })
    .from(memoriesTable)
    .where(eq(memoriesTable.id, memoryId));

  if (memory) {
    const [actor] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    const actorName = actor?.name ?? "Someone";

    notifyFamilyOfMemoryEvent({
      memoryId,
      babyId: memory.babyId,
      memoryOwnerId: memory.uploaderId,
      actorUserId: userId,
      type: "reaction",
      title: `${emoji} ${actorName} reacted to a memory`,
      body: `${actorName} reacted with ${emoji}`,
    }).catch(() => { });
  }

  res.status(201).json({ reacted: true, reaction });
});

// GET /memories/:id/reactions
router.get("/memories/:id/reactions", requireAuth, async (req, res): Promise<void> => {
  const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const reactions = await db
    .select()
    .from(reactionsTable)
    .where(eq(reactionsTable.memoryId, memoryId));
  res.json(reactions);
});

export default router;
