import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

console.log("⚡ [Server]: RUNNING INTEGRATED DASHBOARD BACKEND");

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
    console.log("⚡ [DB]: Gathering overview matrix and analytics...");
    const [users, babies, memories, comments, reactions, dreamTales, invites] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM babies'),
      pool.query('SELECT COUNT(*) as count FROM memories'),
      pool.query('SELECT COUNT(*) as count FROM comments'),
      pool.query('SELECT COUNT(*) as count FROM reactions'),
      pool.query('SELECT COUNT(*) as count FROM dream_tales'),
      pool.query('SELECT COUNT(*) as count FROM invites'),
    ]);

    // Aggregate daily counts for the charts layout
    const [userGrowthRaw, memoryGrowthRaw] = await Promise.all([
      pool.query(`
        SELECT DATE(created_at)::text as date, COUNT(*) as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),
      pool.query(`
        SELECT DATE(created_at)::text as date, COUNT(*) as count
        FROM memories
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),
    ]);

    res.json({
      counts: {
        users: Number(users.rows[0].count),
        babies: Number(babies.rows[0].count),
        memories: Number(memories.rows[0].count),
        comments: Number(comments.rows[0].count),
        reactions: Number(reactions.rows[0].count),
        dreamTales: Number(dreamTales.rows[0].count),
        invites: Number(invites.rows[0].count),
      },
      charts: {
        userGrowth: userGrowthRaw.rows.map(r => ({ date: r.date, count: Number(r.count) })),
        memoryGrowth: memoryGrowthRaw.rows.map(r => ({ date: r.date, count: Number(r.count) })),
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

    const countRes = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_admin as "isAdmin", u.subscription_status as "subscriptionStatus",
              u.auth_provider as "authProvider", u.app_version as "appVersion",
              u.email_verified as "emailVerified", u.profile_image as "profileImage", u.created_at as "createdAt",
              COUNT(DISTINCT b.id) as "babyCount"
       FROM users u
       LEFT JOIN babies b ON b.parent_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
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

    const countRes = await pool.query('SELECT COUNT(*) FROM babies');
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      `SELECT b.*, u.name as "parentName", u.email as "parentEmail",
              COUNT(DISTINCT m.id) as "memoryCount"
       FROM babies b
       LEFT JOIN users u ON u.id = b.parent_id
       LEFT JOIN memories m ON m.baby_id = b.id
       GROUP BY b.id, u.name, u.email
       ORDER BY b.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
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

    const countRes = await pool.query('SELECT COUNT(*) FROM memories');
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      `SELECT m.*, b.name as "babyName", u.name as "uploaderName", u.email as "uploaderEmail",
              COUNT(DISTINCT r.id) as "reactionCount",
              COUNT(DISTINCT c.id) as "commentCount"
       FROM memories m
       LEFT JOIN babies b ON b.id = m.baby_id
       LEFT JOIN users u ON u.id = m.uploader_id
       LEFT JOIN reactions r ON r.memory_id = m.id
       LEFT JOIN comments c ON c.memory_id = m.id
       GROUP BY m.id, b.name, u.name, u.email
       ORDER BY m.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
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

    const countRes = await pool.query('SELECT COUNT(*) FROM invites');
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      `SELECT i.*, b.name as "babyName"
       FROM invites i
       LEFT JOIN babies b ON b.id = i.baby_id
       ORDER BY i.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
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

    const countRes = await pool.query('SELECT COUNT(*) FROM dream_tales');
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      `SELECT dt.id, dt.title, dt.language, dt.story_style as "storyStyle", dt.voice_name as "voiceName",
              dt.duration_seconds as "durationSeconds", dt.is_favorite as "isFavorite",
              dt.cover_image_url as "coverImageUrl", dt.created_at as "createdAt",
              b.name as "babyName", u.name as "userName", u.email as "userEmail"
       FROM dream_tales dt
       LEFT JOIN babies b ON b.id = dt.baby_id
       LEFT JOIN users u ON u.id = dt.user_id
       ORDER BY dt.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const PORT = 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 [Server]: Listening on port ${PORT}`);
});

setInterval(() => { }, 1000 * 60 * 60);