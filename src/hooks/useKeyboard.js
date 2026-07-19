import { useEffect } from "react";

export default function useKeyboard(
  moveUp,
  moveDown
) {
  useEffect(() => {
    function handleKey(e) {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA"
      )
        return;

      switch (e.key) {
        case "w":
        case "ArrowUp":
          e.preventDefault();
          moveUp();
          break;

        case "s":
        case "ArrowDown":
          e.preventDefault();
          moveDown();
          break;

        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKey);

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  }, [moveUp, moveDown]);
}