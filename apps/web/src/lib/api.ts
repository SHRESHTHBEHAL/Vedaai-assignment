import type {
  Assignment,
  AssignmentInput,
  CreateAssignmentResponse,
  GeneratedPaper,
} from "@shared/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? body?.message ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function createAssignment(
  formData: FormData,
): Promise<CreateAssignmentResponse> {
  return request<CreateAssignmentResponse>("/assignments", {
    method: "POST",
    body: formData,
  });
}

export async function getAssignments(
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: Assignment[];
  total: number;
  page: number;
  limit: number;
}> {
  return request(`/assignments?page=${page}&limit=${limit}`);
}

export async function getAssignment(id: string): Promise<Assignment> {
  return request(`/assignments/${id}`);
}

export async function getGeneratedPaper(
  assignmentId: string,
): Promise<GeneratedPaper> {
  return request(`/assignments/${assignmentId}/paper`);
}

export async function regeneratePaper(
  assignmentId: string,
): Promise<CreateAssignmentResponse> {
  return request<CreateAssignmentResponse>(
    `/assignments/${assignmentId}/regenerate`,
    { method: "POST" },
  );
}

export async function deleteAssignment(
  id: string,
): Promise<{ message: string }> {
  return request(`/assignments/${id}`, { method: "DELETE" });
}
