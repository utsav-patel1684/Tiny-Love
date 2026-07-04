import { Router, type IRouter } from "express";
import { eq, count, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  babiesTable,
  memoriesTable,
  commentsTable,
  reactionsTable,
  dreamTalesTable,
  invitesTable,
} from "@workspace/db";

const router: IRouter = Router();

// ── Admin: Overview / Dashboard ───────────────────────────────────────────────
router.get("/admin/overview", async (req, res): Promise<void> => {
  try {
    // Get counts
    const [usersCount] = await db
      .select({ count: count() })
      .from(usersTable);

    const [babiesCount] = await db
      .select({ count: count() })
      .from(babiesTable);

    const [memoriesCount] = await db
      .select({ count: count() })
      .from(memoriesTable);

    const [commentsCount] = await db
      .select({ count: count() })
      .from(commentsTable);

    const [reactionsCount] = await db
      .select({ count: count() })
      .from(reactionsTable);

    const [dreamTalesCount] = await db
      .select({ count: count() })
      .from(dreamTalesTable);

    const [invitesCount] = await db
      .select({ count: count() })
      .from(invitesTable);

    res.json({
      users: usersCount.count,
      babies: babiesCount.count,
      memories: memoriesCount.count,
      comments: commentsCount.count,
      reactions: reactionsCount.count,
      dreamTales: dreamTalesCount.count,
      invites: invitesCount.count,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin: Users ──────────────────────────────────────────────────────────────
router.get("/admin/users", async (req, res): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(usersTable);
    const total = totalResult.count;

    // Get paginated users with baby count
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        isAdmin: usersTable.isAdmin,
        subscriptionStatus: usersTable.subscriptionStatus,
        authProvider: usersTable.authProvider,
        appVersion: usersTable.appVersion,
        emailVerified: usersTable.emailVerified,
        profileImage: usersTable.profileImage,
        createdAt: usersTable.createdAt,
        babyCount: count(babiesTable.id),
      })
      .from(usersTable)
      .leftJoin(babiesTable, eq(babiesTable.parentId, usersTable.id))
      .groupBy(usersTable.id)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: users,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin: Babies ─────────────────────────────────────────────────────────────
router.get("/admin/babies", async (req, res): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(babiesTable);
    const total = totalResult.count;

    // Get paginated babies with parent info and memory count
    const babies = await db
      .select({
        id: babiesTable.id,
        name: babiesTable.name,
        dob: babiesTable.dob,
        profilePhoto: babiesTable.profilePhoto,
        createdAt: babiesTable.createdAt,
        parentName: usersTable.name,
        parentEmail: usersTable.email,
        memoryCount: count(memoriesTable.id),
      })
      .from(babiesTable)
      .leftJoin(usersTable, eq(babiesTable.parentId, usersTable.id))
      .leftJoin(memoriesTable, eq(memoriesTable.babyId, babiesTable.id))
      .groupBy(babiesTable.id, usersTable.id)
      .orderBy(desc(babiesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: babies,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/admin/babies/:id", async (req, res): Promise<void> => {
  try {
    const babyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await db.delete(babiesTable).where(eq(babiesTable.id, babyId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin: Memories ───────────────────────────────────────────────────────────
router.get("/admin/memories", async (req, res): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(memoriesTable);
    const total = totalResult.count;

    // Get paginated memories with engagement counts
    const memories = await db
      .select({
        id: memoriesTable.id,
        caption: memoriesTable.caption,
        type: memoriesTable.type,
        mediaUrl: memoriesTable.mediaUrl,
        thumbnailUrl: memoriesTable.thumbnailUrl,
        createdAt: memoriesTable.createdAt,
        babyName: babiesTable.name,
        uploaderName: usersTable.name,
        uploaderEmail: usersTable.email,
        commentCount: count(commentsTable.id),
        reactionCount: count(reactionsTable.id),
      })
      .from(memoriesTable)
      .leftJoin(babiesTable, eq(memoriesTable.babyId, babiesTable.id))
      .leftJoin(usersTable, eq(memoriesTable.uploaderId, usersTable.id))
      .leftJoin(commentsTable, eq(commentsTable.memoryId, memoriesTable.id))
      .leftJoin(reactionsTable, eq(reactionsTable.memoryId, memoriesTable.id))
      .groupBy(memoriesTable.id, babiesTable.id, usersTable.id)
      .orderBy(desc(memoriesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: memories,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/admin/memories/:id", async (req, res): Promise<void> => {
  try {
    const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await db.delete(memoriesTable).where(eq(memoriesTable.id, memoryId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin: Dream Tales ────────────────────────────────────────────────────────
router.get("/admin/dream-tales", async (req, res): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(dreamTalesTable);
    const total = totalResult.count;

    // Get paginated dream tales
    const dreamTales = await db
      .select({
        id: dreamTalesTable.id,
        title: dreamTalesTable.title,
        language: dreamTalesTable.language,
        storyStyle: dreamTalesTable.storyStyle,
        voiceName: dreamTalesTable.voiceName,
        durationSeconds: dreamTalesTable.durationSeconds,
        isFavorite: dreamTalesTable.isFavorite,
        coverImageUrl: dreamTalesTable.coverImageUrl,
        createdAt: dreamTalesTable.createdAt,
        babyName: babiesTable.name,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(dreamTalesTable)
      .leftJoin(babiesTable, eq(dreamTalesTable.babyId, babiesTable.id))
      .leftJoin(usersTable, eq(dreamTalesTable.userId, usersTable.id))
      .orderBy(desc(dreamTalesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: dreamTales,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/admin/dream-tales/:id", async (req, res): Promise<void> => {
  try {
    const taleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await db.delete(dreamTalesTable).where(eq(dreamTalesTable.id, taleId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Admin: Invites ────────────────────────────────────────────────────────────
router.get("/admin/invites", async (req, res): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(invitesTable);
    const total = totalResult.count;

    // Get paginated invites with baby and inviter info
    const invites = await db
      .select({
        id: invitesTable.id,
        token: invitesTable.token,
        inviteStatus: invitesTable.inviteStatus,
        createdAt: invitesTable.createdAt,
        expiresAt: invitesTable.expiresAt,
        babyName: babiesTable.name,
        inviterName: usersTable.name,
      })
      .from(invitesTable)
      .leftJoin(babiesTable, eq(invitesTable.babyId, babiesTable.id))
      .leftJoin(usersTable, eq(invitesTable.inviterId, usersTable.id))
      .orderBy(desc(invitesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: invites,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/admin/invites/:id", async (req, res): Promise<void> => {
  try {
    const inviteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await db.delete(invitesTable).where(eq(invitesTable.id, inviteId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
