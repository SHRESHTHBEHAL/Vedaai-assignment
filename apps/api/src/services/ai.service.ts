import "dotenv/config";
import { buildSystemPrompt, buildUserPrompt } from "@shared/prompt";
import type { AssignmentInput } from "@shared/types";
import { logger } from "../utils/logger";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

function stripThinkingBlocks(text: string): string {
  // Remove <｜end▁of▁thinking｜> blocks that Gemini thinking models may include
  let cleaned = text
    .replace(/<\s*thinking\s*>[\s\S]*?<\s*\/\s*thinking\s*>/gi, "")
    .replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, "")
    .replace(/<\s*thought\s*>[\s\S]*?<\s*\/\s*thought\s*>/gi, "")
    .trim();

  // Remove any text before the first `{` (thinking models sometimes output reasoning first)
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace > 0) {
    cleaned = cleaned.substring(firstBrace);
  }

  // Remove any text after the last `}` 
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace > 0 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }

  return cleaned;
}

export async function generatePaperWithAI(
  input: AssignmentInput,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    logger.warn("GEMINI_API_KEY not set; using fallback generator.");
    return generateFallback(input);
  }

  try {
    const systemPrompt = buildSystemPrompt();
    // Add timestamp and random seed to force unique output on regenerations
    const uniquenessHint = `\n\nGENERATION SEED: ${Date.now()}-${Math.random().toString(36).substring(2, 8)}. Generate DIFFERENT questions than before. Be creative and vary question styles.`;
    const userPrompt = buildUserPrompt(input) + uniquenessHint;

    logger.info(`Calling Gemini model: ${GEMINI_MODEL}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2,
          topP: 0.95,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`Gemini API error ${response.status}:`, errorBody);
      throw new Error(`Gemini API error ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: string }> };
      }>;
    };

    // Collect ALL text parts (skip thought/thinking parts)
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const textParts = parts
      .filter((p) => p.text && p.text.trim().length > 0)
      .map((p) => p.text!)
      .join("\n");

    if (!textParts) {
      logger.warn("Gemini returned empty response, falling back.", { partsCount: parts.length });
      return generateFallback(input);
    }

    // Log raw response for debugging (first 300 chars)
    logger.info("Gemini raw response preview:", textParts.substring(0, 300));

    // Strip any thinking blocks
    const cleaned = stripThinkingBlocks(textParts);

    logger.info("Gemini cleaned response preview:", cleaned.substring(0, 300));
    logger.info("Gemini generated paper successfully");

    return cleaned;
  } catch (error) {
    logger.error("AI generation failed, falling back:", error);
    return generateFallback(input);
  }
}

function generateFallback(input: AssignmentInput): string {
  const sections = input.questionConfigs.map((qc, i) => {
    const label = `Section ${String.fromCharCode(65 + i)}`;
    const typeLabel =
      {
        mcq: "Multiple Choice Questions",
        short_answer: "Short Answer Questions",
        long_answer: "Long Answer Questions",
        true_false: "True or False Questions",
        fill_in_the_blank: "Fill in the Blank Questions",
        diagram: "Diagram / Labeling Questions",
        graph: "Graph / Chart Based Questions",
      }[qc.type] ?? qc.type;

    const questions = Array.from({ length: qc.count }, (_, j) => {
      const isMCQ = qc.type === "mcq";
      return {
        text: `Question ${j + 1} for ${input.topic} (${qc.difficulty} difficulty)`,
        type: qc.type,
        difficulty: qc.difficulty,
        marks: qc.marksPerQuestion,
        ...(isMCQ && {
          options: [
            `A. Option one for ${input.topic}`,
            `B. Option two for ${input.topic}`,
            `C. Option three for ${input.topic}`,
            `D. Option four for ${input.topic}`,
          ],
        }),
        answer: `Model answer for question ${j + 1}`,
      };
    });

    return {
      label,
      title: typeLabel,
      instruction: `Answer all questions. Each question carries ${qc.marksPerQuestion} mark(s).`,
      questions,
    };
  });

  const totalMarks = input.questionConfigs.reduce(
    (sum, qc) => sum + qc.count * qc.marksPerQuestion,
    0,
  );

  return JSON.stringify({
    title: input.title,
    duration: `${Math.max(1, Math.ceil(totalMarks / 20))} hour(s)`,
    sections,
  });
}
