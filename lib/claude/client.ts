import Anthropic from "@anthropic-ai/sdk";
import { SubjectType } from "@/types/database";
import { ClaudeAnalysisResponse, AnalysisResult } from "@/types/analysis";
import { buildSystemPrompt, buildUserMessage } from "./prompts";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const QuestionSchema = z.object({
  number: z.number(),
  text: z.string(),
  student_answer: z.string().nullable(),
  correct_answer: z.string(),
  status: z.enum(["dogru", "yanlis", "cevaplanmamis"]),
  topic: z.string(),
});

const SolutionSchema = z.object({
  question_number: z.number(),
  steps: z.array(z.string()),
  explanation: z.string(),
});

const ClaudeResponseSchema = z.object({
  detected_topic: z.string(),
  questions: z.array(QuestionSchema),
  strong_topics: z.array(z.string()),
  weak_topics: z.array(z.string()),
  solutions: z.array(SolutionSchema),
  summary: z.string(),
});

function parseClaudeJson(text: string): ClaudeAnalysisResponse {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  return ClaudeResponseSchema.parse(parsed);
}

function toAnalysisResult(response: ClaudeAnalysisResponse): AnalysisResult {
  const total = response.questions.length;
  const correct = response.questions.filter((q) => q.status === "dogru").length;
  const incorrect = response.questions.filter((q) => q.status === "yanlis").length;
  const unanswered = response.questions.filter((q) => q.status === "cevaplanmamis").length;
  const score = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;

  return {
    detected_topic: response.detected_topic,
    total_questions: total,
    correct_count: correct,
    incorrect_count: incorrect,
    unanswered_count: unanswered,
    score_percentage: score,
    strong_topics: response.strong_topics,
    weak_topics: response.weak_topics,
    questions_detail: response.questions,
    solutions: response.solutions,
    summary: response.summary,
  };
}

export async function analyzeHomework(params: {
  imageUrls: string[];
  grade: number;
  subject: SubjectType;
  childName: string;
}): Promise<{ result: AnalysisResult; rawResponse: string }> {
  const { imageUrls, grade, subject, childName } = params;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const imageBlocks = imageUrls.map((url) => ({
        type: "image" as const,
        source: { type: "url" as const, url },
      }));

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: buildSystemPrompt(grade, subject, childName),
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: [
              ...imageBlocks,
              {
                type: "text",
                text: buildUserMessage(imageUrls[0]),
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Claude'dan metin yanıtı alınamadı.");
      }

      const rawResponse = textBlock.text;
      const parsed = parseClaudeJson(rawResponse);
      const result = toAnalysisResult(parsed);

      return { result, rawResponse };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error("Analiz başarısız oldu.");
}
