import { and, eq, inArray } from "drizzle-orm";
import { subscriptions } from "../../drizzle/schema";
import { getDb } from "../db";
import type { Subscription } from "../types";
import type { SubscriptionRepository } from "./subscription-service";

function convertToSubscription(
  row: typeof subscriptions.$inferSelect
): Subscription {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    url: row.url || undefined,
    price: Number.parseFloat(row.price),
    charges: row.charges
      ? row.charges.map((c) => ({
          amount: c.amount,
          dayOfMonth: c.dayOfMonth,
          startDate: new Date(c.startDate),
        }))
      : undefined,
    currency: row.currency,
    recurringDuration:
      row.recurringDuration as Subscription["recurringDuration"],
    startDate:
      row.startDate instanceof Date ? row.startDate : new Date(row.startDate),
    createdAt:
      row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

export class NeonSubscriptionRepository implements SubscriptionRepository {
  async getAll(userId: string): Promise<Subscription[]> {
    const db = getDb();
    const results = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    return results.map(convertToSubscription);
  }

  async getById(userId: string, id: string): Promise<Subscription | null> {
    const db = getDb();
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.id, id)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return convertToSubscription(result[0]);
  }

  async create(
    userId: string,
    subscription: Omit<Subscription, "id" | "createdAt">
  ): Promise<Subscription> {
    const db = getDb();
    const [result] = await db
      .insert(subscriptions)
      .values({
        userId,
        title: subscription.title,
        description: subscription.description,
        url: subscription.url,
        price: subscription.price.toString(),
        charges: subscription.charges
          ? subscription.charges.map((c) => ({
              amount: c.amount,
              dayOfMonth: c.dayOfMonth,
              startDate: c.startDate.toISOString(),
            }))
          : null,
        currency: subscription.currency,
        recurringDuration: subscription.recurringDuration,
        startDate: subscription.startDate,
      })
      .returning();

    return convertToSubscription(result);
  }

  async update(
    userId: string,
    id: string,
    updates: Partial<Omit<Subscription, "id" | "createdAt">>
  ): Promise<Subscription> {
    const updateData: Partial<typeof subscriptions.$inferInsert> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.price !== undefined)
      updateData.price = updates.price.toString();
    if (updates.charges !== undefined) {
      updateData.charges = updates.charges.map((c) => ({
        amount: c.amount,
        dayOfMonth: c.dayOfMonth,
        startDate: c.startDate.toISOString(),
      })) as Array<{ amount: number; dayOfMonth: number; startDate: string }>;
    }
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.recurringDuration !== undefined)
      updateData.recurringDuration = updates.recurringDuration;
    if (updates.startDate !== undefined)
      updateData.startDate = updates.startDate;

    const db = getDb();
    const [result] = await db
      .update(subscriptions)
      .set(updateData)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.id, id)))
      .returning();

    if (!result) {
      throw new Error(`Subscription with id ${id} not found`);
    }

    return convertToSubscription(result);
  }

  async delete(userId: string, id: string): Promise<void> {
    const db = getDb();
    await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.id, id)));
  }

  async bulkCreate(
    userId: string,
    subscriptionsToCreate: Omit<Subscription, "id" | "createdAt">[]
  ): Promise<Subscription[]> {
    if (subscriptionsToCreate.length === 0) {
      return [];
    }

    const values = subscriptionsToCreate.map((sub) => ({
      userId,
      title: sub.title,
      description: sub.description,
      url: sub.url,
      price: sub.price.toString(),
      charges: sub.charges
        ? sub.charges.map((c) => ({
            amount: c.amount,
            dayOfMonth: c.dayOfMonth,
            startDate: c.startDate.toISOString(),
          }))
        : null,
      currency: sub.currency,
      recurringDuration: sub.recurringDuration,
      startDate: sub.startDate,
    }));

    const db = getDb();
    const results = await db.insert(subscriptions).values(values).returning();

    return results.map(convertToSubscription);
  }

  async bulkDelete(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const db = getDb();
    await db
      .delete(subscriptions)
      .where(
        and(eq(subscriptions.userId, userId), inArray(subscriptions.id, ids))
      );
  }
}
