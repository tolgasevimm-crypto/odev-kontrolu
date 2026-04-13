import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { analyzeHomework } from "@/lib/claude/client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Load submission
  const { data: submission, error: subError } = await supabase
    .from("homework_submissions")
    .select("*, children(name)")
    .eq("id", id)
    .eq("parent_id", user.id)
    .single();

  if (subError || !submission) {
    return NextResponse.json({ error: "Ödev bulunamadı." }, { status: 404 });
  }

  if (submission.status === "completed") {
    return NextResponse.json({ error: "Bu ödev zaten analiz edildi." }, { status: 409 });
  }

  // Generate fresh signed URL (60s) for Claude
  const { data: signedUrlData, error: signedError } = await serviceClient.storage
    .from("homework-images")
    .createSignedUrl(submission.image_path, 60);

  if (signedError || !signedUrlData) {
    return NextResponse.json({ error: "Görsel URL alınamadı." }, { status: 500 });
  }

  // Mark as processing
  await serviceClient
    .from("homework_submissions")
    .update({ status: "processing" })
    .eq("id", id);

  try {
    const childName = (submission.children as { name: string } | null)?.name ?? "Öğrenci";

    const { result, rawResponse } = await analyzeHomework({
      imageUrl: signedUrlData.signedUrl,
      grade: submission.grade_at_time,
      subject: submission.subject,
      childName,
    });

    // Save analysis
    const analysisInsert = {
      submission_id: id,
      child_id: submission.child_id,
      detected_topic: result.detected_topic,
      total_questions: result.total_questions,
      correct_count: result.correct_count,
      incorrect_count: result.incorrect_count,
      unanswered_count: result.unanswered_count,
      score_percentage: result.score_percentage,
      strong_topics: result.strong_topics,
      weak_topics: result.weak_topics,
      questions_detail: result.questions_detail as unknown as import("@/types/database").Json,
      solutions: result.solutions as unknown as import("@/types/database").Json,
      raw_claude_response: rawResponse,
    };

    const { data: analysis, error: analysisError } = await serviceClient
      .from("analyses")
      .insert(analysisInsert)
      .select()
      .single();

    if (analysisError) throw analysisError;

    // Upsert topic_performance for each question topic
    const topicMap = new Map<string, { correct: number; incorrect: number }>();
    for (const q of result.questions_detail) {
      const existing = topicMap.get(q.topic) ?? { correct: 0, incorrect: 0 };
      if (q.status === "dogru") existing.correct++;
      else existing.incorrect++;
      topicMap.set(q.topic, existing);
    }

    const upserts = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      child_id: submission.child_id,
      subject: submission.subject,
      topic,
      attempts: stats.correct + stats.incorrect,
      correct: stats.correct,
      incorrect: stats.incorrect,
      last_seen: new Date().toISOString(),
    }));

    if (upserts.length > 0) {
      await serviceClient.rpc("upsert_topic_performance", { rows: upserts });
    }

    // Mark as completed
    await serviceClient
      .from("homework_submissions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ analysis });
  } catch (err) {
    await serviceClient
      .from("homework_submissions")
      .update({ status: "failed" })
      .eq("id", id);

    const message = err instanceof Error ? err.message : "Analiz başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
