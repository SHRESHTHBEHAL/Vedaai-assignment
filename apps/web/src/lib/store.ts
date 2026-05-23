"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Assignment,
  AssignmentInput,
  GeneratedPaper,
  JobStatus,
  WebSocketMessage,
} from "@shared/types";

interface AssignmentStore {
  // Current form state
  currentInput: Partial<AssignmentInput>;
  setCurrentInput: (input: Partial<AssignmentInput>) => void;
  resetCurrentInput: () => void;

  // Active job tracking
  activeAssignmentId: string | null;
  activeJobId: string | null;
  jobStatus: JobStatus | null;
  jobProgress: number;
  jobMessage: string;
  setActiveJob: (assignmentId: string, jobId: string) => void;
  updateJobProgress: (progress: number, message: string) => void;
  clearActiveJob: () => void;

  // Generated paper
  generatedPaper: GeneratedPaper | null;
  setGeneratedPaper: (paper: GeneratedPaper) => void;
  clearGeneratedPaper: () => void;

  // Assignment list
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;

  // WebSocket event handling
  handleWebSocketMessage: (msg: WebSocketMessage) => void;

  // UI state
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set, get) => ({
      // Form state
      currentInput: {},
      setCurrentInput: (input) =>
        set((s) => ({
          currentInput: { ...s.currentInput, ...input },
        })),
      resetCurrentInput: () => set({ currentInput: {} }),

      // Job tracking
      activeAssignmentId: null,
      activeJobId: null,
      jobStatus: null,
      jobProgress: 0,
      jobMessage: "",
      setActiveJob: (assignmentId, jobId) =>
        set({
          activeAssignmentId: assignmentId,
          activeJobId: jobId,
          jobStatus: "pending",
          jobProgress: 0,
          jobMessage: "Job queued...",
          error: null,
        }),
      updateJobProgress: (progress, message) =>
        set({
          jobProgress: progress,
          jobMessage: message,
        }),
      clearActiveJob: () =>
        set({
          activeAssignmentId: null,
          activeJobId: null,
          jobStatus: null,
          jobProgress: 0,
          jobMessage: "",
        }),

      // Generated paper
      generatedPaper: null,
      setGeneratedPaper: (paper) =>
        set({
          generatedPaper: paper,
          jobStatus: "completed",
          jobProgress: 100,
        }),
      clearGeneratedPaper: () => set({ generatedPaper: null }),

      // Assignment list
      assignments: [],
      setAssignments: (assignments) => set({ assignments }),
      addAssignment: (assignment) =>
        set((s) => ({
          assignments: [assignment, ...s.assignments].slice(0, 100),
        })),
      updateAssignment: (id, updates) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        })),

      // WebSocket message handler
      handleWebSocketMessage: (msg) => {
        const state = get();
        if (msg.assignmentId !== state.activeAssignmentId) return;

        switch (msg.type) {
          case "JOB_STATUS":
          case "JOB_PROGRESS":
            set({
              jobStatus: msg.status,
              jobProgress: msg.progress ?? state.jobProgress,
              jobMessage: msg.message ?? state.jobMessage,
            });
            break;
          case "JOB_COMPLETE":
            set({
              jobStatus: "completed",
              jobProgress: 100,
              jobMessage: msg.message ?? "Complete!",
              generatedPaper: msg.paper ?? null,
            });
            if (msg.paper) {
              // Update the assignment in the list
              get().updateAssignment(msg.assignmentId, {
                status: "completed",
                paper: msg.paper,
              });
            }
            break;
          case "JOB_ERROR":
            set({
              jobStatus: "failed",
              error: msg.error ?? "Generation failed",
              jobMessage: msg.message ?? "",
            });
            break;
        }
      },

      // UI state
      isSubmitting: false,
      setIsSubmitting: (v) => set({ isSubmitting: v }),
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: "vedaai-assignment-store",
      partialize: (state) => ({
        assignments: state.assignments,
        generatedPaper: state.generatedPaper,
      }),
    },
  ),
);
