import type { Subscription } from "../types";
import { NeonSubscriptionRepository } from "./neon-subscription-repository";

export interface SubscriptionRepository {
  getAll(userId: string): Promise<Subscription[]>;
  getById(userId: string, id: string): Promise<Subscription | null>;
  create(
    userId: string,
    subscription: Omit<Subscription, "id" | "createdAt">
  ): Promise<Subscription>;
  update(
    userId: string,
    id: string,
    updates: Partial<Omit<Subscription, "id" | "createdAt">>
  ): Promise<Subscription>;
  delete(userId: string, id: string): Promise<void>;
  bulkCreate(
    userId: string,
    subscriptions: Omit<Subscription, "id" | "createdAt">[]
  ): Promise<Subscription[]>;
  bulkDelete(userId: string, ids: string[]): Promise<void>;
}

let repositoryInstance: SubscriptionRepository | null = null;

export function getSubscriptionRepository(): SubscriptionRepository {
  if (!repositoryInstance) {
    repositoryInstance = new NeonSubscriptionRepository();
  }
  return repositoryInstance;
}

export function setSubscriptionRepository(repo: SubscriptionRepository): void {
  repositoryInstance = repo;
}
