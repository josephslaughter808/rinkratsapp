"use client";

import { useEffect, useState } from "react";

interface Team {
  id: string;
  name: string;
}

interface Pick {
  id: string;
  round: number;
  overall: number;
  team_id: string;
  player_name: string | null;
}

interface Props {
  draftId: string;
}

export default function DraftBoard({ draftId }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [rounds, setRounds] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const t: Team[] = await fetch(`/api/draft/${draftId}/teams`).then(r => r.json());
      const p: Pick[] = await fetch(`/api/draft/${draftId}/picks`).then(r => r.json());

      setTeams(t);
      setPicks(p);

      const maxRound = p.length ? Math.max(...p.map((x: Pick) => x.round)) : 0;
      setRounds(maxRound);
    };

    load();
  }, [draftId]);

  const getPick = (round: number, teamId: string) => {
    return picks.find(p => p.round === round && p.team_id === teamId);
  };

  if (!rounds || teams.length === 0) {
    return <div>Loading draft board…</div>;
  }

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-[#0A0A0A]">
      <table className="min-w-max w-full border-collapse">
        <thead>
          <tr className="bg-[#111] text-white text-sm">
            <th className="p-3 border-r border-[#222] w-20 text-left">Rnd</th>
            {teams.map(team => (
              <th
                key={team.id}
                className="p-3 border-r border-[#222] text-left font-semibold"
              >
                {team.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rounds }).map((_, i) => {
            const round = i + 1;
            return (
              <tr key={round} className="border-t border-[#222]">
                <td className="p-3 text-white border-r border-[#222] font-bold">
                  {round}
                </td>

                {teams.map(team => {
                  const pick = getPick(round, team.id);

                  return (
                    <td
                      key={team.id}
                      className="p-3 border-r border-[#222] text-sm text-white"
                    >
                      {pick?.player_name ? (
                        <div className="bg-[#1E1E1E] p-2 rounded-md border border-[#333]">
                          {pick.player_name}
                        </div>
                      ) : (
                        <div className="opacity-40 italic">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
