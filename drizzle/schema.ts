import { createId } from "@paralleldrive/cuid2";
import {
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const subscriptions = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  charges:
    jsonb("charges").$type<
      Array<{ amount: number; dayOfMonth: number; startDate: string }>
    >(),
  currency: varchar("currency", { length: 10 }).notNull(),
  recurringDuration: varchar("recurring_duration", { length: 20 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
