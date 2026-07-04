import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import {
  db,
  pushTokensTable,
  familyMembersTable,
  babiesTable,
  notificationsTable,
} from "@workspace/db";
import type { NotificationType } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "./lib/logger";
import { getFirebaseMessaging } from "./lib/firebase";
import * as http2 from "http2";
import { SignJWT, importPKCS8 } from "jose";

const expo = new Expo();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface TokenRow {
  token: string;
  tokenType: string;
}

// ─── FCM sender (Firebase Admin SDK v1 API — Android only) ───────────────────
// Handles raw Android FCM device tokens (obtained via getDevicePushTokenAsync).
// NOTE: iOS APNs tokens (type "ios") are NOT sent here — FCM's multicast API
// only accepts FCM registration tokens, not raw APNs device tokens.
// iOS is handled separately via sendApnsMessages below.

function getAppIconUrl(): string | undefined {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  return domain ? `https://${domain}/api/icon.png` : undefined;
}

async function sendFcmMessages(
  androidTokens: string[],
  payload: PushPayload
): Promise<void> {
  if (androidTokens.length === 0) return;

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    logger.warn(
      { androidCount: androidTokens.length },
      "FIREBASE_SERVICE_ACCOUNT not set — FCM tokens skipped"
    );
    return;
  }

  const BATCH = 500;
  for (let i = 0; i < androidTokens.length; i += BATCH) {
    const batch = androidTokens.slice(i, i + BATCH);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "default",
            color: "#5F7A68",
            icon: "notification_icon",
            imageUrl: getAppIconUrl(),
          },
        },
      });

      const failures = response.responses.filter((r: { success: boolean }) => !r.success);
      if (failures.length > 0) {
        logger.warn(
          { failures: failures.map((f: { error?: { message?: string } }) => f.error?.message) },
          `${failures.length}/${batch.length} FCM messages failed`
        );
      } else {
        logger.info(`FCM: ${batch.length} messages sent OK`);
      }
    } catch (err) {
      logger.warn({ err }, "FCM sendEachForMulticast failed");
    }
  }
}

// ─── APNs direct sender (iOS) ─────────────────────────────────────────────────
// expo-notifications getDevicePushTokenAsync() on iOS returns the raw APNs
// device token (64-char hex, type "ios"), NOT an FCM registration token.
// FCM's sendEachForMulticast cannot accept these — we must call APNs HTTP/2 API
// directly using Apple's token-based auth (p8 key + JWT).
//
// Required env vars:
//   APNS_KEY     — full p8 private key content (PEM, with -----BEGIN PRIVATE KEY-----)
//   APNS_KEY_ID  — 10-char Key ID from Apple Developer → Certificates, IDs & Profiles
//   APNS_TEAM_ID — 10-char Team ID from Apple Developer membership page

const APNS_BUNDLE_ID = "com.tinylove.app";
const APNS_HOST = process.env.NODE_ENV === "production"
  ? "api.push.apple.com"
  : "api.sandbox.push.apple.com";

let _apnsJwt: { token: string; expiresAt: number } | null = null;
let _apnsPrivateKey: CryptoKey | null = null;

async function getApnsJwt(): Promise<string | null> {
  const p8Key = process.env.APNS_KEY;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  if (!p8Key || !keyId || !teamId) return null;

  const now = Date.now();
  if (_apnsJwt && now < _apnsJwt.expiresAt) return _apnsJwt.token;

  try {
    if (!_apnsPrivateKey) {
      _apnsPrivateKey = await importPKCS8(p8Key, "ES256") as CryptoKey;
    }
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuedAt()
      .setIssuer(teamId)
      .sign(_apnsPrivateKey);
    _apnsJwt = { token, expiresAt: now + 55 * 60 * 1000 };
    return token;
  } catch (err) {
    logger.warn({ err }, "APNs: failed to sign JWT");
    return null;
  }
}

async function sendApnsMessages(iosTokens: string[], payload: PushPayload): Promise<void> {
  if (iosTokens.length === 0) return;

  const jwt = await getApnsJwt();
  if (!jwt) {
    logger.warn(
      { iosCount: iosTokens.length },
      "APNS_KEY/APNS_KEY_ID/APNS_TEAM_ID not set — iOS push skipped. " +
      "Set these env vars with your Apple Developer APNs Auth Key credentials."
    );
    return;
  }

  const apnsBody = JSON.stringify({
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      badge: 1,
    },
    ...(payload.data ?? {}),
  });

  const client = http2.connect(`https://${APNS_HOST}`);
  client.on("error", (err) => logger.warn({ err }, "APNs: HTTP/2 client error"));

  let sent = 0;
  let failed = 0;

  const sendOne = (token: string): Promise<void> =>
    new Promise((resolve) => {
      const req = client.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        ":scheme": "https",
        ":authority": APNS_HOST,
        authorization: `bearer ${jwt}`,
        "apns-push-type": "alert",
        "apns-topic": APNS_BUNDLE_ID,
        "apns-priority": "10",
        "content-type": "application/json",
        "content-length": Buffer.byteLength(apnsBody).toString(),
      });

      req.write(apnsBody);
      req.end();

      let status = 0;
      let body = "";
      req.on("response", (headers) => { status = headers[":status"] as number; });
      req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
      req.on("end", () => {
        if (status === 200) {
          sent++;
        } else {
          failed++;
          logger.warn({ token: `…${token.slice(-8)}`, status, body }, "APNs: notification rejected");
        }
        resolve();
      });
      req.on("error", (err) => {
        failed++;
        logger.warn({ err, token: `…${token.slice(-8)}` }, "APNs: request error");
        resolve();
      });
    });

  try {
    await Promise.all(iosTokens.map(sendOne));
  } finally {
    client.close();
  }

  if (sent > 0) logger.info(`APNs: ${sent} notifications sent OK`);
  if (failed > 0) logger.warn(`APNs: ${failed} notifications failed`);
}

// ─── Expo push sender ─────────────────────────────────────────────────────────

async function sendExpoMessages(tokens: string[], payload: PushPayload): Promise<void> {
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      for (const receipt of receipts) {
        if (receipt.status === "error") {
          logger.warn({ receipt }, "Expo push notification error");
        }
      }
    } catch (err) {
      logger.warn({ err }, "Failed to send Expo push chunk");
    }
  }
}

// ─── Low-level push sender (routes by token type) ────────────────────────────

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (userIds.length === 0) return;

  const tokenRows = (await db
    .select({ token: pushTokensTable.token, tokenType: pushTokensTable.tokenType })
    .from(pushTokensTable)
    .where(inArray(pushTokensTable.userId, userIds))) as TokenRow[];

  if (tokenRows.length === 0) return;

  const expoTokens: string[] = [];
  const androidTokens: string[] = [];
  const iosTokens: string[] = [];

  for (const row of tokenRows) {
    if (Expo.isExpoPushToken(row.token)) {
      expoTokens.push(row.token);
    } else if (row.tokenType === "android") {
      androidTokens.push(row.token);
    } else if (row.tokenType === "ios") {
      iosTokens.push(row.token);
    }
  }

  // Fire all three senders in parallel
  await Promise.all([
    sendExpoMessages(expoTokens, payload),
    sendFcmMessages(androidTokens, payload),
    sendApnsMessages(iosTokens, payload),
  ]);
}

// ─── Family circle resolver ───────────────────────────────────────────────────

async function resolveFamilyCircle(
  babyId: string
): Promise<{ parentId: string; babyName: string; memberUserIds: string[] }> {
  const [baby] = await db
    .select({ parentId: babiesTable.parentId, name: babiesTable.name })
    .from(babiesTable)
    .where(eq(babiesTable.id, babyId));

  if (!baby) throw new Error(`Baby ${babyId} not found`);

  const familyRows = await db
    .select({ userId: familyMembersTable.userId })
    .from(familyMembersTable)
    .where(
      and(
        eq(familyMembersTable.babyId, babyId),
        eq(familyMembersTable.inviteStatus, "accepted")
      )
    );

  const memberUserIds = familyRows
    .map((r) => r.userId)
    .filter((id): id is string => Boolean(id));

  return { parentId: baby.parentId, babyName: baby.name, memberUserIds };
}

// ─── Core family notifier ─────────────────────────────────────────────────────

export interface FamilyEventOpts {
  memoryId: string;
  babyId: string;
  memoryOwnerId: string;
  actorUserId: string;
  type: NotificationType;
  title: string;
  body: string;
  extraRecipientIds?: string[];
  memoryType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
}

export async function notifyFamilyOfMemoryEvent(
  opts: FamilyEventOpts
): Promise<void> {
  try {
    const { parentId, memberUserIds } = await resolveFamilyCircle(opts.babyId);

    const recipientSet = new Set<string>();
    recipientSet.add(opts.memoryOwnerId);
    recipientSet.add(parentId);
    for (const uid of memberUserIds) recipientSet.add(uid);
    for (const uid of opts.extraRecipientIds ?? []) recipientSet.add(uid);
    recipientSet.delete(opts.actorUserId);

    const recipients = [...recipientSet];
    if (recipients.length === 0) return;

    const data: Record<string, string> = {
      memoryId: opts.memoryId,
      babyId: opts.babyId,
      type: opts.type,
      ...(opts.memoryType ? { memoryType: opts.memoryType } : {}),
      ...(opts.mediaUrl ? { mediaUrl: opts.mediaUrl } : {}),
      ...(opts.thumbnailUrl ? { thumbnailUrl: opts.thumbnailUrl } : {}),
    };

    await db.insert(notificationsTable).values(
      recipients.map((userId) => ({
        userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        data,
      }))
    );

    await sendPushToUsers(recipients, { title: opts.title, body: opts.body, data });
  } catch (err) {
    logger.warn({ err, opts }, "notifyFamilyOfMemoryEvent failed");
  }
}

// ─── New memory created ───────────────────────────────────────────────────────

export async function notifyFamilyOfNewMemory(
  babyId: string,
  uploaderUserId: string,
  uploaderName: string,
  caption: string,
  memoryId: string,
  memoryType?: string,
  mediaUrl?: string,
  thumbnailUrl?: string
): Promise<void> {
  try {
    const { babyName } = await resolveFamilyCircle(babyId);
    const title = `📸 ${uploaderName} shared a new memory`;
    const body = caption
      ? `${uploaderName} added a memory of ${babyName} — "${caption.slice(0, 60)}"`
      : `${uploaderName} added a new memory of ${babyName}. Tap to view.`;

    await notifyFamilyOfMemoryEvent({
      memoryId,
      babyId,
      memoryOwnerId: uploaderUserId,
      actorUserId: uploaderUserId,
      type: "memory_added",
      title,
      body,
      memoryType,
      mediaUrl,
      thumbnailUrl,
    });
  } catch (err) {
    logger.warn({ err }, "notifyFamilyOfNewMemory failed");
  }
}
