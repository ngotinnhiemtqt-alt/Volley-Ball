import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Trophy,
  Grid,
  Swords,
  Hash,
  Play,
  RotateCcw,
  Sparkles,
  GitFork,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Tournament,
  Team,
  GroupDrawResult,
  MatchupDrawResult,
  OrderDrawResult,
  BracketData,
} from '../../types/tournament';
import { soundEngine } from '../../services/soundEngine';

interface LedPresentationModalProps {
  tournament: Tournament;
  teams: Team[];
  groupDraw: GroupDrawResult | null;
  matchupDraw: MatchupDrawResult | null;
  orderDraw: OrderDrawResult | null;
  bracketData: BracketData | null;
  onClose: () => void;
  onStepGroupDraw?: () => void;
}

export const LedPresentationModal: React.FC<LedPresentationModalProps> = ({
  tournament,
  teams,
  groupDraw,
  matchupDraw,
  orderDraw,
  bracketData,
  onClose,
}) => {
  const [activeScreen, setActiveScreen] = useState<'groups' | 'matchup' | 'order' | 'bracket'>('groups');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [spotlightMatchIndex, setSpotlightMatchIndex] = useState(0);

  // Keyboard navigation inside LED mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === '1') {
        setActiveScreen('groups');
      } else if (e.key === '2') {
        setActiveScreen('matchup');
      } else if (e.key === '3') {
        setActiveScreen('order');
      } else if (e.key === '4') {
        setActiveScreen('bracket');
      } else if (e.key === 'ArrowRight' && activeScreen === 'matchup') {
        setSpotlightMatchIndex((prev) => (matchupDraw ? (prev + 1) % matchupDraw.matchups.length : 0));
        soundEngine.playVersusImpact();
      } else if (e.key === 'ArrowLeft' && activeScreen === 'matchup') {
        setSpotlightMatchIndex((prev) =>
          matchupDraw ? (prev - 1 + matchupDraw.matchups.length) % matchupDraw.matchups.length : 0
        );
        soundEngine.playVersusImpact();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreen, matchupDraw, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    soundEngine.setMuted(next);
    setIsMuted(next);
  };

  const currentMatch = matchupDraw?.matchups[spotlightMatchIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#060E18] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Subtle theatrical stage lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top LED Stage Banner */}
      <div className="relative z-20 px-8 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#071322]/90 backdrop-blur-md">
        {/* Left: Tournament Badge */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#071322] rounded-[10px] flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl md:text-2xl tracking-wider uppercase text-white">
                BỐC THĂM THI ĐẤU <span className="text-amber-400">PRO 2027</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 border border-blue-700 text-blue-300">
                LED 16:9
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-xl">
              {tournament.organizer} · {tournament.location}
            </div>
          </div>
        </div>

        {/* Center: Stage screen switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setActiveScreen('groups')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeScreen === 'groups'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Chia Bảng [1]</span>
          </button>

          <button
            onClick={() => setActiveScreen('matchup')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeScreen === 'matchup'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Đối Đầu VS [2]</span>
          </button>

          <button
            onClick={() => setActiveScreen('order')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeScreen === 'order'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Số Thứ Tự [3]</span>
          </button>

          <button
            onClick={() => setActiveScreen('bracket')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeScreen === 'bracket'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Sơ Đồ [4]</span>
          </button>
        </div>

        {/* Right: Stage Control actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Toàn màn hình [F]"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 transition-colors"
            title="Thoát chế độ trình chiếu [Esc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Presentation Stage Viewport (16:9 proportioned) */}
      <div className="relative z-10 flex-1 p-6 md:p-10 flex flex-col justify-center max-w-[1720px] w-full mx-auto overflow-y-auto">
        {/* Tournament Large Headline */}
        <div className="text-center pb-6">
          <div className="text-xs md:text-sm font-mono tracking-widest uppercase text-amber-400 font-bold mb-1">
            {tournament.sport} · {tournament.location}
          </div>
          <h1 className="text-2xl md:text-4xl font-display font-black text-white tracking-tight uppercase drop-shadow-lg">
            {tournament.name}
          </h1>
        </div>

        {/* Screen 1: Group Draw Presentation */}
        {activeScreen === 'groups' && (
          <div className="my-auto">
            {groupDraw && groupDraw.groups.length > 0 ? (
              <div
                className={`grid gap-6 ${
                  groupDraw.groups.length <= 2
                    ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
                    : groupDraw.groups.length <= 4
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
                }`}
              >
                {groupDraw.groups.map((group) => (
                  <div
                    key={group.name}
                    className="rounded-3xl bg-gradient-to-b from-[#0F2644] to-[#0A1A2E] border-2 border-blue-500/40 p-6 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b-2 border-blue-500/30">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black font-display text-xl flex items-center justify-center shadow-md">
                          {group.name}
                        </span>
                        <span className="font-display font-black text-2xl text-white tracking-wide">
                          BẢNG {group.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800">
                        {group.teams.length} ĐỘI
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {group.teams.map((team, idx) => (
                        <div
                          key={team.id}
                          className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shadow-md"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-900/60 text-blue-300 font-mono font-black text-sm flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-white text-base md:text-lg block truncate">
                                {team.name}
                              </span>
                              <span className="text-xs text-slate-400 block truncate">
                                {team.unit || 'Tự do'}
                              </span>
                            </div>
                          </div>

                          {team.seedGroup && team.seedGroup > 0 ? (
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 shrink-0">
                              H{team.seedGroup}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 text-base">
                Chưa có kết quả chia bảng. Hãy thực hiện bốc thăm trên màn hình điều khiển.
              </div>
            )}
          </div>
        )}

        {/* Screen 2: Versus Matchup Presentation */}
        {activeScreen === 'matchup' && (
          <div className="my-auto max-w-5xl mx-auto w-full space-y-6">
            {currentMatch ? (
              <div className="rounded-3xl bg-gradient-to-r from-[#0C1A2E] via-[#102A43] to-[#0C1A2E] border-2 border-amber-500/50 p-8 md:p-14 shadow-2xl space-y-6 text-center">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-sm font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-950/90 px-4 py-1.5 rounded-full border border-amber-700">
                    TRẬN ĐẤU SỐ {currentMatch.matchNumber} · {currentMatch.court || 'SÂN 1'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-8 py-6">
                  {/* Team A */}
                  <div className="md:col-span-5 p-8 rounded-3xl bg-slate-950/90 border border-blue-500/40 space-y-3 shadow-2xl">
                    <span className="text-xs font-mono font-bold uppercase text-blue-400">
                      NHÁNH 1 (CHỦ NHÀ)
                    </span>
                    <div className="text-2xl md:text-4xl font-display font-black text-white leading-tight">
                      {currentMatch.teamA?.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {currentMatch.teamA?.unit || 'Tự do'}
                      {currentMatch.teamA?.seedGroup ? ` · Hạt giống ${currentMatch.teamA.seedGroup}` : ''}
                    </div>
                  </div>

                  {/* VS Emblem */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-600 text-white font-black font-display text-2xl flex items-center justify-center shadow-2xl shadow-rose-600/50 border-4 border-white/30 animate-pulse">
                      VS
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="md:col-span-5 p-8 rounded-3xl bg-slate-950/90 border border-rose-500/40 space-y-3 shadow-2xl">
                    <span className="text-xs font-mono font-bold uppercase text-rose-400">
                      {currentMatch.isBye ? 'SUẤT MIỄN THI ĐẤU' : 'NHÁNH 2 (ĐỘI KHÁCH)'}
                    </span>
                    <div className="text-2xl md:text-4xl font-display font-black text-white leading-tight">
                      {currentMatch.teamB ? currentMatch.teamB.name : <span className="text-amber-400">MIỄN ĐẤU (BYE)</span>}
                    </div>
                    <div className="text-sm text-slate-400">
                      {currentMatch.teamB ? currentMatch.teamB.unit || 'Tự do' : 'Vào thẳng vòng tiếp theo'}
                    </div>
                  </div>
                </div>

                {/* Matchup Navigation Pager */}
                {matchupDraw && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => {
                        setSpotlightMatchIndex((prev) => (prev - 1 + matchupDraw.matchups.length) % matchupDraw.matchups.length);
                        soundEngine.playVersusImpact();
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                    >
                      ← Trận Trước (Phím Mũi Tên Trái)
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-400 px-3">
                      {spotlightMatchIndex + 1} / {matchupDraw.matchups.length}
                    </span>
                    <button
                      onClick={() => {
                        setSpotlightMatchIndex((prev) => (prev + 1) % matchupDraw.matchups.length);
                        soundEngine.playVersusImpact();
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                    >
                      Trận Kế Tiếp (Phím Mũi Tên Phải) →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 text-base">
                Chưa có dữ liệu cặp đối đầu.
              </div>
            )}
          </div>
        )}

        {/* Screen 3: Order Draw Presentation */}
        {activeScreen === 'order' && (
          <div className="my-auto max-w-5xl mx-auto w-full">
            {orderDraw && orderDraw.items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {orderDraw.items.map((item) => (
                  <div
                    key={item.orderNumber}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4 shadow-xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black font-display text-3xl flex items-center justify-center shadow-lg shrink-0">
                      {item.orderNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base text-white truncate">{item.team.name}</div>
                      <div className="text-xs text-slate-400 truncate">{item.team.unit || 'Tự do'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 text-base">
                Chưa có kết quả số thứ tự thi đấu.
              </div>
            )}
          </div>
        )}

        {/* Screen 4: Knockout Bracket Presentation */}
        {activeScreen === 'bracket' && (
          <div className="my-auto max-w-5xl mx-auto w-full">
            {bracketData && bracketData.rounds.length > 0 ? (
              <div className="flex gap-8 justify-center items-center">
                {bracketData.rounds.map((round) => (
                  <div key={round.roundNumber} className="flex-1 space-y-4">
                    <div className="text-center font-display font-black text-lg text-amber-400 uppercase pb-2 border-b border-slate-800">
                      {round.roundName}
                    </div>
                    <div className="space-y-4">
                      {round.matches.map((m) => (
                        <div key={m.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <div className="flex justify-between text-xs font-mono text-slate-500">
                            <span>{m.roundName}</span>
                            <span>{m.court}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-slate-200 p-2 rounded bg-slate-950">
                            <span className="truncate">{m.teamA?.name || 'TBD'}</span>
                            <span className="font-mono text-amber-400">{m.scoreA ?? '-'}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-slate-200 p-2 rounded bg-slate-950">
                            <span className="truncate">{m.teamB?.name || 'TBD'}</span>
                            <span className="font-mono text-amber-400">{m.scoreB ?? '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 text-base">
                Chưa có dữ liệu sơ đồ thi đấu.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Ticker & Status Bar */}
      <div className="px-8 py-3 bg-[#071322]/95 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-semibold uppercase">TRÌNH CHIẾU SÂN KHẤU TRỰC TIẾP</span>
          <span className="text-slate-600">|</span>
          <span>Web Crypto API Unbiased Randomness</span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400">
          <span>Phím [1-4]: Đổi màn hình</span>
          <span>Phím [F]: Toàn màn hình</span>
          <span>Phím [Esc]: Đóng trình chiếu</span>
        </div>
      </div>
    </div>
  );
};
