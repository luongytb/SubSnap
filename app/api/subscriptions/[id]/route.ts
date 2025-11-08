import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getSubscriptionRepository } from "@/lib/services/subscription-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const repository = getSubscriptionRepository();
    const subscription = await repository.getById(userId, id);

    if (!subscription) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const repository = getSubscriptionRepository();
    const subscription = await repository.update(userId, id, body);
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const repository = getSubscriptionRepository();
    await repository.delete(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
