"use client";

import { differenceInDays, format, isToday, isTomorrow } from "date-fns";
import {
  ExternalLinkIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { EditSubscriptionDialog } from "@/components/edit-subscription-dialog";
import { SubscriptionDetailsDialog } from "@/components/subscription-details-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { calculateNextRenewalDate, getTotalPrice } from "@/lib/stats";
import type { RecurringDuration, Subscription } from "@/lib/types";

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdate: (
    id: string,
    updates: Partial<Omit<Subscription, "id" | "createdAt">>
  ) => void;
  onDelete: (id: string) => void;
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

function getDurationSuffix(duration: RecurringDuration): string {
  const suffixes: Record<RecurringDuration, string> = {
    weekly: "/week",
    "bi-weekly": "/2 weeks",
    monthly: "/month",
    quarterly: "/quarter",
    "semi-annually": "/6 months",
    yearly: "/year",
  };
  return suffixes[duration];
}

export function SubscriptionCard({
  subscription,
  onUpdate,
  onDelete,
}: SubscriptionCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const nextRenewal = calculateNextRenewalDate(subscription);

  const getRenewalLabel = () => {
    if (isToday(nextRenewal)) {
      return "Renews today";
    }
    if (isTomorrow(nextRenewal)) {
      return "Renews tomorrow";
    }
    const daysUntil = differenceInDays(nextRenewal, new Date());
    if (daysUntil < 7) {
      return `Renews in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
    }
    return "Next renewal";
  };

  const handleDeleteConfirm = () => {
    onDelete(subscription.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <Card
        className="flex cursor-pointer flex-col gap-4 transition-colors hover:bg-accent/50"
        onClick={() => setDetailsOpen(true)}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <CardTitle className="text-lg">{subscription.title}</CardTitle>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              <Badge className="max-w-[200px] shrink-0" variant="secondary">
                {subscription.charges && subscription.charges.length > 1 ? (
                  <span className="block truncate text-xs">
                    {subscription.charges.map((c, i) => (
                      <span className="whitespace-nowrap" key={i}>
                        {formatCurrency(c.amount, subscription.currency)}
                        {subscription.recurringDuration === "monthly" &&
                          c.dayOfMonth != null &&
                          ` (d${c.dayOfMonth})`}
                        {subscription.charges &&
                        i < subscription.charges.length - 1
                          ? " + "
                          : ""}
                      </span>
                    ))}
                    {" = "}
                    <span className="whitespace-nowrap font-semibold">
                      {formatCurrency(
                        getTotalPrice(subscription),
                        subscription.currency
                      )}
                      {getDurationSuffix(subscription.recurringDuration)}
                    </span>
                  </span>
                ) : (
                  <span>
                    {formatCurrency(
                      getTotalPrice(subscription),
                      subscription.currency
                    )}
                    {getDurationSuffix(subscription.recurringDuration)}
                  </span>
                )}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-8"
                    onClick={(e) => e.stopPropagation()}
                    size="icon"
                    variant="ghost"
                  >
                    <MoreVerticalIcon aria-hidden="true" className="size-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditOpen(true);
                    }}
                  >
                    <PencilIcon aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteOpen(true);
                    }}
                    variant="destructive"
                  >
                    <TrashIcon aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        {subscription.description && (
          <CardDescription>{subscription.description}</CardDescription>
        )}
        <CardContent>
          <div className="flex flex-col gap-2 text-muted-foreground text-sm">
            <div className="flex items-center justify-between">
              <span>Started:</span>
              <time dateTime={subscription.startDate.toISOString()}>
                {format(subscription.startDate, "MMM d, yyyy")}
              </time>
            </div>
            <div className="flex items-center justify-between">
              <span>{getRenewalLabel()}:</span>
              <time
                className="font-medium text-foreground"
                dateTime={nextRenewal.toISOString()}
              >
                {format(nextRenewal, "MMM d, yyyy")}
              </time>
            </div>
            <div className="flex items-center justify-between">
              <span>Recurring:</span>
              <span className="font-medium text-foreground">
                {formatRecurringDuration(subscription.recurringDuration)}
              </span>
            </div>
            {subscription.url && (
              <div className="flex items-center justify-between">
                <span>Website:</span>
                <Button
                  asChild
                  className="h-auto p-0 text-sm"
                  size="sm"
                  variant="link"
                >
                  <a
                    className="inline-flex items-center gap-1"
                    href={subscription.url}
                    onClick={(e) => e.stopPropagation()}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Visit
                    <ExternalLinkIcon aria-hidden="true" className="size-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <SubscriptionDetailsDialog
        onOpenChange={setDetailsOpen}
        open={detailsOpen}
        subscription={subscription}
      />
      <EditSubscriptionDialog
        onOpenChange={setEditOpen}
        onUpdate={onUpdate}
        open={editOpen}
        subscription={subscription}
      />
      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{subscription.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
