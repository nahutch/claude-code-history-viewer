import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { GithubIcon, MailIcon, InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FeedbackData {
  subject: string;
  body: string;
  include_system_info: boolean;
  feedback_type: string;
}

interface SystemInfo {
  app_version: string;
  os_type: string;
  os_version: string;
  arch: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const { t } = useTranslation("components");
  const [feedbackType, setFeedbackType] = useState<string>("bug");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [includeSystemInfo, setIncludeSystemInfo] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const feedbackTypes = [
    { value: "bug", label: t("feedback.types.bug") },
    { value: "feature", label: t("feedback.types.feature") },
    { value: "improvement", label: t("feedback.types.improvement") },
    { value: "other", label: t("feedback.types.other") },
  ];

  const loadSystemInfo = async () => {
    try {
      const info = await invoke<SystemInfo>("get_system_info");
      setSystemInfo(info);
    } catch (error) {
      console.error("Failed to load system info:", error);
      alert(t("feedback.systemInfoError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedSubject || !trimmedBody) {
      return;
    }

    if (trimmedSubject.length > 100 || trimmedBody.length > 1000) {
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData: FeedbackData = {
        subject: trimmedSubject,
        body: trimmedBody,
        include_system_info: includeSystemInfo,
        feedback_type: feedbackType,
      };

      await invoke("send_feedback", { feedback: feedbackData });

      setSubject("");
      setBody("");
      onClose();
    } catch (error) {
      console.error("Failed to send feedback:", error);
      alert(t("feedback.sendError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGitHub = async () => {
    try {
      await invoke("open_github_issues");
    } catch (error) {
      console.error("Failed to open GitHub:", error);
      alert(t("feedback.openGitHubError"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("feedback.title")}</DialogTitle>
          <DialogDescription>
            {t("feedback.description", "Share your feedback to help us improve")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="feedbackType">{t("feedback.type")}</Label>
            <select
              id="feedbackType"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "transition-colors focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              {feedbackTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">{t("feedback.subjectRequired")}</Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("feedback.subjectPlaceholder")}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="body">{t("feedback.contentRequired")}</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                feedbackType === "bug"
                  ? t("feedback.placeholders.bug")
                  : feedbackType === "feature"
                  ? t("feedback.placeholders.feature")
                  : t("feedback.placeholders.default")
              }
              rows={6}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "transition-colors placeholder:text-muted-foreground resize-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              required
            />
          </div>

          {/* Include System Info */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeSystemInfo"
              checked={includeSystemInfo}
              onChange={(e) => setIncludeSystemInfo(e.target.checked)}
              className={cn(
                "h-4 w-4 rounded border-input text-primary",
                "focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
            />
            <Label htmlFor="includeSystemInfo" className="cursor-pointer">
              {t("feedback.includeSystemInfo")}
            </Label>
            {includeSystemInfo && !systemInfo && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={loadSystemInfo}
                className="h-auto p-0"
              >
                {t("feedback.preview")}
              </Button>
            )}
          </div>

          {/* System Info Preview */}
          {includeSystemInfo && systemInfo && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground mb-2">
                <InfoIcon className="h-4 w-4" />
                {t("feedback.systemInfoPreview")}
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div>
                  {t("feedback.appVersion", {
                    version: systemInfo.app_version,
                  })}
                </div>
                <div>
                  {t("feedback.os", {
                    os: systemInfo.os_type,
                    version: systemInfo.os_version,
                  })}
                </div>
                <div>
                  {t("feedback.architecture", { arch: systemInfo.arch })}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !body.trim()}
              className="flex-1"
            >
              <MailIcon className="h-4 w-4" />
              {isSubmitting
                ? t("feedback.sendingEmail")
                : t("feedback.sendEmail")}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleOpenGitHub}
              className="flex-1"
            >
              <GithubIcon className="h-4 w-4" />
              {t("feedback.openGitHub")}
            </Button>
          </DialogFooter>
        </form>

        {/* Help Tips */}
        <div className="mt-2 rounded-lg border border-border bg-card p-4 text-sm">
          <div className="font-medium text-foreground mb-2">
            {t("feedback.tips")}
          </div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>{t("feedback.tipBugReport")}</li>
            <li>{t("feedback.tipFeatureRequest")}</li>
            <li>{t("feedback.tipScreenshot")}</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
