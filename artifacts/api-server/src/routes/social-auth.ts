import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db, usersTable } from "@workspace/db";
import { signToken } from "../middleware/auth";

const router: IRouter = Router();

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
    createdAt: user.createdAt.toISOString(),
  };
}

// ── POST /auth/social/google ─────────────────────────────────────────────────
// Body: { accessToken: string }
// Verifies token with Google userinfo API, finds/creates user, returns JWT.
router.post("/auth/social/google", async (req, res): Promise<void> => {
  const { accessToken } = req.body ?? {};
  if (!accessToken || typeof accessToken !== "string") {
    res.status(400).json({ error: "accessToken is required" });
    return;
  }

  let googleUser: { sub: string; email: string; name: string; picture?: string };
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      res.status(401).json({ error: "Invalid Google access token" });
      return;
    }
    googleUser = (await response.json()) as typeof googleUser;
  } catch (err) {
    req.log.error({ err }, "Google userinfo fetch failed");
    res.status(502).json({ error: "Failed to verify Google token" });
    return;
  }

  if (!googleUser.email || !googleUser.sub) {
    res.status(400).json({ error: "Google account is missing email or user ID" });
    return;
  }

  const normalizedEmail = googleUser.email.toLowerCase();

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.googleId, googleUser.sub), eq(usersTable.email, normalizedEmail)));

  if (existing) {
    const toUpdate: Partial<typeof usersTable.$inferInsert> = { emailVerified: true };
    if (!existing.googleId) toUpdate.googleId = googleUser.sub;

    const [updated] = await db
      .update(usersTable)
      .set(toUpdate)
      .where(eq(usersTable.id, existing.id))
      .returning();

    const jwt = signToken({ userId: updated.id, email: updated.email });
    req.log.info({ userId: updated.id }, "Google sign-in: existing user");
    res.json({ token: jwt, user: safeUser(updated) });
    return;
  }

  const [created] = await db
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

  const jwt = signToken({ userId: created.id, email: created.email });
  req.log.info({ userId: created.id }, "Google sign-in: new user created");
  res.status(201).json({ token: jwt, user: safeUser(created), isNewUser: true });
});

// ── POST /auth/social/apple ──────────────────────────────────────────────────
// Body: { identityToken, email?, fullName?: { givenName?, familyName? } }
// Verifies Apple identity JWT, finds/creates user, returns JWT.
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

router.post("/auth/social/apple", async (req, res): Promise<void> => {
  const { identityToken, email: bodyEmail, fullName } = req.body ?? {};
  if (!identityToken || typeof identityToken !== "string") {
    res.status(400).json({ error: "identityToken is required" });
    return;
  }

  let appleSub: string;
  let tokenEmail: string | undefined;

  try {
    const { payload } = await jwtVerify(identityToken, appleJwks, {
      issuer: "https://appleid.apple.com",
    });
    if (!payload.sub) throw new Error("Missing sub in Apple token");
    appleSub = payload.sub as string;
    tokenEmail = payload.email as string | undefined;
  } catch (err) {
    req.log.error({ err }, "Apple identity token verification failed");
    res.status(401).json({ error: "Invalid Apple identity token" });
    return;
  }

  const resolvedEmail: string | undefined = tokenEmail ?? bodyEmail ?? undefined;

  const conditions = resolvedEmail
    ? or(eq(usersTable.appleId, appleSub), eq(usersTable.email, resolvedEmail.toLowerCase()))
    : eq(usersTable.appleId, appleSub);

  const [existing] = await db.select().from(usersTable).where(conditions);

  if (existing) {
    const toUpdate: Partial<typeof usersTable.$inferInsert> = { emailVerified: true };
    if (!existing.appleId) toUpdate.appleId = appleSub;

    const [updated] = await db
      .update(usersTable)
      .set(toUpdate)
      .where(eq(usersTable.id, existing.id))
      .returning();

    const jwt = signToken({ userId: updated.id, email: updated.email });
    req.log.info({ userId: updated.id }, "Apple sign-in: existing user");
    res.json({ token: jwt, user: safeUser(updated) });
    return;
  }

  if (!resolvedEmail) {
    res.status(400).json({ error: "Apple account email is required for first sign-in" });
    return;
  }

  const givenName = (fullName?.givenName ?? "").trim();
  const familyName = (fullName?.familyName ?? "").trim();
  const resolvedName = [givenName, familyName].filter(Boolean).join(" ") || resolvedEmail.split("@")[0];

  const [created] = await db
    .insert(usersTable)
    .values({
      email: resolvedEmail.toLowerCase(),
      name: resolvedName,
      appleId: appleSub,
      emailVerified: true,
      authProvider: "apple",
      passwordHash: null,
    })
    .returning();

  const jwt = signToken({ userId: created.id, email: created.email });
  req.log.info({ userId: created.id }, "Apple sign-in: new user created");
  res.status(201).json({ token: jwt, user: safeUser(created), isNewUser: true });
});

export default router;
