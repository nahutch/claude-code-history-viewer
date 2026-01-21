import {
  Loader2,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Activity,
  FileEdit,
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
    <header className="h-12 flex items-center justify-between px-4 bg-sidebar border-b border-border/50">
      {/* Left: Logo & App Name */}
      <div className="flex items-center gap-2">
        <img
          src="/app-icon.png"
          alt="Claude Code History"
          className="w-6 h-6"
        />
        <span className="text-sm font-semibold text-foreground tracking-tight">
          {t("appName")}
        </span>
      </div>

      {/* Center: Navigation Tabs */}
      {selectedProject && (
        <nav className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
          {selectedSession && (
            <NavTab
              icon={MessageSquare}
              label={tComponents("message.view")}
              isActive={computed.isMessagesView}
              onClick={() => {
                if (!computed.isMessagesView) {
                  analyticsActions.switchToMessages();
                }
              }}
            />
          )}
          <NavTab
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
          <NavTab
            icon={Activity}
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
          <NavTab
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
        </nav>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {selectedSession && (
          <TooltipButton
            onClick={() => refreshCurrentSession()}
            disabled={isLoadingMessages}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
            content={tComponents("session.refresh")}
          >
            <RefreshCw
              className={cn("w-4 h-4", isLoadingMessages && "animate-spin")}
            />
          </TooltipButton>
        )}
        <SettingDropdown />
      </div>
    </header>
  );
};

/* Navigation Tab Component */
interface NavTabProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const NavTab = ({
  icon: Icon,
  label,
  isActive,
  isLoading,
  onClick,
  disabled,
}: NavTabProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};
