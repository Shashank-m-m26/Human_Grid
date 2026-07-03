"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Layers,
  Users,
  Briefcase,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  GitBranch,
  Cpu,
  Shield,
  Activity,
  Brain,
  Network,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Mission Command Center");

  const sidebarItems = [
    { name: "Mission Command Center", icon: LayoutDashboard },
    { name: "Active Missions", icon: Layers },
    { name: "Employees", icon: Users },
    { name: "Projects", icon: Briefcase },
    { name: "Analytics", icon: BarChart3 },
    { name: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none -z-10" />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? "5rem" : "18rem" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-20 flex flex-col border-r border-slate-900 bg-slate-900/40 backdrop-blur-xl"
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-900">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-blue-400"
              >
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                <span>HumanGrid</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-400 transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 p-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex w-full items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-650/20 text-blue-400 border border-blue-500/20 font-semibold shadow-lg shadow-blue-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-900">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-850/40 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg shadow-blue-500/10">
              HG
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden"
              >
                <h4 className="text-sm font-bold text-slate-200 truncate">Enterprise Mode</h4>
                <p className="text-xs text-slate-500 truncate">v1.0.0-prod</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 md:px-8 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          {/* Logo & Sub-path for small screens / Context title */}
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-200 md:block hidden">
              {activeTab}
            </h2>
          </div>

          {/* Search, Notifications, User */}
          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="relative max-w-xs md:w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search missions, assets, graph..."
                disabled
                className="w-full bg-slate-900/60 border border-slate-850/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
            </button>

            {/* Profile Menu */}
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 border border-slate-900 transition-colors">
              <div className="w-6.5 h-6.5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-semibold">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-300 hidden md:inline">Admin User</span>
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Dashboard Summary Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                Command Center Workspace
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Multi-agent enterprise pipeline execution dashboard. Ready to process missions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-950/20 w-fit">
              <Shield className="w-4 h-4 shrink-0" />
              Secure ADK Pipeline
            </div>
          </div>

          {/* Grid Layout of Placeholder Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mission Timeline Card */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-slate-200 text-base">Mission Timeline</h3>
                  </div>
                  <span className="text-xs text-slate-500">Pipeline State Transitions</span>
                </div>
                <div className="h-28 flex items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40">
                  <p className="text-xs text-slate-500">No active mission. Submission timeline will render here.</p>
                </div>
              </div>

              {/* Agent Execution Timeline Card */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-slate-200 text-base">Agent Execution Timeline</h3>
                  </div>
                  <span className="text-xs text-slate-500">7 Sub-Agents Live Flow</span>
                </div>
                <div className="h-44 flex items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40">
                  <p className="text-xs text-slate-500">Execution sequence and durations per sub-agent will stream here.</p>
                </div>
              </div>

              {/* Intelligence Explanation Card */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-200 text-base">Intelligence Explanation</h3>
                  </div>
                  <span className="text-xs text-slate-500">Ranked Match Reasoning</span>
                </div>
                <div className="h-40 flex items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40">
                  <p className="text-xs text-slate-500">Explainable candidate scores and workloads will show here.</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Mission Progress Card */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-slate-200 text-base">Mission Progress</h3>
                  </div>
                </div>
                <div className="h-24 flex items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40">
                  <p className="text-xs text-slate-500">Progress metrics placeholder.</p>
                </div>
              </div>

              {/* Recommended Team Card */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-slate-200 text-base">Recommended Team</h3>
                  </div>
                </div>
                <div className="h-44 flex items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40">
                  <p className="text-xs text-slate-500">Discovered collaborators cards placeholder.</p>
                </div>
              </div>

              {/* Enterprise Knowledge Graph Card */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-slate-200 text-base">Enterprise Knowledge Graph</h3>
                  </div>
                </div>
                <div className="h-40 flex items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40">
                  <p className="text-xs text-slate-500">Interactive node/edge matches representation.</p>
                </div>
              </div>

              {/* Activity Feed Card */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-200 text-base">Activity Feed</h3>
                  </div>
                </div>
                <div className="h-32 flex items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40">
                  <p className="text-xs text-slate-500">Live feed logs placeholder.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
