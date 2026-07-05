"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Sparkles,
  Users,
  Terminal,
  Send,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { createMission } from "@/services/api";
import { useMission } from "@/context/MissionContext";

const AGENTS = [
  "Intent",
  "Planner",
  "Skills",
  "Discovery",
  "Intel",
  "Coordinator",
  "Tracker",
];

const FEATURE_CARDS = [
  {
    icon: Shield,
    color: "blue",
    title: "7-Agent Orchestrator",
    description:
      "Coordinates Intent, Planning, Skills, Discovery, Intel, Coordination, and Tracking through a sequential ADK pipeline.",
  },
  {
    icon: Users,
    color: "cyan",
    title: "Expert Discovery",
    description:
      "Searches the complete enterprise knowledge graph spanning employees, projects, departments, and skills.",
  },
  {
    icon: Terminal,
    color: "indigo",
    title: "Mission Command Center",
    description:
      "Enforces clear status transitions, activity feed telemetry, and explainable ranked recommendations.",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20",
};

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
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
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
            role="status"
            aria-live="polite"
            aria-label="Mission engine activating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950/96 backdrop-blur-md px-4"
          >
            {/* Pulsing ring */}
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-blue-500/15 animate-ping" />
              <div className="relative z-10 p-4 rounded-full bg-blue-600/10 border border-blue-500/25 backdrop-blur">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center space-y-1.5"
            >
              <p className="text-slate-100 font-bold text-lg tracking-tight">
                Activating Mission Engine
              </p>
              <p className="text-slate-400 text-sm">
                Seven-agent pipeline initialising…
              </p>
            </motion.div>

            {/* Agent pipeline dots */}
            <div
              className="flex items-end gap-3 sm:gap-4"
              aria-hidden="true"
            >
              {AGENTS.map((label, i) => (
                <motion.div
                  key={label}
                  className="flex flex-col items-center gap-1.5"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-500"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: i * 0.18,
                    }}
                  />
                  <span className="text-[9px] text-slate-500 font-semibold hidden sm:block tracking-wide uppercase">
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page ── */}
      <main
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8 py-16"
        aria-label="HumanGrid Concierge home"
      >
        {/* Background radial gradient */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10"
          aria-hidden="true"
        />

        {/* Decorative grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 -z-10"
          aria-hidden="true"
        />

        <div className="max-w-4xl w-full text-center space-y-10">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/25 bg-blue-950/40 text-blue-400 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm select-none">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Enterprise AI Orchestration Platform
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-blue-100 to-slate-300 leading-tight pb-1">
              HumanGrid Concierge
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
              Connecting the Right People.{" "}
              <span className="text-slate-300">Completing the Right Mission.</span>
            </p>
          </motion.div>

          {/* ── Mission Input Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="max-w-2xl mx-auto w-full"
          >
            <form
              onSubmit={handleSubmit}
              className="space-y-3"
              aria-label="Mission submission form"
            >
              <div className="relative">
                <label htmlFor="mission-prompt" className="sr-only">
                  Describe your mission
                </label>
                <textarea
                  id="mission-prompt"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (!isLoading && prompt.trim()) handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  disabled={isLoading}
                  placeholder="Describe your mission… e.g. I need an MCP expert who can lead API integration before tomorrow's client demo."
                  rows={4}
                  aria-describedby={error ? "mission-error" : undefined}
                  aria-invalid={!!error}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-500 text-sm leading-relaxed px-5 py-4 resize-none backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 hover:border-slate-700 hover:bg-slate-900/80 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    id="mission-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="flex items-start gap-2 px-1 text-left overflow-hidden"
                  >
                    <AlertTriangle
                      className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-amber-400 leading-relaxed">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit row */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-600 leading-relaxed hidden sm:block">
                  Powered by Gemini 2.5 Flash &bull; Seven-Agent ADK Pipeline
                  <span className="block text-slate-700 mt-0.5">
                    ⌘ + Enter to submit
                  </span>
                </p>
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-blue-700/20 hover:shadow-blue-500/30 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 whitespace-nowrap ml-auto"
                  aria-label={isLoading ? "Processing mission" : "Launch Mission"}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  {isLoading ? "Processing…" : "Launch Mission"}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-2"
            role="list"
            aria-label="Platform features"
          >
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  role="listitem"
                  className="group p-5 sm:p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md text-left space-y-3 card-hover cursor-default"
                >
                  <div
                    className={`p-2 w-fit rounded-lg transition-colors duration-200 ${colorMap[card.color]}`}
                    aria-hidden="true"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-slate-200 text-base leading-snug">
                    {card.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-slate-600 group-hover:text-slate-500 transition-colors font-medium">
                    <span>Learn more</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="pt-2 text-[11px] text-slate-600 font-medium tracking-wide"
            role="contentinfo"
          >
            Locked Scope Architecture &bull; Kaggle AI Agents Intensive 2026 &bull; Vibe Coding Capstone
          </motion.footer>
        </div>
      </main>
    </>
  );
}
