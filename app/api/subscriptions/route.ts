import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getSubscriptionRepository } from "@/lib/services/subscription-service";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repository = getSubscriptionRepository();
    const subscriptions = await repository.getAll(userId);
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Convert date strings to Date objects
    const subscriptionData = {
      ...body,
      startDate:
        body.startDate instanceof Date
          ? body.startDate
          : new Date(body.startDate),
      charges: body.charges
        ? body.charges.map(
            (c: {
              amount: number;
              dayOfMonth: number;
              startDate: string | Date;
            }) => ({
              ...c,
              startDate:
                c.startDate instanceof Date
                  ? c.startDate
                  : new Date(c.startDate),
            })
          )
        : undefined,
    };

    const repository = getSubscriptionRepository();
    const subscription = await repository.create(userId, subscriptionData);
    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
