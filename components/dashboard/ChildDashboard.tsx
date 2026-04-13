"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardData } from "@/types/analysis";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const SUBJECT_COLORS: Record<string, string> = {
  Matematik: "#6366f1",
  Türkçe: "#f59e0b",
  "Fen Bilgisi": "#10b981",
  "Sosyal Bilgiler": "#f97316",
  İngilizce: "#3b82f6",
};

export default function ChildDashboard({ childId }: { childId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/${childId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.subjectSummary.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Henüz analiz edilmiş ödev yok.</p>
        <p className="text-sm mt-1">Ödev yükleyerek başlayın.</p>
      </div>
    );
  }

  const radarData = data.subjectSummary.map((s) => ({
    subject: s.subject,
    score: s.average_score,
  }));

  // Group score over time by month per subject
  const lineData = data.scoreOverTime.reduce<Record<string, Record<string, number | string>>>((acc, d) => {
    if (!acc[d.date]) acc[d.date] = { date: d.date };
    acc[d.date][d.subject] = d.score;
    return acc;
  }, {});
  const lineChartData = Object.values(lineData).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  const subjects = [...new Set(data.scoreOverTime.map((d) => d.subject))];

  const topTopics = data.topicPerformance.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Subject Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {data.subjectSummary.map((s) => (
          <Card key={s.subject}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.subject}</p>
              <p
                className="text-2xl font-bold"
                style={{ color: SUBJECT_COLORS[s.subject] ?? "#6366f1" }}
              >
                %{Math.round(s.average_score)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{s.total_submissions} ödev</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Radar Chart */}
      {radarData.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ders Bazlı Genel Başarı</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar
                  name="Başarı"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Line Chart - Score Over Time */}
      {lineChartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Zaman İçindeki Gelişim</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `%${v}`} />
                <Legend />
                {subjects.map((subject) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={SUBJECT_COLORS[subject] ?? "#6366f1"}
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Topic Bar Chart */}
      {topTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Konu Bazlı Performans</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topTopics} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="topic" width={130} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "correct" ? [`${value} doğru`, ""] : [`${value} yanlış`, ""]
                  }
                />
                <Bar dataKey="correct" name="Doğru" stackId="a" fill="#10b981" />
                <Bar dataKey="incorrect" name="Yanlış" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
