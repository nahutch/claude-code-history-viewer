// src/components/ProjectTree.tsx
import React, { useState } from "react";
import {
  Folder,
  Wrench,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Database,
  Clock,
  Hash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClaudeProject, ClaudeSession } from "../types";
import { cn } from "@/lib/utils";
import { getLocale } from "../utils/time";

interface ProjectTreeProps {
  projects: ClaudeProject[];
  sessions: ClaudeSession[];
  selectedProject: ClaudeProject | null;
  selectedSession: ClaudeSession | null;
  onProjectSelect: (project: ClaudeProject) => void;
  onSessionSelect: (session: ClaudeSession) => void;
  onGlobalStatsClick: () => void;
  isLoading: boolean;
  isViewingGlobalStats: boolean;
}

export const ProjectTree: React.FC<ProjectTreeProps> = ({
  projects,
  sessions,
  selectedSession,
  onProjectSelect,
  onSessionSelect,
  onGlobalStatsClick,
  isLoading,
  isViewingGlobalStats,
}) => {
  const [expandedProject, setExpandedProject] = useState("");
  const { t, i18n } = useTranslation();

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const currentLanguage = i18n.language || "en";
      const locale = getLocale(currentLanguage);

      if (diffMins < 60) {
        return t("common:time.minutesAgo", "{{count}}m", { count: diffMins });
      } else if (diffHours < 24) {
        return t("common:time.hoursAgo", "{{count}}h", { count: diffHours });
      } else if (diffDays < 7) {
        return t("common:time.daysAgo", "{{count}}d", { count: diffDays });
      } else {
        return date.toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return dateStr;
    }
  };

  const toggleProject = (projectPath: string) => {
    setExpandedProject((prev) => (prev === projectPath ? "" : projectPath));
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("components:project.explorer", "Explorer")}
          </span>
          <span className="text-2xs font-mono text-muted-foreground">
            {projects.length}
          </span>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {projects.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Folder className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("components:project.notFound", "No projects found")}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 animate-stagger">
            {/* Global Stats Button */}
            <button
              onClick={onGlobalStatsClick}
              className={cn(
                "sidebar-item w-full flex items-center gap-3 mx-2",
                "text-left transition-all duration-200",
                isViewingGlobalStats && "active"
              )}
              style={{ width: "calc(100% - 16px)" }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-accent/10 text-accent"
                )}
              >
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground">
                  {t("components:project.globalStats", "Global Statistics")}
                </div>
                <div className="text-2xs text-muted-foreground">
                  {t("components:project.globalStatsDescription", "All projects overview")}
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="my-2 mx-4 h-px bg-sidebar-border" />

            {/* Projects */}
            {projects.map((project) => {
              const isExpanded = expandedProject === project.path;

              return (
                <div key={project.path}>
                  {/* Project Item */}
                  <button
                    onClick={() => {
                      onProjectSelect(project);
                      toggleProject(project.path);
                    }}
                    className={cn(
                      "w-full px-4 py-2 flex items-center gap-2",
                      "text-left transition-all duration-200",
                      "hover:bg-sidebar-accent/50",
                      isExpanded && "bg-sidebar-accent/30"
                    )}
                  >
                    {/* Expand Icon */}
                    <span className="text-muted-foreground">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>

                    {/* Folder Icon */}
                    <Folder
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isExpanded ? "text-accent" : "text-muted-foreground"
                      )}
                    />

                    {/* Project Name */}
                    <span
                      className={cn(
                        "text-sm truncate flex-1",
                        isExpanded
                          ? "text-sidebar-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {project.name}
                    </span>
                  </button>

                  {/* Sessions List */}
                  {isExpanded && sessions.length > 0 && !isLoading && (
                    <div className="ml-4 pl-3 border-l border-sidebar-border/50 space-y-0.5 py-1">
                      {sessions.map((session) => {
                        const isSessionSelected =
                          selectedSession?.session_id === session.session_id;

                        return (
                          <button
                            key={session.session_id}
                            onClick={() => {
                              if (!isSessionSelected) {
                                onSessionSelect(session);
                              }
                            }}
                            className={cn(
                              "sidebar-item w-full flex flex-col gap-1 py-2.5",
                              "text-left transition-all duration-200",
                              isSessionSelected && "active"
                            )}
                            style={{ width: "calc(100% - 8px)" }}
                          >
                            {/* Session Header */}
                            <div className="flex items-start gap-2">
                              <MessageCircle
                                className={cn(
                                  "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                                  isSessionSelected
                                    ? "text-accent"
                                    : "text-muted-foreground"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-xs leading-tight line-clamp-2",
                                  isSessionSelected
                                    ? "text-sidebar-foreground font-medium"
                                    : "text-muted-foreground"
                                )}
                              >
                                {session.summary ||
                                  t(
                                    "components:session.summaryNotFound",
                                    "No summary"
                                  )}
                              </span>
                            </div>

                            {/* Session Meta */}
                            <div className="flex items-center gap-2 ml-5.5 text-2xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(session.last_modified)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {session.message_count}
                              </span>
                              {session.has_tool_use && (
                                <Wrench className="w-3 h-3 text-accent/70" />
                              )}
                              {session.has_errors && (
                                <AlertTriangle className="w-3 h-3 text-destructive" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Loading State */}
                  {isExpanded && isLoading && (
                    <div className="ml-7 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full animate-shimmer" />
                        <div className="h-3 w-24 rounded animate-shimmer" />
                      </div>
                    </div>
                  )}

                  {/* Empty Sessions */}
                  {isExpanded && sessions.length === 0 && !isLoading && (
                    <div className="ml-7 py-3 text-2xs text-muted-foreground">
                      {t("components:session.notFound", "No sessions")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-2xs text-muted-foreground">
          <span>
            {t("components:project.count", "{{count}} projects", {
              count: projects.length,
            })}
          </span>
          <span>
            {t("components:session.count", "{{count}} sessions", {
              count: sessions.length,
            })}
          </span>
        </div>
      </div>
    </aside>
  );
};
