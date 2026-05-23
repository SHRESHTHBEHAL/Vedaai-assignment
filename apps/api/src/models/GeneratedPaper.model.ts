import mongoose, { Schema } from "mongoose";
import type { GeneratedPaper } from "@shared/types";

const QuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, required: true },
    difficulty: { type: String, required: true },
    marks: { type: Number, required: true },
    options: { type: [String] },
    answer: { type: String },
  },
  { _id: false },
);

const SectionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    questions: { type: [QuestionSchema], required: true },
  },
  { _id: false },
);

const GeneratedPaperSchema = new Schema<GeneratedPaper>(
  {
    id: { type: String, required: true, unique: true },
    assignmentId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    topic: { type: String, required: true },
    dueDate: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    duration: { type: String, required: true },
    sections: { type: [SectionSchema], required: true },
    generatedAt: { type: String, required: true },
  },
  {
    collection: "generated_papers",
  },
);

export const GeneratedPaperModel =
  mongoose.models.GeneratedPaper ||
  mongoose.model<GeneratedPaper>("GeneratedPaper", GeneratedPaperSchema);

