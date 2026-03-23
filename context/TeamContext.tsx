"use client";

import { createContext, useContext, useState } from "react";

type TeamContextType = {
  selectedTeam: any;
  setSelectedTeam: (team: any) => void;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  return (
    <TeamContext.Provider value={{ selectedTeam, setSelectedTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used inside a <TeamProvider>");
  }
  return context;
}
