import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { commentsTable } from "./comments";
import { usersTable } from "./users";

export const commentLikesTable = pgTable("comment_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().references(() => commentsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.commentId, t.userId)]);

export type CommentLike = typeof commentLikesTable.$inferSelect;
