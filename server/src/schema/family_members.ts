import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { babiesTable } from "./babies";

export const familyMembersTable = pgTable("family_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id").notNull().references(() => babiesTable.id, { onDelete: "cascade" }),
  invitedEmail: text("invited_email"),
  name: text("name").notNull(),
  role: text("role").notNull().default("Grandparent"),
  canManageContent: boolean("can_manage_content").notNull().default(true),
  inviteStatus: text("invite_status").notNull().default("pending"),
  userId: uuid("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembersTable.$inferSelect;
