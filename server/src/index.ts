import express from 'express';
import cors from 'cors';
import { db } from './db.js'; // Using the Drizzle instance
import * as schema from '../src/schema/index.js';// Importing your Drizzle schemas
import { sql, desc, eq } from 'drizzle-orm';

console.log("⚡ [Server]: RUNNING INTEGRATED DASHBOARD BACKEND (DRIZZLE ORM)");

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
app.use(express.json());

// 1. Fully Integrated Overview & Growth Charts Endpoint
app.get('/api/overview', async (_req, res) => {
  try {
    console.log("⚡ [DB]: Gathering overview matrix and analytics via Drizzle...");

    const [users, babies, memories, comments, reactions, dreamTales, invites] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.usersTable),
      db.select({ count: sql<number>`count(*)` }).from(schema.babiesTable),
      db.select({ count: sql<number>`count(*)` }).from(schema.memoriesTable),
      db.select({ count: sql<number>`count(*)` }).from(schema.commentsTable),
      db.select({ count: sql<number>`count(*)` }).from(schema.reactionsTable),
      db.select({ count: sql<number>`count(*)` }).from(schema.dreamTalesTable),
      db.select({ count: sql<number>`count(*)` }).from(schema.invitesTable),
    ]);

    // Aggregate daily counts for the charts layout
    const userGrowthRaw = await db.execute(sql`
      SELECT DATE(created_at)::text as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const memoryGrowthRaw = await db.execute(sql`
      SELECT DATE(created_at)::text as date, COUNT(*) as count
      FROM memories
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      counts: {
        users: Number(users[0]?.count || 0),
        babies: Number(babies[0]?.count || 0),
        memories: Number(memories[0]?.count || 0),
        comments: Number(comments[0]?.count || 0),
        reactions: Number(reactions[0]?.count || 0),
        dreamTales: Number(dreamTales[0]?.count || 0),
        invites: Number(invites[0]?.count || 0),
      },
      charts: {
        userGrowth: userGrowthRaw.rows.map((r: any) => ({ date: r.date, count: Number(r.count) })),
        memoryGrowth: memoryGrowthRaw.rows.map((r: any) => ({ date: r.date, count: Number(r.count) })),
      },
      dbStatus: { connected: true }
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 2. Paginated Users Endpoint
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.usersTable);
    const total = Number(countRes[0]?.count || 0);

    const rows = await db.select({
      id: schema.usersTable.id,
      name: schema.usersTable.name,
      email: schema.usersTable.email,
      // isAdmin: schema.usersTable.isAdmin,
      subscriptionStatus: schema.usersTable.subscriptionStatus,
      authProvider: schema.usersTable.authProvider,
      appVersion: schema.usersTable.appVersion,
      emailVerified: schema.usersTable.emailVerified,
      profileImage: schema.usersTable.profileImage,
      createdAt: schema.usersTable.createdAt,
      babyCount: sql<number>`COUNT(DISTINCT ${schema.babiesTable.id})`
    })
      .from(schema.usersTable)
      .leftJoin(schema.babiesTable, eq(schema.babiesTable.parentId, schema.usersTable.id))
      .groupBy(schema.usersTable.id)
      .orderBy(desc(schema.usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 3. Paginated Babies Endpoint
app.get('/api/babies', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.babiesTable);
    const total = Number(countRes[0]?.count || 0);

    const rows = await db.select({
      id: schema.babiesTable.id,
      name: schema.babiesTable.name,
      parentId: schema.babiesTable.parentId,
      createdAt: schema.babiesTable.createdAt,
      parentName: schema.usersTable.name,
      parentEmail: schema.usersTable.email,
      memoryCount: sql<number>`COUNT(DISTINCT ${schema.memoriesTable.id})`
    })
      .from(schema.babiesTable)
      .leftJoin(schema.usersTable, eq(schema.usersTable.id, schema.babiesTable.parentId))
      .leftJoin(schema.memoriesTable, eq(schema.memoriesTable.babyId, schema.babiesTable.id))
      .groupBy(schema.babiesTable.id, schema.usersTable.name, schema.usersTable.email)
      .orderBy(desc(schema.babiesTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 4. Paginated Memories Endpoint
app.get('/api/memories', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.memoriesTable);
    const total = Number(countRes[0]?.count || 0);

    const rows = await db.select({
      id: schema.memoriesTable.id,
      babyId: schema.memoriesTable.babyId,
      uploaderId: schema.memoriesTable.uploaderId,
      createdAt: schema.memoriesTable.createdAt,
      babyName: schema.babiesTable.name,
      uploaderName: schema.usersTable.name,
      uploaderEmail: schema.usersTable.email,
      reactionCount: sql<number>`COUNT(DISTINCT ${schema.reactionsTable.id})`,
      commentCount: sql<number>`COUNT(DISTINCT ${schema.commentsTable.id})`
    })
      .from(schema.memoriesTable)
      .leftJoin(schema.babiesTable, eq(schema.babiesTable.id, schema.memoriesTable.babyId))
      .leftJoin(schema.usersTable, eq(schema.usersTable.id, schema.memoriesTable.uploaderId))
      .leftJoin(schema.reactionsTable, eq(schema.reactionsTable.memoryId, schema.memoriesTable.id))
      .leftJoin(schema.commentsTable, eq(schema.commentsTable.memoryId, schema.memoriesTable.id))
      .groupBy(schema.memoriesTable.id, schema.babiesTable.name, schema.usersTable.name, schema.usersTable.email)
      .orderBy(desc(schema.memoriesTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 5. Paginated Invites Endpoint
app.get('/api/invites', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.invitesTable);
    const total = Number(countRes[0]?.count || 0);

    const rows = await db.select({
      id: schema.invitesTable.id,
      babyId: schema.invitesTable.babyId,
      token: schema.invitesTable.token,
      role: schema.invitesTable.role,
      canManageContent: schema.invitesTable.canManageContent,
      invitedEmail: schema.invitesTable.invitedEmail,
      usedAt: schema.invitesTable.usedAt,
      expiresAt: schema.invitesTable.expiresAt,
      createdAt: schema.invitesTable.createdAt,
      babyName: schema.babiesTable.name
    })
      .from(schema.invitesTable)
      .leftJoin(schema.babiesTable, eq(schema.babiesTable.id, schema.invitesTable.babyId))
      .orderBy(desc(schema.invitesTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 6. Paginated Dream Tales Endpoint
app.get('/api/dream-tales', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.dreamTalesTable);
    const total = Number(countRes[0]?.count || 0);

    const rows = await db.select({
      id: schema.dreamTalesTable.id,
      title: schema.dreamTalesTable.title,
      language: schema.dreamTalesTable.language,
      storyStyle: schema.dreamTalesTable.storyStyle,
      voiceName: schema.dreamTalesTable.voiceName,
      durationSeconds: schema.dreamTalesTable.durationSeconds,
      isFavorite: schema.dreamTalesTable.isFavorite,
      coverImageUrl: schema.dreamTalesTable.coverImageUrl,
      createdAt: schema.dreamTalesTable.createdAt,
      babyName: schema.babiesTable.name,
      userName: schema.usersTable.name,
      userEmail: schema.usersTable.email
    })
      .from(schema.dreamTalesTable)
      .leftJoin(schema.babiesTable, eq(schema.babiesTable.id, schema.dreamTalesTable.babyId))
      .leftJoin(schema.usersTable, eq(schema.usersTable.id, schema.dreamTalesTable.userId))
      .orderBy(desc(schema.dreamTalesTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Replit uses dynamic process ports or standard mappings
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 [Server]: Listening live on unified port ${PORT}`);
});