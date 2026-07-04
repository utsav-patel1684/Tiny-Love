import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { signToken } from "../middleware/auth";

const router: IRouter = Router();

function getRedirectUri(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  return `https://${domain}/api/auth/google/callback`;
}

// ── GET /auth/google/init ─────────────────────────────────────────────────────
// Opens Google OAuth in the browser. Passes app_callback in state so the
// callback endpoint knows where to deep-link the user back after auth.
router.get("/auth/google/init", (req, res): void => {
  const appCallback = req.query.app_callback as string | undefined;
  if (!appCallback) {
    res.status(400).send("Missing app_callback parameter");
    return;
  }

  const clientId = process.env.GOOGLE_WEB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Google OAuth is not configured");
    return;
  }

  const state = Buffer.from(JSON.stringify({ appCallback })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /auth/google/callback ─────────────────────────────────────────────────
// Receives the authorization code from Google, exchanges it for tokens,
// finds/creates the user, then deep-links back to the app with the JWT.
router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const { code, state, error } = req.query;

  let appCallback = "";
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state as string, "base64url").toString());
      appCallback = decoded.appCallback ?? "";
    }
  } catch {
    // ignore state parse errors
  }

  const fail = (msg: string): void => {
    if (appCallback) {
      res.redirect(`${appCallback}?error=${encodeURIComponent(msg)}`);
    } else {
      res.status(400).send(msg);
    }
  };

  if (error) {
    fail("Google sign-in was cancelled");
    return;
  }
  if (!code) {
    fail("No authorization code received from Google");
    return;
  }

  const clientId = process.env.GOOGLE_WEB_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    fail("Google OAuth is not configured on the server");
    return;
  }

  // Exchange authorization code for access token
  let accessToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(),
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };
    if (tokens.error || !tokens.access_token) {
      req.log.error({ tokens }, "Google token exchange error");
      fail("Google authentication failed — please try again");
      return;
    }
    accessToken = tokens.access_token;
  } catch (err) {
    req.log.error({ err }, "Google token exchange fetch failed");
    fail("Could not reach Google servers — please try again");
    return;
  }

  // Fetch Google user info
  let googleUser: { sub: string; email: string; name: string; picture?: string };
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    googleUser = (await userRes.json()) as typeof googleUser;
  } catch (err) {
    req.log.error({ err }, "Google userinfo fetch failed");
    fail("Could not fetch Google account info — please try again");
    return;
  }

  if (!googleUser.email || !googleUser.sub) {
    fail("Google account is missing required information");
    return;
  }

  const normalizedEmail = googleUser.email.toLowerCase();

  // Find existing user by Google ID or email, or create a new one
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.googleId, googleUser.sub), eq(usersTable.email, normalizedEmail)));

  let user: typeof usersTable.$inferSelect;
  if (existing) {
    const toUpdate: Partial<typeof usersTable.$inferInsert> = { emailVerified: true };
    if (!existing.googleId) toUpdate.googleId = googleUser.sub;
    [user] = await db.update(usersTable).set(toUpdate).where(eq(usersTable.id, existing.id)).returning();
    req.log.info({ userId: user.id }, "Google OAuth: existing user signed in");
  } else {
    [user] = await db
      .insert(usersTable)
      .values({
        email: normalizedEmail,
        name: googleUser.name || normalizedEmail.split("@")[0],
        profileImage: googleUser.picture ?? null,
        googleId: googleUser.sub,
        emailVerified: true,
        authProvider: "google",
        passwordHash: null,
      })
      .returning();
    req.log.info({ userId: user.id }, "Google OAuth: new user created");
  }

  const jwt = signToken({ userId: user.id, email: user.email });

  // Deep-link back to the app with the JWT
  res.redirect(`${appCallback}?token=${encodeURIComponent(jwt)}`);
});

export default router;
