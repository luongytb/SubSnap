"use client";

import { format } from "date-fns";
import { CalendarIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { RecurringDuration, Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SORTED_CURRENCIES, formatCurrencyDisplay } from "@/lib/currencies";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface EditSubscriptionDialogProps {
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    id: string,
    updates: Partial<Omit<Subscription, "id" | "createdAt">>
  ) => void | Promise<void>;
}

export function EditSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
  onUpdate,
}: EditSubscriptionDialogProps) {
  const [title, setTitle] = useState(subscription.title);
  const [description, setDescription] = useState(
    subscription.description || ""
  );
  const [url, setUrl] = useState(subscription.url || "");
  const [useMultipleCharges, setUseMultipleCharges] = useState(
    subscription.charges && subscription.charges.length > 0
  );
  const [price, setPrice] = useState(
    subscription.charges && subscription.charges.length > 0
      ? ""
      : subscription.price.toString()
  );
  const [charges, setCharges] = useState<
    Array<{ amount: string; dayOfMonth: string; startDate: Date | undefined }>
  >(
    subscription.charges && subscription.charges.length > 0
      ? subscription.charges.map((c) => ({
          amount: c.amount.toString(),
          dayOfMonth: c.dayOfMonth.toString(),
          startDate: new Date(c.startDate),
        }))
      : [{ amount: "", dayOfMonth: "1", startDate: new Date() }]
  );
  const [currency, setCurrency] = useState(subscription.currency);
  const [recurringDuration, setRecurringDuration] = useState<RecurringDuration>(
    subscription.recurringDuration
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(subscription.startDate)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevSubscriptionIdRef = useRef(subscription.id);

  useEffect(() => {
    if (open && prevSubscriptionIdRef.current !== subscription.id) {
      requestAnimationFrame(() => {
        setTitle(subscription.title);
        setDescription(subscription.description || "");
        setUrl(subscription.url || "");
        const hasCharges =
          subscription.charges && subscription.charges.length > 0;
        setUseMultipleCharges(hasCharges);
        setPrice(hasCharges ? "" : subscription.price.toString());
        setCharges(
          hasCharges
            ? subscription.charges!.map((c) => ({
                amount: c.amount.toString(),
                dayOfMonth: c.dayOfMonth.toString(),
                startDate: new Date(c.startDate),
              }))
            : [{ amount: "", dayOfMonth: "1", startDate: new Date() }]
        );
        setCurrency(subscription.currency);
        setRecurringDuration(subscription.recurringDuration);
        setStartDate(new Date(subscription.startDate));
        setErrors({});
      });
      prevSubscriptionIdRef.current = subscription.id;
    }
  }, [open, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (useMultipleCharges) {
      const validCharges = charges.filter((c) => c.amount.trim() !== "");

      if (validCharges.length === 0) {
        newErrors.charges = "At least one charge is required";
      } else {
        const invalidAmounts = validCharges.filter((c) => {
          const amount = Number.parseFloat(c.amount);
          return isNaN(amount) || amount <= 0;
        });
        const invalidDays = validCharges.filter((c) => {
          const day = Number.parseInt(c.dayOfMonth, 10);
          return isNaN(day) || day < 1 || day > 31;
        });
        const invalidDates = validCharges.filter((c) => !c.startDate);

        if (invalidAmounts.length > 0) {
          newErrors.charges = "All charge amounts must be positive numbers";
        } else if (invalidDays.length > 0) {
          newErrors.charges = "Day of month must be between 1 and 31";
        } else if (invalidDates.length > 0) {
          newErrors.charges = "All charges must have a start date";
        }
      }
    } else {
      if (price.trim()) {
        const priceNum = Number.parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
          newErrors.price = "Price must be a positive number";
        }
      } else {
        newErrors.price = "Price is required";
      }

      if (!startDate) {
        newErrors.startDate = "Start date is required";
      }
    }

    if (url && !isValidUrl(url)) {
      newErrors.url = "Please enter a valid URL";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const chargesArray = useMultipleCharges
        ? charges
            .filter((c) => c.amount.trim() !== "")
            .map((c) => ({
              amount: Number.parseFloat(c.amount),
              dayOfMonth: Number.parseInt(c.dayOfMonth, 10),
              startDate: c.startDate!,
            }))
        : undefined;

      const totalPrice = useMultipleCharges
        ? chargesArray!.reduce((sum, c) => sum + c.amount, 0)
        : Number.parseFloat(price);

      const earliestStartDate = useMultipleCharges
        ? chargesArray!.reduce(
            (earliest, c) => (c.startDate < earliest ? c.startDate : earliest),
            chargesArray![0].startDate
          )
        : startDate!;

      await onUpdate(subscription.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        price: totalPrice,
        charges: chargesArray,
        currency,
        recurringDuration,
        startDate: earliestStartDate,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update your subscription details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                aria-describedby={errors.title ? "edit-title-error" : undefined}
                aria-invalid={!!errors.title}
                id="edit-title"
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: "" });
                }}
                placeholder="Netflix, Spotify, etc."
                required
                value={title}
              />
              {errors.title && (
                <p
                  className="text-destructive text-sm"
                  id="edit-title-error"
                  role="alert"
                >
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description or notes…"
                rows={3}
                value={description}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                aria-describedby={errors.url ? "edit-url-error" : undefined}
                aria-invalid={!!errors.url}
                id="edit-url"
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errors.url) setErrors({ ...errors, url: "" });
                }}
                placeholder="https://example.com…"
                type="url"
                value={url}
              />
              {errors.url && (
                <p
                  className="text-destructive text-sm"
                  id="edit-url-error"
                  role="alert"
                >
                  {errors.url}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={useMultipleCharges}
                  id="edit-use-multiple-charges"
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setUseMultipleCharges(isChecked);
                    if (isChecked) {
                      setPrice("");
                    } else {
                      setCharges([
                        { amount: "", dayOfMonth: "1", startDate: new Date() },
                      ]);
                    }
                    setErrors({ ...errors, price: "", charges: "" });
                  }}
                />
                <Label
                  className="cursor-pointer font-normal"
                  htmlFor="edit-use-multiple-charges"
                >
                  Multiple charges per billing cycle (e.g., SIP)
                </Label>
              </div>

              {useMultipleCharges ? (
                <div className="flex flex-col gap-3">
                  <Label>
                    Charges <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-col gap-2">
                    {charges.map((charge, index) => (
                      <div
                        className="flex flex-col gap-2 rounded-md border p-3"
                        key={index}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            aria-describedby={
                              errors.charges ? "edit-charges-error" : undefined
                            }
                            aria-invalid={!!errors.charges}
                            className="flex-1"
                            min="0"
                            onChange={(e) => {
                              const newCharges = [...charges];
                              newCharges[index] = {
                                ...newCharges[index],
                                amount: e.target.value,
                              };
                              setCharges(newCharges);
                              if (errors.charges)
                                setErrors({ ...errors, charges: "" });
                            }}
                            placeholder="Amount"
                            step="0.01"
                            type="number"
                            value={charge.amount}
                          />
                          <Label
                            className="shrink-0 text-sm"
                            htmlFor={`edit-day-${index}`}
                          >
                            Day:
                          </Label>
                          <Input
                            className="w-20"
                            id={`edit-day-${index}`}
                            max="31"
                            min="1"
                            onChange={(e) => {
                              const newCharges = [...charges];
                              newCharges[index] = {
                                ...newCharges[index],
                                dayOfMonth: e.target.value,
                              };
                              setCharges(newCharges);
                              if (errors.charges)
                                setErrors({ ...errors, charges: "" });
                            }}
                            placeholder="Day"
                            type="number"
                            value={charge.dayOfMonth}
                          />
                          {charges.length > 1 && (
                            <Button
                              aria-label={`Remove charge ${index + 1}`}
                              className="size-9 shrink-0"
                              onClick={() => {
                                const newCharges = charges.filter(
                                  (_, i) => i !== index
                                );
                                setCharges(
                                  newCharges.length > 0
                                    ? newCharges
                                    : [
                                        {
                                          amount: "",
                                          dayOfMonth: "1",
                                          startDate: new Date(),
                                        },
                                      ]
                                );
                              }}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <XIcon aria-hidden="true" className="size-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label
                            className="text-sm"
                            htmlFor={`edit-charge-start-date-${index}`}
                          >
                            Start Date{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !charge.startDate && "text-muted-foreground"
                                )}
                                id={`edit-charge-start-date-${index}`}
                                variant="outline"
                              >
                                <CalendarIcon aria-hidden="true" />
                                {charge.startDate ? (
                                  format(charge.startDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-auto p-0"
                            >
                              <Calendar
                                initialFocus
                                mode="single"
                                onSelect={(date) => {
                                  const newCharges = [...charges];
                                  newCharges[index] = {
                                    ...newCharges[index],
                                    startDate: date,
                                  };
                                  setCharges(newCharges);
                                  if (errors.charges)
                                    setErrors({ ...errors, charges: "" });
                                }}
                                selected={charge.startDate}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ))}
                    <Button
                      className="w-full"
                      onClick={() =>
                        setCharges([
                          ...charges,
                          {
                            amount: "",
                            dayOfMonth: "1",
                            startDate: new Date(),
                          },
                        ])
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <PlusIcon aria-hidden="true" className="size-4" />
                      Add Charge
                    </Button>
                  </div>
                  {errors.charges && (
                    <p
                      className="text-destructive text-sm"
                      id="edit-charges-error"
                      role="alert"
                    >
                      {errors.charges}
                    </p>
                  )}
                  {charges.filter((c) => c.amount.trim() !== "").length > 0 && (
                    <p className="text-muted-foreground text-sm">
                      Total:{" "}
                      {formatCurrency(
                        charges
                          .filter((c) => c.amount.trim() !== "")
                          .map((c) => Number.parseFloat(c.amount))
                          .reduce((sum, c) => sum + (isNaN(c) ? 0 : c), 0),
                        currency
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">
                      Price <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      aria-describedby={
                        errors.price ? "edit-price-error" : undefined
                      }
                      aria-invalid={!!errors.price}
                      id="edit-price"
                      min="0"
                      onChange={(e) => {
                        setPrice(e.target.value);
                        if (errors.price) setErrors({ ...errors, price: "" });
                      }}
                      placeholder="9.99"
                      required
                      step="0.01"
                      type="number"
                      value={price}
                    />
                    {errors.price && (
                      <p
                        className="text-destructive text-sm"
                        id="edit-price-error"
                        role="alert"
                      >
                        {errors.price}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Select onValueChange={setCurrency} value={currency}>
                  <SelectTrigger className="w-full" id="edit-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {formatCurrencyDisplay(currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-recurringDuration">
                Recurring Duration <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setRecurringDuration(value as RecurringDuration)
                }
                value={recurringDuration}
              >
                <SelectTrigger className="w-full" id="edit-recurringDuration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-annually</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!useMultipleCharges && (
              <div className="grid gap-2">
                <Label>
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      aria-describedby={
                        errors.startDate ? "edit-startDate-error" : undefined
                      }
                      aria-invalid={!!errors.startDate}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      variant="outline"
                    >
                      <CalendarIcon aria-hidden="true" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="single"
                      onSelect={(date) => {
                        setStartDate(date);
                        if (errors.startDate)
                          setErrors({ ...errors, startDate: "" });
                      }}
                      selected={startDate}
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && (
                  <p
                    className="text-destructive text-sm"
                    id="edit-startDate-error"
                    role="alert"
                  >
                    {errors.startDate}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Spinner />
                  Save Changes
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
