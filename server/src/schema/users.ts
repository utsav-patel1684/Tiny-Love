import { pgTable, text, uuid, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  emailVerified: boolean("email_verified").notNull().default(false),
  authProvider: text("auth_provider").notNull().default("email"),
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  preferredStoryLanguage: text("preferred_story_language").notNull().default("english"),
  preferredVoice: text("preferred_voice").notNull().default("nova"),
  preferredDuration: integer("preferred_duration").notNull().default(5),
  subscriptionStatus: text("subscription_status").notNull().default("free"),
  trialStartDate: timestamp("trial_start_date", { withTimezone: true }),
  trialEndDate: timestamp("trial_end_date", { withTimezone: true }),
  appVersion: text("app_version"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
