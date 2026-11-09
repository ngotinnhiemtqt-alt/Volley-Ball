import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  Tv,
  Printer,
  Download,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  FastForward,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, Team, GroupConfig, GroupDrawResult } from '../../types/tournament';
import { DrawEngine } from '../../services/drawEngine';
import { soundEngine } from '../../services/soundEngine';
import { ExportService } from '../../services/exportService';

interface GroupDrawViewProps {
  tournament: Tournament;
  teams: Team[];
  groupDraw: GroupDrawResult | null;
  onSaveGroupDraw: (result: GroupDrawResult) => void;
  onOpenLed: () => void;
  onNavigateToSchedule: () => void;
}

export const GroupDrawView: React.FC<GroupDrawViewProps> = ({
  tournament,
  teams,
  groupDraw,
  onSaveGroupDraw,
  onOpenLed,
  onNavigateToSchedule,
}) => {
  // Config state
  const [groupCount, setGroupCount] = useState<number>(tournament.numberOfGroups || 2);
  const [drawMode, setDrawMode] = useState<'random' | 'seeded' | 'avoid_same_unit'>('seeded');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Animation / execution state
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeRevealedTeam, setActiveRevealedTeam] = useState<Team | null>(null);
  const [targetGroupRevealed, setTargetGroupRevealed] = useState<string | null>(null);
  const [rollingName, setRollingName] = useState<string>('---');
  const [showRedrawConfirm, setShowRedrawConfirm] = useState(false);

  // Current in-progress groups
  const [inProgressGroups, setInProgressGroups] = useState<{ name: string; teams: Team[] }[]>([]);
  const [remainingTeams, setRemainingTeams] = useState<Team[]>([]);
  const [plannedFullResult, setPlannedFullResult] = useState<GroupDrawResult | null>(null);

  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or load existing draw
  useEffect(() => {
    if (groupDraw) {
      setInProgressGroups(groupDraw.groups);
      setRemainingTeams(groupDraw.unassignedTeams || []);
      setGroupCount(groupDraw.groups.length);
    } else {
      resetDrawBoard(groupCount, drawMode);
    }
  }, [groupDraw, tournament.id]);

  const resetDrawBoard = (numGroups: number, mode: 'random' | 'seeded' | 'avoid_same_unit') => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const initialGroups = Array.from({ length: numGroups }, (_, i) => ({
      name: letters[i] || `G${i + 1}`,
      teams: [] as Team[],
    }));
    setInProgressGroups(initialGroups);
    setRemainingTeams([...teams]);
    setActiveRevealedTeam(null);
    setTargetGroupRevealed(null);
    setRollingName('---');
  };

  // Speed timings in ms
  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return { roll: 2500, reveal: 1500 };
      case 'fast':
        return { roll: 600, reveal: 400 };
      case 'normal':
      default:
        return { roll: 1400, reveal: 800 };
    }
  };

  // Keyboard shortcut listener for Space (Draw next) and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isDrawing && remainingTeams.length > 0 && (!groupDraw || !groupDraw.isLocked)) {
          handleDrawNextStep();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, remainingTeams, groupDraw]);

  // Pre-calculate full draw if not calculated
  const getOrComputeFullDraw = (): GroupDrawResult => {
    if (plannedFullResult && plannedFullResult.groups.length === groupCount) {
      return plannedFullResult;
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const groupNames = Array.from({ length: groupCount }, (_, i) => letters[i] || `G${i + 1}`);

    const config: GroupConfig = {
      groupCount,
      groupNames,
      balanced: true,
      mode: drawMode,
    };

    const result = DrawEngine.drawGroups(tournament.id, teams, config);
    setPlannedFullResult(result);
    return result;
  };

  // Step-by-step draw
  const handleDrawNextStep = () => {
    if (isDrawing || remainingTeams.length === 0) return;

    if (groupDraw?.isLocked) {
      alert('Kết quả bốc thăm đã bị KHÓA. Hãy mở khóa trước khi bốc thăm lại.');
      return;
    }

    const fullResult = getOrComputeFullDraw();
    setIsDrawing(true);
    soundEngine.playTick();

    const { roll, reveal } = getDuration();

    // Start rolling animation
    const rollStart = Date.now();
    rollIntervalRef.current = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * teams.length);
      setRollingName(teams[randomIdx].name);
      soundEngine.playTick();
    }, 70);

    // Determine which team from remainingTeams should enter next
    // We look at the sequence in fullResult
    // Flatten fullResult in order
    const orderedSequence: { team: Team; groupName: string }[] = [];
    const maxTeamsInAnyGroup = Math.max(...fullResult.groups.map((g) => g.teams.length));

    for (let round = 0; round < maxTeamsInAnyGroup; round++) {
      for (const group of fullResult.groups) {
        if (group.teams[round]) {
          orderedSequence.push({ team: group.teams[round], groupName: group.name });
        }
      }
    }

    // Count how many teams have already been placed in inProgressGroups
    const placedCount = inProgressGroups.reduce((acc, g) => acc + g.teams.length, 0);
    const nextAssignment = orderedSequence[placedCount] || {
      team: remainingTeams[0],
      groupName: inProgressGroups[placedCount % inProgressGroups.length].name,
    };

    setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      setRollingName(nextAssignment.team.name);
      setActiveRevealedTeam(nextAssignment.team);
      setTargetGroupRevealed(nextAssignment.groupName);
      soundEngine.playReveal();

      // Confetti burst for each revealed team
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#168BFF', '#FF8C32', '#10B981'],
        });
      } catch {
        // Ignore
      }

      // Add to group
      setTimeout(() => {
        setInProgressGroups((prev) =>
          prev.map((g) =>
            g.name === nextAssignment.groupName
              ? { ...g, teams: [...g.teams, nextAssignment.team] }
              : g
          )
        );

        const newRemaining = remainingTeams.filter((t) => t.id !== nextAssignment.team.id);
        setRemainingTeams(newRemaining);
        setIsDrawing(false);

        // Check if finished
        if (newRemaining.length === 0) {
          soundEngine.playFanfare();
          try {
            confetti({
              particleCount: 100,
              spread: 100,
              origin: { y: 0.4 },
            });
          } catch {
            // Ignore
          }
          // Save result
          const finalResult: GroupDrawResult = {
            tournamentId: tournament.id,
            drawId: 'GRP_' + Date.now(),
            timestamp: Date.now(),
            isLocked: true,
            groups: inProgressGroups.map((g) =>
              g.name === nextAssignment.groupName
                ? { ...g, teams: [...g.teams, nextAssignment.team] }
                : g
            ),
            unassignedTeams: [],
            logs: fullResult.logs,
          };
          onSaveGroupDraw(finalResult);
        }
      }, reveal);
    }, roll);
  };

  // Auto-draw all teams with smooth sequence
  const handleAutoDrawAll = async () => {
    if (isDrawing) return;

    if (groupDraw?.isLocked) {
      alert('Kết quả bốc thăm đã bị KHÓA. Hãy mở khóa trước khi bốc thăm lại.');
      return;
    }

    // Direct computation
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const groupNames = Array.from({ length: groupCount }, (_, i) => letters[i] || `G${i + 1}`);

    const config: GroupConfig = {
      groupCount,
      groupNames,
      balanced: true,
      mode: drawMode,
    };

    setIsDrawing(true);
    soundEngine.playTick();

    // Fast roll simulation
    let count = 0;
    const interval = setInterval(() => {
      setRollingName(teams[Math.floor(Math.random() * teams.length)].name);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const result = DrawEngine.drawGroups(tournament.id, teams, config);
        setInProgressGroups(result.groups);
        setRemainingTeams([]);
        setIsDrawing(false);
        setActiveRevealedTeam(null);
        setTargetGroupRevealed(null);
        setRollingName('ĐÃ HOÀN TẤT!');
        soundEngine.playFanfare();

        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#FF8C32', '#168BFF', '#10B981', '#F59E0B'],
          });
        } catch {
          // Ignore
        }

        const savedResult = { ...result, isLocked: true };
        onSaveGroupDraw(savedResult);
      }
    }, 60);
  };

  const handleConfirmRedraw = () => {
    setShowRedrawConfirm(false);
    setPlannedFullResult(null);
    resetDrawBoard(groupCount, drawMode);
  };

  const handleToggleLock = () => {
    if (!groupDraw) return;
    const updated = { ...groupDraw, isLocked: !groupDraw.isLocked };
    onSaveGroupDraw(updated);
  };

  const isComplete = remainingTeams.length === 0 && teams.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-400" />
            <span>Bốc Thăm Chia Bảng Thi Đấu</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân bổ {teams.length} đội vào {groupCount} bảng với thuật toán Web Crypto và hiển thị chuyển động sân khấu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {groupDraw && (
            <button
              onClick={handleToggleLock}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                groupDraw.isLocked
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900/60'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {groupDraw.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{groupDraw.isLocked ? 'ĐÃ KHÓA KẾT QUẢ' : 'Chưa khóa kết quả'}</span>
            </button>
          )}

          <button
            onClick={onOpenLed}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Tv className="w-3.5 h-3.5 text-amber-300" />
            <span>Trình Chiếu LED 16:9</span>
          </button>

          {isComplete && (
            <button
              onClick={() => ExportService.exportGroupDrawToCsv(tournament, groupDraw || {
                tournamentId: tournament.id,
                drawId: 'TEMP',
                timestamp: Date.now(),
                isLocked: false,
                groups: inProgressGroups,
                unassignedTeams: [],
                logs: [],
              })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          )}

          <button
            onClick={() => setShowRedrawConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Bốc Lại Từ Đầu</span>
          </button>
        </div>
      </div>

      {/* Draw Settings Panel */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Số bảng:</span>
            <select
              disabled={isDrawing || (groupDraw?.isLocked && isComplete)}
              value={groupCount}
              onChange={(e) => {
                const count = Number(e.target.value);
                setGroupCount(count);
                resetDrawBoard(count, drawMode);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value={2}>2 Bảng (Bảng A, B)</option>
              <option value={3}>3 Bảng (Bảng A, B, C)</option>
              <option value={4}>4 Bảng (A, B, C, D)</option>
              <option value={6}>6 Bảng (A - F)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Chế độ phân bổ:</span>
            <select
              disabled={isDrawing || (groupDraw?.isLocked && isComplete)}
              value={drawMode}
              onChange={(e) => {
                const m = e.target.value as 'random' | 'seeded' | 'avoid_same_unit';
                setDrawMode(m);
                setPlannedFullResult(null);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="seeded">Phân bổ hạt giống đều các bảng (Khuyên dùng)</option>
              <option value="avoid_same_unit">Tránh cùng đơn vị / cơ quan vào chung bảng</option>
              <option value="random">Hoàn toàn ngẫu nhiên (Fisher-Yates thuần)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Tốc độ quay:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as 'slow' | 'normal' | 'fast')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none"
            >
              <option value="slow">Chậm (Hồi hộp: 2.5s)</option>
              <option value="normal">Bình thường (1.4s)</option>
              <option value="fast">Nhanh (0.6s)</option>
            </select>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Web Crypto CSP Verified</span>
        </div>
      </div>

      {/* 3-Column Core Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Waiting Urn (Danh sách chờ bốc) */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-900/50 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Thùng Phiếu Chờ Bốc
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold">
              {remainingTeams.length} / {teams.length}
            </span>
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {remainingTeams.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="font-semibold">Đã bốc hết tất cả các đội!</p>
              </div>
            ) : (
              remainingTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-200 truncate">{team.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{team.unit || 'Tự do'}</div>
                  </div>
                  {team.seedGroup && team.seedGroup > 0 ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 shrink-0">
                      H{team.seedGroup}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Column: Digital Lottery Drum / Theatrical Stage */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#0F2238] via-[#091525] to-[#060D18] border border-blue-900/60 p-6 flex flex-col items-center justify-between min-h-[460px] shadow-2xl relative overflow-hidden">
          {/* Ambient background glow rings */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header indicator */}
          <div className="text-center space-y-1 relative z-10">
            <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400 font-semibold bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-800/50">
              {isDrawing ? 'ĐANG QUAY SỐ...' : isComplete ? 'BỐC THĂM HOÀN TẤT' : 'SẴN SÀNG BỐC THĂM'}
            </span>
          </div>

          {/* Central Animated Sphere / Lottery Drum */}
          <div className="my-auto py-6 flex flex-col items-center justify-center relative z-10 w-full text-center">
            <div className="relative w-44 h-44 rounded-full flex items-center justify-center p-2 mb-4">
              {/* Outer glowing rings */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-dashed border-blue-400/30 ${
                  isDrawing ? 'animate-spin-slow' : ''
                }`}
              />
              <div
                className={`absolute inset-2 rounded-full border border-amber-400/40 ${
                  isDrawing ? 'animate-glow' : ''
                }`}
              />

              {/* Sphere core */}
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-950 via-[#102A43] to-blue-900/80 flex flex-col items-center justify-center p-3 shadow-inner border border-blue-500/30">
                <Sparkles
                  className={`w-8 h-8 mb-1 transition-transform ${
                    isDrawing ? 'text-amber-400 scale-125 animate-bounce' : 'text-blue-400'
                  }`}
                />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {targetGroupRevealed ? `VÀO BẢNG ${targetGroupRevealed}` : 'QUAY SỐ'}
                </span>
              </div>
            </div>

            {/* Revealed Team Title */}
            <div className="w-full px-2 min-h-[70px] flex flex-col items-center justify-center">
              <div className="text-lg font-display font-extrabold text-white tracking-tight text-center leading-snug drop-shadow-md">
                {isDrawing ? rollingName : activeRevealedTeam ? activeRevealedTeam.name : 'Nhấn nút để bốc thăm'}
              </div>
              {activeRevealedTeam && !isDrawing && (
                <div className="text-xs text-amber-300 font-medium mt-1">
                  {activeRevealedTeam.unit ? `Đơn vị: ${activeRevealedTeam.unit}` : ''}
                  {targetGroupRevealed && ` → Phân bổ vào BẢNG ${targetGroupRevealed}`}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full space-y-2 relative z-10 pt-2">
            {!isComplete ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={isDrawing || remainingTeams.length === 0}
                  onClick={handleDrawNextStep}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>BỐC TỪNG ĐỘI [Space]</span>
                </button>

                <button
                  disabled={isDrawing || remainingTeams.length === 0}
                  onClick={handleAutoDrawAll}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-xs font-bold shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <FastForward className="w-3.5 h-3.5 fill-current" />
                  <span>TỰ ĐỘNG BỐC TẤT CẢ</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={onNavigateToSchedule}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>HOÀN TẤT · TIẾN HÀNH XẾP LỊCH ĐẤU</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Groups Grid (Các bảng đấu đang hình thành) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inProgressGroups.map((group) => {
              const isTarget = targetGroupRevealed === group.name && isDrawing;

              return (
                <div
                  key={group.name}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${
                    isTarget
                      ? 'bg-blue-950/50 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Group header */}
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-display font-extrabold text-sm flex items-center justify-center shadow-sm">
                        {group.name}
                      </span>
                      <span className="font-display font-bold text-sm text-slate-100">
                        BẢNG {group.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {group.teams.length} đội
                    </span>
                  </div>

                  {/* Team slots */}
                  <div className="space-y-2 min-h-[160px]">
                    {group.teams.length === 0 ? (
                      <div className="h-32 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-[11px] text-slate-600">
                        Chờ bốc thăm phân bổ...
                      </div>
                    ) : (
                      group.teams.map((team, idx) => (
                        <div
                          key={team.id}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs animate-in fade-in slide-in-from-right duration-300"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="w-5 h-5 rounded-md bg-slate-900 text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-semibold text-slate-200 block truncate">
                                {team.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {team.unit || 'Tự do'}
                              </span>
                            </div>
                          </div>

                          {team.seedGroup && team.seedGroup > 0 ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 shrink-0">
                              H{team.seedGroup}
                            </span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Redraw */}
      {showRedrawConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Xác Nhận Bốc Thăm Lại?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thao tác này sẽ xóa kết quả chia bảng hiện tại để thực hiện bốc thăm lại từ đầu. Theo quy định điều lệ giải thể thao, hãy đảm bảo có sự đồng thuận của Ban tổ chức và đại diện các đội tham dự.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowRedrawConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmRedraw}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
              >
                Đồng Ý Bốc Thăm Lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
