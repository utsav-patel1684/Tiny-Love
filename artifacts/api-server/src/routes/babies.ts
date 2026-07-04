import { Router, type IRouter } from "express";
import { eq, and, count, desc, inArray } from "drizzle-orm";
import { db, babiesTable, memoriesTable, commentsTable, familyMembersTable, reactionsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /babies — list babies the user owns OR is an accepted family member of
router.get("/babies", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const ownedBabies = await db
    .select()
    .from(babiesTable)
    .where(eq(babiesTable.parentId, userId))
    .orderBy(babiesTable.createdAt);

  const familyRows = await db
    .select({ baby: babiesTable })
    .from(babiesTable)
    .innerJoin(familyMembersTable, eq(familyMembersTable.babyId, babiesTable.id))
    .where(
      and(
        eq(familyMembersTable.userId, userId),
        eq(familyMembersTable.inviteStatus, "accepted")
      )
    )
    .orderBy(babiesTable.createdAt);

  const seen = new Set<string>();
  const all = [...ownedBabies];
  for (const b of familyRows.map((r) => r.baby)) {
    if (!seen.has(b.id)) { seen.add(b.id); all.push(b); }
  }
  for (const b of ownedBabies) { seen.add(b.id); }

  res.json(all);
});

// POST /babies — create a new baby
router.post("/babies", requireAuth, async (req, res): Promise<void> => {
  const { name, dob, profilePhoto } = req.body ?? {};
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [baby] = await db.insert(babiesTable).values({
    parentId: req.user!.userId,
    name: name.trim(),
    dob: dob ?? null,
    profilePhoto: profilePhoto ?? null,
  }).returning();
  req.log.info({ babyId: baby.id }, "Baby created");
  res.status(201).json(baby);
});

// GET /babies/:id
router.get("/babies/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [baby] = await db
    .select()
    .from(babiesTable)
    .where(and(eq(babiesTable.id, id), eq(babiesTable.parentId, req.user!.userId)));
  if (!baby) {
    res.status(404).json({ error: "Baby not found" });
    return;
  }
  res.json(baby);
});

// PATCH /babies/:id
router.patch("/babies/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, dob, profilePhoto } = req.body ?? {};
  const [baby] = await db
    .update(babiesTable)
    .set({ ...(name && { name }), ...(dob !== undefined && { dob }), ...(profilePhoto !== undefined && { profilePhoto }) })
    .where(and(eq(babiesTable.id, id), eq(babiesTable.parentId, req.user!.userId)))
    .returning();
  if (!baby) {
    res.status(404).json({ error: "Baby not found" });
    return;
  }
  res.json(baby);
});

// DELETE /babies/:id — owner only; cascades to memories, reactions, comments etc.
router.delete("/babies/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [deleted] = await db
    .delete(babiesTable)
    .where(and(eq(babiesTable.id, id), eq(babiesTable.parentId, req.user!.userId)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Baby not found or not authorised" });
    return;
  }
  req.log.info({ babyId: deleted.id }, "Baby deleted");
  res.status(204).end();
});

// GET /babies/:id/memories
router.get("/babies/:id/memories", requireAuth, async (req, res): Promise<void> => {
  const babyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user!.userId;

  const memories = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.babyId, babyId))
    .orderBy(desc(memoriesTable.createdAt));

  if (memories.length === 0) {
    res.json([]);
    return;
  }

  const memoryIds = memories.map((m) => m.id);

  // Comment counts
  const countsForBaby = await db
    .select({ memoryId: commentsTable.memoryId, total: count() })
    .from(commentsTable)
    .innerJoin(memoriesTable, eq(commentsTable.memoryId, memoriesTable.id))
    .where(eq(memoriesTable.babyId, babyId))
    .groupBy(commentsTable.memoryId);

  const countMap: Record<string, number> = {};
  for (const row of countsForBaby) {
    countMap[row.memoryId] = Number(row.total);
  }

  // Reaction counts + whether the requesting user has reacted
  const reactions = await db
    .select()
    .from(reactionsTable)
    .where(inArray(reactionsTable.memoryId, memoryIds));

  const heartCountMap: Record<string, number> = {};
  const smileCountMap: Record<string, number> = {};
  const myHeartMap: Record<string, boolean> = {};
  const mySmileMap: Record<string, boolean> = {};
  for (const r of reactions) {
    if (r.emoji === "❤️") {
      heartCountMap[r.memoryId] = (heartCountMap[r.memoryId] ?? 0) + 1;
      if (r.userId === userId) myHeartMap[r.memoryId] = true;
    } else if (r.emoji === "😊") {
      smileCountMap[r.memoryId] = (smileCountMap[r.memoryId] ?? 0) + 1;
      if (r.userId === userId) mySmileMap[r.memoryId] = true;
    }
  }

  res.json(
    memories.map((m) => ({
      ...m,
      commentCount: countMap[m.id] ?? 0,
      heartCount: heartCountMap[m.id] ?? 0,
      smileCount: smileCountMap[m.id] ?? 0,
      myHeart: myHeartMap[m.id] ?? false,
      mySmile: mySmileMap[m.id] ?? false,
    }))
  );
});

export default router;
