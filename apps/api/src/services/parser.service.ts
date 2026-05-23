import { randomUUID } from "node:crypto";
import type { GeneratedPaper, Section } from "@shared/types";
import { ParseError } from "../utils/errors";
import { logger } from "../utils/logger";

interface RawAIResponse {
  title: string;
  duration: string;
  sections: Array<{
    label: string;
    title: string;
    instruction: string;
    questions: Array<{
      text: string;
      type: string;
      difficulty: string;
      marks: number;
      options?: string[];
      answer?: string;
    }>;
  }>;
}

function extractJSON(text: string): string {
  let cleaned = text.trim();

  // Remove markdown fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // If it starts with {, try to find the matching closing brace
  if (cleaned.startsWith("{")) {
    // Find the outermost JSON object
    let depth = 0;
    let end = cleaned.length;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    cleaned = cleaned.substring(0, end);
  }

  return cleaned;
}

export function parseAIResponse(
  rawText: string,
  assignmentId: string,
  subject: string,
  grade: string,
  topic: string,
  dueDate: string,
): GeneratedPaper {
  logger.info("Parsing AI response", {
    length: rawText.length,
    preview: rawText.substring(0, 200),
  });

  const cleaned = extractJSON(rawText);

  logger.info("Cleaned JSON", {
    length: cleaned.length,
    preview: cleaned.substring(0, 200),
  });

  try {
    const parsed: RawAIResponse = JSON.parse(cleaned);

    if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Missing required fields: title, sections");
    }

    let totalMarks = 0;

    const sections: Section[] = parsed.sections.map((sec) => {
      if (!sec.questions || !Array.isArray(sec.questions)) {
        throw new Error(`Section "${sec.label}" has no questions array`);
      }

      const sectionMarks = sec.questions.reduce(
        (sum, q) => sum + (q.marks ?? 0),
        0,
      );
      totalMarks += sectionMarks;

      return {
        id: randomUUID(),
        label: sec.label ?? "Section",
        title: sec.title ?? "Questions",
        instruction:
          sec.instruction ?? "Answer all questions in this section.",
        totalMarks: sectionMarks,
        questions: sec.questions.map((q) => ({
          id: randomUUID(),
          text: q.text ?? "",
          type: (q.type as Section["questions"][0]["type"]) ?? "short_answer",
          difficulty:
            (q.difficulty as Section["questions"][0]["difficulty"]) ?? "medium",
          marks: q.marks ?? 1,
          options: q.options,
          answer: q.answer,
        })),
      };
    });

    return {
      id: randomUUID(),
      assignmentId,
      title: parsed.title,
      subject,
      grade,
      topic,
      dueDate,
      totalMarks,
      duration: parsed.duration ?? "2 hours",
      sections,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Failed to parse AI response", {
      error: error instanceof Error ? error.message : String(error),
      rawPreview: rawText.substring(0, 500),
      cleanedPreview: cleaned.substring(0, 500),
    });
    throw new ParseError(
      "AI response could not be parsed as valid paper JSON",
      rawText,
    );
  }
}
