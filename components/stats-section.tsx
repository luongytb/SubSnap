"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateAverageMonthlyCost,
  calculateMonthlyCost,
  calculateTotalSpent,
  getMostCostlySubscription,
  groupByCurrency,
} from "@/lib/stats";
import type { Subscription } from "@/lib/types";

interface StatsSectionProps {
  subscriptions: Subscription[];
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function StatsSection({ subscriptions }: StatsSectionProps) {
  const currencies = Object.keys(groupByCurrency(subscriptions));
  const [selectedCurrency, setSelectedCurrency] = useState(
    currencies[0] || "USD"
  );

  const filteredSubscriptions = subscriptions.filter(
    (sub) => sub.currency === selectedCurrency
  );

  if (filteredSubscriptions.length === 0 && subscriptions.length > 0) {
    const allCurrencies = currencies.join(", ");
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
            <SelectTrigger className="w-32" id="currency-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-muted-foreground text-sm">
            No subscriptions found in {selectedCurrency}. Available currencies:{" "}
            {allCurrencies}
          </p>
        </div>
      </div>
    );
  }

  const totalMonthly = filteredSubscriptions.reduce(
    (sum, sub) => sum + calculateMonthlyCost(sub.price, sub.recurringDuration),
    0
  );

  const totalSpent = filteredSubscriptions.reduce(
    (sum, sub) => sum + calculateTotalSpent(sub),
    0
  );

  const mostCostly = getMostCostlySubscription(filteredSubscriptions);
  const averageMonthly = calculateAverageMonthlyCost(filteredSubscriptions);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
          <SelectTrigger className="w-32" id="currency-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.length > 0 ? (
              currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="USD">USD</SelectItem>
            )}
          </SelectContent>
        </Select>
        {currencies.length > 1 &&
          filteredSubscriptions.length < subscriptions.length && (
            <p className="text-muted-foreground text-xs">
              Showing {filteredSubscriptions.length} of {subscriptions.length}{" "}
              subscriptions
            </p>
          )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {filteredSubscriptions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Total Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(totalMonthly, selectedCurrency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-2xl">
                {formatCurrency(totalSpent, selectedCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">
                Since subscriptions started
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Average Monthly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-2xl">
                {formatCurrency(averageMonthly, selectedCurrency)}
              </div>
              <p className="text-muted-foreground text-xs">Per subscription</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {mostCostly && (
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Most Costly Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="font-semibold text-lg">{mostCostly.title}</div>
                <div className="text-muted-foreground text-sm">
                  {formatCurrency(
                    calculateMonthlyCost(
                      mostCostly.price,
                      mostCostly.recurringDuration
                    ),
                    selectedCurrency
                  )}{" "}
                  per month
                </div>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <div className="font-bold text-lg">
                  {formatCurrency(mostCostly.price, selectedCurrency)}
                </div>
                <div className="text-muted-foreground text-xs capitalize">
                  {mostCostly.recurringDuration.replace("-", " ")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
