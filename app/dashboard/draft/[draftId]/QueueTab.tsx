"use client";

import { useEffect, useState } from "react";

interface QueuedPlayer {
  id: string;
  player_id: string;
  player_name: string;
  position: string;
  level: string;
  goals: number;
  assists: number;
}

export default function QueueTab({ draftId }: { draftId: string }) {
  const [queue, setQueue] = useState<QueuedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/draft/${draftId}/queue`);
      const data = await res.json();
      setQueue(data);
      setLoading(false);
    };

    load();
  }, [draftId]);

  const removeFromQueue = async (playerId: string) => {
    await fetch(`/api/draft/${draftId}/queue/${playerId}`, {
      method: "DELETE",
    });

    setQueue((prev) => prev.filter((p) => p.player_id !== playerId));
  };

  if (loading) {
    return <div className="text-white p-4">Loading queue…</div>;
  }

  if (queue.length === 0) {
    return (
      <div className="text-white p-4 opacity-70 italic">
        No players in your queue yet.
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg bg-[#0A0A0A] p-4">
      <table className="min-w-max w-full border-collapse">
        <thead>
          <tr className="bg-[#111] text-white text-sm">
            <th className="p-3 border-r border-[#222] text-left">Player</th>
            <th className="p-3 border-r border-[#222] text-left">Pos</th>
            <th className="p-3 border-r border-[#222] text-left">Lvl</th>
            <th className="p-3 border-r border-[#222] text-left">G</th>
            <th className="p-3 border-r border-[#222] text-left">A</th>
            <th className="p-3 border-r border-[#222] text-left">Remove</th>
          </tr>
        </thead>

        <tbody>
          {queue.map((p) => (
            <tr key={p.id} className="border-t border-[#222] text-white">
              <td className="p-3 border-r border-[#222]">{p.player_name}</td>
              <td className="p-3 border-r border-[#222]">{p.position}</td>
              <td className="p-3 border-r border-[#222]">{p.level}</td>
              <td className="p-3 border-r border-[#222]">{p.goals}</td>
              <td className="p-3 border-r border-[#222]">{p.assists}</td>
              <td className="p-3 border-r border-[#222]">
                <button
                  onClick={() => removeFromQueue(p.player_id)}
                  className="bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
