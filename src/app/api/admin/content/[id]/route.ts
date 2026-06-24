import { NextRequest, NextResponse } from "next/server";
import { updateContent, getContentById, deleteContent } from "@/lib/admin/content-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  const result = await getContentById(id);
  if (result.error) {
    return NextResponse.json(result, { status: 404 });
  }
  return NextResponse.json(result);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json();
  const result = await updateContent(id, body);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  const result = await deleteContent(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}