import type { Metadata } from "next";
import "./globals.css";
import { MissionProvider } from "@/context/MissionContext";

export const metadata: Metadata = {
  title: "HumanGrid Concierge",
  description: "Connecting the Right People. Completing the Right Mission.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 antialiased selection:bg-cyan-500 selection:text-slate-900">
        <MissionProvider>{children}</MissionProvider>
      </body>
    </html>
  );
}
