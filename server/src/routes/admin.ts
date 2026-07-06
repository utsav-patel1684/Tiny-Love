import { Router } from "express";
import { db } from "../db.js";
import * as schema from '../schema/index.js'; // Adjust the path if necessary to point to your schema folder
import { sql, desc, eq } from "drizzle-orm";

const router = Router();

// 1. Dashboard Overview Statistics
router.get("/overview", async (_req, res) => {
    try {
        const [users, babies, memories, comments, reactions, dreamTales, invites] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(schema.usersTable),
            db.select({ count: sql<number>`count(*)` }).from(schema.babiesTable),
            db.select({ count: sql<number>`count(*)` }).from(schema.memoriesTable),
            db.select({ count: sql<number>`count(*)` }).from(schema.commentsTable),
            db.select({ count: sql<number>`count(*)` }).from(schema.reactionsTable),
            db.select({ count: sql<number>`count(*)` }).from(schema.dreamTalesTable),
            db.select({ count: sql<number>`count(*)` }).from(schema.invitesTable),
        ]);

        // Aggregate 30-day metrics safely using Drizzle execute wrappers
        const userGrowthRaw = await db.execute(sql`
      SELECT DATE(created_at)::text as date, COUNT(*) as count FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date ASC
    `);

        const memoryGrowthRaw = await db.execute(sql`
      SELECT DATE(created_at)::text as date, COUNT(*) as count FROM memories
      WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date ASC
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

export default router;