import type { Subscription } from "../types";
import { getSubscriptionRepository } from "./subscription-service";

export interface ExportData {
  version: string;
  exportDate: string;
  subscriptions: Subscription[];
}

const CURRENT_VERSION = "1.0.0";

export async function exportSubscriptions(userId: string): Promise<string> {
  const repository = getSubscriptionRepository();
  const subscriptions = await repository.getAll(userId);

  const exportData: ExportData = {
    version: CURRENT_VERSION,
    exportDate: new Date().toISOString(),
    subscriptions,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importSubscriptions(
  userId: string,
  jsonData: string,
  options: { merge?: boolean; overwrite?: boolean } = {}
): Promise<{ imported: number; errors: string[] }> {
  const repository = getSubscriptionRepository();
  const errors: string[] = [];
  let imported = 0;

  try {
    const parsed = JSON.parse(jsonData);

    let subscriptionsArray: unknown[];
    if (Array.isArray(parsed)) {
      subscriptionsArray = parsed;
    } else if (parsed.subscriptions && Array.isArray(parsed.subscriptions)) {
      subscriptionsArray = parsed.subscriptions;
    } else {
      throw new Error(
        "Invalid export format: subscriptions array not found. Expected either an array or an object with a 'subscriptions' property."
      );
    }

    if (options.overwrite) {
      const existing = await repository.getAll(userId);
      const existingIds = existing.map((sub) => sub.id);
      if (existingIds.length > 0) {
        await repository.bulkDelete(userId, existingIds);
      }
    }

    interface ImportSubscription {
      title: string;
      description?: string;
      url?: string;
      price: number | string;
      charges?: Array<{
        amount: number | string;
        dayOfMonth: number | string;
        startDate?: string | Date;
      }>;
      currency: string;
      recurringDuration: string;
      startDate: string | Date;
    }

    const subscriptionsToImport = (subscriptionsArray as ImportSubscription[])
      .map((sub) => {
        try {
          if (
            !(
              sub.title &&
              sub.price &&
              sub.currency &&
              sub.recurringDuration &&
              sub.startDate
            )
          ) {
            throw new Error("Missing required fields");
          }

          return {
            title: sub.title,
            description: sub.description,
            url: sub.url,
            price:
              typeof sub.price === "number"
                ? sub.price
                : Number.parseFloat(String(sub.price)),
            charges: sub.charges
              ? sub.charges.map((c) => ({
                  amount:
                    typeof c.amount === "number"
                      ? c.amount
                      : Number.parseFloat(String(c.amount)),
                  dayOfMonth:
                    typeof c.dayOfMonth === "number"
                      ? c.dayOfMonth
                      : Number.parseInt(String(c.dayOfMonth), 10),
                  startDate: new Date(c.startDate || sub.startDate),
                }))
              : undefined,
            currency: sub.currency,
            recurringDuration: sub.recurringDuration,
            startDate: new Date(sub.startDate),
          };
        } catch (error) {
          errors.push(
            `Failed to import subscription "${sub.title || "Unknown"}": ${error instanceof Error ? error.message : "Unknown error"}`
          );
          return null;
        }
      })
      .filter((sub): sub is NonNullable<typeof sub> => sub !== null);

    if (subscriptionsToImport.length > 0) {
      const created = await repository.bulkCreate(
        userId,
        subscriptionsToImport
      );
      imported = created.length;
    }

    return { imported, errors };
  } catch (error) {
    throw new Error(
      `Failed to import subscriptions: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType = "application/json"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        resolve(e.target.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
