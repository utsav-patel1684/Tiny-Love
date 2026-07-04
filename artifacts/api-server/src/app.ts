import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Replit (and most cloud platforms) sit behind a reverse proxy that sets
// X-Forwarded-For. Tell Express to trust it so rate-limit can identify
// real client IPs instead of the proxy IP.
app.set("trust proxy", 1);

// ── Rate limiting ─────────────────────────────────────────────────────────────
//
// General API limit — applies to every endpoint.
// 300 requests per minute per IP is generous for normal usage
// but blocks runaway clients or basic scraping.
const generalLimiter = rateLimit({
  windowMs: 60_000,       // 1-minute sliding window
  max: 300,               // max requests per IP per window
  standardHeaders: true,  // sends X-RateLimit-* headers so clients know their limit
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// OTP/auth limit — tighter, applied only to sensitive auth endpoints.
// Prevents brute-forcing OTP codes (1M guesses → 1 per minute = 19 years)
// and stops someone burning your Resend quota with fake registrations.
const authLimiter = rateLimit({
  windowMs: 60_000,       // 1-minute window
  max: 10,                // max 10 auth attempts per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a minute and try again." },
});

app.use("/api", generalLimiter);

// Tighter limit on the endpoints that send emails or accept OTP codes
app.use("/api/auth/register",       authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/resend-otp",     authLimiter);
app.use("/api/auth/verify-email",   authLimiter);
app.use("/api/auth/verify-otp",     authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static assets (e.g. app icon used in push notification imageUrl)
app.use("/api", express.static(path.join(__dirname, "../public")));

app.use("/api", router);

export default app;
