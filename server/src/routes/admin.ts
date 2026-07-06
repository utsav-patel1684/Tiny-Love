import { Router } from "express";
import { pool } from "../db.js";

console.log("⚡ [Router]: Admin router module initialized");

const adminRouter = Router();

// Notice this is just "/users", NOT "/api/users"
adminRouter.get("/users", async (req, res) => {
    try {
        console.log("⚡ [DB]: Fetching user records from Neon...");
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const countRes = await pool.query("SELECT COUNT(*) FROM users");
        const total = parseInt(countRes.rows[0].count);

        const { rows } = await pool.query(
            `SELECT id, name, email, is_admin as "isAdmin", created_at as "createdAt"
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("❌ [DB Users Error]:", error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

export default adminRouter;