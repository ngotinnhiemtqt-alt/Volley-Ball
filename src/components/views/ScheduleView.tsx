import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Play,
  RotateCcw,
  Clock,
  MapPin,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
} from 'lucide-react';
import { Tournament, Team, ScheduleMatch, GroupDrawResult } from '../../types/tournament';
import { DrawEngine } from '../../services/drawEngine';
import { ExportService } from '../../services/exportService';
import { soundEngine } from '../../services/soundEngine';

interface ScheduleViewProps {
  tournament: Tournament;
  teams: Team[];
  groupDraw: GroupDrawResult | null;
  schedule: ScheduleMatch[];
  onSaveSchedule: (schedule: ScheduleMatch[]) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  tournament,
  teams,
  groupDraw,
  schedule,
  onSaveSchedule,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(tournament.startDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [courtsInput, setCourtsInput] = useState<string>('Sân 1, Sân 2');
  const [matchDuration, setMatchDuration] = useState<number>(45);
  const [breakDuration, setBreakDuration] = useState<number>(15);
  const [isDoubleRound, setIsDoubleRound] = useState<boolean>(false);

  // Score editing modal
  const [editingMatch, setEditingMatch] = useState<ScheduleMatch | null>(null);
  const [scoreA, setScoreA] = useState<string>('0');
  const [scoreB, setScoreB] = useState<string>('0');

  const handleGenerateSchedule = () => {
    const courtsList = courtsInput.split(',').map((c) => c.trim()).filter(Boolean);
    const courts = courtsList.length > 0 ? courtsList : ['Sân 1', 'Sân 2'];

    let allMatches: ScheduleMatch[] = [];

    if (groupDraw && groupDraw.groups.length > 0) {
      // Generate per group
      groupDraw.groups.forEach((group) => {
        const groupMatches = DrawEngine.generateRoundRobinSchedule(tournament.id, group.teams, group.name, {
          startDate,
          startTime,
          courts,
          matchDurationMin: matchDuration,
          breakMin: breakDuration,
          isDoubleRound,
        });
        allMatches.push(...groupMatches);
      });
    } else {
      // Single pool
      allMatches = DrawEngine.generateRoundRobinSchedule(tournament.id, teams, 'Chung', {
        startDate,
        startTime,
        courts,
        matchDurationMin: matchDuration,
        breakMin: breakDuration,
        isDoubleRound,
      });
    }

    // Renumber matches globally
    allMatches.forEach((m, idx) => {
      m.matchNumber = idx + 1;
    });

    onSaveSchedule(allMatches);
    soundEngine.playFanfare();
  };

  const handleSaveScore = () => {
    if (!editingMatch) return;
    const numA = parseInt(scoreA, 10) || 0;
    const numB = parseInt(scoreB, 10) || 0;

    const updated = schedule.map((m) =>
      m.id === editingMatch.id
        ? {
            ...m,
            scoreA: numA,
            scoreB: numB,
            status: 'finished' as const,
          }
        : m
    );

    onSaveSchedule(updated);
    setEditingMatch(null);
    soundEngine.playReveal();
  };

  const filteredMatches = schedule.filter((m) => {
    if (selectedGroup === 'all') return true;
    return m.groupName === selectedGroup;
  });

  const availableGroups = Array.from(new Set(schedule.map((m) => m.groupName)));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-400" />
            <span>Lập Lịch Thi Đấu Vòng Tròn (Round Robin)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Thuật toán Berger & Circle Method chuẩn quốc tế, tự động phân phối sân và giờ thi đấu không trùng lặp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {schedule.length > 0 && (
            <button
              onClick={() => ExportService.exportScheduleToCsv(tournament, schedule)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          )}

          <button
            onClick={handleGenerateSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{schedule.length > 0 ? 'Tạo Lại Lịch Đấu' : 'Tự Động Lập Lịch Đấu'}</span>
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="space-y-1">
          <label className="text-slate-400 font-medium">Ngày bắt đầu:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-medium">Giờ trận đầu:</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-medium">Danh sách sân đấu:</label>
          <input
            type="text"
            value={courtsInput}
            onChange={(e) => setCourtsInput(e.target.value)}
            placeholder="Sân 1, Sân 2"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-medium">Thời lượng / nghỉ (phút):</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              min="10"
              value={matchDuration}
              onChange={(e) => setMatchDuration(Number(e.target.value))}
              className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-center"
            />
            <input
              type="number"
              min="0"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
              className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-center"
            />
          </div>
        </div>

        <div className="space-y-1 flex flex-col justify-center">
          <label className="flex items-center gap-2 cursor-pointer pt-3">
            <input
              type="checkbox"
              checked={isDoubleRound}
              onChange={(e) => setIsDoubleRound(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="text-slate-300 font-medium">Vòng tròn 2 lượt (Lượt đi / về)</span>
          </label>
        </div>
      </div>

      {/* Filter by group */}
      {availableGroups.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Xem bảng:</span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                selectedGroup === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả bảng ({schedule.length} trận)
            </button>
            {availableGroups.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  selectedGroup === grp ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bảng {grp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
              <th className="py-2.5 px-3 w-16 text-center font-mono">TRẬN</th>
              <th className="py-2.5 px-3 font-mono">VÒNG</th>
              <th className="py-2.5 px-3">BẢNG</th>
              <th className="py-2.5 px-3 font-mono">NGÀY & GIỜ</th>
              <th className="py-2.5 px-3">SÂN</th>
              <th className="py-2.5 px-4">CẶP THI ĐẤU</th>
              <th className="py-2.5 px-3 text-center">TỶ SỐ</th>
              <th className="py-2.5 px-3 text-right">CẬP NHẬT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  Chưa có lịch thi đấu. Hãy nhấn "Tự Động Lập Lịch Đấu" ở trên.
                </td>
              </tr>
            ) : (
              filteredMatches.map((match) => (
                <tr key={match.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400 tabular-nums">
                    {match.matchNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    Vòng {match.roundNumber}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-blue-400">
                    Bảng {match.groupName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    <div>{match.time}</div>
                    <div className="text-[10px] text-slate-500">{match.date}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {match.court}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-200">
                    <span className="text-blue-300">{match.teamA.name}</span>
                    <span className="text-slate-500 font-normal px-2">vs</span>
                    <span className="text-amber-300">{match.teamB.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-sm">
                    {match.scoreA !== undefined && match.scoreB !== undefined ? (
                      <span className="text-emerald-400">
                        {match.scoreA} - {match.scoreB}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setEditingMatch(match);
                        setScoreA(String(match.scoreA ?? 0));
                        setScoreB(String(match.scoreB ?? 0));
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                    >
                      Nhập điểm
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Match Score Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Trận {editingMatch.matchNumber} · Bảng {editingMatch.groupName}
              </h3>
              <span className="text-xs font-mono text-slate-400">{editingMatch.court}</span>
            </div>

            <div className="space-y-4 my-2">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {editingMatch.teamA.name}
                </span>
                <input
                  type="number"
                  min="0"
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white text-base focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {editingMatch.teamB.name}
                </span>
                <input
                  type="number"
                  min="0"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white text-base focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveScore}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
              >
                Lưu Tỷ Số Trận Đấu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
