import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  processing: <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />,
  pending: <AlertCircle className="w-4 h-4 text-gray-400" />,
};

const statusLabel: Record<string, string> = {
  completed: "Tamamlandı",
  failed: "Başarısız",
  processing: "İşleniyor",
  pending: "Bekliyor",
};

function scoreColor(score: number | null): string {
  if (score == null) return "text-gray-400";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

export default async function GecmisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: submissions } = await supabase
    .from("homework_submissions")
    .select("id, subject, status, submitted_at, child_id, children!inner(name)")
    .eq("parent_id", user!.id)
    .order("submitted_at", { ascending: false })
    .limit(50);

  const ids = (submissions ?? []).map((s) => s.id);
  const { data: scores } = ids.length
    ? await supabase
        .from("analyses")
        .select("submission_id, score_percentage")
        .in("submission_id", ids)
    : { data: [] };

  const scoreMap = new Map((scores ?? []).map((s) => [s.submission_id, s.score_percentage]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ödev Geçmişi</h1>

      {!submissions || submissions.length === 0 ? (
        <p className="text-gray-400 text-center py-16">Henüz yüklenen ödev yok.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => {
            const score = scoreMap.get(s.id) ?? null;
            return (
              <Link key={s.id} href={`/gecmis/${s.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        {statusIcon[s.status]}
                        <span className="text-xs text-gray-500">{statusLabel[s.status]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {(s.children as unknown as { name: string }).name} — {s.subject}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(s.submitted_at).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {score != null && (
                        <span className={`font-bold text-lg ${scoreColor(score)}`}>
                          %{Math.round(score)}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
