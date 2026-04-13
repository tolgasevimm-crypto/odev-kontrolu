import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: submission, error } = await supabase
    .from("homework_submissions")
    .select("*")
    .eq("id", id)
    .eq("parent_id", user.id)
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("submission_id", id)
    .single();

  return NextResponse.json({ submission, analysis: analysis ?? null });
}
