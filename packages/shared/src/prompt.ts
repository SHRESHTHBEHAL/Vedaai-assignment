import type { AssignmentInput, QuestionConfig } from "./types";

const typeLabels: Record<string, string> = {
  mcq: "Multiple Choice",
  short_answer: "Short Answer",
  long_answer: "Long Answer / Essay",
  true_false: "True or False",
  fill_in_the_blank: "Fill in the Blank",
  diagram: "Diagram / Labeling",
  graph: "Graph / Chart Based",
};

export function buildSystemPrompt(): string {
  return [
    "You are an expert educational assessment designer. Your ONLY job is to output a valid JSON object.",
    "NEVER output markdown. NEVER output thinking. NEVER output explanations. ONLY output the JSON.",
    "Your entire response must be a single JSON object, nothing else.",
  ].join("\n");
}

export function buildUserPrompt(input: AssignmentInput): string {
  const qcLines = input.questionConfigs
    .map(
      (qc: QuestionConfig, i: number) =>
        `Section ${String.fromCharCode(65 + i)}: EXACTLY ${qc.count} ${typeLabels[qc.type] ?? qc.type} questions, ${qc.marksPerQuestion} mark(s) each, ${qc.difficulty} difficulty`,
    )
    .join("\n");

  const fileBlock = input.fileContent?.trim()
    ? `\nReference Material:\n${input.fileContent.substring(0, 3000)}`
    : "";

  const totalMarks = input.questionConfigs.reduce(
    (sum, qc) => sum + qc.count * qc.marksPerQuestion,
    0,
  );

  return [
    `Generate a question paper. Output ONLY this JSON structure:`,
    ``,
    `{`,
    `  "title": "${input.title}",`,
    `  "duration": "${Math.max(1, Math.ceil(totalMarks / 20))} hour(s)",`,
    `  "sections": [`,
    `    {`,
    `      "label": "Section A",`,
    `      "title": "Multiple Choice Questions",`,
    `      "instruction": "Choose the correct answer. Each question carries 1 mark.",`,
    `      "questions": [`,
    `        { "text": "What is...", "type": "mcq", "difficulty": "easy", "marks": 1, "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "B" }`,
    `      ]`,
    `    }`,
    `  ]`,
    `}`,
    ``,
    `REQUIREMENTS:`,
    `Subject: ${input.subject}`,
    `Grade: ${input.grade}`,
    `Topic: ${input.topic}`,
    `Instructions: ${input.instructions || "Create balanced assessment questions"}`,
    fileBlock,
    ``,
    `SECTIONS TO GENERATE (exact counts):`,
    qcLines,
    ``,
    `CRITICAL RULES:`,
    `1. Output ONLY the JSON object. No markdown, no explanations, no thinking.`,
    `2. Start your response with "{" and end with "}".`,
    `3. Generate the EXACT number of questions specified for each section.`,
    `4. MCQ questions MUST have exactly 4 options labeled A, B, C, D.`,
    `5. Questions must be specific to the topic and grade-appropriate.`,
    `6. Ensure JSON is valid (no trailing commas, proper escaping).`,
    `7. For "diagram" type: ask students to draw, label, or complete a diagram. E.g. "Draw and label the parts of a flower" or "Complete the circuit diagram showing..."`,
    `8. For "graph" type: ask students to plot, interpret, or analyze a graph/chart. E.g. "Plot a velocity-time graph from the given data" or "Interpret the population growth chart and answer..."`,
    `9. Diagram/graph questions should describe exactly what to draw/plot in the question text.`,
  ].join("\n");
}

/** @deprecated Use buildUserPrompt instead */
export function buildStructuredPrompt(input: AssignmentInput): string {
  return buildUserPrompt(input);
}
