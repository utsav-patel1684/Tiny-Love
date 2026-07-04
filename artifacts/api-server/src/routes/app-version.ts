import { Router, type IRouter } from "express";
import { db, appVersionsTable } from "@workspace/db";

const router: IRouter = Router();

// ── GET /app-version ─────────────────────────────────────────────────────────
// Public endpoint — no auth required.
// Returns the current iOS/Android minimum versions and force-update flags.
// Mobile calls this on every launch before rendering the app.
router.get("/app-version", async (req, res): Promise<void> => {
  const rows = await db.select().from(appVersionsTable).limit(1);

  if (rows.length === 0) {
    // No config row yet — default to no forced update
    res.json({
      iosVersion: "1.0.0",
      androidVersion: "1.0.0",
      iosForceUpdate: false,
      androidForceUpdate: false,
    });
    return;
  }

  const row = rows[0];
  res.json({
    iosVersion: row.iosVersion,
    androidVersion: row.androidVersion,
    iosForceUpdate: row.iosForceUpdate,
    androidForceUpdate: row.androidForceUpdate,
  });
});

export default router;
