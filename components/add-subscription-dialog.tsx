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
  DialogTrigger,
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

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface AddSubscriptionDialogProps {
  onAdd: (
    subscription: Omit<Subscription, "id" | "createdAt">
  ) => void | Promise<void> | Promise<Subscription>;
}

export function AddSubscriptionDialog({ onAdd }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [useMultipleCharges, setUseMultipleCharges] = useState(false);
  const [charges, setCharges] = useState<
    Array<{ amount: string; dayOfMonth: string; startDate: Date | undefined }>
  >([{ amount: "", dayOfMonth: "1", startDate: new Date() }]);
  const [currency, setCurrency] = useState("USD");
  const [recurringDuration, setRecurringDuration] =
    useState<RecurringDuration>("monthly");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      requestAnimationFrame(() => {
        setCurrency("USD");
      });
    }
    prevOpenRef.current = open;
  }, [open]);

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

      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        price: totalPrice,
        charges: chargesArray,
        currency,
        recurringDuration,
        startDate: earliestStartDate,
      });

      setTitle("");
      setDescription("");
      setUrl("");
      setPrice("");
      setUseMultipleCharges(false);
      setCharges([{ amount: "", dayOfMonth: "1", startDate: new Date() }]);
      setCurrency("USD");
      setRecurringDuration("monthly");
      setStartDate(new Date());
      setErrors({});
      setOpen(false);
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
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden="true" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
            <DialogDescription>
              Track your subscriptions and manage your recurring expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                aria-describedby={errors.title ? "title-error" : undefined}
                aria-invalid={!!errors.title}
                id="title"
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
                  id="title-error"
                  role="alert"
                >
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description or notes…"
                rows={3}
                value={description}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                aria-describedby={errors.url ? "url-error" : undefined}
                aria-invalid={!!errors.url}
                id="url"
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
                  id="url-error"
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
                  id="use-multiple-charges"
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
                    setErrors({
                      ...errors,
                      price: "",
                      charges: "",
                      startDate: "",
                    });
                  }}
                />
                <Label
                  className="cursor-pointer font-normal"
                  htmlFor="use-multiple-charges"
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
                              errors.charges ? "charges-error" : undefined
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
                            htmlFor={`day-${index}`}
                          >
                            Day:
                          </Label>
                          <Input
                            className="w-20"
                            id={`day-${index}`}
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
                            htmlFor={`charge-start-date-${index}`}
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
                                id={`charge-start-date-${index}`}
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
                      id="charges-error"
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
                    <Label htmlFor="price">
                      Price <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      aria-describedby={
                        errors.price ? "price-error" : undefined
                      }
                      aria-invalid={!!errors.price}
                      id="price"
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
                        id="price-error"
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
                <Label htmlFor="currency">Currency</Label>
                <Select onValueChange={setCurrency} value={currency}>
                  <SelectTrigger className="w-full" id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recurringDuration">
                  Recurring Duration <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setRecurringDuration(value as typeof recurringDuration)
                  }
                  value={recurringDuration}
                >
                  <SelectTrigger className="w-full" id="recurringDuration">
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
                        errors.startDate ? "startDate-error" : undefined
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
                    id="startDate-error"
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
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Spinner />
                  Add Subscription
                </>
              ) : (
                "Add Subscription"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
