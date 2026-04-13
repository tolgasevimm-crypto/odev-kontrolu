import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AnalysisResult from "@/components/homework/AnalysisResult";
import { QuestionDetail, SolutionDetail } from "@/types/analysis";
import { Analysis } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: submission } = await supabase
    .from("homework_submissions")
    .select("id, subject, status, submitted_at, image_url, child_id, children!inner(name)")
    .eq("id", id)
    .eq("parent_id", user!.id)
    .single();

  if (!submission) notFound();

  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("submission_id", id)
    .single<Analysis>();

  const childName = (submission.children as unknown as { name: string }).name;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gecmis" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {childName} — {submission.subject}
          </h1>
          <p className="text-sm text-gray-400">
            {new Date(submission.submitted_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge
          variant={
            submission.status === "completed"
              ? "default"
              : submission.status === "failed"
              ? "destructive"
              : "secondary"
          }
        >
          {submission.status === "completed"
            ? "Tamamlandı"
            : submission.status === "failed"
            ? "Başarısız"
            : "İşleniyor"}
        </Badge>
      </div>

      {submission.status === "processing" && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg animate-pulse">Yapay zeka analiz ediyor...</p>
          <p className="text-sm mt-2">Bu işlem 10-30 saniye sürebilir.</p>
        </div>
      )}

      {submission.status === "failed" && (
        <div className="text-center py-16 text-red-400">
          <p className="text-lg">Analiz sırasında bir hata oluştu.</p>
        </div>
      )}

      {submission.status === "completed" && analysis && (
        <AnalysisResult
          analysis={{
            detected_topic: analysis.detected_topic ?? "",
            total_questions: analysis.total_questions ?? 0,
            correct_count: analysis.correct_count ?? 0,
            incorrect_count: analysis.incorrect_count ?? 0,
            unanswered_count: analysis.unanswered_count ?? 0,
            score_percentage: analysis.score_percentage ?? 0,
            strong_topics: analysis.strong_topics ?? [],
            weak_topics: analysis.weak_topics ?? [],
            questions_detail: (analysis.questions_detail as unknown as QuestionDetail[]) ?? [],
            solutions: (analysis.solutions as unknown as SolutionDetail[]) ?? [],
            summary: "",
          }}
          childName={childName}
          subject={submission.subject}
          imageUrl={submission.image_url}
        />
      )}
    </div>
  );
}
