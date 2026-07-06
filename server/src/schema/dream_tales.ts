import { pgTable, text, uuid, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { babiesTable } from "./babies";
import { usersTable } from "./users";
import { memoriesTable } from "./memories";

export const dreamTalesTable = pgTable("dream_tales", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id").notNull().references(() => babiesTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  memoryId: uuid("memory_id").references(() => memoriesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  storyText: text("story_text").notNull(),
  storyStyle: text("story_style").notNull().default("bedtime_calm"),
  voiceName: text("voice_name").notNull().default("nova"),
  coverImageUrl: text("cover_image_url"),
  durationSeconds: integer("duration_seconds").notNull().default(180),
  isFavorite: boolean("is_favorite").notNull().default(false),
  language: text("language").notNull().default("english"),
  audioBase64: text("audio_base64"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDreamTaleSchema = createInsertSchema(dreamTalesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDreamTale = z.infer<typeof insertDreamTaleSchema>;
export type DreamTale = typeof dreamTalesTable.$inferSelect;
