import { pgTable, text, uuid, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const babiesTable = pgTable("babies", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dob: date("dob"),
  profilePhoto: text("profile_photo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBabySchema = createInsertSchema(babiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBaby = z.infer<typeof insertBabySchema>;
export type Baby = typeof babiesTable.$inferSelect;
