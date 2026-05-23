import mongoose, { Schema } from "mongoose";
import type { Assignment } from "@shared/types";

const QuestionConfigSchema = new Schema(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true },
    marksPerQuestion: { type: Number, required: true },
    difficulty: { type: String, required: true },
  },
  { _id: false },
);

const AssignmentInputSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    topic: { type: String, required: true },
    dueDate: { type: String, required: true },
    instructions: { type: String, default: "" },
    questionConfigs: { type: [QuestionConfigSchema], required: true },
    fileContent: { type: String },
    fileName: { type: String },
  },
  { _id: false },
);

const AssignmentSchema = new Schema<Assignment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    input: { type: AssignmentInputSchema, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    jobId: { type: String },
    paper: { type: Schema.Types.Mixed },
    error: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "assignments",
  },
);

AssignmentSchema.index({ createdAt: -1 });

export const AssignmentModel =
  mongoose.models.Assignment ||
  mongoose.model<Assignment>("Assignment", AssignmentSchema);

