import {
  Loader2,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Activity,
  FileEdit,
  Terminal,
} from "lucide-react";

import { TooltipButton } from "@/shared/TooltipButton";
import { useAppStore } from "@/store/useAppStore";
import { useAnalytics } from "@/hooks/useAnalytics";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { SettingDropdown } from "./SettingDropdown";

export const Header = () => {
  const { t } = useTranslation("common");
  const { t: tComponents } = useTranslation("components");
  const { t: tMessages } = useTranslation("messages");

  const {
    selectedProject,
    selectedSession,
    isLoadingMessages,
    refreshCurrentSession,
  } = useAppStore();

  const { actions: analyticsActions, computed } = useAnalytics();

  const handleLoadTokenStats = async () => {
    if (!selectedProject) return;
    try {
      await analyticsActions.switchToTokenStats();
    } catch (error) {
      console.error("Failed to load token stats:", error);
    }
  };

  const handleLoadAnalytics = async () => {
    if (!selectedProject) return;
    try {
      await analyticsActions.switchToAnalytics();
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const handleLoadRecentEdits = async () => {
    if (!selectedProject) return;
    try {
      await analyticsActions.switchToRecentEdits();
    } catch (error) {
      console.error("Failed to load recent edits:", error);
    }
  };

  return (
    <header className="relative h-14 flex items-center justify-between px-5 border-b-0 bg-gradient-to-r from-sidebar via-sidebar to-card">
      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-accent/60 via-accent to-accent/60" />

      {/* Left: Logo & Title */}
      <div className="relative flex items-center gap-3">
        {/* Logo with ring */}
        <div className="relative">
          <div className="absolute -inset-1 bg-accent/20 rounded-xl blur-md" />
          <div className="relative p-1.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl ring-1 ring-accent/30">
            <img
              src="/app-icon.png"
              alt="Claude Code History"
              className="w-7 h-7 rounded-lg"
            />
          </div>
        </div>

        {/* Title Group */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              {t("appName")}
            </h1>
            {selectedProject && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
                  {selectedProject.name}
                </span>
              </>
            )}
          </div>
          {selectedSession ? (
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {selectedSession.summary ||
                `${tComponents("session.title")} ${selectedSession.session_id.slice(-8)}`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("appDescription")}</p>
          )}
        </div>
      </div>

      {/* Center: Quick Stats (when session selected) */}
      {selectedSession && computed.isMessagesView && (
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span className="text-2xs uppercase tracking-widest text-muted-foreground font-medium">
              Session
            </span>
            <span className="font-mono text-xs text-foreground">
              {selectedSession.actual_session_id.slice(0, 8)}
            </span>
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {selectedProject && (
          <>
            {/* Analytics */}
            <NavButton
              icon={BarChart3}
              label={tComponents("analytics.dashboard")}
              isActive={computed.isAnalyticsView}
              onClick={() => {
                if (computed.isAnalyticsView) {
                  analyticsActions.switchToMessages();
                } else {
                  handleLoadAnalytics();
                }
              }}
            />

            {/* Token Stats */}
            <NavButton
              icon={computed.isAnyLoading ? Loader2 : Activity}
              label={tMessages("tokenStats.existing")}
              isActive={computed.isTokenStatsView}
              isLoading={computed.isAnyLoading}
              onClick={() => {
                if (computed.isTokenStatsView) {
                  analyticsActions.switchToMessages();
                } else {
                  handleLoadTokenStats();
                }
              }}
              disabled={computed.isAnyLoading}
            />

            {/* Recent Edits */}
            <NavButton
              icon={FileEdit}
              label={tComponents("recentEdits.title")}
              isActive={computed.isRecentEditsView}
              onClick={() => {
                if (computed.isRecentEditsView) {
                  analyticsActions.switchToMessages();
                } else {
                  handleLoadRecentEdits();
                }
              }}
              disabled={computed.isAnyLoading}
            />
          </>
        )}

        {selectedSession && (
          <>
            {/* Divider */}
            <div className="w-px h-6 bg-border mx-2" />

            {/* Messages */}
            <NavButton
              icon={MessageSquare}
              label={tComponents("message.view")}
              isActive={computed.isMessagesView}
              onClick={() => {
                if (!computed.isMessagesView) {
                  analyticsActions.switchToMessages();
                }
              }}
            />

            {/* Refresh */}
            <TooltipButton
              onClick={() => refreshCurrentSession()}
              disabled={isLoadingMessages}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-secondary"
              )}
              content={tComponents("session.refresh")}
            >
              <RefreshCw
                className={cn("w-4 h-4", isLoadingMessages && "animate-spin")}
              />
            </TooltipButton>
          </>
        )}

        {/* Settings Dropdown */}
        <div className="ml-2 pl-2 border-l border-border">
          <SettingDropdown />
        </div>
      </div>
    </header>
  );
};

/* Navigation Button Component */
interface NavButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const NavButton = ({
  icon: Icon,
  label,
  isActive,
  isLoading,
  onClick,
  disabled,
}: NavButtonProps) => {
  return (
    <TooltipButton
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative p-2 rounded-lg transition-all duration-200",
        "text-muted-foreground",
        isActive
          ? "bg-accent/15 text-accent shadow-sm shadow-accent/20"
          : "hover:bg-secondary/80 hover:text-foreground hover:shadow-sm",
        disabled && "opacity-50 cursor-not-allowed",
        "active:scale-95"
      )}
      content={label}
    >
      <Icon className={cn("w-4 h-4 transition-transform", isLoading && "animate-spin")} />
      {isActive && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-glow animate-subtle-pulse" />
      )}
    </TooltipButton>
  );
};
