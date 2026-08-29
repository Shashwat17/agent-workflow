import { useEffect } from "react";

export function useKeyboardShortcuts(
  selectedNodeId,
  handleUndo,
  handleDeleteSelectedNode,
) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const isEditableElement =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isEditableElement) {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "z"
        ) {
          event.preventDefault();
          handleUndo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedNodeId
      ) {
        event.preventDefault();
        handleDeleteSelectedNode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelectedNode, handleUndo, selectedNodeId]);
}
