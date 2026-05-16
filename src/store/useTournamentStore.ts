import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Team = {
  id: string;
  name: string;
  player1: string;
  player2: string;
  avatarUrl: string;
};

export type Match = {
  id: string;
  round: number;
  matchIndex: number;
  team1Id: string | null;
  team2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  nextMatchId: string | null;
};

export type TournamentMode = 'knockout' | 'league';
export type TournamentStatus = 'setup' | 'playing' | 'completed';

interface TournamentState {
  status: TournamentStatus;
  mode: TournamentMode;
  teams: Team[];
  matches: Match[];
  
  // Actions
  setMode: (mode: TournamentMode) => void;
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, team: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  startTournament: () => void;
  resetTournament: () => void;
  updateMatchResult: (matchId: string, winnerId: string, score1: number, score2: number) => void;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateInitialBracket = (teams: Team[]): Match[] => {
  // Simple single-elimination bracket generation
  const numTeams = teams.length;
  if (numTeams < 2) return [];

  // Calculate next power of 2 for bracket size
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const byes = bracketSize - numTeams;
  
  let matches: Match[] = [];
  let matchIdCounter = 1;
  const numRounds = Math.log2(bracketSize);

  // Shuffle teams for completely random matchmaking
  const seededTeams = shuffleArray([...teams.map(t => t.id)]);
  
  // Distribute byes without creating null vs null matchups
  const firstRoundMatchesCount = bracketSize / 2;
  const team1Ids: (string|null)[] = Array(firstRoundMatchesCount).fill(null);
  const team2Ids: (string|null)[] = Array(firstRoundMatchesCount).fill(null);
  
  let teamIdx = 0;
  for (let i = 0; i < firstRoundMatchesCount; i++) {
     team1Ids[i] = seededTeams[teamIdx++];
  }
  for (let i = 0; i < firstRoundMatchesCount; i++) {
     if (teamIdx < numTeams) {
         team2Ids[i] = seededTeams[teamIdx++];
     } else {
         team2Ids[i] = null;
     }
  }

  let currentRoundMatches: Match[] = [];
  let previousRoundMatches: Match[] = [];

  // Build rounds from bottom (first round) up to final
  for (let round = 1; round <= numRounds; round++) {
    const isFirstRound = round === 1;
    const matchesInRound = bracketSize / Math.pow(2, round);
    currentRoundMatches = [];

    for (let i = 0; i < matchesInRound; i++) {
      const matchId = `match-${matchIdCounter++}`;
      const match: Match = {
        id: matchId,
        round,
        matchIndex: i,
        team1Id: isFirstRound ? team1Ids[i] : null,
        team2Id: isFirstRound ? team2Ids[i] : null,
        score1: null,
        score2: null,
        winnerId: null,
        nextMatchId: null, // Will be set by next round
      };
      
      // Auto-advance byes in first round
      if (isFirstRound && (match.team1Id === null || match.team2Id === null)) {
        match.winnerId = match.team1Id || match.team2Id;
      }

      currentRoundMatches.push(match);
      matches.push(match);
    }

    // Link previous round to this round
    if (!isFirstRound) {
       for (let j = 0; j < previousRoundMatches.length; j++) {
         const parentMatchIndex = Math.floor(j / 2);
         const parentMatch = currentRoundMatches[parentMatchIndex];
         previousRoundMatches[j].nextMatchId = parentMatch.id;
         
         // Auto-advance winners from first-round byes into round 2
         if (previousRoundMatches[j].winnerId) {
            if (j % 2 === 0) parentMatch.team1Id = previousRoundMatches[j].winnerId;
            else parentMatch.team2Id = previousRoundMatches[j].winnerId;
         }
       }
    }

    previousRoundMatches = currentRoundMatches;
  }

  return matches;
};

const generateLeagueMatches = (teams: Team[]): Match[] => {
  let matches: Match[] = [];
  let matchIdCounter = 1;
  const shuffledTeams = shuffleArray([...teams]);
  
  // Simple round robin algorithm
  const n = shuffledTeams.length;
  const teamsArr = [...shuffledTeams.map(t => t.id)];
  if (n % 2 !== 0) {
    teamsArr.push(null as any); // null is a bye
  }
  
  const totalRounds = teamsArr.length - 1;
  const matchesPerRound = teamsArr.length / 2;
  
  for (let r = 0; r < totalRounds; r++) {
    for (let m = 0; m < matchesPerRound; m++) {
      const t1 = teamsArr[m];
      const t2 = teamsArr[teamsArr.length - 1 - m];
      if (t1 !== null && t2 !== null) {
        matches.push({
          id: `match-league-${matchIdCounter++}`,
          round: r + 1,
          matchIndex: m,
          team1Id: t1,
          team2Id: t2,
          score1: null,
          score2: null,
          winnerId: null,
          nextMatchId: null,
        });
      }
    }
    // Rotate array (keep first element fixed)
    teamsArr.splice(1, 0, teamsArr.pop()!);
  }
  return matches;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      status: 'setup',
      mode: 'knockout',
      teams: [],
      matches: [],

      setMode: (mode) => set({ mode }),
      
      addTeam: (team) => set((state) => ({
        teams: [...state.teams, { ...team, id: crypto.randomUUID() }]
      })),
      
      updateTeam: (id, updatedTeam) => set((state) => ({
        teams: state.teams.map(t => t.id === id ? { ...t, ...updatedTeam } : t)
      })),

      removeTeam: (id) => set((state) => ({
        teams: state.teams.filter(t => t.id !== id)
      })),

      startTournament: () => {
        const { teams, mode } = get();
        if (teams.length < 2) return;
        
        let initialMatches: Match[] = [];
        if (mode === 'knockout') {
           initialMatches = generateInitialBracket(teams);
        } else if (mode === 'league') {
           initialMatches = generateLeagueMatches(teams);
        }

        set({ status: 'playing', matches: initialMatches });
      },

      resetTournament: () => set({ status: 'setup', matches: [] }),

      updateMatchResult: (matchId, winnerId, score1, score2) => set((state) => {
        const newMatches = [...state.matches];
        const matchIndex = newMatches.findIndex(m => m.id === matchId);
        if (matchIndex === -1) return state;

        const match = { ...newMatches[matchIndex] };
        match.winnerId = winnerId;
        match.score1 = score1;
        match.score2 = score2;
        newMatches[matchIndex] = match;

        // Advance winner to next match if there is one
        if (match.nextMatchId) {
          const nextMatchIndex = newMatches.findIndex(m => m.id === match.nextMatchId);
          if (nextMatchIndex !== -1) {
            const nextMatch = { ...newMatches[nextMatchIndex] };
            // Assign to team1Id or team2Id based on position
            // Since we know the previous match indexes, we can deduce it
            const incomingMatchesList = state.matches.filter(m => m.nextMatchId === match.nextMatchId).sort((a,b) => a.matchIndex - b.matchIndex);
            const isTeam1 = incomingMatchesList[0].id === matchId;
            
            if (isTeam1) {
              nextMatch.team1Id = winnerId;
            } else {
              nextMatch.team2Id = winnerId;
            }
            newMatches[nextMatchIndex] = nextMatch;
          }
        }

        return { matches: newMatches };
      }),
    }),
    {
      name: 'beerpong-storage',
    }
  )
);
