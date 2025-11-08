export type RecurringDuration =
  | "weekly"
  | "bi-weekly"
  | "monthly"
  | "quarterly"
  | "semi-annually"
  | "yearly";

export interface Charge {
  amount: number;
  dayOfMonth: number;
  startDate: Date;
}

export interface Subscription {
  id: string;
  title: string;
  description?: string;
  url?: string;
  price: number;
  charges?: Charge[];
  currency: string;
  recurringDuration: RecurringDuration;
  startDate: Date;
  createdAt: Date;
}
