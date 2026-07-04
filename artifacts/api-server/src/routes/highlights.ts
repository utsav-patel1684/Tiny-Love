import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  highlightsTable,
  highlightItemsTable,
  memoriesTable,
} from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { createNotification } from "./notifications";

const router: IRouter = Router();

// GET /babies/:babyId/highlights
router.get(
  "/babies/:babyId/highlights",
  requireAuth,
  async (req, res): Promise<void> => {
    const babyId = Array.isArray(req.params.babyId)
      ? req.params.babyId[0]
      : req.params.babyId;

    const highlights = await db
      .select()
      .from(highlightsTable)
      .where(eq(highlightsTable.babyId, babyId));

    const result = await Promise.all(
      highlights.map(async (hl) => {
        const items = await db
          .select()
          .from(highlightItemsTable)
          .where(eq(highlightItemsTable.highlightId, hl.id));

        let memories: (typeof memoriesTable.$inferSelect)[] = [];
        if (items.length > 0) {
          memories = await db
            .select()
            .from(memoriesTable)
            .where(
              inArray(
                memoriesTable.id,
                items.map((i) => i.memoryId)
              )
            );
        }

        return { ...hl, memoryCount: memories.length, memories };
      })
    );

    res.json(result);
  }
);

// POST /babies/:babyId/highlights — body: { name, memoryIds[] }
router.post(
  "/babies/:babyId/highlights",
  requireAuth,
  async (req, res): Promise<void> => {
    const babyId = Array.isArray(req.params.babyId)
      ? req.params.babyId[0]
      : req.params.babyId;
    const { name, memoryIds = [] } = req.body ?? {};

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    // Derive cover from first selected memory
    let coverUrl: string | null = null;
    if (Array.isArray(memoryIds) && memoryIds.length > 0) {
      const [firstMem] = await db
        .select()
        .from(memoriesTable)
        .where(eq(memoriesTable.id, memoryIds[0]));
      coverUrl =
        firstMem?.thumbnailUrl ?? firstMem?.mediaUrl ?? null;
    }

    const [highlight] = await db
      .insert(highlightsTable)
      .values({ babyId, name, coverUrl })
      .returning();

    let memories: (typeof memoriesTable.$inferSelect)[] = [];
    if (Array.isArray(memoryIds) && memoryIds.length > 0) {
      await db.insert(highlightItemsTable).values(
        (memoryIds as string[]).map((memoryId) => ({
          highlightId: highlight.id,
          memoryId,
        }))
      );
      memories = await db
        .select()
        .from(memoriesTable)
        .where(inArray(memoriesTable.id, memoryIds));
    }

    req.log.info({ highlightId: highlight.id }, "Highlight created");

    createNotification(
      req.user!.userId,
      "highlight_created",
      "New Highlight Created",
      `"${name}" — ${memories.length} memory${memories.length !== 1 ? "s" : ""}`,
      { highlightId: highlight.id, babyId }
    );

    res.status(201).json({ ...highlight, memoryCount: memories.length, memories });
  }
);

// DELETE /babies/:babyId/highlights/:highlightId
router.delete(
  "/babies/:babyId/highlights/:highlightId",
  requireAuth,
  async (req, res): Promise<void> => {
    const highlightId = Array.isArray(req.params.highlightId)
      ? req.params.highlightId[0]
      : req.params.highlightId;

    await db
      .delete(highlightsTable)
      .where(eq(highlightsTable.id, highlightId));

    req.log.info({ highlightId }, "Highlight deleted");
    res.status(204).send();
  }
);

export default router;
