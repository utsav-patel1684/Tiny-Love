import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, pushTokensTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// POST /push/token — register or update a push token
router.post("/push/token", requireAuth, async (req, res): Promise<void> => {
  const { token, platform, tokenType } = req.body ?? {};
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "token is required" });
    return;
  }

  const resolvedType: string = tokenType ?? "expo";

  // Upsert: update platform/tokenType if the same token re-registers
  // (e.g. app reinstall or user login on same device)
  await db
    .insert(pushTokensTable)
    .values({
      userId: req.user!.userId,
      token,
      platform: platform ?? "unknown",
      tokenType: resolvedType,
    })
    .onConflictDoUpdate({
      target: pushTokensTable.token,
      set: {
        userId: req.user!.userId,
        platform: platform ?? "unknown",
        tokenType: resolvedType,
      },
    });

  req.log.info({ platform, tokenType: resolvedType }, "Push token registered");
  res.json({ ok: true });
});

// DELETE /push/token — unregister on logout
router.delete("/push/token", requireAuth, async (req, res): Promise<void> => {
  const { token } = req.body ?? {};
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  await db
    .delete(pushTokensTable)
    .where(
      and(
        eq(pushTokensTable.token, token),
        eq(pushTokensTable.userId, req.user!.userId)
      )
    );

  res.json({ ok: true });
});

export default router;
