import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import type { InsertNotification, NotificationType } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// ─── Helper (exported for other routes) ──────────────────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    await db.insert(notificationsTable).values({ userId, type, title, body, data });
  } catch {
    // non-critical — never let notification errors break primary actions
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /notifications — list all for current user
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);
  res.json(notifications);
});

// GET /notifications/unread-count
router.get("/notifications/unread-count", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, req.user!.userId),
        eq(notificationsTable.isRead, false)
      )
    );
  res.json({ count: rows.length });
});

// PATCH /notifications/:id/read — mark one as read
router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.userId, req.user!.userId)
      )
    )
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(updated);
});

// POST /notifications/read-all — mark all as read
router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.userId, req.user!.userId),
        eq(notificationsTable.isRead, false)
      )
    );
  res.json({ ok: true });
});

// DELETE /notifications/:id
router.delete("/notifications/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db
    .delete(notificationsTable)
    .where(
      and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.userId, req.user!.userId)
      )
    );
  res.sendStatus(204);
});

export default router;
