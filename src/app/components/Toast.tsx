"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  /** tracks enter / visible / exit lifecycle */
  phase: "enter" | "visible" | "exit";
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const startExit = useCallback(
    (id: number) => {
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, phase: "exit" } : t))
      );
      // after exit animation finishes, remove from DOM
      const t = setTimeout(() => remove(id), 300);
      timers.current.set(id, t);
    },
    [remove]
  );

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = ++nextId;
      setItems((prev) => [...prev, { id, type, message, phase: "enter" }]);

      // transition to visible after mount frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setItems((prev) =>
            prev.map((t) => (t.id === id ? { ...t, phase: "visible" } : t))
          );
        });
      });

      // auto-dismiss after 3.5 s
      const t = setTimeout(() => startExit(id), 3500);
      timers.current.set(id, t);
    },
    [startExit]
  );

  // cleanup on unmount
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* toast container – fixed top-right, stacks downward */}
      <div
        aria-live="polite"
        className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto max-w-sm rounded-md px-4 py-2.5 text-sm font-medium shadow-lg
              transition-all duration-300 ease-out cursor-pointer
              ${
                item.type === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-600 text-white"
              }
              ${
                item.phase === "enter"
                  ? "translate-x-full opacity-0"
                  : item.phase === "exit"
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
              }`}
            onClick={() => startExit(item.id)}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
