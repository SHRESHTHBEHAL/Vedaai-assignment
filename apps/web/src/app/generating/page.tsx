"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useAssignmentStore } from "@web/lib/store";
import { useWebSocket } from "@web/hooks/useWebSocket";
import { getAssignment } from "@web/lib/api";

const steps = [
  { label: "Queued", range: [0, 0] },
  { label: "Processing", range: [1, 20] },
  { label: "Generating", range: [21, 50] },
  { label: "Structuring", range: [51, 80] },
  { label: "Complete", range: [81, 100] },
];

export default function GeneratingPage() {
  const router = useRouter();
  const {
    activeAssignmentId,
    activeJobId,
    jobStatus,
    jobProgress,
    jobMessage,
    error,
    generatedPaper,
  } = useAssignmentStore();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!activeAssignmentId) {
      router.replace("/create");
    }
  }, [activeAssignmentId, router]);

  useEffect(() => {
    if (generatedPaper && activeAssignmentId) {
      setTimeout(() => {
        router.push(`/paper/${activeAssignmentId}`);
      }, 800);
    }
  }, [generatedPaper, activeAssignmentId, router]);

  useEffect(() => {
    if (activeAssignmentId) {
      subscribe(activeAssignmentId);
    }
  }, [activeAssignmentId, subscribe]);

  if (!activeAssignmentId) {
    return null;
  }

  const activeStepIndex = steps.findIndex(
    (s) => jobProgress >= s.range[0] && jobProgress <= s.range[1],
  );

  return (
    <div className="min-h-screen bg-[#ECEFF1] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-soft border border-black/5 p-8 space-y-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-bold text-[#14213d]/50 hover:text-[#14213d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-black text-[#14213d]">
            Generating Question Paper
          </h1>
          <p className="text-sm text-[#14213d]/55 font-semibold">
            Assignment ID: {activeAssignmentId.substring(0, 8)}...
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-[#ECEFF1] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#3BB78F] transition-all duration-500 ease-out"
              style={{ width: `${jobProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-[#14213d]/40">
            <span>0%</span>
            <span>{jobProgress}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Status message */}
        <div className="text-center">
          <p className="text-sm font-bold text-[#14213d]/70">{jobMessage}</p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-between">
          {steps.map((step, i) => {
            const isCompleted = i < activeStepIndex;
            const isActive = i === activeStepIndex;
            const isFailed = jobStatus === "failed" && isActive;

            return (
              <div
                key={step.label}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <div
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    isFailed
                      ? "bg-[#FF4136]"
                      : isCompleted
                        ? "bg-[#3BB78F]"
                        : isActive
                          ? "bg-[#3BB78F] shadow-[0_0_8px_rgba(59,183,143,0.6)]"
                          : "bg-[#14213d]/15"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold text-center leading-tight ${
                    isActive || isCompleted
                      ? "text-[#14213d]"
                      : "text-[#14213d]/30"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {jobStatus === "failed" && error && (
          <div className="bg-[#FF4136]/5 border border-[#FF4136]/15 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm font-bold text-[#FF4136]">
              Generation failed
            </p>
            <p className="text-xs text-[#14213d]/60">{error}</p>
            <button
              onClick={() => router.push("/create")}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white hover:bg-black/90 transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
