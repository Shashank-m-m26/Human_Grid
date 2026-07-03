"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { MissionEngineOutput } from "@/types";

interface MissionContextValue {
  mission: MissionEngineOutput | null;
  setMission: (m: MissionEngineOutput) => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [mission, setMission] = useState<MissionEngineOutput | null>(null);
  return (
    <MissionContext.Provider value={{ mission, setMission }}>
      {children}
    </MissionContext.Provider>
  );
}

export function useMission(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used inside MissionProvider");
  return ctx;
}
