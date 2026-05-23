"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  UploadCloud,
  ChevronDown,
  X,
  Plus,
  Mic,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAssignmentStore } from "@web/lib/store";
import { useWebSocket } from "@web/hooks/useWebSocket";
import { createAssignment } from "@web/lib/api";
import { cn } from "@web/lib/utils";
import type { QuestionConfig, Difficulty, QuestionType } from "@shared/types";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice Questions",
  short_answer: "Short Answer Questions",
  long_answer: "Long Answer / Essay Questions",
  true_false: "True or False",
  fill_in_the_blank: "Fill in the Blanks",
  diagram: "Diagram / Labeling Based",
  graph: "Graph / Chart Based",
};

const QUESTION_TYPES: QuestionType[] = [
  "mcq",
  "short_answer",
  "long_answer",
  "true_false",
  "fill_in_the_blank",
  "diagram",
  "graph",
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

interface QuestionRow {
  id: string;
  type: QuestionType;
  count: number;
  marks: number;
  difficulty: Difficulty;
}

function newRow(): QuestionRow {
  return {
    id: String(Date.now()),
    type: "mcq",
    count: 5,
    marks: 1,
    difficulty: "easy",
  };
}

export default function CreatePage() {
  const router = useRouter();
  const { subscribe } = useWebSocket();
  const {
    setActiveJob,
    addAssignment,
    setCurrentInput,
    resetCurrentInput,
  } = useAssignmentStore();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0],
  );
  const [instructions, setInstructions] = useState("");
  const [rows, setRows] = useState<QuestionRow[]>([newRow()]);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalQuestions = rows.reduce((s, r) => s + r.count, 0);
  const totalMarks = rows.reduce((s, r) => s + r.count * r.marks, 0);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3)
      errs.title = "Title must be at least 3 characters";
    if (!subject.trim()) errs.subject = "Subject is required";
    if (!grade.trim()) errs.grade = "Grade is required";
    if (!topic.trim() || topic.trim().length < 3)
      errs.topic = "Topic must be at least 3 characters";
    if (totalMarks === 0) errs.rows = "Add at least one question";
    if (totalMarks > 500)
      errs.rows = "Total marks cannot exceed 500";
    if (totalQuestions > 100)
      errs.rows = "Total questions cannot exceed 100";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const processFile = useCallback((f: File) => {
    setFile(f);
    setFileName(f.name);
    setFileSize(`${(f.size / (1024 * 1024)).toFixed(1)} MB`);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const updateRow = (id: string, patch: Partial<QuestionRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, newRow()]);
  };

  const deleteRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("subject", subject.trim());
      fd.append("grade", grade.trim());
      fd.append("topic", topic.trim());
      fd.append("dueDate", dueDate);
      fd.append("instructions", instructions.trim());

      const configs: QuestionConfig[] = rows.map((r) => ({
        type: r.type,
        count: r.count,
        marksPerQuestion: r.marks,
        difficulty: r.difficulty,
      }));
      fd.append("questionConfigs", JSON.stringify(configs));

      if (file) {
        fd.append("file", file);
      }

      const result = await createAssignment(fd);

      setActiveJob(result.assignmentId, result.jobId);
      subscribe(result.assignmentId);

      addAssignment({
        id: result.assignmentId,
        input: {
          title: title.trim(),
          subject: subject.trim(),
          grade: grade.trim(),
          topic: topic.trim(),
          dueDate,
          instructions: instructions.trim(),
          questionConfigs: configs,
          fileName: fileName || undefined,
        },
        status: "pending",
        jobId: result.jobId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      router.push("/generating");
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Failed to create assignment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const Stepper = ({
    value,
    onDecrement,
    onIncrement,
    min = 1,
  }: {
    value: number;
    onDecrement: () => void;
    onIncrement: () => void;
    min?: number;
  }) => (
    <div className="flex items-center justify-between bg-[#F5F6F8] border border-black/5 rounded-full p-1 h-9">
      <button
        type="button"
        onClick={onDecrement}
        className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black shadow-sm font-black text-sm active:scale-90 transition-transform"
      >
        -
      </button>
      <span className="text-xs font-black text-[#14213d] select-none">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black shadow-sm font-black text-sm active:scale-90 transition-transform"
      >
        +
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#ECEFF1] p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl hover:bg-white text-[#14213d]/60 hover:text-[#14213d] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#14213d]">
              Create Assignment
            </h1>
            <p className="text-xs text-[#14213d]/50 font-semibold">
              Set up a new assignment for AI paper generation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields card */}
          <div className="bg-white rounded-[24px] border border-black/5 p-6 md:p-8 shadow-soft space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] gap-3",
                  isDragOver
                    ? "border-[#FF5A36] bg-[#FF5A36]/5"
                    : "border-black/10 bg-[#FAFAFA] hover:border-[#FF5A36] hover:bg-[#FF5A36]/2",
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                  className="hidden"
                />
                <div className="p-3 bg-white rounded-full shadow-sm text-[#FF5A36] border border-black/5">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-xs font-black text-[#14213d] select-none">
                  {fileName || "Choose a file or drag & drop it here"}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold select-none">
                  {fileSize ? `Size: ${fileSize}` : "PDF, TXT, up to 10MB"}
                </p>
              </div>
            </div>

            {/* Basic details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Title"
                value={title}
                onChange={setTitle}
                placeholder="e.g. Physics Mid-Term Examination"
                error={errors.title}
              />
              <InputField
                label="Subject"
                value={subject}
                onChange={setSubject}
                placeholder="e.g. Physics"
                error={errors.subject}
              />
              <InputField
                label="Grade / Class"
                value={grade}
                onChange={setGrade}
                placeholder="e.g. Grade 8"
                error={errors.grade}
              />
              <InputField
                label="Topic / Chapter"
                value={topic}
                onChange={setTopic}
                placeholder="e.g. Electricity & Circuits"
                error={errors.topic}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-[#14213d]">
                Due Date
              </label>
              <div className="relative max-w-sm">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-[#14213d]/10 rounded-[12px] pl-4 pr-10 py-3 text-xs font-bold text-[#14213d] outline-none shadow-sm focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all"
                />
                <Calendar className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#14213d]/45" />
              </div>
            </div>

            {/* Question Type Rows */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-[#14213d]">
                Question Types
              </label>

              {/* Desktop layout */}
              <div className="hidden md:block space-y-3">
                <div className="grid grid-cols-[1fr_100px_auto_130px_130px] gap-2 px-2 text-[10px] font-black text-gray-400 tracking-wider">
                  <div>TYPE</div>
                  <div>DIFFICULTY</div>
                  <div />
                  <div className="text-center">NO. OF QUESTIONS</div>
                  <div className="text-center">MARKS</div>
                </div>

                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_100px_auto_130px_130px] gap-2 items-center"
                  >
                    <select
                      value={row.type}
                      onChange={(e) =>
                        updateRow(row.id, {
                          type: e.target.value as QuestionType,
                        })
                      }
                      className="bg-white border border-[#14213d]/10 rounded-[12px] pl-3 pr-8 py-2.5 text-xs font-bold text-[#14213d] appearance-none outline-none focus:border-[#FF5A36] transition-all cursor-pointer shadow-sm"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {QUESTION_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>

                    <select
                      value={row.difficulty}
                      onChange={(e) =>
                        updateRow(row.id, {
                          difficulty: e.target.value as Difficulty,
                        })
                      }
                      className="bg-white border border-[#14213d]/10 rounded-[12px] pl-3 pr-6 py-2.5 text-xs font-bold text-[#14213d] appearance-none outline-none focus:border-[#FF5A36] transition-all cursor-pointer shadow-sm"
                    >
                      {DIFFICULTY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#FF4136] hover:bg-[#FF4136]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <Stepper
                      value={row.count}
                      onDecrement={() =>
                        updateRow(row.id, {
                          count: Math.max(1, row.count - 1),
                        })
                      }
                      onIncrement={() =>
                        updateRow(row.id, {
                          count: Math.min(50, row.count + 1),
                        })
                      }
                    />

                    <Stepper
                      value={row.marks}
                      onDecrement={() =>
                        updateRow(row.id, {
                          marks: Math.max(1, row.marks - 1),
                        })
                      }
                      onIncrement={() =>
                        updateRow(row.id, {
                          marks: Math.min(100, row.marks + 1),
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Mobile layout */}
              <div className="md:hidden space-y-4">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="bg-[#FAFAFA] border border-black/5 rounded-[16px] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <select
                        value={row.type}
                        onChange={(e) =>
                          updateRow(row.id, {
                            type: e.target.value as QuestionType,
                          })
                        }
                        className="bg-white border border-[#14213d]/10 rounded-[10px] pl-3 pr-8 py-2 text-xs font-bold"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {QUESTION_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        disabled={rows.length <= 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF4136]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-400 block px-1">
                          NO. OF QUESTIONS
                        </span>
                        <Stepper
                          value={row.count}
                          onDecrement={() =>
                            updateRow(row.id, {
                              count: Math.max(1, row.count - 1),
                            })
                          }
                          onIncrement={() =>
                            updateRow(row.id, {
                              count: Math.min(50, row.count + 1),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-400 block px-1">
                          MARKS
                        </span>
                        <Stepper
                          value={row.marks}
                          onDecrement={() =>
                            updateRow(row.id, {
                              marks: Math.max(1, row.marks - 1),
                            })
                          }
                          onIncrement={() =>
                            updateRow(row.id, {
                              marks: Math.min(100, row.marks + 1),
                            })
                          }
                        />
                      </div>
                    </div>
                    <select
                      value={row.difficulty}
                      onChange={(e) =>
                        updateRow(row.id, {
                          difficulty: e.target.value as Difficulty,
                        })
                      }
                      className="w-full bg-white border border-[#14213d]/10 rounded-[10px] pl-3 pr-8 py-2 text-xs font-bold"
                    >
                      {DIFFICULTY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 text-xs font-black text-[#14213d] hover:text-[#FF5A36] transition-colors"
                disabled={rows.length >= 5}
              >
                <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center">
                  <Plus className="h-3 w-3 stroke-[3]" />
                </div>
                Add Question Type
              </button>
            </div>

            {/* Summary */}
            <div className="flex flex-col items-end border-t border-black/5 pt-4 text-xs font-black text-[#14213d] gap-1.5 pr-2">
              <div className="flex gap-2">
                <span className="text-gray-400">Total Questions :</span>
                <span>{totalQuestions}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400">Total Marks :</span>
                <span>{totalMarks}</span>
              </div>
              {errors.rows && (
                <span className="text-[#FF4136] text-[10px]">
                  {errors.rows}
                </span>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-2 border-t border-black/5 pt-4">
              <label className="block text-xs font-black text-[#14213d]">
                Additional Instructions
              </label>
              <div className="relative">
                <textarea
                  value={instructions}
                  onChange={(e) =>
                    setInstructions(e.target.value.substring(0, 1000))
                  }
                  placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                  className="w-full bg-[#FAFAFA] border border-[#14213d]/10 rounded-[16px] pl-4 pr-12 py-3 text-xs font-medium text-[#14213d] outline-none shadow-sm focus:border-[#FF5A36] focus:bg-white transition-all placeholder:text-gray-400 min-h-[96px] resize-y"
                />
                <button
                  type="button"
                  onClick={() =>
                    setInstructions(
                      "Generate a balanced assessment focusing on fundamental concepts, computational problems, and diagram-based evaluations.",
                    )
                  }
                  className="absolute right-3.5 bottom-3.5 p-1.5 rounded-full bg-white text-[#14213d] hover:text-[#FF5A36] border border-black/5 hover:scale-105 active:scale-95 shadow-sm transition-all"
                >
                  <Mic className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-[#FF4136]/5 border border-[#FF4136]/15 rounded-xl p-4">
              <p className="text-sm font-bold text-[#FF4136]">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-black px-6 py-3.5 font-black text-white hover:bg-black/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-md text-xs transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Generate Question Paper
                  <span className="text-[#FF7E40]">✦</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black text-[#14213d]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-white border rounded-[12px] pl-4 pr-4 py-3 text-xs font-bold text-[#14213d] outline-none shadow-sm focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all",
          error
            ? "border-[#FF4136]"
            : "border-[#14213d]/10",
        )}
      />
      {error && (
        <p className="text-[10px] font-bold text-[#FF4136]">{error}</p>
      )}
    </div>
  );
}
