import React, { useState } from 'react';
import {
  MapPin,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, Team } from '../../types/tournament';
import { DrawEngine } from '../../services/drawEngine';
import { soundEngine } from '../../services/soundEngine';

interface PositionDrawViewProps {
  tournament: Tournament;
  teams: Team[];
  onOpenLed: () => void;
}

interface AssignedPosition {
  team: Team;
  positionNumber: number;
  bracketSide: 'Nhánh Trái (Left)' | 'Nhánh Phải (Right)';
  designatedCourt: string;
}

export const PositionDrawView: React.FC<PositionDrawViewProps> = ({
  tournament,
  teams,
  onOpenLed,
}) => {
  const [assigned, setAssigned] = useState<AssignedPosition[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDrawPositions = () => {
    if (teams.length === 0) return;
    setIsDrawing(true);
    soundEngine.playTick();

    setTimeout(() => {
      const shuffled = DrawEngine.shuffle(teams);
      const results: AssignedPosition[] = shuffled.map((team, index) => {
        const pos = index + 1;
        const side = pos <= Math.ceil(teams.length / 2) ? 'Nhánh Trái (Left)' : 'Nhánh Phải (Right)';
        const court = `Sân ${((index % 2) + 1)}`;
        return {
          team,
          positionNumber: pos,
          bracketSide: side,
          designatedCourt: court,
        };
      });

      // Sort by position number
      results.sort((a, b) => a.positionNumber - b.positionNumber);
      setAssigned(results);
      setIsDrawing(false);
      soundEngine.playFanfare();

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch {
        // Ignore
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Bốc Thăm Vị Trí Nhánh Đấu & Sân Thi Đấu</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Xác định vị trí trên sơ đồ loại trực tiếp (Nhánh Trái / Nhánh Phải) hoặc phân chia sân thi đấu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLed}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Tv className="w-3.5 h-3.5 text-amber-300" />
            <span>Trình Chiếu LED</span>
          </button>

          <button
            disabled={isDrawing}
            onClick={handleDrawPositions}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Bốc Thăm Vị Trí</span>
          </button>
        </div>
      </div>

      {/* Arena view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase text-blue-400 font-mono">
              NHÁNH TRÁI (LEFT BRACKET)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Vị trí 1 đến {Math.ceil(teams.length / 2)}</span>
          </div>

          <div className="space-y-2">
            {assigned.filter((a) => a.bracketSide.includes('Trái')).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                Chưa có dữ liệu bốc thăm vị trí
              </div>
            ) : (
              assigned
                .filter((a) => a.bracketSide.includes('Trái'))
                .map((item) => (
                  <div
                    key={item.team.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-blue-950 text-blue-400 font-mono font-bold flex items-center justify-center shrink-0">
                        {item.positionNumber}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">{item.team.name}</div>
                        <div className="text-[11px] text-slate-500">{item.team.unit || 'Tự do'}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      {item.designatedCourt}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase text-amber-400 font-mono">
              NHÁNH PHẢI (RIGHT BRACKET)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Vị trí {Math.ceil(teams.length / 2) + 1} đến {teams.length}</span>
          </div>

          <div className="space-y-2">
            {assigned.filter((a) => a.bracketSide.includes('Phải')).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                Chưa có dữ liệu bốc thăm vị trí
              </div>
            ) : (
              assigned
                .filter((a) => a.bracketSide.includes('Phải'))
                .map((item) => (
                  <div
                    key={item.team.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-amber-950 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0">
                        {item.positionNumber}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">{item.team.name}</div>
                        <div className="text-[11px] text-slate-500">{item.team.unit || 'Tự do'}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      {item.designatedCourt}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
