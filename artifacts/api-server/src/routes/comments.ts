import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, commentsTable, commentLikesTable, usersTable, memoriesTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { notifyFamilyOfMemoryEvent } from "../pushService";

const router: IRouter = Router();

// GET /memories/:id/comments — fetch threaded comments with like counts
router.get("/memories/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const currentUserId = req.user!.userId;

  const allComments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.memoryId, memoryId))
    .orderBy(commentsTable.createdAt);

  if (allComments.length === 0) {
    res.json([]);
    return;
  }

  const likeRows = await db
    .select({ commentId: commentLikesTable.commentId, userId: commentLikesTable.userId })
    .from(commentLikesTable)
    .innerJoin(commentsTable, eq(commentLikesTable.commentId, commentsTable.id))
    .where(eq(commentsTable.memoryId, memoryId));

  const likeCounts: Record<string, number> = {};
  const likedByMe: Record<string, boolean> = {};
  for (const row of likeRows) {
    likeCounts[row.commentId] = (likeCounts[row.commentId] ?? 0) + 1;
    if (row.userId === currentUserId) likedByMe[row.commentId] = true;
  }

  interface CommentOut {
    id: string;
    memoryId: string;
    userId: string;
    parentCommentId: string | null;
    authorName: string;
    text: string;
    likeCount: number;
    likedByMe: boolean;
    createdAt: string;
    updatedAt: string;
    replies: CommentOut[];
  }

  const flat: CommentOut[] = allComments.map((c) => ({
    id: c.id,
    memoryId: c.memoryId,
    userId: c.userId,
    parentCommentId: c.parentCommentId,
    authorName: c.authorName,
    text: c.text,
    likeCount: likeCounts[c.id] ?? 0,
    likedByMe: likedByMe[c.id] ?? false,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    replies: [],
  }));

  const byId = new Map(flat.map((c) => [c.id, c]));
  const roots: CommentOut[] = [];
  for (const c of flat) {
    if (!c.parentCommentId) {
      roots.push(c);
    } else {
      byId.get(c.parentCommentId)?.replies.push(c);
    }
  }

  res.json(roots);
});

// POST /memories/:id/comments — add a top-level comment or a reply
router.post("/memories/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { text, parentCommentId } = req.body ?? {};
  const actorId = req.user!.userId;

  if (!text?.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, actorId));
  const authorName = user?.name ?? "Family Member";

  const [comment] = await db.insert(commentsTable).values({
    memoryId,
    userId: actorId,
    parentCommentId: parentCommentId ?? null,
    authorName,
    text: text.trim(),
  }).returning();

  req.log.info({ commentId: comment.id }, "Comment created");

  // Resolve memory once for both paths
  const [memory] = await db
    .select({ babyId: memoriesTable.babyId, uploaderId: memoriesTable.uploaderId })
    .from(memoriesTable)
    .where(eq(memoriesTable.id, memoryId));

  if (memory) {
    if (parentCommentId) {
      // Reply → notify full family + the parent comment's author
      const [parentComment] = await db
        .select({ userId: commentsTable.userId })
        .from(commentsTable)
        .where(eq(commentsTable.id, parentCommentId));

      notifyFamilyOfMemoryEvent({
        memoryId,
        babyId: memory.babyId,
        memoryOwnerId: memory.uploaderId,
        actorUserId: actorId,
        type: "comment_reply",
        title: `↩️ ${authorName} replied to a comment`,
        body: `"${text.trim().slice(0, 80)}"`,
        extraRecipientIds: parentComment ? [parentComment.userId] : [],
      }).catch(() => {});
    } else {
      // Top-level comment → notify full family
      notifyFamilyOfMemoryEvent({
        memoryId,
        babyId: memory.babyId,
        memoryOwnerId: memory.uploaderId,
        actorUserId: actorId,
        type: "comment",
        title: `💬 ${authorName} commented on a memory`,
        body: `"${text.trim().slice(0, 80)}"`,
      }).catch(() => {});
    }
  }

  res.status(201).json({
    ...comment,
    likeCount: 0,
    likedByMe: false,
    replies: [],
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  });
});

// PATCH /comments/:id — edit own comment
router.patch("/comments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { text } = req.body ?? {};

  if (!text?.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const [existing] = await db.select().from(commentsTable).where(eq(commentsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  if (existing.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(commentsTable)
    .set({ text: text.trim(), updatedAt: new Date() })
    .where(eq(commentsTable.id, id))
    .returning();

  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// DELETE /comments/:id — delete own comment (cascades to replies + likes)
router.delete("/comments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [existing] = await db.select().from(commentsTable).where(eq(commentsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  if (existing.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.parentCommentId, id));
  await db.delete(commentsTable).where(eq(commentsTable.id, id));

  res.sendStatus(204);
});

// POST /comments/:id/likes — toggle like / unlike
router.post("/comments/:id/likes", requireAuth, async (req, res): Promise<void> => {
  const commentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user!.userId;

  const [existing] = await db
    .select()
    .from(commentLikesTable)
    .where(and(eq(commentLikesTable.commentId, commentId), eq(commentLikesTable.userId, userId)));

  if (existing) {
    await db.delete(commentLikesTable).where(eq(commentLikesTable.id, existing.id));
    res.json({ liked: false });
    return;
  }

  await db.insert(commentLikesTable).values({ commentId, userId });

  // Notify the full family circle + the comment author (only on like, not unlike)
  const [comment] = await db
    .select({
      userId: commentsTable.userId,
      authorName: commentsTable.authorName,
      memoryId: commentsTable.memoryId,
    })
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId));

  if (comment) {
    const [memory] = await db
      .select({ babyId: memoriesTable.babyId, uploaderId: memoriesTable.uploaderId })
      .from(memoriesTable)
      .where(eq(memoriesTable.id, comment.memoryId));

    if (memory) {
      const [liker] = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, userId));
      const likerName = liker?.name ?? "Someone";

      notifyFamilyOfMemoryEvent({
        memoryId: comment.memoryId,
        babyId: memory.babyId,
        memoryOwnerId: memory.uploaderId,
        actorUserId: userId,
        type: "comment_like",
        title: `❤️ ${likerName} liked a comment`,
        body: `${likerName} liked a comment on a memory`,
        extraRecipientIds: [comment.userId], // always include comment author
      }).catch(() => {});
    }
  }

  res.json({ liked: true });
});

export default router;
