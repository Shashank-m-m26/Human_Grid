export interface MeetingHours {
  start: string;
  end: string;
  timezone: string;
}

export interface EmployeeProfile {
  employee_id: string;
  full_name: string;
  designation: string;
  department: string;
  office_location: string;
  experience_years: number;
  skills: string[];
  certifications: string[];
  languages: string[];
  availability: string;
  preferred_meeting_hours: MeetingHours;
  current_workload: number;
  trust_score: number;
  collaboration_score: number;
  mentor_score: number;
  communication_style: string;
  completed_projects: string[];
  current_projects: string[];
}

export interface MissionTask {
  task_id: string;
  title: string;
  description: string;
  required_skills: string[];
  required_departments: string[];
  estimated_duration: string;
  status: string;
}

export interface MissionStageEvent {
  stage: string;
  transitioned_at: string;
}

export interface MissionRecord {
  mission_id: string;
  requester_id: string;
  title: string;
  objective: string;
  status: string;
  priority: string;
  created_at: string;
  tasks: MissionTask[];
  team_member_ids: string[];
  stage_history: MissionStageEvent[];
}

export interface AgentExecutionEvent {
  agent_name: string;
  status: string;
  summary: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  reasoning_summary: string;
  confidence: number;
}

export interface KnowledgeGraphMatch {
  entity_type: string;
  entity_id: string;
  label: string;
  relevance_score: number;
  reason: string;
  relationships: string[];
}

export interface PeopleDiscoveryOutput {
  candidates_by_task: Record<string, string[]>;
  graph_matches_by_task: Record<string, KnowledgeGraphMatch[]>;
  searched_domains: string[];
}

export interface RankedCandidate {
  employee: EmployeeProfile;
  ranking_score: number;
  confidence_score: number;
  explanation: string;
  structured_reasoning: string[];
}

export interface IntelligenceOutput {
  ranked_candidates_by_task: Record<string, RankedCandidate[]>;
}

export interface CoordinationOutput {
  mission_id: string;
  assigned_employee_ids: string[];
  scheduled_meeting_ids: string[];
  notification_ids: string[];
}

export interface MissionEngineOutput {
  state: {
    mission: MissionRecord;
    current_agent: string | null;
    current_stage: string;
    activity_feed: string[];
  };
  execution_timeline: AgentExecutionEvent[];
  root_agent_name: string;
  adk_available: boolean;
  people_discovery: PeopleDiscoveryOutput;
  intelligence: IntelligenceOutput;
  coordination: CoordinationOutput;
}
