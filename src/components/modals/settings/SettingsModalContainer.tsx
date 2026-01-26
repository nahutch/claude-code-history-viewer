/**
 * SettingsModalContainer Component
 *
 * Container that connects SettingsModal to the modal context.
 */

import { SettingsModal } from "./SettingsModal";
import { useModal } from "@/contexts/modal";

export const SettingsModalContainer: React.FC = () => {
  const { isOpen, closeModal } = useModal();

  if (!isOpen("settings")) return null;

  return <SettingsModal isOpen={true} onClose={() => closeModal("settings")} />;
};
