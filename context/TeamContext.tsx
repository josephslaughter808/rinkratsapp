"use client";

import { createContext, useContext, useState } from "react";

export type SelectedTeam = {
  id: string;
  name: string;
  teamLogo: string | null;
  leagueId: string | null;
  player_id: string;
  role?: string | null;
};

type TeamContextType = {
  selectedTeam: SelectedTeam | null;
  setSelectedTeam: (team: SelectedTeam | null) => void;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam | null>(null);

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
