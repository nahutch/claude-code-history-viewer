/**
 * SettingsModal Component
 *
 * Modal wrapper for Claude Code Settings Manager.
 * Uses a larger modal size (max-w-4xl) to accommodate the complex UI.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SettingsManager } from "@/components/SettingsManager";
import { useAppStore } from "@/store/useAppStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  // Get current project path for project-scoped settings
  const selectedProject = useAppStore((state) => state.selectedProject);
  const projectPath = selectedProject?.path;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle>Claude Code Settings</DialogTitle>
          <DialogDescription className="text-xs">
            Manage permissions, presets, and behaviors for Claude Code
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <SettingsManager projectPath={projectPath} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
