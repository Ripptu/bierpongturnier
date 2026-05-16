import { useTournamentStore, Match, Team } from '../store/useTournamentStore';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { Trophy, X, ListOrdered } from 'lucide-react';

export function PlayingView() {
  const { matches, teams, resetTournament, updateMatchResult, mode } = useTournamentStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Group matches by round for Knockout, or matchday for League
  const roundsMap = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundsCount = Object.keys(roundsMap).length;
  const finalMatch = mode === 'knockout' ? matches.find(m => m.round === roundsCount) : null;
  const tournamentFinished = mode === 'knockout' ? !!finalMatch?.winnerId : matches.every(m => m.winnerId !== null);

  const handleMatchClick = (match: Match) => {
     if (!match.team1Id || !match.team2Id) return;
     setSelectedMatch(match);
  };

  const getTeam = (id: string | null) => teams.find(t => t.id === id);

  // League Standings Calculation
  const standings = teams.map(team => {
    const teamMatches = matches.filter(m => m.team1Id === team.id || m.team2Id === team.id);
    const played = teamMatches.filter(m => m.winnerId !== null).length;
    let wins = 0;
    let losses = 0;
    let cupsDifferential = 0;

    teamMatches.forEach(m => {
      if (m.winnerId === team.id) wins++;
      else if (m.winnerId && m.winnerId !== team.id) losses++;

      // Cups diff simplified
      if (m.winnerId && m.score1 !== null && m.score2 !== null) {
         if (m.team1Id === team.id) {
           cupsDifferential += (m.score1 - m.score2);
         } else {
           cupsDifferential += (m.score2 - m.score1);
         }
      }
    });

    return { ...team, played, wins, losses, cupsDifferential };
  }).sort((a, b) => b.wins - a.wins || b.cupsDifferential - a.cupsDifferential);

  return (
    <div className="min-h-screen bg-white p-2 md:p-4 flex flex-col">
      <div className="flex-1 bg-black text-white rounded-[40px] md:rounded-[60px] p-6 md:p-10 flex flex-col relative shrink-0">
        <div className="flex justify-between items-center w-full mb-8 border-b border-white/20 pb-6 shrink-0 z-10">
          <h1 className="text-[32px] md:text-[64px] font-black uppercase tracking-tighter italic leading-none">{mode === 'league' ? 'LIGA' : 'BRACKET'}</h1>
          <button 
            onClick={resetTournament}
            className="border border-white/30 text-white bg-transparent px-4 py-2 md:px-6 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase transition-all hover:bg-white hover:text-black shrink-0"
          >
            End Tournament
          </button>
        </div>

        {mode === 'league' ? (
          <div className="flex-1 flex flex-col lg:flex-row gap-8">
            {/* MATCHES LIST */}
            <div className="flex-1 pr-0 lg:pr-4 flex flex-col gap-8 pb-12">
              {Object.entries(roundsMap).map(([roundNum, roundMatches]) => (
                <div key={roundNum} className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">Matchday {roundNum}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roundMatches.map(match => {
                      const t1 = getTeam(match.team1Id);
                      const t2 = getTeam(match.team2Id);
                      const isFinished = !!match.winnerId;

                      return (
                        <div 
                          key={match.id}
                          onClick={() => handleMatchClick(match)}
                          className={cn(
                            "relative bg-white/5 p-4 rounded-[30px] border border-white/10 transition-all cursor-pointer",
                            !isFinished ? "hover:border-[#FF3B30] hover:bg-white/10" : "opacity-100"
                          )}
                        >
                           <div className="flex justify-between mb-3">
                             <span className="text-[10px] font-bold uppercase opacity-60">MATCH #{match.id.split('-').pop()?.padStart(2, '0')}</span>
                             {!isFinished && <span className="text-[10px] text-[#FF3B30] font-black uppercase">LIVE</span>}
                             {isFinished && <span className="text-[10px] text-green-400 font-black uppercase">DONE</span>}
                           </div>

                           <div className={cn("flex justify-between items-center", match.winnerId === t1?.id ? "text-white" : isFinished ? "opacity-50" : "text-white")}>
                             <div className="flex items-center gap-2 overflow-hidden flex-1">
                               {t1 && <img src={t1.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${t1.name}`} className="w-5 h-5 rounded-full bg-white object-cover shrink-0" alt="" />}
                               <span className="font-black text-sm uppercase truncate">{t1?.name}</span>
                             </div>
                             <span className="text-xl font-black italic ml-2">{match.score1 ?? '-'}</span>
                           </div>
                           <div className="h-[1px] w-full bg-white/10 my-2"></div>
                           <div className={cn("flex justify-between items-center", match.winnerId === t2?.id ? "text-white" : isFinished ? "opacity-50" : "text-white")}>
                             <div className="flex items-center gap-2 overflow-hidden flex-1">
                               {t2 && <img src={t2.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${t2.name}`} className="w-5 h-5 rounded-full bg-white object-cover shrink-0" alt="" />}
                               <span className="font-black text-sm uppercase truncate">{t2?.name}</span>
                             </div>
                             <span className="text-xl font-black italic ml-2">{match.score2 ?? '-'}</span>
                           </div>
                        </div>
                       )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* STANDINGS TABLE */}
            <div className="w-full lg:w-[400px] shrink-0 bg-white/5 border border-white/10 rounded-[40px] p-6 flex flex-col mt-4 lg:mt-0">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                 <ListOrdered className="w-5 h-5 text-[#FF3B30]" /> Standings
              </h2>
              <div className="flex flex-col gap-2">
                {standings.map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                     <span className="text-xs font-black opacity-50 w-4">{idx + 1}.</span>
                     <img src={team.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${team.name}`} className="w-6 h-6 rounded-full bg-white object-cover shrink-0" alt="" />
                     <span className="font-bold text-sm uppercase flex-1 truncate">{team.name}</span>
                     <div className="text-right flex gap-3 text-xs">
                        <span className="opacity-60 w-8">{team.wins}W</span>
                        <span className="opacity-60 w-8">{team.losses}L</span>
                        <span className={team.cupsDifferential > 0 ? "text-green-400 font-bold w-10" : "text-red-400 font-bold w-10"}>
                          {team.cupsDifferential > 0 ? '+' : ''}{team.cupsDifferential}
                        </span>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex gap-8 md:gap-16 overflow-x-auto pb-12 items-start md:items-center flex-1 px-2 md:px-4">
          {Object.entries(roundsMap).map(([roundNum, roundMatches], rIdx) => (
            <div key={roundNum} className="flex flex-col min-w-[260px] md:min-w-[320px] relative mt-12 md:mt-0">
              <div className="absolute -top-10 left-0">
                <span className="text-[10px] border border-white px-3 py-1 rounded-full uppercase font-bold bg-white text-black">
                  Round {roundNum}
                </span>
              </div>
              
              <div className={cn(
                "flex flex-col", 
                rIdx === 0 ? "gap-4 md:gap-6" : 
                rIdx === 1 ? "gap-[3.5rem]" : 
                rIdx === 2 ? "gap-[10rem]" : 
                "gap-[22rem]"
              )}>
                {roundMatches.map((match) => {
                  const t1 = getTeam(match.team1Id);
                  const t2 = getTeam(match.team2Id);
                  const isReady = t1 && t2;
                  const isFinished = !!match.winnerId;

                  return (
                    <div 
                      key={match.id}
                      onClick={() => handleMatchClick(match)}
                      className={cn(
                        "relative bg-white/10 p-3 md:p-4 rounded-[20px] md:rounded-[30px] border border-white/10 transition-all",
                        isReady && !isFinished ? "hover:border-[#FF3B30] hover:bg-white/20 cursor-pointer" : isFinished ? "opacity-100" : "opacity-40"
                      )}
                    >
                      <div className="flex justify-between mb-2">
                         <span className="text-[10px] md:text-xs font-bold uppercase opacity-60">MATCH #{match.id.replace('match-', '').padStart(2, '0')}</span>
                         {!isFinished && isReady && <span className="text-[10px] md:text-xs text-[#FF3B30] font-black uppercase">LIVE</span>}
                      </div>

                      {/* Team 1 */}
                      <div className={cn(
                        "flex items-center justify-between",
                        match.winnerId === t1?.id ? "text-white" : isFinished ? "opacity-30" : "text-white",
                        !t1 && "opacity-30"
                      )}>
                         <div className="flex items-center gap-2 overflow-hidden flex-1">
                           {t1 && <img src={t1.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${t1.name}`} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white object-cover shrink-0" alt="" />}
                           <span className="font-black text-sm md:text-lg uppercase truncate pr-2">
                             {t1 ? t1.name : "TBD"}
                           </span>
                         </div>
                         <span className={cn("text-xl md:text-3xl font-black italic ml-2 shrink-0", match.score1 === null && "opacity-10")}>
                           {match.score1 !== null ? match.score1.toString().padStart(2, '0') : '--'}
                         </span>
                      </div>

                      <div className="h-[1px] bg-white/10 my-2"></div>

                      {/* Team 2 */}
                      <div className={cn(
                        "flex items-center justify-between",
                        match.winnerId === t2?.id ? "text-white" : isFinished ? "opacity-30" : "text-white",
                        !t2 && "opacity-30"
                      )}>
                         <div className="flex items-center gap-2 overflow-hidden flex-1">
                           {t2 && <img src={t2.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${t2.name}`} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white object-cover shrink-0" alt="" />}
                           <span className="font-black text-sm md:text-lg uppercase truncate pr-2">
                             {t2 ? t2.name : "TBD"}
                           </span>
                         </div>
                         <span className={cn("text-xl md:text-3xl font-black italic ml-2 shrink-0", match.score2 === null && "opacity-10")}>
                           {match.score2 !== null ? match.score2.toString().padStart(2, '0') : '--'}
                         </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Champion Slot */}
          {tournamentFinished && finalMatch?.winnerId && (
            <div className="flex flex-col items-center justify-center ml-4 md:ml-8 min-w-[280px] md:min-w-[320px]">
              <Trophy className="w-16 h-16 md:w-24 md:h-24 text-[#FF3B30] mb-4 md:mb-6" />
              <div className="text-center relative">
                <h2 className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">CHAMPION</h2>
                <div className="bg-[#FF3B30] text-white border-[1.5px] border-black px-6 py-4 md:px-10 md:py-6 rounded-[30px] md:rounded-[40px] flex gap-4 items-center flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <img src={getTeam(finalMatch.winnerId)?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${getTeam(finalMatch.winnerId)?.name}`} className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white object-cover border-4 border-white" alt="" />
                  <p className="text-2xl md:text-4xl font-black uppercase break-words w-full text-center">{getTeam(finalMatch.winnerId)?.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Match Modal */}
      {selectedMatch && getTeam(selectedMatch.team1Id) && getTeam(selectedMatch.team2Id) && (
        <MatchModal 
          match={selectedMatch} 
          team1={getTeam(selectedMatch.team1Id)!} 
          team2={getTeam(selectedMatch.team2Id)!}
          onClose={() => setSelectedMatch(null)}
          onSave={(winnerId, s1, s2) => {
            updateMatchResult(selectedMatch.id, winnerId, s1, s2);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
}

function MatchModal({ match, team1, team2, onClose, onSave }: { match: Match, team1: Team, team2: Team, onClose: () => void, onSave: (w: string, s1: number, s2: number) => void }) {
  const [score1, setScore1] = useState<number | ''>(match.score1 ?? '');
  const [score2, setScore2] = useState<number | ''>(match.score2 ?? '');
  const [explicitWinner, setExplicitWinner] = useState<string | null>(match.winnerId);

  const handleSave = () => {
    const s1 = score1 === '' ? 0 : Number(score1);
    const s2 = score2 === '' ? 0 : Number(score2);
    
    let winner = explicitWinner;
    
    // Auto-select winner if clear
    if (!winner) {
      if (s1 > s2) winner = team1.id;
      else if (s2 > s1) winner = team2.id;
      else {
        alert("Please select a winner manually (e.g., in case of overtime/rebuttal).");
        return;
      }
    }

    onSave(winner, s1, s2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white text-black border-[1.5px] border-black rounded-[40px] p-6 md:p-8 max-w-lg w-full relative flex flex-col">
        <button onClick={onClose} className="absolute right-4 top-4 md:right-6 md:top-6 p-2 bg-gray-100 rounded-full border border-black/10 hover:border-black hover:bg-[#FF3B30] hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h3 className="text-[28px] md:text-[40px] font-black leading-none uppercase mb-2">Match Result</h3>
        <p className="text-[9px] md:text-[11px] font-bold opacity-60 uppercase tracking-widest mb-6 md:mb-8">Cups remaining & Winner</p>
        
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Team 1 input */}
          <div 
             className={cn("flex flex-col gap-3 md:gap-4 items-center p-3 md:p-4 border-[1.5px] rounded-[20px] md:rounded-[30px] cursor-pointer transition-all", explicitWinner === team1.id ? "border-[#FF3B30] bg-red-50 text-black scale-105" : "border-black/20 hover:border-black")}
             onClick={() => setExplicitWinner(team1.id)}
          >
             <div className="flex flex-col items-center gap-2 mb-2">
               <img src={team1.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${team1.name}`} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 object-cover border-2 border-black/10" alt="" />
               <div className="font-black text-sm md:text-lg uppercase text-center break-words w-full min-h-[2.5rem] md:min-h-[3rem] flex justify-center items-center">
                 {team1.name}
               </div>
             </div>
             <input 
               type="number" 
               min="0"
               max="10"
               value={score1}
               onChange={(e) => {
                 setScore1(e.target.valueAsNumber || '');
                 if (e.target.valueAsNumber > Number(score2 || 0)) setExplicitWinner(team1.id);
               }}
               onClick={(e) => e.stopPropagation()}
               className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-black italic border-[1.5px] border-black/20 rounded-[16px] md:rounded-[20px] focus:outline-none focus:border-[#FF3B30] bg-white transition-colors"
               placeholder="0"
             />
             <div className="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Cups</div>
          </div>

          {/* Team 2 input */}
          <div 
             className={cn("flex flex-col gap-3 md:gap-4 items-center p-3 md:p-4 border-[1.5px] rounded-[20px] md:rounded-[30px] cursor-pointer transition-all", explicitWinner === team2.id ? "border-[#FF3B30] bg-red-50 text-black scale-105" : "border-black/20 hover:border-black")}
             onClick={() => setExplicitWinner(team2.id)}
          >
             <div className="flex flex-col items-center gap-2 mb-2">
               <img src={team2.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${team2.name}`} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 object-cover border-2 border-black/10" alt="" />
               <div className="font-black text-sm md:text-lg uppercase text-center break-words w-full min-h-[2.5rem] md:min-h-[3rem] flex justify-center items-center">
                 {team2.name}
               </div>
             </div>
             <input 
               type="number" 
               min="0"
               max="10"
               value={score2}
               onChange={(e) => {
                 setScore2(e.target.valueAsNumber || '');
                 if (e.target.valueAsNumber > Number(score1 || 0)) setExplicitWinner(team2.id);
               }}
               onClick={(e) => e.stopPropagation()}
               className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-black italic border-[1.5px] border-black/20 rounded-[16px] md:rounded-[20px] focus:outline-none focus:border-[#FF3B30] bg-white transition-colors"
               placeholder="0"
             />
             <div className="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Cups</div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-[#FF3B30] text-white h-14 md:h-16 rounded-[30px] md:rounded-[40px] text-sm md:text-lg font-black uppercase tracking-widest transition-all duration-100 hover:bg-[#E0332B] hover:-translate-y-[2px]"
        >
          Save Result
        </button>
      </div>
    </div>
  )
}
