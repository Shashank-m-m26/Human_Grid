import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MissionProvider } from "@/context/MissionContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HumanGrid Concierge — Enterprise AI Orchestration",
  description:
    "Connecting the Right People. Completing the Right Mission. Seven-agent AI pipeline for enterprise workforce orchestration.",
  keywords: ["AI", "enterprise", "orchestration", "workforce", "mission"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-slate-950 font-sans antialiased">
        <MissionProvider>{children}</MissionProvider>
      </body>
    </html>
  );
}
