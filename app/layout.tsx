import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Neuro Chat",
  description: "PDF chat app with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-[#050709] text-gray-300 font-sans antialiased">
        <div className="flex h-full">
          <main className="relative h-full flex-1 overflow-hidden">
            {/* Futuristic Background Glows */}
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute left-20 top-20 h-96 w-96 rounded-full bg-blue-600 blur-[128px] mix-blend-screen" />
              <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-purple-600 blur-[128px] mix-blend-screen" />
            </div>

            <div className="relative z-10 h-full">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}