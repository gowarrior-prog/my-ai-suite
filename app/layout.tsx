import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/app/contexts/ThemeContext";
import { SettingsModalProvider } from "@/app/contexts/SettingsModalContext";
import SettingsModal from "@/components/SettingsModal";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Neuro Chat",
  description: "AI chat application with PDF support",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full overflow-hidden bg-black text-gray-200 font-sans antialiased">
        <ThemeProvider>
          <SettingsModalProvider>
            <div className="flex h-full">
              <main className="relative h-full flex-1 overflow-hidden">
                {/* Elegant Minimalist Background Glows */}
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-600/20 blur-[120px] mix-blend-screen" />
                  <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen" />
                </div>

                <div className="relative z-10 h-full">{children}</div>
              </main>
            </div>

            {/* Ek hi jagah render hota hai — Sidebar aur ChatHeader dono
                sirf openSettings() call karte hain, modal khud yahan se dikhta hai */}
            <SettingsModal />
          </SettingsModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}