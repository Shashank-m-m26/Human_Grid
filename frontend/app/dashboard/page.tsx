"use client";

import { useState, useEffect } from "react";
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
  Sparkles,
  GitBranch,
  Cpu,
  Shield,
  Activity,
  Brain,
  Network,
  Clock,
  Check,
  UserCheck,
  LucideIcon,
} from "lucide-react";
import { useMission } from "@/context/MissionContext";
import {
  MissionEngineOutput,
  AgentExecutionEvent,
  RankedCandidate,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm ${className}`}
    >
      {children}
    </section>
  );
}

function CardHeader({
  icon: Icon,
  iconColor,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${iconColor}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <h2 className="font-bold text-slate-200 text-sm leading-none">{title}</h2>
      </div>
      {subtitle && (
        <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
          {subtitle}
        </span>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  minH = "h-36",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  minH?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${minH} border border-dashed border-slate-800 rounded-xl bg-slate-950/30 text-center px-6 py-8 gap-2`}
      role="status"
      aria-label={title}
    >
      <Icon className="w-7 h-7 text-slate-700 mb-1" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {subtitle && (
        <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{subtitle}</p>
      )}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  color = "bg-blue-500",
  max = 100,
  unit = "%",
}: {
  label: string;
  value: number;
  color?: string;
  max?: number;
  unit?: string;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline text-[11px] font-semibold text-slate-400">
        <span>{label}</span>
        <span className="text-slate-300 tabular-nums">
          {value}
          {unit !== "%" ? ` ${unit}` : "%"}
        </span>
      </div>
      <div
        className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE GRAPH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: "mission" | "department" | "employee" | "skill" | "project";
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

function buildGraphData(m: MissionEngineOutput | null): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const topPadding = 40;
  const usableH = 256;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  function spreadY(total: number, idx: number): number {
    return total > 1
      ? topPadding + (idx * usableH) / (total - 1)
      : topPadding + usableH / 2;
  }

  if (!m) {
    // placeholder demo graph
    const depts = ["Engineering", "DevOps"];
    const emps = [
      { id: "e1", name: "Aarav Sharma", dept: "Engineering", skills: ["Python"], projects: ["Nimbus"] },
      { id: "e2", name: "Zara Patel", dept: "DevOps", skills: ["Kubernetes"], projects: ["Pulse"] },
    ];
    const skills = ["Python", "Kubernetes"];
    const projs = ["Nimbus", "Pulse"];

    nodes.push({ id: "mission-root", label: "No Active Mission", type: "mission", x: 100, y: spreadY(1, 0) });
    depts.forEach((d, i) => {
      nodes.push({ id: `dept-${d}`, label: d, type: "department", x: 300, y: spreadY(depts.length, i) });
      edges.push({ id: `em-${d}`, source: "mission-root", target: `dept-${d}` });
    });
    emps.forEach((e, i) => {
      nodes.push({ id: `emp-${e.id}`, label: e.name, type: "employee", x: 500, y: spreadY(emps.length, i) });
      edges.push({ id: `de-${e.id}`, source: `dept-${e.dept}`, target: `emp-${e.id}` });
    });
    skills.forEach((s, i) => {
      nodes.push({ id: `skill-${s}`, label: s, type: "skill", x: 700, y: spreadY(skills.length, i) });
      emps.forEach((e) => {
        if (e.skills.includes(s))
          edges.push({ id: `es-${e.id}-${s}`, source: `emp-${e.id}`, target: `skill-${s}` });
      });
    });
    projs.forEach((p, i) => {
      nodes.push({ id: `proj-${p}`, label: p, type: "project", x: 900, y: spreadY(projs.length, i) });
      emps.forEach((e) => {
        if (e.projects.includes(p))
          edges.push({ id: `ep-${e.id}-${p}`, source: `emp-${e.id}`, target: `proj-${p}` });
      });
    });
    return { nodes, edges };
  }

  // Active mission
  const tasks = m.state?.mission?.tasks || [];
  const depts = Array.from(new Set(tasks.flatMap((t) => t.required_departments || []))).slice(0, 3);
  const allCands = Object.values(m.intelligence?.ranked_candidates_by_task || {}).flat();
  const uniqueEmps = Array.from(new Map(allCands.map((c) => [c.employee.employee_id, c.employee])).values()).slice(0, 4);
  const reqSkills = Array.from(new Set(tasks.flatMap((t) => t.required_skills || []))).slice(0, 4);
  const projects = Array.from(
    new Set(uniqueEmps.flatMap((e) => [...(e.completed_projects || []), ...(e.current_projects || [])]))
  ).slice(0, 4);

  nodes.push({ id: "mission-root", label: m.state?.mission?.title || "Active Mission", type: "mission", x: 100, y: spreadY(1, 0) });

  depts.forEach((d, i) => {
    nodes.push({ id: `dept-${d}`, label: d, type: "department", x: 300, y: spreadY(depts.length, i) });
    edges.push({ id: `em-${d}`, source: "mission-root", target: `dept-${d}` });
  });

  uniqueEmps.forEach((e, i) => {
    nodes.push({ id: `emp-${e.employee_id}`, label: e.full_name, type: "employee", x: 500, y: spreadY(uniqueEmps.length, i) });
    const cd = depts.includes(e.department) ? e.department : depts[0];
    if (cd) edges.push({ id: `de-${e.employee_id}`, source: `dept-${cd}`, target: `emp-${e.employee_id}` });
  });

  reqSkills.forEach((s, i) => {
    nodes.push({ id: `skill-${s}`, label: s, type: "skill", x: 700, y: spreadY(reqSkills.length, i) });
    uniqueEmps.forEach((e) => {
      if (e.skills?.includes(s))
        edges.push({ id: `es-${e.employee_id}-${s}`, source: `emp-${e.employee_id}`, target: `skill-${s}` });
    });
  });

  projects.forEach((p, i) => {
    nodes.push({ id: `proj-${p}`, label: p, type: "project", x: 900, y: spreadY(projects.length, i) });
    uniqueEmps.forEach((e) => {
      if (e.completed_projects?.includes(p) || e.current_projects?.includes(p))
        edges.push({ id: `ep-${e.employee_id}-${p}`, source: `emp-${e.employee_id}`, target: `proj-${p}` });
    });
  });

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE GRAPH COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function KnowledgeGraph({
  mission,
  hoveredNodeId,
  setHoveredNodeId,
}: {
  mission: MissionEngineOutput | null;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
}) {
  const { nodes, edges } = buildGraphData(mission);

  const isEdgeActive = (e: GraphEdge) =>
    hoveredNodeId === e.source || hoveredNodeId === e.target;

  const isNodeHighlighted = (id: string) => {
    if (!hoveredNodeId) return true;
    if (id === hoveredNodeId) return true;
    return edges.some((e) => (e.source === hoveredNodeId && e.target === id) || (e.target === hoveredNodeId && e.source === id));
  };

  const nodeStyle: Record<string, { ring: string; bg: string; text: string; icon: LucideIcon }> = {
    mission:    { ring: "stroke-amber-500",    bg: "bg-amber-950/70 border-amber-500/40",    text: "text-amber-400",    icon: Sparkles },
    department: { ring: "stroke-indigo-500",   bg: "bg-indigo-950/70 border-indigo-500/40",  text: "text-indigo-400",   icon: Layers },
    employee:   { ring: "stroke-blue-500",     bg: "bg-blue-950/70 border-blue-500/40",      text: "text-blue-400",     icon: User },
    skill:      { ring: "stroke-emerald-500",  bg: "bg-emerald-950/70 border-emerald-500/40",text: "text-emerald-400",  icon: Brain },
    project:    { ring: "stroke-cyan-500",     bg: "bg-cyan-950/70 border-cyan-500/40",      text: "text-cyan-400",     icon: Activity },
  };

  return (
    <div
      className="relative w-full h-[300px] sm:h-[320px] bg-slate-950/50 border border-slate-800/60 rounded-xl overflow-hidden"
      role="img"
      aria-label="Enterprise knowledge graph showing mission-to-skills relationships"
    >
      {/* Legend */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-500 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm" aria-hidden="true">
        {(["mission", "department", "employee", "skill", "project"] as const).map((t) => {
          const colorDot: Record<string, string> = {
            mission: "bg-amber-400", department: "bg-indigo-500",
            employee: "bg-blue-500", skill: "bg-emerald-500", project: "bg-cyan-400",
          };
          return (
            <span key={t} className="flex items-center gap-1 font-semibold capitalize">
              <span className={`w-1.5 h-1.5 rounded-full ${colorDot[t]}`} />
              {t}
            </span>
          );
        })}
      </div>

      <svg viewBox="0 0 1000 340" className="w-full h-full" aria-hidden="true">
        {/* Edges */}
        {edges.map((edge) => {
          const s = nodes.find((n) => n.id === edge.source);
          const t = nodes.find((n) => n.id === edge.target);
          if (!s || !t) return null;
          const active = isEdgeActive(edge);
          const dimmed = hoveredNodeId && !active;
          return (
            <path
              key={edge.id}
              d={`M ${s.x} ${s.y} C ${(s.x + t.x) / 2} ${s.y}, ${(s.x + t.x) / 2} ${t.y}, ${t.x} ${t.y}`}
              fill="none"
              stroke={active ? "#38bdf8" : "#1e293b"}
              strokeWidth={active ? 2 : 1}
              opacity={dimmed ? 0.08 : active ? 1 : 0.35}
              className={active ? "dash-flow" : ""}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const style = nodeStyle[node.type];
          const NodeIcon = style.icon;
          const r = node.type === "mission" ? 18 : 14;
          const highlighted = isNodeHighlighted(node.id);
          const isHovered = hoveredNodeId === node.id;

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="cursor-pointer"
              opacity={hoveredNodeId ? (highlighted ? 1 : 0.2) : mission ? 1 : 0.5}
            >
              {/* Hover ring */}
              {isHovered && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 8}
                  fill="none"
                  className={`${style.ring} opacity-20`}
                  strokeWidth={2}
                />
              )}
              {/* Base circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill="#020617"
                className={`${isHovered ? style.ring : "stroke-slate-800"} transition-all`}
                strokeWidth={isHovered ? 1.5 : 1}
              />
              {/* Icon */}
              <foreignObject
                x={node.x - r + 2}
                y={node.y - r + 2}
                width={(r - 2) * 2}
                height={(r - 2) * 2}
                className="pointer-events-none"
              >
                <div className={`flex items-center justify-center w-full h-full rounded-full border ${style.bg}`}>
                  <NodeIcon className={`w-3 h-3 ${style.text}`} />
                </div>
              </foreignObject>
              {/* Label */}
              <text
                x={node.x}
                y={node.y + r + 12}
                textAnchor="middle"
                fontSize={8}
                fontWeight={isHovered ? 700 : 500}
                fill={isHovered ? "#94a3b8" : "#475569"}
              >
                {node.label.length > 14 ? `${node.label.slice(0, 12)}…` : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { name: "Mission Command Center", icon: LayoutDashboard },
  { name: "Active Missions", icon: Layers },
  { name: "Employees", icon: Users },
  { name: "Projects", icon: Briefcase },
  { name: "Analytics", icon: BarChart3 },
  { name: "Settings", icon: SettingsIcon },
];

const STAGES = ["Created", "Planning", "Searching", "Ranking", "Assigned"] as const;

const AGENT_ICONS: Record<string, LucideIcon> = {
  "Intent Agent": Brain,
  "Mission Planner Agent": Briefcase,
  "Skill Mapper Agent": Layers,
  "People Discovery Agent": Network,
  "Intelligence Agent": Sparkles,
  "Coordinator Agent": Users,
  "Mission Tracker Agent": Activity,
};

const FEED_ICONS: Record<string, LucideIcon> = {
  authenticated: Shield,
  intent: Brain,
  planner: Briefcase,
  skill: Layers,
  discovery: Network,
  intelligence: Sparkles,
  coordinator: Users,
  tracker: Activity,
};

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Mission Command Center");
  const { mission } = useMission();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const allCandidates: RankedCandidate[] = mission
    ? Object.values(mission.intelligence?.ranked_candidates_by_task || {}).flat()
    : [];
  const uniqueCandidates = Array.from(
    new Map(allCandidates.map((c) => [c.employee.employee_id, c])).values()
  );

  useEffect(() => {
    if (uniqueCandidates.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(uniqueCandidates[0].employee.employee_id);
    }
  }, [uniqueCandidates, selectedEmployeeId]);

  const selectedCandidate =
    uniqueCandidates.find((c) => c.employee.employee_id === selectedEmployeeId) ||
    uniqueCandidates[0] ||
    null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/8 via-slate-950 to-slate-950 pointer-events-none"
        aria-hidden="true"
      />

      {/* ──────────── SIDEBAR ──────────── */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? "4.5rem" : "16rem" }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-20 flex flex-col shrink-0 border-r border-slate-800/70 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
        aria-label="Sidebar navigation"
      >
        {/* Logo row */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-slate-800/60 shrink-0">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 min-w-0"
              >
                <Sparkles className="w-4.5 h-4.5 text-blue-400 shrink-0" aria-hidden="true" />
                <span className="font-extrabold text-sm bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-blue-300 truncate">
                  HumanGrid
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isSidebarCollapsed}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto" aria-label="Main navigation">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                aria-current={isActive ? "page" : undefined}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex w-full items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : ""}`}
                  aria-hidden="true"
                />
                {!isSidebarCollapsed && (
                  <span className="truncate text-[13px]">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer identity */}
        <div className="p-2 border-t border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
              HG
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-300 truncate">Enterprise Mode</p>
                <p className="text-[10px] text-slate-600 truncate">v1.0.0-prod</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ──────────── MAIN AREA ──────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between px-5 md:px-6 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md shrink-0 z-10">
          <h1 className="text-sm font-bold text-slate-200 truncate">{activeTab}</h1>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search…"
                disabled
                aria-label="Search (disabled)"
                className="w-48 bg-slate-900/60 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-400 placeholder-slate-600 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Notifications */}
            <button
              className="relative p-1.5 rounded-lg hover:bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
            </button>

            {/* User */}
            <button
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-slate-900 border border-slate-800 transition-colors"
              aria-label="User account"
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                <User className="w-3 h-3 text-slate-400" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Admin</span>
            </button>
          </div>
        </header>

        {/* Scrollable workspace */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5"
          aria-label="Mission Command Center workspace"
        >
          {/* Mission active banner */}
          <AnimatePresence>
            {mission && (
              <motion.div
                key="mission-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <p className="text-sm font-bold text-emerald-400 truncate">
                    {mission.state?.mission?.title || "Active Mission"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600 font-semibold">{mission.state?.current_stage}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold badge-emerald">
                    {mission.state?.mission?.status || "Assigned"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* ── LEFT COLUMN (2/3) ── */}
            <div className="xl:col-span-2 space-y-5">

              {/* WIDGET 1 — MISSION TIMELINE */}
              <Card>
                <CardHeader
                  icon={Clock}
                  iconColor="text-blue-400"
                  title="Mission Timeline"
                  subtitle="Pipeline State Transitions"
                />
                <div className="p-5">
                  {!mission ? (
                    <EmptyState
                      icon={Clock}
                      title="No active mission"
                      subtitle="Launch a mission from the home screen to see the timeline."
                    />
                  ) : (
                    <div className="space-y-5">
                      {/* Metadata grid */}
                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                        {[
                          { label: "Mission ID", value: mission.state?.mission?.mission_id || "—" },
                          { label: "Current Stage", value: mission.state?.current_stage || "—", accent: true },
                          { label: "Status", value: mission.state?.mission?.status || "Assigned", badge: true },
                          {
                            label: "Created",
                            value: mission.state?.mission?.created_at
                              ? new Date(mission.state.mission.created_at).toLocaleString([], {
                                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                })
                              : "—",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <dt className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                              {item.label}
                            </dt>
                            {item.badge ? (
                              <span className="inline-flex text-[10px] px-2 py-0.5 font-bold rounded-full badge-cyan">
                                {item.value}
                              </span>
                            ) : (
                              <dd
                                className={`text-xs font-bold truncate ${item.accent ? "text-blue-400" : "text-slate-300"}`}
                              >
                                {item.value}
                              </dd>
                            )}
                          </div>
                        ))}
                      </dl>

                      {/* Tags */}
                      <div className="space-y-2 text-xs">
                        {[
                          {
                            label: "Departments",
                            items: Array.from(new Set(mission.state?.mission?.tasks?.flatMap((t) => t.required_departments || []) || [])),
                            color: "badge-indigo",
                          },
                          {
                            label: "Skills",
                            items: Array.from(new Set(mission.state?.mission?.tasks?.flatMap((t) => t.required_skills || []) || [])),
                            color: "badge-emerald",
                          },
                        ].map(({ label, items, color }) => (
                          <div key={label} className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-500 font-semibold">{label}:</span>
                            {items.length > 0 ? (
                              items.map((v) => (
                                <span key={v} className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
                                  {v}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-600 text-[10px]">None</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Stage stepper */}
                      <div className="border-t border-slate-800/60 pt-4">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-4">
                          Stage Progression
                        </p>
                        <div
                          className="relative flex items-start justify-between gap-2"
                          role="list"
                          aria-label="Mission stages"
                        >
                          {/* Connector line */}
                          <div
                            className="absolute top-3 left-3 right-3 h-px bg-slate-800"
                            aria-hidden="true"
                          />
                          {STAGES.map((stage, idx) => {
                            const histIdx = STAGES.indexOf(
                              (mission.state?.current_stage as typeof STAGES[number]) || "Created"
                            );
                            const done = idx <= histIdx;
                            const event = mission.state?.mission?.stage_history?.find(
                              (h) => h.stage.toLowerCase() === stage.toLowerCase()
                            );
                            return (
                              <div
                                key={stage}
                                role="listitem"
                                className="flex flex-col items-center gap-1.5 relative z-10 flex-1 min-w-0"
                              >
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all ${
                                    done
                                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                                      : "bg-slate-950 border-slate-700 text-slate-600"
                                  }`}
                                  aria-label={done ? `${stage} — completed` : stage}
                                >
                                  {done ? <Check className="w-3 h-3" /> : idx + 1}
                                </div>
                                <span
                                  className={`text-[10px] font-semibold text-center leading-tight ${
                                    done ? "text-blue-400" : "text-slate-600"
                                  }`}
                                >
                                  {stage}
                                </span>
                                <span className="text-[9px] text-slate-600 font-medium">
                                  {event
                                    ? new Date(event.transitioned_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* WIDGET 2 — AGENT EXECUTION TIMELINE */}
              <Card>
                <CardHeader
                  icon={Cpu}
                  iconColor="text-cyan-400"
                  title="Agent Execution Timeline"
                  subtitle="7-Agent Pipeline"
                />
                <div className="p-5">
                  {!mission ? (
                    <EmptyState
                      icon={Cpu}
                      title="Execution timeline pending"
                      subtitle="Execution logs appear here after a mission is processed."
                      minH="h-44"
                    />
                  ) : (
                    <ol
                      className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-slate-800"
                      aria-label="Agent execution steps"
                    >
                      {(mission.execution_timeline || []).map(
                        (event: AgentExecutionEvent, idx: number) => {
                          const StepIcon = AGENT_ICONS[event.agent_name] || Cpu;
                          return (
                            <li key={idx} className="relative group">
                              {/* Timeline dot */}
                              <div
                                className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-slate-950 border-2 border-cyan-600 shadow-sm group-hover:border-cyan-400 transition-colors"
                                aria-hidden="true"
                              />
                              <div className="bg-slate-950/60 hover:bg-slate-900/60 transition-colors border border-slate-800/60 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-default">
                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <StepIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                                    <span className="text-xs font-bold text-slate-200">{event.agent_name}</span>
                                    <span className="text-[9px] px-1.5 py-px font-bold rounded-full badge-emerald">
                                      {event.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {event.reasoning_summary}
                                  </p>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 text-right shrink-0 pt-0.5">
                                  <div className="text-[10px] text-slate-500">
                                    <span className="text-slate-300 font-bold tabular-nums">{event.duration_ms}ms</span>
                                  </div>
                                  <div className="text-[10px] text-cyan-400 font-bold tabular-nums">
                                    {Math.round(event.confidence * 100)}% conf.
                                  </div>
                                  <time
                                    className="text-[9px] text-slate-600 hidden sm:block"
                                    dateTime={event.completed_at}
                                  >
                                    {new Date(event.completed_at).toLocaleTimeString([], { hour12: false })}
                                  </time>
                                </div>
                              </div>
                            </li>
                          );
                        }
                      )}
                    </ol>
                  )}
                </div>
              </Card>

              {/* WIDGET 6 — INTELLIGENCE EXPLANATION */}
              <Card>
                <CardHeader
                  icon={Brain}
                  iconColor="text-indigo-400"
                  title="Intelligence Explanation"
                  subtitle="Ranked Match Reasoning"
                />
                <div className="p-5">
                  {!mission || !selectedCandidate ? (
                    <EmptyState
                      icon={Brain}
                      title="No candidate selected"
                      subtitle="Select a candidate from the Recommended Team panel to see scoring breakdown."
                      minH="h-44"
                    />
                  ) : (
                    <div className="space-y-5">
                      {/* Candidate header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-extrabold text-xs shrink-0">
                            {selectedCandidate.employee.full_name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
                              {selectedCandidate.employee.full_name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {selectedCandidate.employee.designation} &bull;{" "}
                              {selectedCandidate.employee.department}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold badge-indigo px-3 py-1.5 rounded-lg self-start sm:self-auto">
                          {selectedCandidate.ranking_score}/100
                        </span>
                      </div>

                      {/* Progress bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(() => {
                          const allSkills = Array.from(
                            new Set(mission.state?.mission?.tasks?.flatMap((t) => t.required_skills || []) || [])
                          );
                          const matched = (selectedCandidate.employee.skills || []).filter((s) =>
                            allSkills.includes(s)
                          );
                          const skillPct = allSkills.length > 0 ? (matched.length / allSkills.length) * 100 : 0;
                          const expPct = Math.min((selectedCandidate.employee.experience_years / 12) * 100, 100);
                          const availMap: Record<string, number> = { available: 100, limited: 65, busy: 35 };
                          const availVal =
                            availMap[(selectedCandidate.employee.availability || "").toLowerCase()] ?? 25;
                          const workload = selectedCandidate.employee.current_workload;

                          return (
                            <>
                              <ProgressBar
                                label={`Skill Match (${matched.length}/${allSkills.length})`}
                                value={Math.round(skillPct)}
                                color="bg-emerald-500"
                              />
                              <ProgressBar
                                label={`Experience (${selectedCandidate.employee.experience_years} yrs)`}
                                value={Math.round(expPct)}
                                color="bg-blue-500"
                              />
                              <ProgressBar
                                label="Trust Score"
                                value={selectedCandidate.employee.trust_score}
                                color="bg-indigo-500"
                              />
                              <ProgressBar
                                label="Collaboration Score"
                                value={selectedCandidate.employee.collaboration_score}
                                color="bg-cyan-500"
                              />
                              <ProgressBar
                                label={`Availability (${selectedCandidate.employee.availability})`}
                                value={availVal}
                                color="bg-amber-500"
                              />
                              <ProgressBar
                                label="Current Workload"
                                value={workload}
                                color={workload > 75 ? "bg-red-500" : workload > 45 ? "bg-amber-500" : "bg-emerald-500"}
                              />
                            </>
                          );
                        })()}

                        {/* Overall confidence — full width */}
                        <div className="sm:col-span-2 pt-3 border-t border-slate-800/60">
                          <ProgressBar
                            label="Overall Assignment Confidence"
                            value={Math.round(selectedCandidate.confidence_score * 100)}
                            color="bg-gradient-to-r from-blue-500 to-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Explanation block */}
                      <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-4 space-y-3">
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          &ldquo;{selectedCandidate.explanation}&rdquo;
                        </p>
                        {(selectedCandidate.structured_reasoning || []).length > 0 && (
                          <div className="border-t border-slate-800 pt-3">
                            <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-2">
                              Match Rationale
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {(selectedCandidate.structured_reasoning || []).map(
                                (r: string, i: number) => (
                                  <li key={i} className="text-[10px] text-slate-500 leading-relaxed">
                                    {r}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* ── RIGHT COLUMN (1/3) ── */}
            <div className="space-y-5">

              {/* WIDGET 4 — MISSION PROGRESS */}
              <Card>
                <CardHeader icon={Activity} iconColor="text-emerald-400" title="Mission Progress" />
                <div className="p-5">
                  {!mission ? (
                    <EmptyState icon={Activity} title="No progress data" minH="h-24" />
                  ) : (
                    <div className="space-y-5">
                      {(() => {
                        const idx = STAGES.indexOf(
                          (mission.state?.current_stage as typeof STAGES[number]) || "Created"
                        );
                        const pct = idx >= 0 ? Math.round(((idx + 1) / STAGES.length) * 100) : 0;
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                  Orchestration Phase
                                </p>
                                <p className="text-xs font-bold text-slate-200 mt-0.5">
                                  {mission.state?.current_stage}
                                </p>
                              </div>
                              <span className="text-xl font-extrabold text-emerald-400 tabular-nums">
                                {pct}%
                              </span>
                            </div>
                            <div
                              className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden"
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label="Mission completion progress"
                            >
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out shadow-sm shadow-emerald-500/20"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Assigned team */}
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Assigned Members
                        </p>
                        {(() => {
                          const ids = mission.coordination?.assigned_employee_ids || [];
                          if (ids.length === 0)
                            return (
                              <p className="text-[11px] text-slate-600 font-medium py-2">
                                No assignments yet.
                              </p>
                            );
                          return (
                            <div className="space-y-2">
                              {ids.map((id: string) => {
                                const match = uniqueCandidates.find((c) => c.employee.employee_id === id);
                                const name = match ? match.employee.full_name : `Employee ${id}`;
                                const initials = name.split(" ").map((w) => w[0]).join("");
                                return (
                                  <div
                                    key={id}
                                    className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60"
                                  >
                                    <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800/40 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                      {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                                        {name}
                                      </p>
                                      {match && (
                                        <p className="text-[10px] text-slate-500 truncate leading-tight">
                                          {match.employee.designation}
                                        </p>
                                      )}
                                    </div>
                                    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full badge-emerald font-bold shrink-0">
                                      <Check className="w-2.5 h-2.5" aria-hidden="true" />
                                      Assigned
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* WIDGET 3 — RECOMMENDED TEAM */}
              <Card>
                <CardHeader
                  icon={Users}
                  iconColor="text-blue-400"
                  title="Recommended Team"
                  subtitle="Select to inspect"
                />
                <div className="p-5">
                  {!mission || uniqueCandidates.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No recommendations yet"
                      subtitle="AI-ranked candidate profiles will appear here."
                      minH="h-44"
                    />
                  ) : (
                    <div
                      className="space-y-2.5 max-h-[340px] overflow-y-auto -mr-1 pr-1"
                      aria-label="Recommended candidates"
                    >
                      {uniqueCandidates.map((candidate: RankedCandidate) => {
                        const isSelected = selectedEmployeeId === candidate.employee.employee_id;
                        const initials = candidate.employee.full_name
                          .split(" ")
                          .map((w) => w[0])
                          .join("");
                        return (
                          <button
                            key={candidate.employee.employee_id}
                            type="button"
                            onClick={() => setSelectedEmployeeId(candidate.employee.employee_id)}
                            aria-pressed={isSelected}
                            aria-label={`${candidate.employee.full_name}, ${Math.round(candidate.confidence_score * 100)}% fit`}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              isSelected
                                ? "bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                                : "bg-slate-950/50 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                                    isSelected
                                      ? "bg-indigo-950 border border-indigo-700 text-indigo-300"
                                      : "bg-slate-900 border border-slate-700 text-slate-400"
                                  }`}
                                  aria-hidden="true"
                                >
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                                    {candidate.employee.full_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate leading-tight">
                                    {candidate.employee.designation}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg badge-blue shrink-0">
                                {Math.round(candidate.confidence_score * 100)}%
                              </span>
                            </div>

                            {/* Mini progress */}
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mb-2.5">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                style={{ width: `${Math.round(candidate.confidence_score * 100)}%` }}
                              />
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1">
                              {(candidate.employee.skills || []).slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="px-1.5 py-px rounded text-[8px] font-semibold bg-slate-900 border border-slate-800 text-slate-500"
                                >
                                  {skill}
                                </span>
                              ))}
                              {(candidate.employee.skills?.length || 0) > 3 && (
                                <span className="text-[8px] text-slate-600 font-semibold px-1">
                                  +{(candidate.employee.skills?.length || 0) - 3}
                                </span>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-1 mt-2.5 pt-2 border-t border-slate-800/50 text-center">
                              {[
                                { v: `${candidate.employee.experience_years}y`, l: "Exp" },
                                { v: String(candidate.employee.trust_score), l: "Trust" },
                                { v: String(candidate.employee.collaboration_score), l: "Collab" },
                              ].map((s) => (
                                <div key={s.l}>
                                  <span className="block text-[11px] font-bold text-slate-300">
                                    {s.v}
                                  </span>
                                  <span className="text-[9px] text-slate-600 font-semibold">{s.l}</span>
                                </div>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              {/* WIDGET 7 — ENTERPRISE KNOWLEDGE GRAPH */}
              <Card>
                <CardHeader
                  icon={Network}
                  iconColor="text-cyan-400"
                  title="Enterprise Knowledge Graph"
                  subtitle="Hover nodes to explore"
                />
                <div className="p-4">
                  <KnowledgeGraph
                    mission={mission}
                    hoveredNodeId={hoveredNodeId}
                    setHoveredNodeId={setHoveredNodeId}
                  />
                </div>
              </Card>

              {/* WIDGET 5 — ACTIVITY FEED */}
              <Card>
                <CardHeader
                  icon={GitBranch}
                  iconColor="text-slate-400"
                  title="Activity Feed"
                  subtitle="Pipeline event log"
                />
                <div className="p-5">
                  {!mission ? (
                    <EmptyState icon={GitBranch} title="No activity logs" minH="h-28" />
                  ) : (
                    <div
                      className="space-y-2 max-h-[240px] overflow-y-auto -mr-1 pr-1"
                      role="log"
                      aria-live="polite"
                      aria-label="Mission activity feed"
                    >
                      {(mission.state?.activity_feed || []).map(
                        (activity: string, idx: number) => {
                          let FeedIcon: LucideIcon = Activity;
                          const lower = activity.toLowerCase();
                          for (const [key, ic] of Object.entries(FEED_ICONS)) {
                            if (lower.includes(key)) {
                              FeedIcon = ic;
                              break;
                            }
                          }
                          const base = new Date(
                            mission.state?.mission?.created_at || new Date().toISOString()
                          );
                          const ts = new Date(base.getTime() + idx * 180_000);
                          return (
                            <div
                              key={idx}
                              className="flex gap-2.5 bg-slate-950/50 hover:bg-slate-900/40 transition-colors p-2.5 rounded-lg border border-slate-800/50 items-start group"
                            >
                              <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 shrink-0 group-hover:text-slate-400 transition-colors">
                                <FeedIcon className="w-3 h-3" aria-hidden="true" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                  {activity}
                                </p>
                                <time className="text-[9px] text-slate-600 font-medium block">
                                  {ts.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  })}
                                </time>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <footer className="pb-2 text-center">
            <p className="text-[10px] text-slate-700 font-medium">
              HumanGrid Concierge &bull; Kaggle AI Agents Intensive 2026 &bull; Secure ADK Pipeline
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
