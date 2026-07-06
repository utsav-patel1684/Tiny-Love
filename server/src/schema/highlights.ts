import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { babiesTable } from "./babies";
import { memoriesTable } from "./memories";

export const highlightsTable = pgTable("highlights", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .notNull()
    .references(() => babiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const highlightItemsTable = pgTable("highlight_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  highlightId: uuid("highlight_id")
    .notNull()
    .references(() => highlightsTable.id, { onDelete: "cascade" }),
  memoryId: uuid("memory_id")
    .notNull()
    .references(() => memoriesTable.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHighlightSchema = createInsertSchema(highlightsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Highlight = typeof highlightsTable.$inferSelect;
export type HighlightItem = typeof highlightItemsTable.$inferSelect;
