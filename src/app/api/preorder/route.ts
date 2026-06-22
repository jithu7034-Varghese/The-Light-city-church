// src/app/api/preorder/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define schema for pre-order
interface PreorderRecord {
  id: string;
  name: string;
  email: string;
  tier: "standard" | "pro";
  timestamp: string;
}

// Temporary JSON database path inside workspace
const DATA_DIR = path.join(process.cwd(), "src/data");
const DATA_FILE = path.join(DATA_DIR, "preorders.json");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, tier } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (tier !== "standard" && tier !== "pro") {
      return NextResponse.json(
        { message: "Invalid tier selected." },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Read existing orders
    let orders: PreorderRecord[] = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, "utf-8");
        orders = JSON.parse(fileContent);
      } catch (err) {
        console.error("Error parsing preorders database, resetting:", err);
      }
    }

    // Check if email already registered
    const emailExists = orders.some(
      (order) => order.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      return NextResponse.json(
        { message: "This email address is already registered for a pre-order." },
        { status: 400 }
      );
    }

    // Create new preorder record
    const newOrder: PreorderRecord = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      tier,
      timestamp: new Date().toISOString(),
    };

    // Save
    orders.push(newOrder);
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), "utf-8");

    console.log(`[AERO-SHIELD API] Pre-order logged successfully: ${newOrder.email} (${newOrder.tier})`);

    return NextResponse.json(
      { message: "Pre-order reservation confirmed.", order: newOrder },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("API Pre-order error:", error);
    return NextResponse.json(
      { message: "Internal Server Error occurred. Please try again." },
      { status: 500 }
    );
  }
}
