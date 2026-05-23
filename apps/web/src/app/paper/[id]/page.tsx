"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Download, RefreshCcw, Sparkles } from "lucide-react";
import { useAssignmentStore } from "@web/lib/store";
import { getGeneratedPaper, regeneratePaper } from "@web/lib/api";
import { useWebSocket } from "@web/hooks/useWebSocket";
import { exportPaperAsPDF } from "@web/lib/exportPaper";
import { cn } from "@web/lib/utils";
import type { GeneratedPaper } from "@shared/types";

const difficultyBadgeStyle: Record<string, { bg: string; text: string; border: string }> = {
  easy: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  medium: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  hard: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
};

const tailwindDifficultyBadge: Record<string, string> = {
  easy: "bg-[#dcfce7] text-[#166534]",
  medium: "bg-[#fef9c3] text-[#854d0e]",
  hard: "bg-[#fee2e2] text-[#991b1b]",
};

export default function PaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { subscribe } = useWebSocket();
  const [id, setId] = useState<string>("");
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  const storePaper = useAssignmentStore((s) => s.generatedPaper);
  const setGeneratedPaper = useAssignmentStore((s) => s.setGeneratedPaper);
  const clearGeneratedPaper = useAssignmentStore((s) => s.clearGeneratedPaper);
  const setActiveJob = useAssignmentStore((s) => s.setActiveJob);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    if (storePaper && storePaper.assignmentId === id) {
      setPaper(storePaper);
      setLoading(false);
      return;
    }

    setLoading(true);
    getGeneratedPaper(id)
      .then((p) => {
        setPaper(p);
        setGeneratedPaper(p);
      })
      .catch(() => setPaper(null))
      .finally(() => setLoading(false));
  }, [id, storePaper, setGeneratedPaper]);

  const handleDownloadPDF = async () => {
    if (!paperRef.current || !paper) return;
    setPdfProgress(0);
    try {
      const fileName = `${paper.subject}_${paper.grade}_${paper.title}`
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_.-]/g, "")
        .substring(0, 200);
      await exportPaperAsPDF(paperRef.current, fileName, setPdfProgress);
    } catch {
      // silently fail
    } finally {
      setPdfProgress(null);
    }
  };

  const handleRegenerate = async () => {
    if (!id || !confirm("This will replace the current paper. Continue?"))
      return;
    setRegenerating(true);
    try {
      // Clear old paper from store so we don't show stale content
      clearGeneratedPaper();
      setPaper(null);
      const response = await regeneratePaper(id);
      setActiveJob(response.assignmentId, response.jobId);
      subscribe(response.assignmentId);
      router.push("/generating");
    } catch {
      alert("Failed to regenerate. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECEFF1] p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-32 bg-white rounded animate-pulse" />
          <div className="bg-white rounded-2xl p-8 space-y-6 animate-pulse">
            <div className="h-8 w-3/4 bg-[#ECEFF1] rounded" />
            <div className="h-4 w-1/2 bg-[#ECEFF1] rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-[#ECEFF1] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-[#ECEFF1] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold text-[#14213d]">Paper not found</p>
          <p className="text-sm text-[#14213d]/50">
            The paper may have been deleted or not yet generated.
          </p>
          <button
            onClick={() => router.push("/create")}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white"
          >
            Create New Assignment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECEFF1] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Action Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-black/5 px-5 py-3 shadow-sm">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-bold text-[#14213d]/60 hover:text-[#14213d] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="hidden md:inline-flex rounded-xl border border-[#14213d]/15 bg-white px-4 py-2 text-xs font-bold text-[#14213d]/85 hover:bg-[#F0F2F5] transition-colors"
            >
              Print
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-2 rounded-xl border border-[#14213d]/15 bg-white px-4 py-2 text-xs font-bold text-[#14213d]/85 hover:bg-[#F0F2F5] transition-colors disabled:opacity-50"
            >
              <RefreshCcw
                className={cn("h-3.5 w-3.5", regenerating && "animate-spin")}
              />
              Regenerate
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfProgress !== null}
              className="flex items-center gap-2 rounded-xl bg-[#1F2937] px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
          </div>
          {pdfProgress !== null && (
            <div className="w-full h-1 bg-[#ECEFF1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3BB78F] transition-all duration-300"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Paper Content */}
        <div
          ref={paperRef}
          className="paper-sheet rounded-[24px] border border-[#14213d]/10 bg-white p-6 md:p-12 shadow-soft relative overflow-hidden"
        >
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF5A36]/5 rounded-bl-[100px] flex items-center justify-center pointer-events-none select-none pl-4 pb-4">
            <Sparkles className="h-5 w-5 text-[#FF5A36]/25" />
          </div>

          {/* Header */}
          <header className="border-b-2 border-dashed border-[#14213d]/15 pb-6 text-center space-y-2">
            <h1 className="text-lg md:text-xl font-black text-[#14213d] uppercase tracking-wide">
              {paper.title}
            </h1>
            <p className="text-xs md:text-sm font-extrabold text-[#14213d]/70 uppercase tracking-widest">
              {paper.grade} | {paper.subject}
            </p>
            <div className="pt-3.5 flex flex-wrap justify-between text-[11px] font-black text-[#14213d]/50 border-t border-black/5 mt-4">
              <span className="uppercase tracking-wider">
                Time allowed: {paper.duration}
              </span>
              <span className="uppercase tracking-wider">
                Maximum Marks: {paper.totalMarks}
              </span>
            </div>
          </header>

          {/* Student Info */}
          <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="flex items-end gap-2 text-xs font-black text-[#14213d]">
              <span className="shrink-0 uppercase tracking-wider text-[10px] text-gray-400">
                Name:
              </span>
              <span className="flex-1 border-b border-[#14213d]/25 pb-0.5" />
            </div>
            <div className="flex items-end gap-2 text-xs font-black text-[#14213d]">
              <span className="shrink-0 uppercase tracking-wider text-[10px] text-gray-400">
                Roll No:
              </span>
              <span className="flex-1 border-b border-[#14213d]/25 pb-0.5" />
            </div>
            <div className="flex items-end gap-2 text-xs font-black text-[#14213d]">
              <span className="shrink-0 uppercase tracking-wider text-[10px] text-gray-400">
                Section:
              </span>
              <span className="flex-1 border-b border-[#14213d]/25 pb-0.5" />
            </div>
          </div>

          {/* Sections */}
          <main className="mt-10 space-y-10">
            {paper.sections.map((section) => (
              <section key={section.id} className="space-y-4">
                <div className="flex flex-col justify-between gap-1 border-b border-[#14213d]/10 pb-2 md:flex-row md:items-end">
                  <div>
                    <h2 className="text-sm md:text-base font-black text-[#14213d] uppercase tracking-wider">
                      {section.label} — {section.title}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold text-[#14213d]/50 italic">
                      {section.instruction}
                    </p>
                  </div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider shrink-0">
                    {section.totalMarks} marks total
                  </span>
                </div>

                <ol className="space-y-5">
                  {section.questions.map((q, index) => (
                    <li
                      key={q.id}
                      className="flex items-start gap-3 question-item"
                    >
                      <span className="font-black text-[#14213d] text-sm shrink-0 select-none w-5 text-right">
                        {index + 1}.
                      </span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="font-medium text-[13px] md:text-[14px] leading-relaxed text-[#14213d] flex-1">
                            {q.text}
                          </span>
                          <span
                            className={cn(
                              "difficulty-badge shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              tailwindDifficultyBadge[q.difficulty] ??
                                "bg-gray-100 text-gray-600",
                            )}
                            style={{
                              display: "inline-block",
                              borderRadius: "9999px",
                              padding: "2px 8px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              backgroundColor:
                                difficultyBadgeStyle[q.difficulty]?.bg ?? "#f3f4f6",
                              color:
                                difficultyBadgeStyle[q.difficulty]?.text ?? "#4b5563",
                              border: `1px solid ${difficultyBadgeStyle[q.difficulty]?.border ?? "#d1d5db"}`,
                              verticalAlign: "middle",
                            }}
                          >
                            {q.difficulty}
                          </span>
                          <span className="font-black text-[#FF5A36] text-xs shrink-0">
                            [{q.marks} Marks]
                          </span>
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="mt-2.5 grid gap-3 grid-cols-1 md:grid-cols-2 pl-2">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="flex items-center gap-2.5 text-xs font-bold text-[#14213d]/70"
                              >
                                <span
                                  className="h-6 w-6 rounded-full border border-black/10 bg-[#F8FAFC] flex items-center justify-center text-[10px] font-black shrink-0 text-[#14213d]/60 select-none"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    backgroundColor: "#F8FAFC",
                                    fontSize: "10px",
                                    fontWeight: "900",
                                    color: "rgba(20,33,61,0.6)",
                                    flexShrink: "0",
                                  }}
                                >
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Drawing area for diagram/graph questions */}
                        {(q.type === "diagram" || q.type === "graph") && (
                          <div
                            className="mt-3 border-2 border-dashed border-[#14213d]/15 rounded-xl p-2"
                            style={{
                              border: "2px dashed rgba(20,33,61,0.15)",
                              borderRadius: "12px",
                              padding: "8px",
                              minHeight: q.type === "graph" ? "180px" : "140px",
                              backgroundColor: "#FAFBFC",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div className="text-center">
                              <p
                                className="text-[11px] font-bold text-[#14213d]/30 uppercase tracking-wider"
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  color: "rgba(20,33,61,0.3)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                }}
                              >
                                {q.type === "graph"
                                  ? "Graph Paper / Plotting Area"
                                  : "Diagram Drawing Area"}
                              </p>
                              <p
                                className="text-[9px] text-[#14213d]/20 mt-1"
                                style={{
                                  fontSize: "9px",
                                  color: "rgba(20,33,61,0.2)",
                                }}
                              >
                                {q.type === "graph"
                                  ? "Use this space to draw your graph/chart"
                                  : "Draw and label your diagram here"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </main>

          {/* Footer */}
          <div className="py-10 flex items-center justify-center gap-4 text-[10px] font-black tracking-widest text-[#14213d]/25 uppercase select-none">
            <span className="h-px w-10 bg-black/10" />
            End of Question Paper
            <span className="h-px w-10 bg-black/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
