import type { Assignment, GeneratedPaper } from "@shared/types";
import { AssignmentModel } from "./models/Assignment.model";

const memoryStore = new Map<string, Assignment>();

export class AssignmentStore {
  constructor(private readonly useMongo: boolean) {}

  async create(record: Assignment): Promise<Assignment> {
    memoryStore.set(record.id, record);
    if (this.useMongo) {
      try {
        await AssignmentModel.create(record);
      } catch {
        // ignore mongo errors, in-memory is primary
      }
    }
    return record;
  }

  async get(id: string): Promise<Assignment | null> {
    if (this.useMongo) {
      try {
        const doc = await AssignmentModel.findOne({ id }).lean();
        if (doc) {
          const { _id, __v, ...assignment } = doc as Record<string, unknown> & { _id: unknown; __v?: unknown };
          return assignment as unknown as Assignment;
        }
      } catch {
        // fall through to memory
      }
    }
    return memoryStore.get(id) ?? null;
  }

  async list(page: number = 1, limit: number = 10): Promise<{
    data: Assignment[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (this.useMongo) {
      try {
        const total = await AssignmentModel.countDocuments();
        const docs = await AssignmentModel.find()
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        const data = docs.map((doc) => {
          const { _id, __v, ...assignment } = doc as Record<string, unknown> & { _id: unknown; __v?: unknown };
          return assignment as unknown as Assignment;
        });
        return { data, total, page, limit };
      } catch {
        // fall through to memory
      }
    }

    const all = [...memoryStore.values()].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit };
  }

  async update(
    id: string,
    updates: Partial<Assignment>,
  ): Promise<Assignment | null> {
    const existing = await this.get(id);
    if (!existing) return null;

    const updated: Assignment = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.set(id, updated);
    if (this.useMongo) {
      try {
        await AssignmentModel.updateOne({ id }, { $set: updated });
      } catch {
        // ignore
      }
    }
    return updated;
  }

  async updateStatus(
    id: string,
    status: Assignment["status"],
    progress: number,
    error?: string,
  ): Promise<Assignment | null> {
    return this.update(id, { status, error, ...(progress !== undefined && {}) });
  }

  async complete(id: string, paper: GeneratedPaper): Promise<Assignment | null> {
    return this.update(id, { status: "completed", paper });
  }

  async delete(id: string): Promise<boolean> {
    memoryStore.delete(id);
    if (this.useMongo) {
      try {
        await AssignmentModel.deleteOne({ id });
      } catch {
        // ignore
      }
    }
    return true;
  }
}
