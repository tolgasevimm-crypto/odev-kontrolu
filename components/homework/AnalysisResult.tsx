"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, MinusCircle, TrendingUp, TrendingDown } from "lucide-react";
import { AnalysisResult as AnalysisResultType } from "@/types/analysis";
import { SubjectType } from "@/types/database";

interface Props {
  analysis: AnalysisResultType;
  childName: string;
  subject: SubjectType;
  imageUrl: string;
}

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  const bg =
    score >= 80 ? "bg-green-50" : score >= 60 ? "bg-yellow-50" : "bg-red-50";

  return (
    <div className={`w-28 h-28 rounded-full ${bg} flex flex-col items-center justify-center`}>
      <span className={`text-3xl font-bold ${color}`}>%{Math.round(score)}</span>
      <span className="text-xs text-gray-500 mt-1">Başarı</span>
    </div>
  );
}

export default function AnalysisResult({ analysis, childName, subject, imageUrl }: Props) {
  const { correct_count, incorrect_count, unanswered_count, total_questions } = analysis;
  const wrongOrMissing = analysis.questions_detail.filter(
    (q) => q.status !== "dogru"
  );

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreCircle score={analysis.score_percentage} />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Konu</p>
                <p className="font-semibold text-gray-900">{analysis.detected_topic}</p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">
                    <strong>{correct_count}</strong> doğru
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-700">
                    <strong>{incorrect_count}</strong> yanlış
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    <strong>{unanswered_count}</strong> boş
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Toplam: {total_questions} soru
                </div>
              </div>
              {analysis.summary && (
                <p className="text-sm text-gray-600 italic border-l-2 border-indigo-300 pl-3">
                  {analysis.summary}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strong / Weak Topics */}
      <div className="grid sm:grid-cols-2 gap-4">
        {analysis.strong_topics.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-700">
                <TrendingUp className="w-4 h-4" />
                Güçlü Konular
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {analysis.strong_topics.map((t) => (
                <Badge key={t} className="bg-green-100 text-green-800 hover:bg-green-100">
                  {t}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
        {analysis.weak_topics.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
                <TrendingDown className="w-4 h-4" />
                Gelişim Gereken Konular
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {analysis.weak_topics.map((t) => (
                <Badge key={t} className="bg-red-100 text-red-800 hover:bg-red-100">
                  {t}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs: Questions + Solutions + Image */}
      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Sorular ({total_questions})</TabsTrigger>
          <TabsTrigger value="solutions">
            Çözümler ({wrongOrMissing.length})
          </TabsTrigger>
          <TabsTrigger value="image">Ödev Görseli</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {analysis.questions_detail.map((q) => (
                  <div key={q.number} className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 shrink-0">
                      {q.status === "dogru" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : q.status === "yanlis" ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <MinusCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {q.number}. {q.text}
                      </p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>
                          Verilen yanıt:{" "}
                          <span className={q.status === "yanlis" ? "text-red-600 font-medium" : ""}>
                            {q.student_answer ?? "—"}
                          </span>
                        </span>
                        {q.status !== "dogru" && (
                          <span>
                            Doğru yanıt:{" "}
                            <span className="text-green-600 font-medium">{q.correct_answer}</span>
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {q.topic}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solutions" className="mt-4">
          {wrongOrMissing.length === 0 ? (
            <p className="text-center py-8 text-gray-400">
              Tüm sorular doğru yapılmış!
            </p>
          ) : (
            <Accordion className="space-y-2">
              {analysis.solutions.map((sol) => {
                const question = analysis.questions_detail.find(
                  (q) => q.number === sol.question_number
                );
                return (
                  <AccordionItem
                    key={sol.question_number}
                    value={String(sol.question_number)}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-sm font-medium text-left">
                      {sol.question_number}. Soru: {question?.text ?? ""}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      <div className="space-y-1">
                        {sol.steps.map((step, i) => (
                          <p key={i} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-indigo-500 font-medium shrink-0">{i + 1}.</span>
                            {step}
                          </p>
                        ))}
                      </div>
                      {sol.explanation && (
                        <p className="text-sm text-indigo-700 bg-indigo-50 rounded p-3 italic">
                          {sol.explanation}
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="image" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative w-full h-96">
                <Image
                  src={imageUrl}
                  alt="Ödev görseli"
                  fill
                  className="object-contain rounded"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
