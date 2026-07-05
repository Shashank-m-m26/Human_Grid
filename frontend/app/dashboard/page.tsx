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
  Menu,
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
  LucideIcon
} from "lucide-react";
import { useMission } from "@/context/MissionContext";
import {
  MissionEngineOutput,
  AgentExecutionEvent,
  RankedCandidate
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH HELPER TYPES AND BUILDER
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

function buildGraphData(m: MissionEngineOutput | null) {
  const topPadding = 40;
  const usableH = 260;

  if (!m) {
    // Beautiful placeholder/simulation graph data for null state
    const depts = ["Engineering", "DevOps"];
    const employees = [
      { employee_id: "sim-emp-1", full_name: "Aarav Sharma", department: "Engineering", skills: ["Python"], completed_projects: ["Nimbus Access"] },
      { employee_id: "sim-emp-2", full_name: "Zara Patel", department: "DevOps", skills: ["Kubernetes"], completed_projects: ["Pulse Support"] }
    ];
    const skills = ["Python", "Kubernetes"];
    const projects = ["Nimbus Access", "Pulse Support"];

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Mission Node
    nodes.push({ id: "mission-root", label: "No Active Mission", type: "mission", x: 100, y: topPadding + usableH / 2 });

    // Departments
    depts.forEach((dept, i) => {
      const y = depts.length > 1 ? topPadding + (i * usableH) / (depts.length - 1) : topPadding + usableH / 2;
      nodes.push({ id: `dept-${dept}`, label: dept, type: "department", x: 300, y });
      edges.push({ id: `e-m-${dept}`, source: "mission-root", target: `dept-${dept}` });
    });

    // Employees
    employees.forEach((emp, i) => {
      const y = employees.length > 1 ? topPadding + (i * usableH) / (employees.length - 1) : topPadding + usableH / 2;
      nodes.push({ id: `emp-${emp.employee_id}`, label: emp.full_name, type: "employee", x: 500, y });
      edges.push({ id: `e-d-${emp.employee_id}`, source: `dept-${emp.department}`, target: `emp-${emp.employee_id}` });
    });

    // Skills
    skills.forEach((skill, i) => {
      const y = skills.length > 1 ? topPadding + (i * usableH) / (skills.length - 1) : topPadding + usableH / 2;
      nodes.push({ id: `skill-${skill}`, label: skill, type: "skill", x: 700, y });
      employees.forEach(emp => {
        if (emp.skills.includes(skill)) {
          edges.push({ id: `e-s-${emp.employee_id}-${skill}`, source: `emp-${emp.employee_id}`, target: `skill-${skill}` });
        }
      });
    });

    // Projects
    projects.forEach((proj, i) => {
      const y = projects.length > 1 ? topPadding + (i * usableH) / (projects.length - 1) : topPadding + usableH / 2;
      nodes.push({ id: `proj-${proj}`, label: proj, type: "project", x: 900, y });
      employees.forEach(emp => {
        if (emp.completed_projects.includes(proj)) {
          edges.push({ id: `e-p-${emp.employee_id}-${proj}`, source: `emp-${emp.employee_id}`, target: `proj-${proj}` });
        }
      });
    });

    return { nodes, edges };
  }

  // Active mission graph
  const tasks = m.state?.mission?.tasks || [];
  const depts = Array.from(new Set(tasks.flatMap(t => t.required_departments || []))).slice(0, 3);

  const allCandidates = Object.values(m.intelligence?.ranked_candidates_by_task || {}).flat();
  const uniqueEmps = Array.from(new Map(allCandidates.map(c => [c.employee.employee_id, c.employee])).values()).slice(0, 4);

  const reqSkills = Array.from(new Set(tasks.flatMap(t => t.required_skills || []))).slice(0, 4);
  const associatedProjects = Array.from(new Set(uniqueEmps.flatMap(e => [...(e.completed_projects || []), ...(e.current_projects || [])]))).slice(0, 4);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // 1. Mission Node
  nodes.push({ id: "mission-root", label: m.state?.mission?.title || "Active Mission", type: "mission", x: 100, y: topPadding + usableH / 2 });

  // 2. Departments
  depts.forEach((dept, i) => {
    const y = depts.length > 1 ? topPadding + (i * usableH) / (depts.length - 1) : topPadding + usableH / 2;
    nodes.push({ id: `dept-${dept}`, label: dept, type: "department", x: 300, y });
    edges.push({ id: `e-m-${dept}`, source: "mission-root", target: `dept-${dept}` });
  });

  // 3. Employees
  uniqueEmps.forEach((emp, i) => {
    const y = uniqueEmps.length > 1 ? topPadding + (i * usableH) / (uniqueEmps.length - 1) : topPadding + usableH / 2;
    nodes.push({ id: `emp-${emp.employee_id}`, label: emp.full_name, type: "employee", x: 500, y });

    const connectedDept = depts.includes(emp.department) ? emp.department : depts[0];
    if (connectedDept) {
      edges.push({ id: `e-d-${emp.employee_id}`, source: `dept-${connectedDept}`, target: `emp-${emp.employee_id}` });
    }
  });

  // 4. Skills
  reqSkills.forEach((skill, i) => {
    const y = reqSkills.length > 1 ? topPadding + (i * usableH) / (reqSkills.length - 1) : topPadding + usableH / 2;
    nodes.push({ id: `skill-${skill}`, label: skill, type: "skill", x: 700, y });
    uniqueEmps.forEach(emp => {
      if (emp.skills?.includes(skill)) {
        edges.push({ id: `e-s-${emp.employee_id}-${skill}`, source: `emp-${emp.employee_id}`, target: `skill-${skill}` });
      }
    });
  });

  // 5. Projects
  associatedProjects.forEach((proj, i) => {
    const y = associatedProjects.length > 1 ? topPadding + (i * usableH) / (associatedProjects.length - 1) : topPadding + usableH / 2;
    nodes.push({ id: `proj-${proj}`, label: proj, type: "project", x: 900, y });
    uniqueEmps.forEach(emp => {
      if (emp.completed_projects?.includes(proj) || emp.current_projects?.includes(proj)) {
        edges.push({ id: `e-p-${emp.employee_id}-${proj}`, source: `emp-${emp.employee_id}`, target: `proj-${proj}` });
      }
    });
  });

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Mission Command Center");
  const { mission } = useMission();

  // Highlight and selection states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute unique candidates
  const allCandidates: RankedCandidate[] = mission
    ? Object.values(mission.intelligence?.ranked_candidates_by_task || {}).flat()
    : [];
  const uniqueCandidates = Array.from(
    new Map(allCandidates.map(c => [c.employee.employee_id, c])).values()
  );

  // Auto-select first employee if none is selected
  useEffect(() => {
    if (uniqueCandidates.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(uniqueCandidates[0].employee.employee_id);
    }
  }, [uniqueCandidates, selectedEmployeeId]);

  const selectedCandidate = uniqueCandidates.find(
    c => c.employee.employee_id === selectedEmployeeId
  ) || uniqueCandidates[0] || null;

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
        className="relative z-20 flex flex-col border-r border-slate-900 bg-slate-900/40 backdrop-blur-xl shrink-0"
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
            <div className="relative max-w-xs md:w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search missions, assets, graph..."
                disabled
                className="w-full bg-slate-900/60 border border-slate-850/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none cursor-not-allowed"
              />
            </div>

            <button className="relative p-2 rounded-lg hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
            </button>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* ───────────────────────────────────────────────────────────────
                  WIDGET 1: MISSION TIMELINE CARD
              ──────────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-slate-200 text-base">Mission Timeline</h3>
                  </div>
                  <span className="text-xs text-slate-500">Pipeline State Transitions</span>
                </div>

                {!mission ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40 text-center px-4">
                    <Clock className="w-7 h-7 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">No active mission</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Please launch a mission from the home screen.</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* High level specs grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Mission ID</p>
                        <p className="text-slate-300 font-bold truncate mt-0.5">{mission.state?.mission?.mission_id || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Current Stage</p>
                        <p className="text-blue-400 font-bold mt-0.5">{mission.state?.current_stage || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status</p>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 mt-0.5 font-bold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                          {mission.state?.mission?.status || "Assigned"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Created Time</p>
                        <p className="text-slate-400 font-semibold truncate mt-0.5">
                          {mission.state?.mission?.created_at
                            ? new Date(mission.state.mission.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Duration, Skills, Depts row */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                        <span className="text-slate-400 font-bold">Estimated Duration:</span>
                        <span className="text-slate-300 font-medium">
                          {mission.state?.mission?.tasks
                            ? mission.state.mission.tasks.map(t => `${t.title} (${t.estimated_duration})`).join(" · ")
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 py-1">
                        <span className="text-slate-500 font-semibold">Required Departments:</span>
                        {Array.from(new Set(mission.state?.mission?.tasks?.flatMap(t => t.required_departments || []) || [])).map(d => (
                          <span key={d} className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/60 border border-indigo-900/60 text-indigo-400">
                            {d}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-500 font-semibold">Required Skills:</span>
                        {Array.from(new Set(mission.state?.mission?.tasks?.flatMap(t => t.required_skills || []) || [])).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 border border-emerald-900/60 text-emerald-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stage steppers */}
                    <div className="border-t border-slate-900 pt-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Stage History Progression</p>
                      <div className="relative flex items-center justify-between max-w-lg mx-auto">
                        <div className="absolute left-0 right-0 h-0.5 bg-slate-900 -z-10" />
                        {["Created", "Planning", "Searching", "Ranking", "Assigned"].map((stage, idx) => {
                          const historyIndex = ["Created", "Planning", "Searching", "Ranking", "Assigned"].indexOf(mission.state?.current_stage || "Created");
                          const isPastOrCurrent = idx <= historyIndex;
                          const matchingEvent = mission.state?.mission?.stage_history?.find(
                            h => h.stage.toLowerCase() === stage.toLowerCase()
                          );

                          return (
                            <div key={stage} className="flex flex-col items-center space-y-1">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all ${
                                  isPastOrCurrent
                                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                                    : "bg-slate-950 border-slate-900 text-slate-600"
                                }`}
                              >
                                {isPastOrCurrent ? <Check className="w-3 h-3" /> : idx + 1}
                              </div>
                              <span className={`text-[10px] font-bold ${isPastOrCurrent ? "text-blue-400" : "text-slate-600"}`}>{stage}</span>
                              <span className="text-[8px] text-slate-500">
                                {matchingEvent ? new Date(matchingEvent.transitioned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ───────────────────────────────────────────────────────────────
                  WIDGET 2: AGENT EXECUTION TIMELINE CARD
              ──────────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-slate-200 text-base">Agent Execution Timeline</h3>
                  </div>
                  <span className="text-xs text-slate-500">7 Sub-Agents Live Flow</span>
                </div>

                {!mission ? (
                  <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40 text-center px-4">
                    <Cpu className="w-7 h-7 text-slate-700 mb-2 animate-pulse" />
                    <p className="text-xs text-slate-500 font-semibold">Execution timeline pending</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Stream logs and pipelines during active execution.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-900/80">
                    {(mission.execution_timeline || []).map((event: AgentExecutionEvent, idx: number) => {
                      const iconsMap: Record<string, LucideIcon> = {
                        "Intent Agent": Brain,
                        "Mission Planner Agent": Briefcase,
                        "Skill Mapper Agent": Layers,
                        "People Discovery Agent": Network,
                        "Intelligence Agent": Sparkles,
                        "Coordinator Agent": Users,
                        "Mission Tracker Agent": Activity
                      };
                      const StepIcon = iconsMap[event.agent_name] || Cpu;

                      return (
                        <div key={idx} className="relative group text-xs">
                          {/* Stepper Bullet */}
                          <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-slate-950 border-2 border-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                          </div>

                          {/* Agent Card */}
                          <div className="bg-slate-950/50 hover:bg-slate-950/80 transition-colors border border-slate-900/80 p-3 rounded-lg flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <StepIcon className="w-4 h-4 text-cyan-400" />
                                <span className="font-bold text-slate-200">{event.agent_name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-900/50">
                                  {event.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{event.reasoning_summary}</p>
                            </div>

                            <div className="flex sm:flex-col items-end gap-2 text-right shrink-0">
                              <div className="text-[10px] text-slate-500">
                                <span>Duration: </span>
                                <span className="text-slate-300 font-bold">{event.duration_ms}ms</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                <span>Confidence: </span>
                                <span className="text-cyan-400 font-bold">{Math.round(event.confidence * 100)}%</span>
                              </div>
                              <div className="text-[9px] text-slate-600 hidden sm:block font-semibold">
                                {new Date(event.completed_at).toLocaleTimeString([], { hour12: false })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ───────────────────────────────────────────────────────────────
                  WIDGET 6: INTELLIGENCE EXPLANATION CARD
              ──────────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-200 text-base">Intelligence Explanation</h3>
                  </div>
                  <span className="text-xs text-slate-500">Ranked Match Reasoning</span>
                </div>

                {!mission || !selectedCandidate ? (
                  <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40 text-center px-4">
                    <Brain className="w-7 h-7 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">No candidate data selected</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Interactive scoring breakdown will trigger here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header Candidate Info */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-900 pb-2">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-400" />
                          {selectedCandidate.employee.full_name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {selectedCandidate.employee.designation} &bull; {selectedCandidate.employee.department}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-indigo-400 bg-indigo-950/50 px-2.5 py-1 rounded border border-indigo-900/50">
                          Match Score: {selectedCandidate.ranking_score}/100
                        </span>
                      </div>
                    </div>

                    {/* Sleek Horizontal Progress Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                      
                      {/* 1. Skill Match */}
                      {(() => {
                        const allRequiredSkills = Array.from(new Set(mission.state?.mission?.tasks?.flatMap(t => t.required_skills || []) || []));
                        const matchedSkills = selectedCandidate.employee.skills?.filter(s => allRequiredSkills.includes(s)) || [];
                        const skillMatchPercent = allRequiredSkills.length > 0 ? (matchedSkills.length / allRequiredSkills.length) * 100 : 0;
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-400 text-[11px]">
                              <span>Skill Match ({matchedSkills.length}/{allRequiredSkills.length} overlap)</span>
                              <span className="text-slate-200">{Math.round(skillMatchPercent)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${skillMatchPercent}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. Experience */}
                      {(() => {
                        const expPercent = Math.min((selectedCandidate.employee.experience_years / 12) * 100, 100);
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-400 text-[11px]">
                              <span>Experience ({selectedCandidate.employee.experience_years} years)</span>
                              <span className="text-slate-200">{Math.round(expPercent)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${expPercent}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* 3. Trust Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-400 text-[11px]">
                          <span>Trust Score</span>
                          <span className="text-slate-200">{selectedCandidate.employee.trust_score}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedCandidate.employee.trust_score}%` }} />
                        </div>
                      </div>

                      {/* 4. Collaboration Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-400 text-[11px]">
                          <span>Collaboration Score</span>
                          <span className="text-slate-200">{selectedCandidate.employee.collaboration_score}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${selectedCandidate.employee.collaboration_score}%` }} />
                        </div>
                      </div>

                      {/* 5. Availability */}
                      {(() => {
                        const availValue = { available: 100, limited: 65, busy: 35 }[selectedCandidate.employee.availability?.toLowerCase() || ""] || 25;
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-400 text-[11px]">
                              <span>Availability ({selectedCandidate.employee.availability})</span>
                              <span className="text-slate-200">{availValue}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${availValue}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* 6. Workload */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-400 text-[11px]">
                          <span>Workload Impact</span>
                          <span className="text-slate-200">{selectedCandidate.employee.current_workload}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            selectedCandidate.employee.current_workload > 75
                              ? "bg-red-500"
                              : selectedCandidate.employee.current_workload > 45
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`} style={{ width: `${selectedCandidate.employee.current_workload}%` }} />
                        </div>
                      </div>

                      {/* 7. Overall Confidence */}
                      <div className="space-y-1 md:col-span-2 border-t border-slate-900/60 pt-3">
                        <div className="flex justify-between font-extrabold text-slate-300 text-[11px]">
                          <span>Overall Assignment Confidence</span>
                          <span className="text-indigo-400">{Math.round(selectedCandidate.confidence_score * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${selectedCandidate.confidence_score * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Explanations & Structured Reasoning list */}
                    <div className="bg-slate-950/60 border border-slate-900/80 p-3 rounded-lg space-y-2 mt-2">
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic">
                        &quot;{selectedCandidate.explanation}&quot;
                      </p>
                      <div className="border-t border-slate-900 pt-2 text-[10px] text-slate-500 space-y-1.5 font-semibold">
                        <p className="uppercase tracking-wider font-extrabold text-[9px] text-slate-400">Match Rationale Points:</p>
                        <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                          {(selectedCandidate.structured_reasoning || []).map((reason: string, rIdx: number) => (
                            <li key={rIdx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* ───────────────────────────────────────────────────────────────
                  WIDGET 4: MISSION PROGRESS CARD
              ──────────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-slate-200 text-base">Mission Progress</h3>
                  </div>
                </div>

                {!mission ? (
                  <div className="h-24 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40 text-center px-4">
                    <Activity className="w-6 h-6 text-slate-700 mb-1" />
                    <p className="text-[11px] text-slate-500 font-semibold">No progress telemetries</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Completion percentages calculation */}
                    {(() => {
                      const stages = ["Created", "Planning", "Searching", "Ranking", "Assigned"];
                      const currentStageIndex = stages.indexOf(mission.state?.current_stage || "Created");
                      const progressPercent = currentStageIndex >= 0 ? Math.round(((currentStageIndex + 1) / stages.length) * 100) : 0;

                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Orchestration Phase</p>
                              <p className="text-xs font-bold text-slate-200">{mission.state?.current_stage}</p>
                            </div>
                            <span className="text-lg font-extrabold text-emerald-400">{progressPercent}%</span>
                          </div>

                          {/* Glowing Progress bar */}
                          <div className="h-2.5 w-full bg-slate-950 rounded-full border border-slate-900 overflow-hidden relative">
                            <div className="absolute inset-0 bg-emerald-500/5" />
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-lg shadow-emerald-500/20 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Assigned Employees */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Assigned Team Members</p>
                      {(() => {
                        const assignedIds = mission.coordination?.assigned_employee_ids || [];
                        if (assignedIds.length === 0) {
                          return <p className="text-[10px] text-slate-600 font-medium">No assigned employees yet.</p>;
                        }

                        return (
                          <div className="space-y-1.5">
                            {assignedIds.map((id: string) => {
                              const match = uniqueCandidates.find(c => c.employee.employee_id === id);
                              const name = match ? match.employee.full_name : `Employee ${id}`;
                              const dept = match ? match.employee.department : "N/A";
                              const desc = match ? match.employee.designation : "Assigned Operator";

                              return (
                                <div key={id} className="flex items-center gap-2 bg-slate-950/60 p-2 rounded border border-slate-900 text-xs">
                                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-900/40 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                                    {name.split(" ").map(w => w[0]).join("")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-200 truncate leading-tight">{name}</p>
                                    <p className="text-[10px] text-slate-500 truncate leading-tight">{desc} &bull; {dept}</p>
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-900/60 text-emerald-400 font-bold">
                                    <Check className="w-2.5 h-2.5" /> Assigned
                                  </div>
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

              {/* ───────────────────────────────────────────────────────────────
                  WIDGET 3: RECOMMENDED TEAM CARD
              ──────────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-slate-200 text-base">Recommended Team</h3>
                  </div>
                </div>

                {!mission || uniqueCandidates.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40 text-center px-4">
                    <Users className="w-7 h-7 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">No recommendations found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ranked Employee Profiles (Select for detail)</p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {uniqueCandidates.map((candidate: RankedCandidate) => {
                        const isSelected = selectedEmployeeId === candidate.employee.employee_id;
                        return (
                          <div
                            key={candidate.employee.employee_id}
                            onClick={() => setSelectedEmployeeId(candidate.employee.employee_id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-2 ${
                              isSelected
                                ? "bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/5"
                                : "bg-slate-950/70 border-slate-900 hover:border-slate-850"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-slate-200">{candidate.employee.full_name}</h4>
                                <p className="text-[10px] text-slate-500">{candidate.employee.designation} &bull; {candidate.employee.department}</p>
                              </div>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/50 shrink-0">
                                {Math.round(candidate.confidence_score * 100)}% Fit
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed truncate font-medium">
                              {candidate.explanation}
                            </p>

                            <div className="flex flex-wrap gap-1">
                              {(candidate.employee.skills || []).slice(0, 3).map(skill => (
                                <span key={skill} className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-slate-900 border border-slate-850 text-slate-400">
                                  {skill}
                                </span>
                              ))}
                              {candidate.employee.skills?.length > 3 && (
                                <span className="text-[8px] text-slate-600 font-semibold px-1 py-0.2">+{candidate.employee.skills.length - 3} more</span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-900/60 text-[9px] text-slate-500 text-center font-bold">
                              <div>
                                <span className="block text-slate-400">{candidate.employee.experience_years}y</span>
                                <span>Experience</span>
                              </div>
                              <div>
                                <span className="block text-slate-400">{candidate.employee.trust_score}</span>
                                <span>Trust</span>
                              </div>
                              <div>
                                <span className="block text-slate-400">{candidate.employee.collaboration_score}</span>
                                <span>Collab</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ───────────────────────────────────────────────────────────────
                  WIDGET 7: ENTERPRISE KNOWLEDGE GRAPH CARD
              ──────────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-slate-200 text-base">Enterprise Knowledge Graph</h3>
                  </div>
                </div>

                <KnowledgeGraph
                  mission={mission}
                  hoveredNodeId={hoveredNodeId}
                  setHoveredNodeId={setHoveredNodeId}
                />
              </div>

              {/* ───────────────────────────────────────────────────────────────
                  WIDGET 5: ACTIVITY FEED CARD
              ──────────────────────────────────────────────────────────────── */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-200 text-base">Activity Feed</h3>
                  </div>
                </div>

                {!mission ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-lg bg-slate-950/40 text-center px-4">
                    <GitBranch className="w-6 h-6 text-slate-700 mb-1" />
                    <p className="text-[11px] text-slate-500 font-semibold">No activity logs</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {(mission.state?.activity_feed || []).map((activity: string, idx: number) => {
                      const iconsMap: Record<string, LucideIcon> = {
                        "authenticated": Shield,
                        "intent": Brain,
                        "planner": Briefcase,
                        "skill": Layers,
                        "discovery": Network,
                        "intelligence": Sparkles,
                        "coordinator": Users,
                        "tracker": Activity
                      };

                      let FeedIcon = Activity;
                      const lowerActivity = activity.toLowerCase();
                      for (const [key, iconComp] of Object.entries(iconsMap)) {
                        if (lowerActivity.includes(key)) {
                          FeedIcon = iconComp;
                          break;
                        }
                      }

                      // Compute simulated timestamp
                      const baseDate = new Date(mission.state?.mission?.created_at || new Date().toISOString());
                      const logTime = new Date(baseDate.getTime() + idx * 1000 * 180);
                      const timeStr = logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

                      return (
                        <div key={idx} className="flex gap-3 text-xs bg-slate-950/50 p-2.5 rounded border border-slate-900/80 items-start">
                          <div className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-400 shrink-0">
                            <FeedIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <p className="text-slate-300 font-semibold leading-relaxed text-[11px]">{activity}</p>
                            <span className="text-[9px] text-slate-500 font-medium">{timeStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE KNOWLEDGE GRAPH SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function KnowledgeGraph({
  mission,
  hoveredNodeId,
  setHoveredNodeId
}: {
  mission: MissionEngineOutput | null;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
}) {
  const { nodes, edges } = buildGraphData(mission);

  const activeSourceOrTarget = (edge: GraphEdge) => {
    if (!hoveredNodeId) return false;
    return edge.source === hoveredNodeId || edge.target === hoveredNodeId;
  };

  const isNodeActive = (nodeId: string) => {
    if (!hoveredNodeId) return true;
    if (nodeId === hoveredNodeId) return true;
    return edges.some(e =>
      (e.source === hoveredNodeId && e.target === nodeId) ||
      (e.target === hoveredNodeId && e.source === nodeId)
    );
  };

  return (
    <div className="relative w-full h-[320px] bg-slate-950/60 border border-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-2">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .dash-flow {
          stroke-dasharray: 6, 4;
          animation: dash 1.5s linear infinite;
        }
      `}</style>

      {/* Graph Legend */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-2 text-[9px] text-slate-500 bg-slate-900/60 p-1.5 rounded border border-slate-850">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Mission</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Dept</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Emp</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Skill</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>Proj</span>
      </div>

      <svg viewBox="0 0 1000 340" className="w-full h-full">
        {/* Render Edges */}
        {edges.map((edge) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const isHighlighted = activeSourceOrTarget(edge);
          const hasHover = !!hoveredNodeId;

          return (
            <path
              key={edge.id}
              d={`M ${sourceNode.x} ${sourceNode.y} C ${(sourceNode.x + targetNode.x) / 2} ${sourceNode.y}, ${(sourceNode.x + targetNode.x) / 2} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`}
              fill="none"
              stroke={isHighlighted ? "#38bdf8" : "#1e293b"}
              strokeWidth={isHighlighted ? 2.5 : 1}
              opacity={hasHover ? (isHighlighted ? 1.0 : 0.1) : 0.3}
              className={isHighlighted ? "dash-flow" : ""}
            />
          );
        })}

        {/* Render Nodes */}
        {nodes.map((node) => {
          const isActive = isNodeActive(node.id);
          const isHovered = hoveredNodeId === node.id;
          const hasHover = !!hoveredNodeId;

          let colorClass = "bg-slate-900 border-slate-850 text-slate-500";
          let nodeIcon = <Briefcase className="w-3.5 h-3.5" />;

          if (node.type === "mission") {
            colorClass = "bg-amber-950/60 border-amber-500/50 text-amber-400 shadow-amber-500/10";
            nodeIcon = <Sparkles className="w-3.5 h-3.5" />;
          } else if (node.type === "department") {
            colorClass = "bg-indigo-950/60 border-indigo-500/50 text-indigo-400 shadow-indigo-500/10";
            nodeIcon = <Layers className="w-3.5 h-3.5" />;
          } else if (node.type === "employee") {
            colorClass = "bg-blue-950/60 border-blue-500/50 text-blue-400 shadow-blue-500/10";
            nodeIcon = <User className="w-3.5 h-3.5" />;
          } else if (node.type === "skill") {
            colorClass = "bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10";
            nodeIcon = <Brain className="w-3.5 h-3.5" />;
          } else if (node.type === "project") {
            colorClass = "bg-cyan-950/60 border-cyan-500/50 text-cyan-400 shadow-cyan-500/10";
            nodeIcon = <Activity className="w-3.5 h-3.5" />;
          }

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="cursor-pointer"
              opacity={hasHover ? (isActive ? 1.0 : 0.25) : (mission ? 1.0 : 0.45)}
            >
              {/* Outer Pulsing Indicator */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === "mission" ? 22 : 18}
                className={`fill-none stroke-current ${isHovered ? "text-cyan-400 animate-ping opacity-20" : "text-transparent"}`}
                strokeWidth={2}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === "mission" ? 18 : 15}
                className={`fill-slate-950 stroke-current text-slate-800 transition-colors ${isHovered ? "stroke-cyan-500" : "stroke-slate-800"}`}
                strokeWidth={1.5}
              />

              {/* Icon component */}
              <foreignObject
                x={node.x - (node.type === "mission" ? 11 : 9)}
                y={node.y - (node.type === "mission" ? 11 : 9)}
                width={node.type === "mission" ? 22 : 18}
                height={node.type === "mission" ? 22 : 18}
                className="pointer-events-none"
              >
                <div className={`flex items-center justify-center w-full h-full rounded-full ${colorClass} border shadow-sm`}>
                  {nodeIcon}
                </div>
              </foreignObject>

              {/* Text Label */}
              <text
                x={node.x}
                y={node.y + (node.type === "mission" ? 30 : 25)}
                textAnchor="middle"
                className={`text-[8px] font-bold select-none fill-slate-400 transition-colors ${isHovered ? "fill-cyan-400 font-extrabold" : ""}`}
              >
                {node.label.length > 15 ? `${node.label.slice(0, 12)}...` : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
