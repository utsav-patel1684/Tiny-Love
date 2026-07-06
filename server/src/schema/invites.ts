import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { babiesTable } from "./babies";

export const invitesTable = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id").notNull().references(() => babiesTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("Grandparent"),
  canManageContent: boolean("can_manage_content").notNull().default(true),
  invitedEmail: text("invited_email"),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInviteSchema = createInsertSchema(invitesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertInvite = z.infer<typeof insertInviteSchema>;
export type Invite = typeof invitesTable.$inferSelect;
