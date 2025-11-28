import { useEffect } from "react";

// Simple hook that creates a DOM node appended to document.body and returns it.
// Caller should use ReactDOM.createPortal(children, portal())
export default function usePortal(id?: string): HTMLElement {
  const el = document.createElement("div");
  if (id) el.id = id;

  useEffect(() => {
    const target = document.body;
    target.appendChild(el);
    return () => {
      if (target.contains(el)) target.removeChild(el);
    };
  }, [el]);

  return el;
}