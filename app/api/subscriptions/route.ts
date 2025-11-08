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
    const repository = getSubscriptionRepository();
    const subscription = await repository.create(userId, body);
    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
