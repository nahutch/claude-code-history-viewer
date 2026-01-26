import {
  FeedbackModalContainer,
  FolderSelectorContainer,
  SettingsModalContainer,
} from "@/components/modals";

export const ModalContainer = () => {
  return (
    <>
      <FolderSelectorContainer />
      <FeedbackModalContainer />
      <SettingsModalContainer />
    </>
  );
};
