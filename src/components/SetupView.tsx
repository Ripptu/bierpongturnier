import { useState } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { X, Plus, Users, Dice5, Upload, Shuffle, Dices } from 'lucide-react';
import { cn } from '../lib/utils';

export function SetupView() {
  const { mode, setMode, teams, addTeam, removeTeam, startTournament } = useTournamentStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  
  const [avatarSeed, setAvatarSeed] = useState(Math.random().toString(36).substring(7));
  const [avatarStyle, setAvatarStyle] = useState('adventurer'); // 'adventurer', 'avataaars', 'bottts'
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [inputMode, setInputMode] = useState<'manual' | 'random'>('manual');
  const [playersInput, setPlayersInput] = useState('');

  const currentAvatarUrl = uploadedImage || `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  const randomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
    setUploadedImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !player1.trim() || !player2.trim()) return;
    addTeam({
      name: newTeamName,
      player1,
      player2,
      avatarUrl: currentAvatarUrl,
    });
    setNewTeamName('');
    setPlayer1('');
    setPlayer2('');
    randomizeAvatar();
  };

  const handleRandomizeTeams = () => {
    const pList = playersInput.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);
    if (pList.length < 2) return alert("Bitte mindestens 2 Spieler eingeben.");
    
    // Shuffle
    const shuffled = [...pList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let teamCounter = teams.length + 1;
    for (let i = 0; i < shuffled.length; i += 2) {
       const p1 = shuffled[i];
       const p2 = shuffled[i+1] || "Freilos";
       const seed = Math.random().toString(36).substring(7);
       
       // Predefined funny names or simple team numbers
       const funnyNames = ["Bierkönige", "Glasreiniger", "Doppeldecker", "Zapfhähne", "Pegeljäger", "Becherschubser", "Hopfenhelden", "Durstlöscher"];
       const randomName = funnyNames[Math.floor(Math.random() * funnyNames.length)] + " " + Math.floor(Math.random() * 99);
       
       addTeam({
         name: randomName,
         player1: p1,
         player2: p2,
         avatarUrl: `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
       });
       teamCounter++;
    }
    setPlayersInput('');
  };

  return (
    <div className="min-h-[100dvh] py-4 px-4 md:px-8 max-w-[1400px] mx-auto flex flex-col">
      <div className="flex flex-col items-start w-full mb-6 shrink-0">
        <h1 className="text-[32px] md:text-[48px] lg:text-[60px] leading-[0.9] font-black tracking-[-0.04em] uppercase flex flex-row items-center gap-4">
          <img src="https://s1.directupload.eu/images/260516/qi6pyzpl.webp" alt="Turnier Logo" className="h-[60px] md:h-[80px] lg:h-[100px] object-contain drop-shadow-md" />
          <span className="flex">BIERPONG<br />TURNIER</span>
        </h1>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-6 flex-1">
        <div className="w-full lg:w-[480px] flex flex-col gap-4 shrink-0">
          <div className="bg-white border-[1.5px] border-black rounded-[30px] p-6 flex-shrink-0">
            <h2 className="text-lg font-black mb-3 uppercase">Tournament Mode</h2>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full border border-black/20 p-3 rounded-[16px] text-sm font-sans font-bold appearance-none bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none mb-1"
            >
              <option value="knockout">K.O. System (Knockout)</option>
              <option value="league">Gruppenphase (Jeder gegen Jeden)</option>
            </select>
          </div>

          <div className="bg-white border-[1.5px] border-black rounded-[30px] p-6 flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-black uppercase">Teams Hinzufügen</h2>
               <div className="flex bg-gray-100 rounded-full border border-black/10 p-1">
                 <button 
                   onClick={() => setInputMode('manual')}
                   className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors", inputMode === 'manual' ? "bg-white border border-black/10 shadow-sm" : "text-gray-400 hover:text-black")}
                 >Manuell</button>
                 <button 
                   onClick={() => setInputMode('random')}
                   className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 transition-colors", inputMode === 'random' ? "bg-white border border-black/10 shadow-sm" : "text-gray-400 hover:text-black")}
                 ><Dices size={12}/> Zufall</button>
               </div>
            </div>

            {inputMode === 'manual' ? (
              <form onSubmit={handleAddTeam} className="space-y-4 flex-1 flex flex-col">
                <div>
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full border border-black/20 bg-gray-50 p-3 rounded-[16px] font-bold placeholder-black/30 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Spieler 1"
                    value={player1}
                    onChange={(e) => setPlayer1(e.target.value)}
                    className="w-full border border-black/20 bg-gray-50 p-3 rounded-[16px] text-sm font-bold placeholder-black/30 focus:outline-none focus:border-black transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Spieler 2"
                    value={player2}
                    onChange={(e) => setPlayer2(e.target.value)}
                    className="w-full border border-black/20 bg-gray-50 p-3 rounded-[16px] text-sm font-bold placeholder-black/30 focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-3 mt-2 pb-4">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-black/60 font-bold mb-1">Team Avatar</p>
                  <div className="flex gap-4 items-center flex-row">
                    <div className="w-20 h-20 rounded-[20px] border border-black overflow-hidden bg-gray-50 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-1">
                       <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-[16px]" />
                    </div>
                    <div className="flex flex-col gap-2 flex-1 w-full">
                       <div className="flex gap-2">
                         <button type="button" onClick={randomizeAvatar} className="flex-1 bg-black text-white rounded-full py-2 px-2 text-[10px] font-bold uppercase hover:bg-black/80 flex justify-center items-center gap-1.5 transition-transform hover:-translate-y-0.5">
                           <Dice5 size={12} /> Mix
                         </button>
                         <label className="flex-1 bg-transparent border border-black text-black rounded-full py-2 px-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white flex justify-center items-center gap-1.5 cursor-pointer transition-all hover:-translate-y-0.5">
                           <Upload size={12} /> Foto
                           <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                         </label>
                       </div>
                       <div className="flex gap-1.5">
                          {['adventurer', 'avataaars', 'bottts'].map(style => (
                             <button type="button" key={style} onClick={() => { setAvatarStyle(style); setUploadedImage(null); }} className={cn("flex-1 text-[9px] font-bold uppercase rounded-full py-1 border border-black/20 transition-all", avatarStyle === style && !uploadedImage ? "bg-[#FF3B30] text-white border-[#FF3B30]" : "hover:bg-gray-100")}>
                                {style.substring(0, 4)}
                             </button>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    type="submit"
                    className="w-full bg-[#FF3B30] text-white rounded-[24px] h-14 text-sm font-black uppercase tracking-widest transition-all duration-100 ease-in hover:bg-[#E0332B] hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    Hinzufügen
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col">
                <p className="text-[10px] uppercase font-bold text-black/60 mb-2">Alle Spieler eingeben (Komma oder neue Zeile):</p>
                <textarea 
                  className="w-full flex-1 border border-black/20 bg-gray-50 rounded-[16px] p-4 text-sm font-bold placeholder-black/30 mb-4 focus:outline-none focus:border-black resize-none min-h-[140px]"
                  placeholder="z.B. Alex, Maria, Kevin, Sarah"
                  value={playersInput}
                  onChange={e => setPlayersInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRandomizeTeams}
                  className="w-full bg-black text-white rounded-[24px] h-14 text-sm font-black uppercase tracking-widest transition-all duration-100 ease-in hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Teams Generieren
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[500px] lg:h-auto bg-black text-white rounded-[40px] p-6 md:p-10 relative">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter">TEAMS</h2>
            <span className="bg-white text-black px-3 py-1 rounded-full text-[10px] font-bold">
              {teams.length}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3 pb-24">
            {teams.length === 0 ? (
              <div className="h-40 border-[1.5px] border-dashed border-white/20 rounded-[30px] flex flex-col items-center justify-center text-white/40 group bg-white/5">
                <Users className="w-6 h-6 mb-2 opacity-50" />
                <p className="font-semibold uppercase tracking-widest text-[10px]">No teams registered</p>
              </div>
            ) : (
              teams.map((team) => {
                return (
                  <div key={team.id} className="border border-white/10 rounded-[100px] py-1.5 px-4 flex items-center gap-4 hover:bg-white/10 cursor-pointer bg-white/5 text-white transition-colors">
                    <div className="w-10 h-10 bg-white flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-white/20">
                      <img src={team.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${team.name}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-sm font-black uppercase tracking-tight truncate">{team.name}</span>
                      <span className="text-[10px] opacity-50 truncate">{team.player1} & {team.player2}</span>
                    </div>
                    <button
                      onClick={() => removeTeam(team.id)}
                      className="text-white/30 hover:text-[#FF3B30] p-2 rounded-full transition-colors flex items-center justify-center shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="text-[12px] text-[#FF3B30] shrink-0">✦</span>
                  </div>
                )
              })
            )}
          </div>

          {teams.length >= 2 && (
            <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 pt-4 bg-gradient-to-t from-black via-black to-transparent">
              <button
                onClick={startTournament}
                className="w-full bg-[#FF3B30] text-white rounded-[30px] h-14 md:h-16 text-sm md:text-lg font-black uppercase tracking-widest transition-all duration-100 ease-in hover:bg-[#E0332B] hover:-translate-y-0.5 shadow-lg"
              >
                ✦ START TOURNAMENT ✦
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
