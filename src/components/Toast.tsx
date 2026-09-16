"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ToastMessage {
  id: number;
  text: string;
  variant: "error" | "success";
}

interface ToastContextValue {
  showToast: (text: string, variant?: "error" | "success") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, variant: "error" | "success" = "error") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 px-4 w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isError = toast.variant === "error";

  return (
    <div
      className={`pointer-events-auto max-w-sm w-full flex items-center gap-2 py-2.5 px-4 rounded-lg border shadow-lg backdrop-blur-sm text-sm font-medium transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      } ${
        isError
          ? "bg-red-500/15 border-red-500/30 text-red-400"
          : "bg-gain/15 border-gain/30 text-gain"
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{toast.text}</span>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
