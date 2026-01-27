import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/lib/auth-context";
import { NudgeSystem } from "@/components/features/nudge-system";
import { CrisisFloatingButton } from "@/components/features/crisis-button";


const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Psychological Support Web",
  description: "A mental health support platform for learning.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          outfit.variable
        )}
      >
        <AuthProvider>
          <div className="relative min-h-screen flex flex-col">
            {/* ... (rest of layout) */}

            {/* Abstract Background Blobs - Keep existing */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Branding Header - Fixed Top */}
            <header className="fixed top-0 left-0 right-0 h-20 z-40 flex items-center justify-between px-6 pointer-events-none bg-gradient-to-b from-background/80 via-background/0 to-transparent">
              {/* SSA101 - CHATGPT TEAM */}
              <div className="pointer-events-auto mt-4 px-6 py-2.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300 group cursor-default">
                <span className="font-outfit font-bold text-sm md:text-base tracking-[0.2em] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent group-hover:bg-gradient-to-l animate-gradient-x">
                  SSA101 <span className="text-white/30 mx-2">|</span> CHATGPT TEAM
                </span>
              </div>

              {/* FPTU Logo Custom */}
              <div className="pointer-events-auto mt-2 rounded-lg p-1 bg-white/50 backdrop-blur-sm shadow-md border border-white/20">
                <img
                  src="/fptu-logo-custom.png"
                  alt="FPTU Logo"
                  className="h-10 md:h-14 w-auto object-contain"
                />
              </div>
            </header>

            <Navbar />

            {/* Main Content with top padding to avoid header overlap */}
            <main className="flex-1 pb-32 pt-24 md:pt-28 px-4">
              {children}
            </main>
            <NudgeSystem />
            <CrisisFloatingButton />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
