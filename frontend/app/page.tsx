"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Users, Terminal, Send, AlertTriangle, Loader2 } from "lucide-react";
import { createMission } from "@/services/api";
import { useMission } from "@/context/MissionContext";

export default function Home() {
  const router = useRouter();
  const { setMission } = useMission();

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await createMission(trimmed);
      setMission(result);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* ── Full-screen loading overlay ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md"
          >
            {/* Pulsing ring */}
            <div className="relative flex items-center justify-center mb-6">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-blue-500/20 animate-ping" />
              <div className="relative z-10 p-4 rounded-full bg-blue-600/10 border border-blue-500/30 backdrop-blur">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
            </div>

            {/* Agent ticker */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-2"
            >
              <p className="text-slate-200 font-bold text-lg tracking-tight">
                Activating Mission Engine
              </p>
              <p className="text-slate-500 text-sm">
                Seven-agent pipeline initialising…
              </p>
            </motion.div>

            {/* Animated agent pipeline dots */}
            <div className="flex items-center gap-2 mt-8">
              {["Intent", "Planner", "Skills", "Discovery", "Intel", "Coordinator", "Tracker"].map(
                (label, i) => (
                  <motion.div
                    key={label}
                    className="flex flex-col items-center gap-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-blue-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                    <span className="text-[9px] text-slate-500 hidden sm:block">{label}</span>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page ── */}
      <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 md:px-8">
        {/* Background Animated Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />

        {/* Decorative Network Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 -z-10" />

        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise AI Orchestration Platform
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-blue-100 to-slate-300">
              HumanGrid Concierge
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              Connecting the Right People. Completing the Right Mission.
            </p>
          </motion.div>

          {/* ── Mission Input Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="max-w-2xl mx-auto w-full"
          >
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                id="mission-prompt"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder="Describe your mission… e.g. I need an MCP expert before tomorrow."
                rows={4}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 placeholder-slate-500 text-sm leading-relaxed px-5 py-4 resize-none backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-start gap-2 mt-2 px-1 text-left"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400 leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit row */}
              <div className="flex items-center justify-between mt-3 gap-3">
                <p className="text-xs text-slate-600">
                  Powered by Gemini 2.5 Flash · Seven-Agent Pipeline
                </p>
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-blue-700/20 hover:shadow-blue-600/30 active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isLoading ? "Processing…" : "Launch Mission"}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Feature cards — unchanged */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4"
          >
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md text-left space-y-3">
              <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-lg">7-Agent Orchestrator</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Coordinates Intent, Planning, Skills, Discovery, Intel, Coordination, and Tracking.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md text-left space-y-3">
              <div className="p-2 w-fit rounded-lg bg-cyan-500/10 text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-lg">Expert Discovery</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Searches the complete enterprise knowledge graph spanning employees, projects, departments, and skills.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md text-left space-y-3">
              <div className="p-2 w-fit rounded-lg bg-indigo-500/10 text-indigo-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-lg">Mission Command Center</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enforces clear status transitions, activity feed telemetry, and explainable recommendations.
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="pt-4 text-xs text-slate-500 font-semibold"
          >
            Locked Scope Architecture &bull; Vibe Coding Capstone 2026
          </motion.div>
        </div>
      </main>
    </>
  );
}
