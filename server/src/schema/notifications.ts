import { pgTable, text, uuid, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const NOTIFICATION_TYPES = [
  "memory_added",
  "reaction",
  "comment",
  "comment_reply",
  "comment_like",
  "dream_tale_ready",
  "family_joined",
  "highlight_created",
  "subscription_reminder",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<NotificationType>(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  data: jsonb("data").$type<Record<string, string>>().default({}),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
