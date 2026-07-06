import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const appVersionsTable = pgTable("app_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  iosVersion: text("ios_version").notNull().default("1.0.0"),
  androidVersion: text("android_version").notNull().default("1.0.0"),
  iosForceUpdate: boolean("ios_force_update").notNull().default(false),
  androidForceUpdate: boolean("android_force_update").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type AppVersion = typeof appVersionsTable.$inferSelect;
