import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, eq, gt } from "drizzle-orm";
import { db, usersTable, passwordResetTokensTable, appVersionsTable, familyMembersTable } from "@workspace/db";
import { requireAuth, signToken } from "../middleware/auth";
import { sendOtpEmail } from "../services/email";

const router: IRouter = Router();

// ── Server-side Google OAuth session store ────────────────────────────────────
// Holds pending OAuth results keyed by sessionId (TTL 5 min)
interface OAuthResult { token: string; user: object; createdAt: Date }
const oauthSessions = new Map<string, OAuthResult>();
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [k, v] of oauthSessions) {
    if (v.createdAt.getTime() < cutoff) oauthSessions.delete(k);
  }
}, 60_000);

const VALID_LANGUAGES = ["english", "hindi", "gujarati"] as const;
const VALID_VOICES = ["nova", "shimmer", "fable", "alloy"] as const;
const VALID_DURATIONS = [3, 5, 8, 12] as const;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function safeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
    emailVerified: user.emailVerified,
    preferredStoryLanguage: user.preferredStoryLanguage,
    preferredVoice: user.preferredVoice,
    preferredDuration: user.preferredDuration,
    subscriptionStatus: user.subscriptionStatus,
    trialStartDate: user.trialStartDate?.toISOString() ?? null,
    trialEndDate: user.trialEndDate?.toISOString() ?? null,
    appVersion: user.appVersion ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

// ── POST /auth/register ──────────────────────────────────────────────────────
// Creates the account, sends an OTP email for verification.
// Returns { requiresVerification: true, email } on success.
// If email delivery fails AND NODE_ENV !== "production", also returns devCode
// so the OTP screen can display the code for testing without email.
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing.length > 0) {
    const existingUser = existing[0];
    if (existingUser.emailVerified) {
      // Already verified — cannot re-register
      res.status(409).json({ error: "An account with this email already exists. Please log in." });
      return;
    }
    // Pending verification — resend a fresh OTP and let them continue
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(passwordResetTokensTable).values({ email: existingUser.email, otp, expiresAt });
    let devCode: string | undefined;
    try {
      await sendOtpEmail(existingUser.email, otp, "verify");
      req.log.info({ userId: existingUser.id }, "OTP resent for pending-verification account on re-register");
    } catch (err) {
      req.log.error({ err, userId: existingUser.id }, "OTP email failed on re-register");
      if (process.env.NODE_ENV !== "production") {
        devCode = otp;
        req.log.warn({ otp }, `[DEV] OTP for ${existingUser.email} — email not delivered`);
      }
    }
    res.status(200).json({ requiresVerification: true, email: existingUser.email, devCode });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase().trim(),
    passwordHash,
    name: name.trim(),
  }).returning();

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(passwordResetTokensTable).values({ email: user.email, otp, expiresAt });

  let devCode: string | undefined;
  try {
    await sendOtpEmail(user.email, otp, "verify");
    req.log.info({ userId: user.id }, "User registered, OTP email sent");
  } catch (err) {
    req.log.error({ err, userId: user.id }, "OTP email failed on register");
    if (process.env.NODE_ENV !== "production") {
      devCode = otp;
      req.log.warn({ otp }, `[DEV] OTP for ${user.email} — email not delivered`);
    }
  }

  res.status(201).json({ requiresVerification: true, email: user.email, devCode });
});

// ── POST /auth/verify-email ──────────────────────────────────────────────────
// Verifies the 6-digit OTP. On success returns JWT token + user.
router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const { email, otp } = req.body ?? {};
  if (!email || !otp) {
    res.status(400).json({ error: "email and otp are required" });
    return;
  }
  const [token] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.email, email.toLowerCase().trim()),
        eq(passwordResetTokensTable.otp, String(otp)),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      )
    )
    .orderBy(passwordResetTokensTable.createdAt);

  if (!token || token.usedAt) {
    res.status(400).json({ error: "Invalid or expired code. Please try again." });
    return;
  }

  await db
    .update(passwordResetTokensTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokensTable.id, token.id));

  const [user] = await db
    .update(usersTable)
    .set({ emailVerified: true })
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const jwt = signToken({ userId: user.id, email: user.email });
  req.log.info({ userId: user.id }, "Email verified");
  res.json({ token: jwt, user: safeUser(user) });
});

// ── POST /auth/resend-otp ────────────────────────────────────────────────────
// Sends a fresh OTP to the given email (for both verify-email and forgot-password).
router.post("/auth/resend-otp", async (req, res): Promise<void> => {
  const { email, purpose } = req.body ?? {};
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const resolvedPurpose: "verify" | "reset" = purpose === "reset" ? "reset" : "verify";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user) {
    // Don't reveal whether the email exists
    res.json({ message: "If that email is registered, a new code has been sent." });
    return;
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(passwordResetTokensTable).values({
    email: user.email,
    otp,
    expiresAt,
  });

  try {
    await sendOtpEmail(user.email, otp, resolvedPurpose);
  } catch {
    res.status(500).json({ error: "Failed to send email. Please try again." });
    return;
  }

  req.log.info({ email: user.email, purpose: resolvedPurpose }, "OTP resent");
  res.json({ message: "A new code has been sent to your email." });
});

// ── POST /auth/login ─────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.emailVerified) {
    res.status(403).json({
      error: "Your email is not verified. Please verify your email first.",
      requiresVerification: true,
      email: user.email,
    });
    return;
  }

  const jwt = signToken({ userId: user.id, email: user.email });
  req.log.info({ userId: user.id }, "User logged in");
  res.json({ token: jwt, user: safeUser(user) });
});

// ── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(safeUser(user));
});

// ── PATCH /auth/me ────────────────────────────────────────────────────────────
router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { preferredStoryLanguage, preferredVoice, preferredDuration, subscriptionAction, appVersion } = req.body ?? {};

  if (preferredStoryLanguage !== undefined && !VALID_LANGUAGES.includes(preferredStoryLanguage)) {
    res.status(400).json({ error: "Invalid language. Must be: english, hindi, gujarati" });
    return;
  }
  if (preferredVoice !== undefined && !VALID_VOICES.includes(preferredVoice)) {
    res.status(400).json({ error: "Invalid voice" });
    return;
  }
  if (preferredDuration !== undefined && !VALID_DURATIONS.includes(preferredDuration)) {
    res.status(400).json({ error: "Invalid duration. Must be: 3, 5, 8, or 12" });
    return;
  }

  let subscriptionFields: Partial<typeof usersTable.$inferInsert> = {};
  if (subscriptionAction === "start_trial") {
    const now = new Date();
    subscriptionFields = {
      subscriptionStatus: "trial_active",
      trialStartDate: now,
      trialEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    };
  } else if (subscriptionAction === "activate_premium") {
    subscriptionFields = { subscriptionStatus: "premium_active" };
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(preferredStoryLanguage !== undefined && { preferredStoryLanguage }),
      ...(preferredVoice !== undefined && { preferredVoice }),
      ...(preferredDuration !== undefined && { preferredDuration }),
      ...(appVersion !== undefined && { appVersion: String(appVersion) }),
      ...subscriptionFields,
    })
    .where(eq(usersTable.id, req.user!.userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  req.log.info({ userId: updated.id, subscriptionAction }, "User settings updated");
  res.json(safeUser(updated));
});

// ── POST /auth/forgot-password ────────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user) {
    res.json({ message: "If that email is registered, a reset code has been sent." });
    return;
  }
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(passwordResetTokensTable).values({ email: user.email, otp, expiresAt });

  try {
    await sendOtpEmail(user.email, otp, "reset");
  } catch {
    res.status(500).json({ error: "Failed to send email. Please try again." });
    return;
  }

  req.log.info({ email: user.email }, "Password reset OTP sent");
  res.json({ message: "A reset code has been sent to your email." });
});

// ── POST /auth/verify-otp ─────────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const { email, otp } = req.body ?? {};
  if (!email || !otp) {
    res.status(400).json({ error: "email and otp are required" });
    return;
  }
  const [token] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.email, email.toLowerCase().trim()),
        eq(passwordResetTokensTable.otp, String(otp)),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      )
    )
    .orderBy(passwordResetTokensTable.createdAt);

  if (!token || token.usedAt) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }
  res.json({ valid: true });
});

// ── POST /auth/reset-password ──────────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { email, otp, newPassword } = req.body ?? {};
  if (!email || !otp || !newPassword) {
    res.status(400).json({ error: "email, otp, and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const [token] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.email, email.toLowerCase().trim()),
        eq(passwordResetTokensTable.otp, String(otp)),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      )
    )
    .orderBy(passwordResetTokensTable.createdAt);

  if (!token || token.usedAt) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.email, email.toLowerCase().trim()));
  await db.update(passwordResetTokensTable).set({ usedAt: new Date() }).where(eq(passwordResetTokensTable.id, token.id));

  req.log.info({ email }, "Password reset successful");
  res.json({ message: "Password reset successfully." });
});

// ── DELETE /api/auth/account ──────────────────────────────────────────────────
// Permanently deletes the authenticated user and all their data.
// Deletion order:
//  1. familyMembersTable rows where userId = req.user (no FK, must be manual)
//  2. passwordResetTokensTable rows for this email (text ref, must be manual)
//  3. usersTable row — cascades to babies → memories → everything else
router.delete("/auth/account", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  // Fetch email before deletion for password_reset_tokens cleanup
  const [user] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" }); return;
  }

  // 1. Remove family memberships on other people's babies (no FK cascade)
  await db.delete(familyMembersTable).where(eq(familyMembersTable.userId, userId));

  // 2. Remove OTP/reset tokens tied to this email (text reference, no FK cascade)
  await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.email, user.email));

  // 3. Delete the user — DB cascades handle everything else:
  //    users → babies (parentId cascade) → memories, invites, family_members (babyId cascade)
  //                                       → reactions, comments, comment_likes (userId / memoryId cascade)
  //    users → notifications, push_tokens, reactions, comments, dream_tales (userId cascade)
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  req.log.info({ userId }, "Account deleted");
  res.json({ message: "Account deleted successfully" });
});

// ── GET /auth/google/start ────────────────────────────────────────────────────
// Opens Google OAuth. Mobile calls this in a browser, passes sessionId so it
// can poll for the result afterwards.
function getServerOrigin(): string {
  // REPLIT_DOMAINS is comma-separated; first entry is the active preview/prod domain.
  const first = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (first) return `https://${first}`;
  return "https://tinylove.replit.app";
}

router.get("/auth/google/start", (req, res): void => {
  const { sessionId } = req.query as Record<string, string>;
  if (!sessionId) { res.status(400).send("sessionId required"); return; }

  const redirectUri = `${getServerOrigin()}/api/auth/callback/google`;
  const state = Buffer.from(JSON.stringify({ sessionId, redirectUri })).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_WEB_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /auth/callback/google ─────────────────────────────────────────────────
// Google redirects here after the user picks an account.
// Exchanges the code, finds/creates the user, stores the JWT for the mobile
// to pick up via /auth/google/result, then shows a success page.
router.get("/auth/callback/google", async (req, res): Promise<void> => {
  const { code, state, error } = req.query as Record<string, string>;

  const errorPage = (msg: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Sign-in failed</title>
<style>body{font-family:-apple-system,sans-serif;text-align:center;padding:60px 20px;background:#FDFBF7}</style>
</head><body><h2>❌ Sign-in failed</h2><p>${msg}</p><p>Please close this tab and try again.</p></body></html>`;

  if (error || !code || !state) {
    res.status(400).send(errorPage(error ?? "Missing parameters")); return;
  }

  let sessionId: string; let redirectUri: string;
  try {
    const d = JSON.parse(Buffer.from(state, "base64url").toString());
    sessionId = d.sessionId; redirectUri = d.redirectUri;
  } catch { res.status(400).send(errorPage("Invalid state")); return; }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, grant_type: "authorization_code",
      client_id: process.env.GOOGLE_WEB_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
    }),
  });
  const tokens = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokens.access_token) {
    req.log.error({ err: tokens.error }, "Google token exchange failed");
    res.status(400).send(errorPage("Could not get access token from Google")); return;
  }

  // Fetch Google user info
  const uRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const gu = await uRes.json() as { id: string; email: string; name: string; picture?: string };
  if (!gu.email) { res.status(400).send(errorPage("Google account has no email")); return; }

  const email = gu.email.toLowerCase().trim();

  // Find or create user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, gu.id));
  if (!user) [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (user) {
    if (!user.googleId) {
      [user] = await db.update(usersTable)
        .set({ googleId: gu.id, authProvider: "google", emailVerified: true, profileImage: user.profileImage ?? gu.picture ?? null })
        .where(eq(usersTable.id, user.id)).returning();
    }
  } else {
    [user] = await db.insert(usersTable).values({
      email, name: gu.name ?? email.split("@")[0],
      googleId: gu.id, authProvider: "google", emailVerified: true,
      profileImage: gu.picture ?? null,
    }).returning();
    req.log.info({ userId: user.id }, "New user created via Google OAuth");
  }

  const token = signToken({ userId: user.id, email: user.email });
  oauthSessions.set(sessionId, { token, user: safeUser(user), createdAt: new Date() });
  req.log.info({ userId: user.id }, "Google OAuth callback success");

  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>TinyLove – Signed in</title>
<style>body{font-family:-apple-system,sans-serif;text-align:center;padding:60px 20px;background:#FDFBF7;color:#1a1a1a}
.icon{font-size:64px;margin-bottom:16px}.title{font-size:22px;font-weight:700;color:#5F7A68;margin-bottom:8px}
.sub{font-size:15px;color:#888}</style></head>
<body><div class="icon">✓</div>
<div class="title">Signed in successfully!</div>
<div class="sub">You can now return to the TinyLove app.</div>
</body></html>`);
});

// ── GET /auth/google/result ───────────────────────────────────────────────────
// Mobile polls this every 2 s after opening the browser.
// Returns 202 while pending, 200 with {token,user} on success.
router.get("/auth/google/result", (req, res): void => {
  const { sessionId } = req.query as Record<string, string>;
  if (!sessionId) { res.status(400).json({ error: "sessionId required" }); return; }
  const result = oauthSessions.get(sessionId);
  if (!result) { res.status(202).json({ status: "pending" }); return; }
  oauthSessions.delete(sessionId);
  res.json({ status: "success", token: result.token, user: result.user });
});

// ── POST /auth/social/google ──────────────────────────────────────────────────
// Accepts either:
//   { accessToken }           — OAuth access token (implicit flow)
//   { code, redirectUri }     — Authorization code (code flow, exchanged server-side)
// Returns { token, user, isNewUser }.
router.post("/auth/social/google", async (req, res): Promise<void> => {
  const { accessToken, code, redirectUri, clientId: requestClientId } = req.body ?? {};

  let resolvedAccessToken: string | undefined = accessToken;

  // Exchange authorization code for access token when provided.
  // Use the clientId the mobile sent (it must match what was used in the OAuth request)
  // so the exchange succeeds. Fall back to the env var only if not provided.
  if (!resolvedAccessToken && code && redirectUri) {
    const clientId =
      requestClientId ??
      process.env.GOOGLE_WEB_CLIENT_ID ??
      "446551390804-q6rldv8crpg63c6esil5d319m76lbh4u.apps.googleusercontent.com";
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "authorization_code",
      }),
    });
    const exchanged = await tokenRes.json() as { access_token?: string; error?: string };
    if (!exchanged.access_token) {
      req.log.error({ clientId, err: exchanged.error }, "Google code exchange failed");
      res.status(400).json({ error: "Failed to exchange Google authorization code" });
      return;
    }
    resolvedAccessToken = exchanged.access_token;
  }

  if (!resolvedAccessToken) {
    res.status(400).json({ error: "accessToken or (code + redirectUri) is required" });
    return;
  }

  // Fetch user info from Google
  let googleUser: { id: string; email: string; name: string; picture?: string };
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${resolvedAccessToken}` },
    });
    if (!response.ok) {
      res.status(401).json({ error: "Invalid Google access token" });
      return;
    }
    googleUser = (await response.json()) as typeof googleUser;
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Google user info");
    res.status(502).json({ error: "Failed to verify Google token" });
    return;
  }

  if (!googleUser.email) {
    res.status(400).json({ error: "Google account has no email address" });
    return;
  }

  const email = googleUser.email.toLowerCase().trim();

  // Try to find existing user by googleId first, then by email
  let [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.googleId, googleUser.id));

  if (!existingUser) {
    // Check if an account with this email already exists (email/password signup)
    [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  }

  let user = existingUser;

  if (user) {
    // Link googleId if not already linked
    if (!user.googleId) {
      [user] = await db
        .update(usersTable)
        .set({
          googleId: googleUser.id,
          authProvider: "google",
          emailVerified: true,
          profileImage: user.profileImage ?? googleUser.picture ?? null,
        })
        .where(eq(usersTable.id, user.id))
        .returning();
    }
  } else {
    // Create new user
    [user] = await db
      .insert(usersTable)
      .values({
        email,
        name: googleUser.name ?? email.split("@")[0],
        googleId: googleUser.id,
        authProvider: "google",
        emailVerified: true,
        profileImage: googleUser.picture ?? null,
      })
      .returning();
    req.log.info({ userId: user.id }, "New user created via Google");
  }

  const isNewUser = !existingUser;
  const token = signToken({ userId: user.id, email: user.email });
  req.log.info({ userId: user.id, isNewUser }, "Google social login success");
  res.json({ token, user: safeUser(user), isNewUser });
});

// ── POST /auth/social/apple ───────────────────────────────────────────────────
// Accepts an Apple identity token (JWT), decodes it to get the Apple user ID,
// then finds or creates the local user and returns a JWT.
router.post("/auth/social/apple", async (req, res): Promise<void> => {
  const { identityToken, email: bodyEmail, fullName } = req.body ?? {};
  if (!identityToken) {
    res.status(400).json({ error: "identityToken is required" });
    return;
  }

  // Decode Apple's identity JWT (we trust the token came directly from Apple SDK)
  let applePayload: { sub?: string; email?: string } | null = null;
  try {
    applePayload = jwt.decode(identityToken) as typeof applePayload;
  } catch {
    res.status(400).json({ error: "Invalid Apple identity token" });
    return;
  }

  const payload = applePayload as { sub?: string; email?: string } | null;
  const appleId = payload?.sub;
  if (!appleId) {
    res.status(400).json({ error: "Apple identity token missing sub claim" });
    return;
  }

  // Apple only sends email on first sign-in; fall back to body email
  const rawEmail = (payload?.email) ?? bodyEmail;
  if (!rawEmail) {
    res.status(400).json({ error: "Email is required for Apple sign-in" });
    return;
  }
  const email = rawEmail.toLowerCase().trim();

  const displayName =
    fullName?.givenName && fullName?.familyName
      ? `${fullName.givenName} ${fullName.familyName}`.trim()
      : fullName?.givenName ?? email.split("@")[0];

  // Find existing user by appleId or email
  let [user] = await db.select().from(usersTable).where(eq(usersTable.appleId, appleId));

  if (!user) {
    [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  }

  let isNewUser = false;

  if (user) {
    if (!user.appleId) {
      [user] = await db
        .update(usersTable)
        .set({ appleId, authProvider: "apple", emailVerified: true })
        .where(eq(usersTable.id, user.id))
        .returning();
    }
  } else {
    [user] = await db
      .insert(usersTable)
      .values({
        email,
        name: displayName,
        appleId,
        authProvider: "apple",
        emailVerified: true,
      })
      .returning();
    req.log.info({ userId: user.id }, "New user created via Apple");
    isNewUser = true;
  }

  const token = signToken({ userId: user.id, email: user.email });
  req.log.info({ userId: user.id }, "Apple social login success");
  res.json({ token, user: safeUser(user), isNewUser });
});

export default router;
