"use client";

import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";
import { ExportImportSection } from "@/components/export-import-section";
import { StatsSection } from "@/components/stats-section";
import { SubscriptionCard } from "@/components/subscription-card";
import { Spinner } from "@/components/ui/spinner";
import { useSubscriptions } from "@/lib/use-subscriptions";

export default function Home() {
  const {
    subscriptions,
    isLoading,
    addSubscription,
    updateSubscription,
    removeSubscription,
  } = useSubscriptions();

  const { isLoaded: authLoaded } = useAuth();

  if (!authLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <SignedOut>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-col gap-4">
              <h1 className="font-bold text-3xl tracking-tight">SubSnap</h1>
              <p className="text-lg text-muted-foreground">
                Track and manage your recurring subscriptions
              </p>
              <p className="text-muted-foreground text-sm">
                Sign in to get started
              </p>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col gap-8">
            <header>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <h1 className="font-bold text-3xl tracking-tight">SubSnap</h1>
                  <p className="text-muted-foreground">
                    Track and manage your recurring subscriptions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportImportSection />
                  <AddSubscriptionDialog onAdd={addSubscription} />
                </div>
              </div>
            </header>

            {subscriptions.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-12 text-center">
                <div className="flex flex-col gap-4">
                  <p className="text-lg text-muted-foreground">
                    No subscriptions yet
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Get started by adding your first subscription
                  </p>
                </div>
                <AddSubscriptionDialog onAdd={addSubscription} />
              </div>
            ) : subscriptions.length > 0 ? (
              <div className="flex flex-col gap-6">
                <StatsSection subscriptions={subscriptions} />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subscriptions
                    .sort((a, b) => {
                      const getTime = (
                        date: Date | string | unknown
                      ): number => {
                        if (date instanceof Date) {
                          return date.getTime();
                        }
                        if (typeof date === "string") {
                          return new Date(date).getTime();
                        }
                        return 0;
                      };
                      return getTime(b.createdAt) - getTime(a.createdAt);
                    })
                    .map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        onDelete={removeSubscription}
                        onUpdate={updateSubscription}
                        subscription={subscription}
                      />
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
