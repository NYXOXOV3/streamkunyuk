import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/admin/content-actions";

export async function GET() {
  const result = await getDashboardStats();
  return NextResponse.json(result);
}