import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icon } from "../components/Icons.jsx";

const ToastContext = createContext(null);

const styles = {
  success: { icon: Icon.check, bar: "bg-success-500", iconWrap: "bg-success-50 text-success-600" },
  error: { icon: Icon.alert, bar: "bg-danger-500", iconWrap: "bg-danger-50 text-danger-600" },
  info: { icon: Icon.flag, bar: "bg-cyan-500", iconWrap: "bg-cyan-50 text-cyan-600" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type = "success", duration = 4000) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => {
          const s = styles[t.type] || styles.info;
          const IconCmp = s.icon;
          return (
            <div key={t.id} className="animate-slide-in flex items-start gap-3 bg-white border border-line shadow-pop rounded-xl p-3.5">
              <span className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${s.iconWrap}`}>
                <IconCmp size={14} />
              </span>
              <p className="text-sm text-ink-900 flex-1 pt-0.5">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-600 mt-0.5">
                <Icon.x size={14} />
              </button>
              <span className={`absolute left-0 bottom-0 h-0.5 rounded-b-xl ${s.bar}`} style={{ width: "100%" }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
