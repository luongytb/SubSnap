"use client";

import { format } from "date-fns";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  calculateMonthlyCost,
  calculateNextRenewalDate,
  calculateTotalSpent,
  getTotalPrice,
} from "@/lib/stats";
import type { RecurringDuration, Subscription } from "@/lib/types";

interface SubscriptionDetailsDialogProps {
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRecurringDuration(duration: RecurringDuration): string {
  const labels: Record<RecurringDuration, string> = {
    weekly: "Weekly",
    "bi-weekly": "Bi-weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    "semi-annually": "Semi-annually",
    yearly: "Yearly",
  };
  return labels[duration];
}

function getDaysInDuration(duration: RecurringDuration): number {
  switch (duration) {
    case "weekly":
      return 7;
    case "bi-weekly":
      return 14;
    case "monthly":
      return 30;
    case "quarterly":
      return 90;
    case "semi-annually":
      return 180;
    case "yearly":
      return 365;
    default:
      return 30;
  }
}

function calculatePaymentHistory(
  subscription: Subscription
): Array<{ date: Date; amount: number }> {
  const now = new Date();
  const startDate = new Date(subscription.startDate);
  const payments: Array<{ date: Date; amount: number }> = [];

  if (startDate > now) {
    return payments;
  }

  const chargesToUse =
    subscription.charges && subscription.charges.length > 0
      ? subscription.charges
      : [
          {
            amount: subscription.price,
            dayOfMonth: startDate.getDate(),
            startDate,
          },
        ];

  chargesToUse.forEach((charge) => {
    const chargeStartDate = new Date(charge.startDate);
    if (chargeStartDate > now) {
      return;
    }

    const daysSinceChargeStart = Math.floor(
      (now.getTime() - chargeStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysInDuration = getDaysInDuration(subscription.recurringDuration);
    const billingCyclesForCharge =
      Math.floor(daysSinceChargeStart / daysInDuration) + 1;

    for (let i = 0; i < billingCyclesForCharge; i++) {
      const paymentDate = new Date(chargeStartDate);

      switch (subscription.recurringDuration) {
        case "weekly":
          paymentDate.setDate(chargeStartDate.getDate() + i * 7);
          break;
        case "bi-weekly":
          paymentDate.setDate(chargeStartDate.getDate() + i * 14);
          break;
        case "monthly": {
          paymentDate.setMonth(chargeStartDate.getMonth() + i);
          paymentDate.setDate(charge.dayOfMonth);
          const daysInMonth = new Date(
            paymentDate.getFullYear(),
            paymentDate.getMonth() + 1,
            0
          ).getDate();
          if (charge.dayOfMonth > daysInMonth) {
            paymentDate.setDate(daysInMonth);
          }
          break;
        }
        case "quarterly":
          paymentDate.setMonth(chargeStartDate.getMonth() + i * 3);
          break;
        case "semi-annually":
          paymentDate.setMonth(chargeStartDate.getMonth() + i * 6);
          break;
        case "yearly":
          paymentDate.setFullYear(chargeStartDate.getFullYear() + i);
          break;
      }

      payments.push({ date: paymentDate, amount: charge.amount });
    }
  });

  payments.sort((a, b) => a.date.getTime() - b.date.getTime());

  return payments;
}

export function SubscriptionDetailsDialog({
  subscription,
  open,
  onOpenChange,
}: SubscriptionDetailsDialogProps) {
  const totalSpent = calculateTotalSpent(subscription);
  const nextRenewal = calculateNextRenewalDate(subscription);
  const monthlyCost = calculateMonthlyCost(
    subscription.price,
    subscription.recurringDuration
  );
  const paymentHistory = calculatePaymentHistory(subscription);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-2xl">
                {subscription.title}
              </DialogTitle>
              {subscription.description && (
                <DialogDescription className="mt-2">
                  {subscription.description}
                </DialogDescription>
              )}
            </div>
            <div className="flex w-full max-w-full shrink-0 flex-col items-end sm:w-auto sm:max-w-[50%]">
              <div className="flex w-full flex-col items-end gap-2">
                <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Total per&nbsp;
                  {subscription.recurringDuration === "weekly" && "week"}
                  {subscription.recurringDuration === "bi-weekly" && "2 weeks"}
                  {subscription.recurringDuration === "monthly" && "month"}
                  {subscription.recurringDuration === "quarterly" && "quarter"}
                  {subscription.recurringDuration === "semi-annually" &&
                    "6 months"}
                  {subscription.recurringDuration === "yearly" && "year"}
                </span>
                <Badge
                  className="flex w-fit items-center gap-2 rounded-lg border border-primary/20 bg-secondary/70 px-4 py-2 text-base shadow-sm dark:bg-secondary/70"
                  variant="secondary"
                >
                  {formatCurrency(
                    getTotalPrice(subscription),
                    subscription.currency
                  )}
                </Badge>
                {subscription.charges && subscription.charges.length > 1 && (
                  <details
                    aria-label="Show details for all charges"
                    className="mt-1 w-full"
                  >
                    <summary className="cursor-pointer rounded text-primary/80 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      Show all charges
                    </summary>
                    <div className="mt-2 flex flex-col gap-1 px-2">
                      {subscription.charges.map((c, i) => (
                        <span
                          className="flex items-center gap-2 text-muted-foreground text-xs"
                          key={i}
                        >
                          <span className="font-mono">
                            {formatCurrency(c.amount, subscription.currency)}
                          </span>
                          {subscription.recurringDuration === "monthly" &&
                            c.dayOfMonth && (
                              <span className="opacity-70">
                                (day&nbsp;{c.dayOfMonth})
                              </span>
                            )}
                        </span>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Starting Date
              </span>
              <div className="flex items-center gap-2">
                <CalendarIcon aria-hidden="true" className="size-4" />
                <time
                  className="font-medium"
                  dateTime={subscription.startDate.toISOString()}
                >
                  {format(subscription.startDate, "PPP")}
                </time>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Next Renewal
              </span>
              <div className="flex items-center gap-2">
                <CalendarIcon aria-hidden="true" className="size-4" />
                <time
                  className="font-medium"
                  dateTime={nextRenewal.toISOString()}
                >
                  {format(nextRenewal, "PPP")}
                </time>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Recurring Duration
              </span>
              <span className="font-medium">
                {formatRecurringDuration(subscription.recurringDuration)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Monthly Cost
              </span>
              <span className="font-medium">
                {formatCurrency(monthlyCost, subscription.currency)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">Total Spent</span>
              <span className="font-bold text-2xl">
                {formatCurrency(totalSpent, subscription.currency)}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Based on {paymentHistory.length} payment
              {paymentHistory.length !== 1 ? "s" : ""} since{" "}
              {format(subscription.startDate, "MMM d, yyyy")}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">Payment History</h3>
            {paymentHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No payments yet. First payment scheduled for{" "}
                {format(subscription.startDate, "PPP")}.
              </p>
            ) : (
              <ScrollArea className="h-64">
                <div className="flex flex-col gap-2 pr-4">
                  {paymentHistory.map((payment, index) => (
                    <div
                      className="flex items-center justify-between rounded-md border p-3"
                      key={index}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                          <span className="font-medium text-muted-foreground text-xs">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <time
                            className="font-medium text-sm"
                            dateTime={payment.date.toISOString()}
                          >
                            {format(payment.date, "MMM d, yyyy")}
                          </time>
                          <span className="text-muted-foreground text-xs">
                            {payment.date <= new Date() ? "Paid" : "Scheduled"}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(payment.amount, subscription.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {subscription.url && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Website</span>
                <Button asChild size="sm" variant="outline">
                  <a
                    className="inline-flex items-center gap-2"
                    href={subscription.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Visit Website
                    <ExternalLinkIcon aria-hidden="true" className="size-4" />
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
