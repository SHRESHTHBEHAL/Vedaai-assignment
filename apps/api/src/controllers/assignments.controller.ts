import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { assignmentSchema, validateQuestionConfigsFromString } from "@shared/schema";
import type { Assignment, AssignmentInput } from "@shared/types";
import { AssignmentStore } from "../store";
import { getGenerationQueue, type JobData } from "../queues/generation.queue";
import { processJobInProcess } from "../queues/generation.worker";
import { extractTextFromBuffer } from "../services/pdf.service";
import { NotFoundError } from "../utils/errors";

function getStore(): AssignmentStore {
  return (globalThis as Record<string, unknown>).__assignmentStore as AssignmentStore;
}

function getParamId(req: Request): string {
  return String(req.params.id ?? "");
}

function normalizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...body };
  // questionConfigs may come as JSON string (from FormData) or as an array (from JSON)
  if (typeof normalized.questionConfigs === "string") {
    try {
      normalized.questionConfigs = JSON.parse(normalized.questionConfigs as string);
    } catch {
      // leave as-is for zod to reject
    }
  }
  return normalized;
}

export async function createAssignment(req: Request, res: Response): Promise<void> {
  const body = normalizeBody(req.body as Record<string, unknown>);
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid assignment",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const input: AssignmentInput = parsed.data;
  const file = req.file;

  if (file) {
    input.fileName = file.originalname;
    input.fileContent = await extractTextFromBuffer(file.buffer, file.mimetype);
  }

  const now = new Date().toISOString();
  const assignmentId = randomUUID();
  const jobId = randomUUID();

  const assignment: Assignment = {
    id: assignmentId,
    input,
    status: "pending",
    jobId,
    createdAt: now,
    updatedAt: now,
  };

  await getStore().create(assignment);

  const queue = getGenerationQueue();
  const jobData: JobData = { assignmentId, jobId, input };

  if (queue) {
    await queue.add("generate", jobData);
  } else {
    void processJobInProcess(jobData, getStore());
  }

  res.status(201).json({
    assignmentId,
    jobId,
    message: "Assignment created. Generation started.",
  });
}

export async function listAssignments(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const result = await getStore().list(page, limit);
  res.json(result);
}

export async function getAssignment(req: Request, res: Response): Promise<void> {
  const id = getParamId(req);
  const assignment = await getStore().get(id);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }
  res.json(assignment);
}

export async function getAssignmentPaper(req: Request, res: Response): Promise<void> {
  const id = getParamId(req);
  const assignment = await getStore().get(id);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }
  if (!assignment.paper) {
    throw new NotFoundError("Paper not yet generated");
  }
  res.json(assignment.paper);
}

export async function regenerateAssignment(req: Request, res: Response): Promise<void> {
  const id = getParamId(req);
  const assignment = await getStore().get(id);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  const jobId = randomUUID();
  const updated: Assignment = {
    ...assignment,
    status: "pending" as const,
    jobId,
    error: undefined,
    paper: undefined,
    updatedAt: new Date().toISOString(),
  };

  await getStore().update(updated.id, updated);

  const queue = getGenerationQueue();
  const jobData: JobData = {
    assignmentId: updated.id,
    jobId,
    input: updated.input,
  };

  if (queue) {
    await queue.add("generate", jobData);
  } else {
    void processJobInProcess(jobData, getStore());
  }

  res.status(202).json({
    assignmentId: updated.id,
    jobId,
    message: "Regeneration started.",
  });
}

export async function deleteAssignment(req: Request, res: Response): Promise<void> {
  const id = getParamId(req);
  const assignment = await getStore().get(id);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  await getStore().delete(id);
  res.json({ message: "Assignment deleted" });
}
