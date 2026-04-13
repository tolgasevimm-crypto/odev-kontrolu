import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("parent_id", user.id)
    .single();

  if (!child) return NextResponse.json({ error: "Çocuk bulunamadı." }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const months = parseInt(searchParams.get("months") ?? "3");
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  // Submissions for this child (completed only)
  const { data: submissions } = await supabase
    .from("homework_submissions")
    .select("id, subject, submitted_at")
    .eq("child_id", childId)
    .eq("status", "completed")
    .gte("submitted_at", since.toISOString())
    .order("submitted_at", { ascending: true });

  const submissionIds = (submissions ?? []).map((s) => s.id);

  // Fetch scores for those submissions
  const { data: analyses } = submissionIds.length
    ? await supabase
        .from("analyses")
        .select("submission_id, score_percentage")
        .in("submission_id", submissionIds)
    : { data: [] };

  const scoreMap = new Map((analyses ?? []).map((a) => [a.submission_id, a.score_percentage ?? 0]));

  const scoreOverTime = (submissions ?? [])
    .filter((s) => scoreMap.has(s.id))
    .map((s) => ({
      date: s.submitted_at.substring(0, 7),
      subject: s.subject,
      score: scoreMap.get(s.id) ?? 0,
    }));

  // Subject summary
  const subjectMap = new Map<string, { total: number; sum: number }>();
  for (const s of submissions ?? []) {
    const score = scoreMap.get(s.id);
    if (score == null) continue;
    const existing = subjectMap.get(s.subject) ?? { total: 0, sum: 0 };
    existing.total++;
    existing.sum += score;
    subjectMap.set(s.subject, existing);
  }

  const subjectSummary = Array.from(subjectMap.entries()).map(([subject, { total, sum }]) => ({
    subject,
    average_score: Math.round((sum / total) * 100) / 100,
    total_submissions: total,
  }));

  // Topic performance
  const { data: topicData } = await supabase
    .from("topic_performance")
    .select("*")
    .eq("child_id", childId)
    .order("attempts", { ascending: false });

  return NextResponse.json({
    scoreOverTime,
    topicPerformance: topicData ?? [],
    subjectSummary,
  });
}
