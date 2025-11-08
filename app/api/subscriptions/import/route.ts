import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { importSubscriptions } from "@/lib/services/export-import-service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jsonData, options } = body;

    if (!jsonData) {
      return NextResponse.json(
        { error: "jsonData is required" },
        { status: 400 }
      );
    }

    const result = await importSubscriptions(userId, jsonData, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to import subscriptions:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
