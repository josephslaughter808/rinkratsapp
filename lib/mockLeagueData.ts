export type MemberRole =
  | "league_manager"
  | "captain"
  | "assistant_captain"
  | "film_manager"
  | "player"
  | "sub";

export type Team = {
  id: string;
  name: string;
  shortName: string;
  accent: string;
  record: string;
  captain: string;
  assistant: string;
};

export type Highlight = {
  id: string;
  title: string;
  type: "goal" | "assist" | "hit" | "penalty" | "save";
  period: string;
  gameClock: string;
  clipStart: string;
  clipEnd: string;
  filmLabel: string;
  description: string;
  players: string[];
  statLine: string;
};

export type Game = {
  id: string;
  week: number;
  date: string;
  puckDrop: string;
  rink: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "final";
  recap: string;
  fullFilmLabel: string;
  highlights: Highlight[];
  stars?: {
    offense: GameStar;
    defense: GameStar;
  };
};

export type GameStar = {
  name: string;
  number: number;
  position: string;
  profileUrl: string;
  stats: Array<{
    label: string;
    value: string | number;
  }>;
};

export type FeedPost = {
  id: string;
  author: string;
  role: "Captain" | "Assistant Captain";
  teamId: string;
  title: string;
  body: string;
  createdAt: string;
  attachmentLabel?: string;
  linkedHighlightId?: string;
};

export type ChatRoom = {
  id: string;
  name: string;
  scope: string;
  lastMessage: string;
  unread: number;
};

export type DraftPlayer = {
  id: string;
  name: string;
  age: number;
  number: number;
  position: "C" | "LW" | "RW" | "D" | "G";
  shoots: "L" | "R";
  tier: "A" | "B" | "C";
  previousTeam: string;
  lastSeasonPoints: number;
  plusMinus: number;
  note: string;
};

export type DraftPick = {
  id: string;
  round: number;
  overall: number;
  teamId: string;
  playerId: string | null;
  madeBy: string;
};

export const teams: Team[] = [
  {
    id: "desert-storm",
    name: "Desert Storm",
    shortName: "DST",
    accent: "#f97316",
    record: "6-1-0",
    captain: "Nate Keller",
    assistant: "Jules Medina",
  },
  {
    id: "ratt-damon",
    name: "Ratt Damon",
    shortName: "RDM",
    accent: "#22c55e",
    record: "4-2-1",
    captain: "Chris Boone",
    assistant: "Milo Hart",
  },
  {
    id: "platypucks",
    name: "Platypucks",
    shortName: "PLY",
    accent: "#38bdf8",
    record: "4-3-0",
    captain: "Ava Reese",
    assistant: "Brock Neal",
  },
  {
    id: "mudsquatch",
    name: "Mudsquatch",
    shortName: "MDS",
    accent: "#a855f7",
    record: "2-5-0",
    captain: "Tyson Black",
    assistant: "Cole Mercer",
  },
];

export const currentMember = {
  name: "Evan Price",
  role: "player" as MemberRole,
  leagueName: "Rink Rats Adult League",
  joinCode: "RINK-4821",
  teamId: "desert-storm",
  teamName: "Desert Storm",
  season: "Spring 2026",
};

export const leagueOverview = {
  name: currentMember.leagueName,
  season: currentMember.season,
  joinCode: currentMember.joinCode,
  enrollmentFlow:
    "Players create an account, join with a league code, and stay unassigned until the league manager places them on a roster, sub list, or draft pool.",
  highlightFlow:
    "Captains, assistants, and film managers upload full game film, tag stat moments by timecode, and publish highlights with scorer, assists, hits, and penalties tied to each clip.",
};

export const games: Game[] = [
  {
    id: "week-7-desert-ratt",
    week: 7,
    date: "Sun, Mar 29",
    puckDrop: "8:40 PM",
    rink: "South Sheet",
    homeTeamId: "desert-storm",
    awayTeamId: "ratt-damon",
    homeScore: 4,
    awayScore: 2,
    status: "final",
    recap:
      "Desert Storm pulled away in the third with two quick-strike goals off recovered loose pucks.",
    fullFilmLabel:
      "Players can watch Desert Storm film. League captains can review all game film.",
    stars: {
      offense: {
        name: "Evan Price",
        number: 98,
        position: "RW",
        profileUrl:
          "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Evan%20Price",
        stats: [
          { label: "G", value: 1 },
          { label: "A", value: 1 },
          { label: "PTS", value: 2 },
          { label: "SOG", value: 4 },
        ],
      },
      defense: {
        name: "Jules Medina",
        number: 4,
        position: "LD",
        profileUrl:
          "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Jules%20Medina",
        stats: [
          { label: "H", value: 3 },
          { label: "BLK", value: 2 },
          { label: "+/-", value: "+2" },
          { label: "A", value: 1 },
        ],
      },
    },
    highlights: [
      {
        id: "h1",
        title: "Backdoor finish off the cycle",
        type: "goal",
        period: "1st",
        gameClock: "12:18",
        clipStart: "08:14",
        clipEnd: "08:42",
        filmLabel: "Game film clip 08:14-08:42",
        description:
          "Keller finds Price behind coverage for the opener after a low-to-high rotation.",
        players: ["Evan Price", "Nate Keller", "Jules Medina"],
        statLine: "Goal: Evan Price | Assist: Nate Keller, Jules Medina",
      },
      {
        id: "h2",
        title: "Net-front battle creates rebound goal",
        type: "goal",
        period: "2nd",
        gameClock: "04:51",
        clipStart: "27:43",
        clipEnd: "28:05",
        filmLabel: "Game film clip 27:43-28:05",
        description:
          "A second effort at the crease turns into the go-ahead finish.",
        players: ["Micah Dunn", "Evan Price"],
        statLine: "Goal: Micah Dunn | Assist: Evan Price",
      },
      {
        id: "h3",
        title: "Bench-side hit flips possession",
        type: "hit",
        period: "3rd",
        gameClock: "10:33",
        clipStart: "41:12",
        clipEnd: "41:25",
        filmLabel: "Game film clip 41:12-41:25",
        description:
          "A clean shoulder check forces the turnover that starts the insurance tally.",
        players: ["Jules Medina", "Ryan Cross"],
        statLine: "Hit: Jules Medina on Ryan Cross",
      },
    ],
  },
  {
    id: "week-7-platy-mud",
    week: 7,
    date: "Sun, Mar 29",
    puckDrop: "9:10 PM",
    rink: "North Sheet",
    homeTeamId: "platypucks",
    awayTeamId: "mudsquatch",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    recap:
      "Late game on the far sheet with two teams fighting for playoff seeding.",
    fullFilmLabel:
      "Captains and film staff can upload and segment the full game once it ends.",
    highlights: [],
  },
  {
    id: "week-6-desert-platy",
    week: 6,
    date: "Sun, Mar 22",
    puckDrop: "8:05 PM",
    rink: "South Sheet",
    homeTeamId: "desert-storm",
    awayTeamId: "platypucks",
    homeScore: 3,
    awayScore: 1,
    status: "final",
    recap:
      "Desert Storm controlled the neutral zone and limited second chances all night.",
    fullFilmLabel:
      "Full film visible to Desert Storm players and league-approved staff.",
    stars: {
      offense: {
        name: "Mason Pope",
        number: 19,
        position: "LW",
        profileUrl:
          "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Mason%20Pope",
        stats: [
          { label: "G", value: 1 },
          { label: "A", value: 1 },
          { label: "PTS", value: 2 },
          { label: "SOG", value: 5 },
        ],
      },
      defense: {
        name: "Derek Cho",
        number: 6,
        position: "RD",
        profileUrl:
          "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Derek%20Cho",
        stats: [
          { label: "H", value: 2 },
          { label: "BLK", value: 4 },
          { label: "+/-", value: "+1" },
          { label: "PIM", value: 0 },
        ],
      },
    },
    highlights: [
      {
        id: "h5",
        title: "Short-side snipe off the rush",
        type: "goal",
        period: "2nd",
        gameClock: "06:11",
        clipStart: "21:55",
        clipEnd: "22:17",
        filmLabel: "Game film clip 21:55-22:17",
        description:
          "Price pulls the defender wide and beats the goalie clean from the circle.",
        players: ["Evan Price", "Mason Pope"],
        statLine: "Goal: Evan Price | Assist: Mason Pope",
      },
    ],
  },
  {
    id: "week-8-desert-mud",
    week: 8,
    date: "Sun, Apr 5",
    puckDrop: "7:50 PM",
    rink: "Center Sheet",
    homeTeamId: "mudsquatch",
    awayTeamId: "desert-storm",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    recap:
      "Next week’s matchup features the current first-place side against a physical forechecking team.",
    fullFilmLabel:
      "Film tools unlock after upload by the captain, assistant, or film manager.",
    highlights: [],
  },
];

export const feedPosts: FeedPost[] = [
  {
    id: "f1",
    author: "Nate Keller",
    role: "Captain",
    teamId: "desert-storm",
    title: "Third-period forecheck clips are up",
    body:
      "Watch the two examples from Sunday and note how our F3 stayed above the puck before both takeaways.",
    createdAt: "Mar 29, 10:14 PM",
    attachmentLabel: "Attached: 2 tagged game clips",
    linkedHighlightId: "h2",
  },
  {
    id: "f2",
    author: "Jules Medina",
    role: "Assistant Captain",
    teamId: "desert-storm",
    title: "Pre-game plan for next week",
    body:
      "Mudsquatch will rim pucks hard on exits. Wingers should shoulder-check early and reverse support low more often.",
    createdAt: "Mar 28, 6:40 PM",
    attachmentLabel: "Attached: full-game scout reel",
  },
];

export const chatRooms: ChatRoom[] = [
  {
    id: "team-room",
    name: "Team Chat",
    scope: "Entire roster",
    lastMessage: "Keller: Film timestamps are locked in for tonight’s goals.",
    unread: 4,
  },
  {
    id: "captains-room",
    name: "Captains Chat",
    scope: "League captains only",
    lastMessage:
      "League Manager: Please verify the draft pool before Tuesday.",
    unread: 1,
  },
  {
    id: "staff-room",
    name: "Captains + Assistants + Film",
    scope: "Game film and league ops",
    lastMessage:
      "Jules: I tagged the boarding penalty and added the clip link.",
    unread: 0,
  },
];

export const roomMessages: Record<
  string,
  Array<{ id: string; sender: string; role: string; content: string; stamp: string }>
> = {
  "team-room": [
    {
      id: "m1",
      sender: "Nate Keller",
      role: "Captain",
      content: "Highlights are linked. Check the backdoor goal and the bench-side hit before next skate.",
      stamp: "9:58 PM",
    },
    {
      id: "m2",
      sender: "Evan Price",
      role: "Player",
      content: "Loved how the clip tied right into the stat line. That’s exactly how this app should work.",
      stamp: "10:05 PM",
    },
  ],
  "captains-room": [
    {
      id: "m3",
      sender: "League Manager",
      role: "League Manager",
      content: "Reminder: unassigned players should remain in the draft pool until the room closes.",
      stamp: "4:20 PM",
    },
  ],
  "staff-room": [
    {
      id: "m4",
      sender: "Jules Medina",
      role: "Assistant Captain",
      content: "I added the hooking clip and linked the penalized player plus the drawn-by skater.",
      stamp: "8:44 PM",
    },
  ],
};

export const draftPlayers: DraftPlayer[] = [
  {
    id: "dp1",
    name: "Owen Mercer",
    age: 29,
    number: 16,
    position: "C",
    shoots: "L",
    tier: "A",
    previousTeam: "Free Agent",
    lastSeasonPoints: 28,
    plusMinus: 11,
    note: "Strong on draws, can play bumper on the power play.",
  },
  {
    id: "dp2",
    name: "Leo Sandoval",
    age: 33,
    number: 7,
    position: "D",
    shoots: "R",
    tier: "A",
    previousTeam: "Ratt Damon",
    lastSeasonPoints: 18,
    plusMinus: 9,
    note: "Gap control defender with a heavy first pass.",
  },
  {
    id: "dp3",
    name: "Finn Walker",
    age: 25,
    number: 30,
    position: "G",
    shoots: "L",
    tier: "B",
    previousTeam: "Sub List",
    lastSeasonPoints: 0,
    plusMinus: 0,
    note: "Athletic goalie who tracks pucks through traffic well.",
  },
  {
    id: "dp4",
    name: "Mason Pope",
    age: 31,
    number: 19,
    position: "RW",
    shoots: "R",
    tier: "B",
    previousTeam: "Platypucks",
    lastSeasonPoints: 21,
    plusMinus: 4,
    note: "Quick release scorer who likes to slip weak-side coverage.",
  },
  {
    id: "dp5",
    name: "Aiden Lowe",
    age: 27,
    number: 88,
    position: "LW",
    shoots: "L",
    tier: "C",
    previousTeam: "Free Agent",
    lastSeasonPoints: 12,
    plusMinus: -1,
    note: "Straight-line winger with good wall play and motor.",
  },
  {
    id: "dp6",
    name: "Derek Cho",
    age: 35,
    number: 4,
    position: "D",
    shoots: "L",
    tier: "C",
    previousTeam: "Mudsquatch",
    lastSeasonPoints: 9,
    plusMinus: 3,
    note: "Reliable second-pairing defender who blocks a lot of shots.",
  },
  ...buildTestDraftPlayers(84),
];

export const draftedPlayerIds = ["dp2", "dp4"];
export const draftQueue = ["dp1", "dp3", "dp5"];

export const draftPicks: DraftPick[] = [
  {
    id: "pick1",
    round: 1,
    overall: 1,
    teamId: "desert-storm",
    playerId: "dp2",
    madeBy: "Nate Keller",
  },
  {
    id: "pick2",
    round: 1,
    overall: 2,
    teamId: "ratt-damon",
    playerId: "dp4",
    madeBy: "Chris Boone",
  },
  {
    id: "pick3",
    round: 1,
    overall: 3,
    teamId: "platypucks",
    playerId: null,
    madeBy: "Ava Reese",
  },
  {
    id: "pick4",
    round: 1,
    overall: 4,
    teamId: "mudsquatch",
    playerId: null,
    madeBy: "Tyson Black",
  },
  {
    id: "pick5",
    round: 2,
    overall: 5,
    teamId: "mudsquatch",
    playerId: null,
    madeBy: "Tyson Black",
  },
  {
    id: "pick6",
    round: 2,
    overall: 6,
    teamId: "platypucks",
    playerId: null,
    madeBy: "Ava Reese",
  },
  {
    id: "pick7",
    round: 2,
    overall: 7,
    teamId: "ratt-damon",
    playerId: null,
    madeBy: "Chris Boone",
  },
  {
    id: "pick8",
    round: 2,
    overall: 8,
    teamId: "desert-storm",
    playerId: null,
    madeBy: "Nate Keller",
  },
];

export const draftConfig = {
  title: "Spring 2026 League Draft",
  currentPickOverall: 3,
  currentRound: 1,
  totalRounds: 21,
  timeLeft: 74,
  yourTeamId: "desert-storm",
  yourNextPickOverall: 8,
};

function buildTestDraftPlayers(count: number): DraftPlayer[] {
  const firstNames = [
    "Alex",
    "Blake",
    "Carter",
    "Drew",
    "Elliot",
    "Flynn",
    "Gavin",
    "Harper",
    "Isaac",
    "Jaden",
    "Kai",
    "Logan",
    "Mason",
    "Noah",
    "Owen",
    "Parker",
    "Quinn",
    "Reese",
    "Sawyer",
    "Tanner",
    "Uri",
    "Vince",
    "Wyatt",
    "Xander",
    "Yuri",
    "Zane",
  ] as const;
  const positions: DraftPlayer["position"][] = ["C", "LW", "RW", "D", "G"];
  const tiers: DraftPlayer["tier"][] = ["A", "B", "C"];
  const shoots: DraftPlayer["shoots"][] = ["L", "R"];

  return Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[index % firstNames.length];
    const position = positions[index % positions.length];
    const tier = tiers[index % tiers.length];
    const shootsHand = shoots[index % shoots.length];
    const tierPointsBase = tier === "A" ? 30 : tier === "B" ? 19 : 10;
    const lastSeasonPoints =
      position === "G" ? 0 : Math.max(2, tierPointsBase - Math.floor(index / 5));
    const plusMinus =
      tier === "A"
        ? 12 - (index % 7)
        : tier === "B"
        ? 6 - (index % 6)
        : 2 - (index % 5);

    return {
      id: `dptest-${String(index + 1).padStart(3, "0")}`,
      name: `${firstName} TEST`,
      age: 21 + (index % 18),
      number: ((index * 7) % 98) + 1,
      position,
      shoots: shootsHand,
      tier,
      previousTeam: "Draft Pool",
      lastSeasonPoints,
      plusMinus,
      note:
        position === "G"
          ? "Unassigned test goalie seeded for draft-room QA."
          : "Unassigned test skater seeded for draft-room QA.",
    };
  });
}

export function getTeam(teamId: string) {
  return teams.find((team) => team.id === teamId);
}

export function getGame(gameId: string) {
  return games.find((game) => game.id === gameId);
}

export function getGamesForWeek(week: number) {
  return games.filter((game) => game.week === week);
}

export function getPlayer(playerId: string | null) {
  if (!playerId) return undefined;
  return draftPlayers.find((player) => player.id === playerId);
}
