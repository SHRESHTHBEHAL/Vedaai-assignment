"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, MoreVertical, Search, Filter, Plus } from "lucide-react";
import { useAssignmentStore } from "@web/lib/store";
import { getAssignments, deleteAssignment as deleteApiAssignment } from "@web/lib/api";
import { cn } from "@web/lib/utils";
import type { Assignment } from "@shared/types";

const statusBadge: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments: storeAssignments, setAssignments } =
    useAssignmentStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    getAssignments(page)
      .then((res) => {
        setAssignments(res.data);
        setTotal(res.total);
      })
      .catch(() => {
        // use store data as fallback
      })
      .finally(() => setLoading(false));
  }, [page, setAssignments]);

  const filtered = storeAssignments.filter((a) =>
    a.input.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    await deleteApiAssignment(id).catch(() => {});
    setAssignments(storeAssignments.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#ECEFF1] p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl hover:bg-white text-[#14213d]/60 hover:text-[#14213d] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#14213d]">Assignments</h1>
              <p className="text-sm text-[#14213d]/50 font-semibold">
                Manage and track your assignments
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/create")}
            className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white hover:bg-black/90 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New Assignment
          </button>
        </div>

        {/* Search/Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#14213d]/40" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#14213d]/10 rounded-full pl-10 pr-4 py-2.5 text-xs font-semibold text-[#14213d] outline-none shadow-sm focus:border-[#FF5A36] transition-all"
            />
          </div>
        </div>

        {/* Dismiss overlay for dropdowns */}
        {activeDropdownId && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveDropdownId(null)}
          />
        )}

        {/* Assignment list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 animate-pulse h-24"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl p-5 border border-black/5 hover:border-black/10 hover:shadow-soft transition-all cursor-pointer"
                onClick={() =>
                  router.push(`/paper/${assignment.id}`)
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-[#14213d] text-sm truncate">
                      {assignment.input.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold text-[#14213d]/45">
                      <span>{assignment.input.subject}</span>
                      <span>{assignment.input.grade}</span>
                      <span>
                        Due:{" "}
                        {new Date(
                          assignment.input.dueDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold",
                        statusBadge[assignment.status] ??
                          "bg-gray-100 text-gray-600",
                      )}
                    >
                      {assignment.status}
                    </span>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(
                            activeDropdownId === assignment.id
                              ? null
                              : assignment.id,
                          );
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#14213d] hover:bg-[#F0F2F5] transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {activeDropdownId === assignment.id && (
                        <div className="absolute right-0 top-9 w-40 bg-white rounded-xl shadow-xl py-2 border border-black/5 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(null);
                              router.push(`/paper/${assignment.id}`);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#F0F2F5] transition-colors"
                          >
                            View Paper
                          </button>
                          <button
                            onClick={(e) =>
                              handleDelete(assignment.id, e)
                            }
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#FF4136] hover:bg-[#FF4136]/5 border-t border-black/5 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-black/5">
            <p className="font-bold text-gray-500">No assignments found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Create your first assignment to get started"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-black/5 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-[#14213d]/50">
              Page {page} of {Math.ceil(total / 10)}
            </span>
            <button
              onClick={() =>
                setPage((p) =>
                  p < Math.ceil(total / 10) ? p + 1 : p,
                )
              }
              disabled={page >= Math.ceil(total / 10)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-black/5 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
