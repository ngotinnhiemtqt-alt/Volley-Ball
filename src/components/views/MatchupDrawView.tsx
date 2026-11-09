import React, { useState, useEffect } from 'react';
import {
  Swords,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  Download,
  ShieldCheck,
  CheckCircle2,
  Tv,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, Team, MatchupDrawResult, Matchup } from '../../types/tournament';
import { DrawEngine } from '../../services/drawEngine';
import { soundEngine } from '../../services/soundEngine';
import { ExportService } from '../../services/exportService';

interface MatchupDrawViewProps {
  tournament: Tournament;
  teams: Team[];
  matchupDraw: MatchupDrawResult | null;
  onSaveMatchupDraw: (result: MatchupDrawResult) => void;
  onOpenLed: () => void;
}

export const MatchupDrawView: React.FC<MatchupDrawViewProps> = ({
  tournament,
  teams,
  matchupDraw,
  onSaveMatchupDraw,
  onOpenLed,
}) => {
  const [avoidSameUnit, setAvoidSameUnit] = useState(true);
  const [seededBye, setSeededBye] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealedMatchup, setRevealedMatchup] = useState<Matchup | null>(null);
  const [matchupsList, setMatchupsList] = useState<Matchup[]>([]);
  const [byeTeamsList, setByeTeamsList] = useState<Team[]>([]);

  useEffect(() => {
    if (matchupDraw) {
      setMatchupsList(matchupDraw.matchups);
      setByeTeamsList(matchupDraw.byeTeams || []);
    }
  }, [matchupDraw]);

  const handleDrawAll = () => {
    if (teams.length < 2) {
      alert('Cần ít nhất 2 đội để bốc thăm đối đầu.');
      return;
    }

    setIsDrawing(true);
    soundEngine.playTick();

    // Theatrical delay
    setTimeout(() => {
      const result = DrawEngine.drawMatchups(tournament.id, teams, {
        avoidSameUnit,
        seededBye,
      });

      setMatchupsList(result.matchups);
      setByeTeamsList(result.byeTeams);
      setIsDrawing(false);
      setRevealedMatchup(result.matchups[0] || null);

      soundEngine.playVersusImpact();
      setTimeout(() => soundEngine.playFanfare(), 300);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch {
        // Ignore
      }

      onSaveMatchupDraw({ ...result, isLocked: true });
    }, 1200);
  };

  const handleDrawSinglePair = () => {
    if (matchupsList.length === 0) {
      handleDrawAll();
      return;
    }
    // Highlight next matchup
    const nextIdx = revealedMatchup
      ? matchupsList.findIndex((m) => m.id === revealedMatchup.id) + 1
      : 0;

    if (nextIdx < matchupsList.length) {
      soundEngine.playVersusImpact();
      setRevealedMatchup(matchupsList[nextIdx]);
    } else {
      setRevealedMatchup(matchupsList[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-400" />
            <span>Bốc Thăm Cặp Thi Đấu Đối Đầu (VS)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghép cặp thi đấu ngẫu nhiên công khai, tự động xử lý suất miễn thi đấu (BYE) khi số đội lẻ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenLed}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Tv className="w-3.5 h-3.5 text-amber-300" />
            <span>Trình Chiếu LED 16:9</span>
          </button>

          {matchupsList.length > 0 && (
            <button
              onClick={() => ExportService.exportMatchupsToCsv(tournament, matchupDraw || {
                tournamentId: tournament.id,
                drawId: 'TEMP',
                timestamp: Date.now(),
                isLocked: false,
                matchups: matchupsList,
                hasBye: byeTeamsList.length > 0,
                byeTeams: byeTeamsList,
                logs: [],
              })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          )}

          <button
            disabled={isDrawing}
            onClick={handleDrawAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{matchupsList.length > 0 ? 'Bốc Thăm Lại' : 'Bắt Đầu Bốc Cặp Đấu'}</span>
          </button>
        </div>
      </div>

      {/* Settings Strip */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={avoidSameUnit}
              onChange={(e) => setAvoidSameUnit(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="font-medium">Tránh gặp đội cùng đơn vị / cơ quan</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={seededBye}
              onChange={(e) => setSeededBye(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="font-medium">Ưu tiên suất BYE cho hạt giống cao nhất (khi số đội lẻ)</span>
          </label>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Tổng số đội: <span className="text-white font-bold">{teams.length}</span> (
          {teams.length % 2 === 0 ? 'Số chẵn, không có BYE' : 'Số lẻ, có 1 suất BYE'}
          )
        </div>
      </div>

      {/* Dramatic VS Arena Spotlight Card */}
      {revealedMatchup && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E1D33] via-[#102A43] to-[#0E1D33] border border-blue-900/70 p-6 md:p-10 shadow-2xl">
          <div className="text-center pb-4">
            <span className="text-xs font-mono tracking-widest text-amber-400 font-bold uppercase bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/60">
              TRẬN ĐẤU SỐ {revealedMatchup.matchNumber} · {revealedMatchup.court || 'Sân 1'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-6 my-4">
            {/* Team A */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-slate-950/80 border border-blue-500/30 text-center space-y-2 shadow-xl animate-in slide-in-from-left duration-500">
              <span className="text-[10px] font-mono uppercase text-blue-400 font-bold tracking-wider">
                ĐỘI CHỦ NHÀ / NHÁNH 1
              </span>
              <div className="text-xl md:text-2xl font-display font-black text-white">
                {revealedMatchup.teamA?.name}
              </div>
              <div className="text-xs text-slate-400">
                {revealedMatchup.teamA?.unit || 'Tự do'}
                {revealedMatchup.teamA?.seedGroup ? ` · Hạt giống ${revealedMatchup.teamA.seedGroup}` : ''}
              </div>
            </div>

            {/* VS Badge */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-600 text-white font-black font-display text-lg flex items-center justify-center shadow-lg shadow-rose-600/40 border-2 border-white/20">
                VS
              </div>
            </div>

            {/* Team B */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-slate-950/80 border border-rose-500/30 text-center space-y-2 shadow-xl animate-in slide-in-from-right duration-500">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider">
                {revealedMatchup.isBye ? 'SUẤT MIỄN THI ĐẤU' : 'ĐỘI KHÁCH / NHÁNH 2'}
              </span>
              <div className="text-xl md:text-2xl font-display font-black text-white">
                {revealedMatchup.teamB ? (
                  revealedMatchup.teamB.name
                ) : (
                  <span className="text-amber-400">MIỄN THI ĐẤU (BYE)</span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {revealedMatchup.teamB ? (
                  <>
                    {revealedMatchup.teamB.unit || 'Tự do'}
                    {revealedMatchup.teamB.seedGroup ? ` · Hạt giống ${revealedMatchup.teamB.seedGroup}` : ''}
                  </>
                ) : (
                  'Tự động vào vòng sau'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matchups Grid Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Danh sách tất cả các cặp đối đầu ({matchupsList.length} trận)
          </h3>
          {matchupsList.length > 1 && (
            <button
              onClick={handleDrawSinglePair}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Xem lần lượt từng cặp
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchupsList.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
              Chưa có kết quả bốc thăm đối đầu. Hãy nhấn "Bắt Đầu Bốc Cặp Đấu" ở trên.
            </div>
          ) : (
            matchupsList.map((m) => (
              <div
                key={m.id}
                onClick={() => setRevealedMatchup(m)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  revealedMatchup?.id === m.id
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
                  <span className="font-bold text-amber-400">TRẬN 0{m.matchNumber}</span>
                  <span className="text-slate-400">{m.court || 'Sân 1'}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{m.teamA?.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.teamA?.unit || 'Tự do'}</div>
                  </div>

                  <span className="font-display font-extrabold text-xs px-2 py-1 rounded bg-slate-800 text-amber-400 shrink-0">
                    VS
                  </span>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-semibold text-slate-200 truncate">
                      {m.teamB ? m.teamB.name : <span className="text-amber-400">BYE</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {m.teamB ? m.teamB.unit || 'Tự do' : 'Miễn đấu'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
