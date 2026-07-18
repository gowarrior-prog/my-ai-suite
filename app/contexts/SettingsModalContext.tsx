"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type SettingsModalContextType = {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

const SettingsModalContext = createContext<SettingsModalContextType | null>(null);

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SettingsModalContext.Provider
      value={{
        isOpen,
        openSettings: () => setIsOpen(true),
        closeSettings: () => setIsOpen(false),
      }}
    >
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  const ctx = useContext(SettingsModalContext);
  if (!ctx) throw new Error("useSettingsModal must be used within a SettingsModalProvider");
  return ctx;
}