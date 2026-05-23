"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Smartphone,
  History,
  Settings,
  ArrowLeft,
  Bell,
  ChevronDown,
  Menu,
  Plus,
  Users,
  Search,
  Filter,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import { useAssignmentStore } from "@web/lib/store";
import { getAssignments, deleteAssignment } from "@web/lib/api";
import { cn } from "@web/lib/utils";
import {
  LogoVedaAI,
  AvatarSchool,
  AvatarUser,
  IllustrationEmptyState,
} from "@web/components/DashboardIcons";

export default function Home() {
  const router = useRouter();
  const {
    assignments: storeAssignments,
    setAssignments,
    clearActiveJob,
    clearGeneratedPaper,
  } = useAssignmentStore();

  const [activeTab, setActiveTab] = useState("assignments");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAssignments(1, 50)
      .then((res) => setAssignments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setAssignments]);

  const handleCreateNew = () => {
    clearActiveJob();
    clearGeneratedPaper();
    router.push("/create");
  };

  const handleViewPaper = (id: string) => {
    setActiveDropdownId(null);
    router.push(`/paper/${id}`);
  };

  const handleDeleteAssignment = async (
    id: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    try {
      await deleteAssignment(id);
    } catch {}
    setAssignments(storeAssignments.filter((a) => a.id !== id));
  };

  // Unique subjects for filter dropdown
  const uniqueSubjects = Array.from(
    new Set(storeAssignments.map((a) => a.input.subject)),
  ).sort();

  const filtered = storeAssignments.filter((a) => {
    const matchesSearch = a.input.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      !subjectFilter || a.input.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-[#ECEFF1] font-sans antialiased text-[#14213d]">
      {/* Dismiss overlay */}
      {activeDropdownId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveDropdownId(null)}
        />
      )}

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden lg:flex min-h-screen p-5 gap-5 max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 bg-white rounded-[24px] shadow-soft flex flex-col justify-between p-6 border border-ink/5 z-20">
          <div className="space-y-8">
            <LogoVedaAI />

            <button
              onClick={handleCreateNew}
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#1F2937] py-3.5 px-4 font-bold text-white transition-all shadow-[0_0_0_1px_rgba(255,90,54,0.85)] hover:bg-black hover:shadow-[0_0_0_2px_rgba(255,90,54,1),0_8px_20px_rgba(255,90,54,0.25)] active:scale-[0.98] text-sm group"
            >
              <span className="text-[#FF7E40] text-sm group-hover:scale-110 transition-transform">
                ✦
              </span>
              Create Assignment
            </button>

            <nav className="space-y-1">
              {[
                { id: "assignments", label: "Assignments", icon: FileText },
                { id: "groups", label: "My Groups", icon: Users },
                {
                  id: "toolkit",
                  label: "AI Teacher's Toolkit",
                  icon: Smartphone,
                },
                { id: "library", label: "My Library", icon: History },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 rounded-[12px] text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-[#F0F2F5] text-[#14213d]"
                        : "text-[#14213d]/60 hover:bg-[#F0F2F5]/50 hover:text-[#14213d]",
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon
                        className={cn(
                          "h-4.5 w-4.5 shrink-0",
                          isActive
                            ? "text-[#14213d]"
                            : "text-[#14213d]/50",
                        )}
                      />
                      {item.label}
                    </div>
                    {item.id === "assignments" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF5A36] text-white text-[11px] font-black leading-normal shadow-sm">
                        {storeAssignments.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-5">
            <button
              onClick={() => setActiveTab("settings")}
              className={cn(
                "flex items-center gap-3.5 w-full px-4 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200",
                activeTab === "settings"
                  ? "bg-[#F0F2F5] text-[#14213d]"
                  : "text-[#14213d]/60 hover:bg-[#F0F2F5]/50 hover:text-[#14213d]",
              )}
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              Settings
            </button>

            <div className="flex items-center gap-3 bg-[#F0F2F5] p-3 rounded-[16px] border border-black/5">
              <AvatarSchool />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#14213d] text-xs truncate leading-tight">
                  Delhi Public School
                </p>
                <p className="text-[#14213d]/55 text-[11px] font-medium truncate mt-0.5">
                  Bokaro Steel City
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Header */}
          <header className="bg-white h-16 rounded-[20px] shadow-soft border border-ink/5 flex items-center justify-between px-6 shrink-0 z-20">
            <div className="flex items-center gap-3.5">
              <LayoutGrid className="h-4 w-4 text-[#14213d]/40" />
              <span className="text-[#14213d]/55 font-semibold text-sm select-none">
                Assignment
              </span>
            </div>

            <div className="flex items-center gap-5">
              <button className="relative p-2 rounded-full hover:bg-[#F0F2F5] text-[#14213d]/70 hover:text-[#14213d] transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF4136] ring-2 ring-white" />
              </button>

              <div className="h-6 w-px bg-black/10" />

              <button className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-full hover:bg-[#F0F2F5] transition-colors">
                <AvatarUser />
                <span className="font-bold text-[#14213d] text-sm">
                  John Doe
                </span>
                <ChevronDown className="h-4 w-4 text-[#14213d]/40" />
              </button>
            </div>
          </header>

          {/* Canvas */}
          <main className="flex-1 bg-[#F5F6F8] rounded-[24px] shadow-inner border border-black/5 overflow-y-auto p-8 relative">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 h-32"
                  />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-6">
                {/* Title */}
                <div className="flex items-center gap-3.5">
                  <span className="h-3 w-3 rounded-full bg-[#3BB78F] shrink-0 shadow-[0_0_8px_rgba(59,183,143,0.6)]" />
                  <div className="space-y-0.5">
                    <h1 className="text-2xl font-black tracking-tight text-[#14213d]">
                      Assignments
                    </h1>
                    <p className="text-[13px] text-[#14213d]/50 font-semibold">
                      Manage and create assignments for your classes.
                    </p>
                  </div>
                </div>

                {/* Filter/Search */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowFilterDropdown(!showFilterDropdown)
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors shadow-sm",
                        subjectFilter
                          ? "border-[#FF5A36] bg-[#FF5A36]/5 text-[#FF5A36]"
                          : "bg-white border-[#14213d]/10 text-[#14213d]/70 hover:bg-[#F0F2F5]",
                      )}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      {subjectFilter || "Filter By Subject"}
                      {subjectFilter && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubjectFilter("");
                          }}
                          className="ml-1 text-[#FF5A36] hover:text-[#FF4136]"
                        >
                          ×
                        </button>
                      )}
                    </button>
                    {showFilterDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowFilterDropdown(false)}
                        />
                        <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-black/5 py-1.5 z-40 animate-scale-up">
                          <button
                            onClick={() => {
                              setSubjectFilter("");
                              setShowFilterDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2 text-xs font-bold transition-colors",
                              !subjectFilter
                                ? "bg-[#F0F2F5] text-[#14213d]"
                                : "text-gray-600 hover:bg-[#F0F2F5]/50",
                            )}
                          >
                            All Subjects
                          </button>
                          {uniqueSubjects.map((subject) => (
                            <button
                              key={subject}
                              onClick={() => {
                                setSubjectFilter(subject);
                                setShowFilterDropdown(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2 text-xs font-bold transition-colors",
                                subjectFilter === subject
                                  ? "bg-[#F0F2F5] text-[#14213d]"
                                  : "text-gray-600 hover:bg-[#F0F2F5]/50",
                              )}
                            >
                              {subject}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative w-80 max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#14213d]/45" />
                    <input
                      type="text"
                      placeholder="Search Assignment"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[#14213d]/10 rounded-full pl-10 pr-4 py-2 text-xs font-semibold text-[#14213d] outline-none shadow-sm focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all placeholder:text-[#14213d]/35"
                    />
                  </div>
                </div>

                {/* Cards */}
                <div className="grid gap-5 md:grid-cols-2">
                  {filtered.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white rounded-[20px] p-6 border border-black/5 hover:border-black/10 hover:shadow-soft transition-all duration-300 flex flex-col justify-between min-h-[140px] relative group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-extrabold text-[#14213d] text-[16px] tracking-tight group-hover:text-black transition-colors">
                          {a.input.title}
                        </h3>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveDropdownId(
                                activeDropdownId === a.id
                                  ? null
                                  : a.id,
                              )
                            }
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#14213d] hover:bg-[#F0F2F5] transition-colors"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>
                          {activeDropdownId === a.id && (
                            <div className="absolute right-0 top-9 w-40 bg-white rounded-xl shadow-xl py-2 border border-black/5 z-50 animate-scale-up">
                              <button
                                onClick={() => handleViewPaper(a.id)}
                                className="flex w-full items-center px-4 py-2 text-xs font-bold text-left text-gray-700 hover:bg-[#F0F2F5] transition-colors"
                              >
                                View Paper
                              </button>
                              <button
                                onClick={(e) =>
                                  handleDeleteAssignment(a.id, e)
                                }
                                className="flex w-full items-center px-4 py-2 text-xs font-bold text-left text-[#FF4136] hover:bg-[#FF4136]/5 transition-colors border-t border-black/5"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#14213d]/45 pt-4 mt-auto">
                        <span>
                          Subject:{" "}
                          <span className="text-[#14213d]/65 font-black">
                            {a.input.subject}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                            {
                              pending: "bg-gray-100 text-gray-600",
                              processing: "bg-blue-100 text-blue-700",
                              completed:
                                "bg-green-100 text-green-700",
                              failed: "bg-red-100 text-red-700",
                            }[a.status] ?? "bg-gray-100 text-gray-600",
                          )}
                        >
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create floating button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-35">
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 rounded-full bg-black py-3.5 px-6 font-extrabold text-white transition-all hover:scale-105 active:scale-[0.98] shadow-lg hover:shadow-xl text-xs"
                  >
                    <Plus className="h-4 w-4 text-white stroke-[3]" />
                    Create Assignment
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="text-center max-w-[520px] mx-auto py-10 space-y-6 animate-scale-up">
                <IllustrationEmptyState className="h-56" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-[#14213d]">
                    No assignments yet
                  </h2>
                  <p className="text-sm text-[#14213d]/60 leading-relaxed font-medium">
                    Create your first assignment to start generating
                    AI-powered question papers. Set up rubrics, define
                    marking criteria, and let AI assist with grading.
                  </p>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1F2937] py-3.5 px-6 font-bold text-white transition-all hover:bg-black hover:scale-[1.03] active:scale-[0.98] shadow-md hover:shadow-lg text-sm"
                >
                  <Plus className="h-4 w-4 text-white" />
                  Create Your First Assignment
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="lg:hidden min-h-screen flex flex-col justify-between p-4 pb-28 gap-4 max-w-md mx-auto">
        <header className="bg-white h-14 rounded-[16px] shadow-soft border border-ink/5 flex items-center justify-between px-4 shrink-0 z-20">
          <LogoVedaAI />
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#14213d]/70 transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#FF4136]" />
            </button>
            <AvatarUser className="h-7 w-7" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#14213d] transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="absolute top-20 right-4 w-56 bg-white rounded-2xl shadow-xl p-4 space-y-3 border border-black/5 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-2 border-b border-black/5">
                <p className="font-bold text-[#14213d] text-xs">
                  Delhi Public School
                </p>
                <p className="text-[10px] text-gray-500">
                  Bokaro Steel City
                </p>
              </div>
              <nav className="space-y-1">
                {[
                  {
                    id: "assignments",
                    label: "Assignments",
                    icon: FileText,
                  },
                  { id: "groups", label: "My Groups", icon: Users },
                  {
                    id: "toolkit",
                    label: "AI Toolkit",
                    icon: Smartphone,
                  },
                  { id: "library", label: "My Library", icon: History },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold",
                        isActive
                          ? "bg-[#F0F2F5] text-[#14213d]"
                          : "text-gray-600 hover:bg-[#F0F2F5]/50",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      {item.id === "assignments" && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FF5A36] text-white text-[10px] font-black">
                          {storeAssignments.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 bg-[#F5F6F8] rounded-[20px] border border-black/5 p-4 relative">
          {/* Mobile Filter/Search */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold shadow-sm shrink-0",
                  subjectFilter
                    ? "border-[#FF5A36] bg-[#FF5A36]/5 text-[#FF5A36]"
                    : "bg-white border-[#14213d]/10 text-[#14213d]/70",
                )}
              >
                <Filter className="h-3 w-3" />
                {subjectFilter || "Filter"}
                {subjectFilter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubjectFilter("");
                    }}
                    className="text-[#FF5A36]"
                  >
                    ×
                  </button>
                )}
              </button>
              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-black/5 py-1 z-40 animate-scale-up">
                    <button
                      onClick={() => {
                        setSubjectFilter("");
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-[11px] font-bold text-gray-600 hover:bg-[#F0F2F5]"
                    >
                      All Subjects
                    </button>
                    {uniqueSubjects.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => {
                          setSubjectFilter(subject);
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-[11px] font-bold text-gray-600 hover:bg-[#F0F2F5]"
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#14213d]/45" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#14213d]/10 rounded-full pl-8 pr-3 py-1.5 text-[11px] font-semibold text-[#14213d] outline-none shadow-sm focus:border-[#FF5A36] transition-all placeholder:text-[#14213d]/35"
              />
            </div>
          </div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 h-24"
                />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-[16px] p-4 border border-black/5 flex flex-col justify-between gap-3 relative shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-extrabold text-[#14213d] text-sm tracking-tight leading-tight">
                      {a.input.title}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdownId(
                            activeDropdownId === a.id
                              ? null
                              : a.id,
                          )
                        }
                        className="p-1 rounded-lg text-gray-400 hover:text-[#14213d] transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {activeDropdownId === a.id && (
                        <div className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-xl py-1.5 border border-black/5 z-50 animate-scale-up">
                          <button
                            onClick={() => handleViewPaper(a.id)}
                            className="flex w-full items-center px-3.5 py-2 text-xs font-bold text-left text-gray-700 hover:bg-[#F0F2F5]"
                          >
                            View Paper
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteAssignment(a.id, e)
                            }
                            className="flex w-full items-center px-3.5 py-2 text-xs font-bold text-left text-[#FF4136] hover:bg-[#FF4136]/5 border-t border-black/5"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-[#14213d]/45">
                    <span>
                      Subject:{" "}
                      <span className="text-[#14213d]/65 font-black">
                        {a.input.subject}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        {
                          pending: "bg-gray-100 text-gray-600",
                          processing:
                            "bg-blue-100 text-blue-700",
                          completed:
                            "bg-green-100 text-green-700",
                          failed: "bg-red-100 text-red-700",
                        }[a.status] ??
                          "bg-gray-100 text-gray-600",
                      )}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-6 animate-scale-up">
              <IllustrationEmptyState className="h-48" />
              <div className="space-y-2 px-2">
                <h2 className="text-xl font-black tracking-tight text-[#14213d]">
                  No assignments yet
                </h2>
                <p className="text-[13px] text-[#14213d]/60 leading-relaxed font-medium">
                  Create your first assignment to start generating
                  AI-powered question papers.
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 rounded-full bg-[#1F2937] py-3 px-5 font-bold text-white transition-all hover:bg-black active:scale-[0.98] shadow-md text-xs"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
                Create Your First Assignment
              </button>
            </div>
          )}
        </main>

        {/* Bottom nav */}
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto">
          <div className="bg-[#1F2937] text-white h-16 rounded-[24px] shadow-xl flex items-center justify-around px-4 border border-white/5">
            {[
              {
                id: "assignments",
                label: "Assignments",
                icon: FileText,
              },
              {
                id: "library",
                label: "Library",
                icon: History,
              },
              {
                id: "toolkit",
                label: "AI Toolkit",
                icon: Sparkles,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all",
                    isActive
                      ? "text-white opacity-100 scale-105"
                      : "text-white/50 hover:text-white/80",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-bold tracking-wide">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="fixed bottom-24 right-6 h-12 w-12 rounded-full bg-white text-[#FF5A36] flex items-center justify-center shadow-lg border border-black/5 hover:scale-105 active:scale-95 transition-transform z-40"
        >
          <Plus className="h-6 w-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
