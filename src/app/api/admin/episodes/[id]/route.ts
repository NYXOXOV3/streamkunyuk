import { NextRequest, NextResponse } from "next/server";
import { updateEpisode, deleteEpisode } from "@/lib/admin/content-actions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.json();
  const result = await updateEpisode(id, formData);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteEpisode(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}