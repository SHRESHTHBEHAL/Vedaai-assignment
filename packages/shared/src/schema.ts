import { z } from "zod";

const questionTypeEnum = z.enum([
  "mcq",
  "short_answer",
  "long_answer",
  "true_false",
  "fill_in_the_blank",
  "diagram",
  "graph",
]);

const difficultyEnum = z.enum(["easy", "medium", "hard"]);

export const questionConfigSchema = z.object({
  type: questionTypeEnum,
  count: z.coerce.number().int().min(1, "Min 1 question").max(50, "Max 50 per section"),
  marksPerQuestion: z.coerce.number().int().min(1, "Min 1 mark").max(100, "Max 100 marks"),
  difficulty: difficultyEnum,
});

export const assignmentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  subject: z.string().trim().min(2, "Subject is required").max(50),
  grade: z.string().trim().min(1, "Grade is required"),
  topic: z.string().trim().min(3, "Topic is required").max(200),
  dueDate: z.string().min(1, "Due date is required"),
  instructions: z.string().trim().max(1000, "Instructions too long").optional().default(""),
  questionConfigs: z
    .array(questionConfigSchema)
    .min(1, "At least one question type is required")
    .max(5, "Maximum 5 sections"),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
});

export const validateQuestionConfigsFromString = (raw: unknown) => {
  if (typeof raw === "string") {
    try {
      return z.array(questionConfigSchema).parse(JSON.parse(raw));
    } catch {
      throw new Error("Invalid questionConfigs JSON");
    }
  }
  return z.array(questionConfigSchema).parse(raw);
};

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
export type AssignmentFormInput = z.input<typeof assignmentSchema>;
export type QuestionConfigFormValues = z.infer<typeof questionConfigSchema>;
