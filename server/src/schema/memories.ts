import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { babiesTable } from "./babies";
import { usersTable } from "./users";

export const memoriesTable = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id").notNull().references(() => babiesTable.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("photo"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption").notNull().default(""),
  category: text("category").notNull().default("Daily Moment"),
  visibility: text("visibility").notNull().default("family"),
  contributorName: text("contributor_name").notNull().default("Parent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMemorySchema = createInsertSchema(memoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memoriesTable.$inferSelect;
