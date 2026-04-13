import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: children } = await supabase
    .from("children")
    .select("id, name, grade")
    .eq("parent_id", user!.id)
    .order("created_at", { ascending: true });

  const { data: recentSubmissions } = await supabase
    .from("homework_submissions")
    .select("id, subject, status, submitted_at, children!inner(name)")
    .eq("parent_id", user!.id)
    .order("submitted_at", { ascending: false })
    .limit(5);

  const ids = (recentSubmissions ?? []).map((s) => s.id);
  const { data: scores } = ids.length
    ? await supabase
        .from("analyses")
        .select("submission_id, score_percentage")
        .in("submission_id", ids)
    : { data: [] };
  const scoreMap = new Map((scores ?? []).map((s) => [s.submission_id, s.score_percentage]));

  const name = profile?.full_name?.split(" ")[0] ?? "Merhaba";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merhaba, {name}!</h1>
          <p className="text-gray-500 text-sm mt-1">Çocuğunuzun ödev performansını takip edin.</p>
        </div>
        <Link href="/odev-yukle">
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Ödev Yükle
          </Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Çocuklarım</h2>
          <Link href="/cocuklar/yeni">
            <Button variant="ghost" size="sm" className="gap-1 text-indigo-600">
              <Plus className="w-4 h-4" />
              Ekle
            </Button>
          </Link>
        </div>

        {!children || children.length === 0 ? (
          <Link href="/cocuklar/yeni">
            <Card className="border-dashed hover:border-indigo-400 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center text-gray-400">
                Çocuk profili ekleyin
              </CardContent>
            </Card>
          </Link>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link key={child.id} href={`/cocuklar/${child.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-700 font-bold">
                        {child.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{child.name}</p>
                      <Badge variant="secondary" className="text-xs">{child.grade}. Sınıf</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {recentSubmissions && recentSubmissions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Son Ödevler</h2>
            <Link href="/gecmis" className="text-sm text-indigo-600 hover:underline">
              Tümünü gör
            </Link>
          </div>
          <div className="space-y-2">
            {recentSubmissions.map((s) => {
              const score = scoreMap.get(s.id) ?? null;
              return (
                <Link key={s.id} href={`/gecmis/${s.id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(s.children as unknown as { name: string }).name} — {s.subject}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(s.submitted_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      {score != null && (
                        <span
                          className={`font-bold ${
                            score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
                          }`}
                        >
                          %{Math.round(score)}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
