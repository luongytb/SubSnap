"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import type { Charge, Subscription } from "./types";

interface ApiSubscription {
  id: string;
  title: string;
  description?: string;
  url?: string;
  price: number;
  charges?: Array<{
    amount: number;
    dayOfMonth: number;
    startDate: string | Date;
  }>;
  currency: string;
  recurringDuration: Subscription["recurringDuration"];
  startDate: string | Date;
  createdAt: string | Date;
}

export function useSubscriptions() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    if (!(isUserLoaded && user?.id)) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/subscriptions");
      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }
      const data = (await response.json()) as ApiSubscription[];
      const subscriptionsWithDates = data.map((sub) => {
        const convertDate = (date: string | Date): Date => {
          if (date instanceof Date) return date;
          if (typeof date === "string") return new Date(date);
          return new Date();
        };
        return {
          ...sub,
          startDate: convertDate(sub.startDate),
          createdAt: convertDate(sub.createdAt),
          charges: sub.charges
            ? (sub.charges.map((c) => ({
                ...c,
                startDate: convertDate(c.startDate),
              })) as Charge[])
            : undefined,
        } as Subscription;
      });
      requestAnimationFrame(() => {
        setSubscriptions(subscriptionsWithDates);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
      requestAnimationFrame(() => {
        setIsLoading(false);
      });
    }
  }, [user?.id, isUserLoaded]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const addSubscription = useCallback(
    async (subscriptionData: Omit<Subscription, "id" | "createdAt">) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      try {
        const response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscriptionData),
        });
        if (!response.ok) {
          throw new Error("Failed to create subscription");
        }
        const newSubscription = (await response.json()) as ApiSubscription;
        const convertDate = (date: string | Date): Date => {
          if (date instanceof Date) return date;
          if (typeof date === "string") return new Date(date);
          return new Date();
        };
        const subscriptionWithDates = {
          ...newSubscription,
          startDate: convertDate(newSubscription.startDate),
          createdAt: convertDate(newSubscription.createdAt),
          charges: newSubscription.charges
            ? (newSubscription.charges.map((c) => ({
                ...c,
                startDate: convertDate(c.startDate),
              })) as Charge[])
            : undefined,
        } as Subscription;
        setSubscriptions((prev) => [...prev, subscriptionWithDates]);
        return subscriptionWithDates;
      } catch (error) {
        console.error("Failed to add subscription:", error);
        throw error;
      }
    },
    [user?.id]
  );

  const removeSubscription = useCallback(
    async (id: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      try {
        const response = await fetch(`/api/subscriptions/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete subscription");
        }
        setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
      } catch (error) {
        console.error("Failed to remove subscription:", error);
        throw error;
      }
    },
    [user?.id]
  );

  const updateSubscription = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Subscription, "id" | "createdAt">>
    ) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      try {
        const response = await fetch(`/api/subscriptions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!response.ok) {
          throw new Error("Failed to update subscription");
        }
        const updated = (await response.json()) as ApiSubscription;
        const convertDate = (date: string | Date): Date => {
          if (date instanceof Date) return date;
          if (typeof date === "string") return new Date(date);
          return new Date();
        };
        const updatedWithDates = {
          ...updated,
          startDate: convertDate(updated.startDate),
          createdAt: convertDate(updated.createdAt),
          charges: updated.charges
            ? (updated.charges.map((c) => ({
                ...c,
                startDate: convertDate(c.startDate),
              })) as Charge[])
            : undefined,
        } as Subscription;
        setSubscriptions((prev) =>
          prev.map((sub) => (sub.id === id ? updatedWithDates : sub))
        );
        return updatedWithDates;
      } catch (error) {
        console.error("Failed to update subscription:", error);
        throw error;
      }
    },
    [user?.id]
  );

  return {
    subscriptions,
    isLoading,
    addSubscription,
    removeSubscription,
    updateSubscription,
    refreshSubscriptions: loadSubscriptions,
  };
}
