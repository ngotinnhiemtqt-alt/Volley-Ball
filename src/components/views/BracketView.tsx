import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  Tv,
  Printer,
  Sparkles,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, Team, BracketData, BracketMatch, GroupDrawResult } from '../../types/tournament';
import { DrawEngine } from '../../services/drawEngine';
import { soundEngine } from '../../services/soundEngine';

interface BracketViewProps {
  tournament: Tournament;
  teams: Team[];
  groupDraw: GroupDrawResult | null;
  bracketData: BracketData | null;
  onSaveBracket: (bracket: BracketData) => void;
  onOpenLed: () => void;
}

export const BracketView: React.FC<BracketViewProps> = ({
  tournament,
  teams,
  groupDraw,
  bracketData,
  onSaveBracket,
  onOpenLed,
}) => {
  const [currentBracket, setCurrentBracket] = useState<BracketData | null>(bracketData);
  const [editingMatch, setEditingMatch] = useState<BracketMatch | null>(null);
  const [scoreA, setScoreA] = useState<string>('0');
  const [scoreB, setScoreB] = useState<string>('0');

  useEffect(() => {
    setCurrentBracket(bracketData);
  }, [bracketData]);

  // Generate bracket from 2-Group format (Semi-finals & Final: 1A vs 2B, 1B vs 2A)
  const handleGenerateFromGroups = () => {
    if (!groupDraw || groupDraw.groups.length < 2) {
      alert('Cần có kết quả chia ít nhất 2 bảng đấu để tạo sơ đồ Bán kết & Chung kết.');
      return;
    }

    const groupA = groupDraw.groups[0];
    const groupB = groupDraw.groups[1];

    if (groupA.teams.length < 2 || groupB.teams.length < 2) {
      alert('Mỗi bảng cần ít nhất 2 đội để chọn Nhất và Nhì bảng vào Bán kết.');
      return;
    }

    // Nhất A, Nhì A, Nhất B, Nhì B
    const firstA = groupA.teams[0];
    const secondA = groupA.teams[1];
    const firstB = groupB.teams[0];
    const secondB = groupB.teams[1];

    // Semifinal 1: Nhất A vs Nhì B
    // Semifinal 2: Nhất B vs Nhì A
    const semi1: BracketMatch = {
      id: 'SEMI_1',
      roundNumber: 1,
      matchIndex: 0,
      roundName: 'Bán kết 1',
      teamA: firstA,
      teamB: secondB,
      nextMatchId: 'FINAL',
      nextMatchSlot: 'A',
      court: 'Sân 1',
    };

    const semi2: BracketMatch = {
      id: 'SEMI_2',
      roundNumber: 1,
      matchIndex: 1,
      roundName: 'Bán kết 2',
      teamA: firstB,
      teamB: secondA,
      nextMatchId: 'FINAL',
      nextMatchSlot: 'B',
      court: 'Sân 2',
    };

    const finalMatch: BracketMatch = {
      id: 'FINAL',
      roundNumber: 2,
      matchIndex: 0,
      roundName: 'Trận Chung Kết',
      teamA: null,
      teamB: null,
      court: 'Sân Trung Tâm',
    };

    const thirdPlaceMatch: BracketMatch = {
      id: 'THIRD_PLACE',
      roundNumber: 2,
      matchIndex: 99,
      roundName: 'Trận Tranh Hạng Ba',
      teamA: null,
      teamB: null,
      court: 'Sân 1',
    };

    const newBracket: BracketData = {
      tournamentId: tournament.id,
      rounds: [
        {
          roundNumber: 1,
          roundName: 'VÒNG BÁN KẾT',
          matches: [semi1, semi2],
        },
        {
          roundNumber: 2,
          roundName: 'VÒNG CHUNG KẾT',
          matches: [finalMatch],
        },
      ],
      thirdPlaceMatch,
      isLocked: false,
    };

    setCurrentBracket(newBracket);
    onSaveBracket(newBracket);
    soundEngine.playFanfare();
  };

  // Generate pure single elimination bracket from all teams
  const handleGeneratePureKnockout = () => {
    if (teams.length < 2) {
      alert('Cần ít nhất 2 đội để tạo sơ đồ đấu loại trực tiếp.');
      return;
    }

    const bracket = DrawEngine.generateKnockoutBracket(tournament.id, teams, {
      hasThirdPlace: tournament.hasThirdPlaceMatch,
    });

    setCurrentBracket(bracket);
    onSaveBracket(bracket);
    soundEngine.playFanfare();
  };

  const handleOpenScoreModal = (match: BracketMatch) => {
    if (!match.teamA || !match.teamB) {
      alert('Trận đấu này chưa xác định đủ 2 đội tham dự.');
      return;
    }
    setEditingMatch(match);
    setScoreA(String(match.scoreA ?? 0));
    setScoreB(String(match.scoreB ?? 0));
  };

  const handleSaveScore = () => {
    if (!editingMatch || !currentBracket) return;

    const numScoreA = parseInt(scoreA, 10) || 0;
    const numScoreB = parseInt(scoreB, 10) || 0;

    if (numScoreA === numScoreB) {
      alert('Trong vòng loại trực tiếp, trận đấu không thể hòa. Vui lòng nhập điểm số phân định thắng thua.');
      return;
    }

    const winner = numScoreA > numScoreB ? editingMatch.teamA : editingMatch.teamB;
    const loser = numScoreA > numScoreB ? editingMatch.teamB : editingMatch.teamA;

    // Clone bracket
    const updatedRounds = currentBracket.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        if (m.id === editingMatch.id) {
          return {
            ...m,
            scoreA: numScoreA,
            scoreB: numScoreB,
            winnerId: winner?.id,
          };
        }
        return m;
      }),
    }));

    // If nextMatchId exists, push winner into next match
    if (editingMatch.nextMatchId) {
      for (const round of updatedRounds) {
        for (const m of round.matches) {
          if (m.id === editingMatch.nextMatchId) {
            if (editingMatch.nextMatchSlot === 'A') {
              m.teamA = winner;
            } else {
              m.teamB = winner;
            }
          }
        }
      }
    }

    // If this is a semi-final and there's a third-place match, push loser into third place match
    let updatedThirdPlace = currentBracket.thirdPlaceMatch;
    if (editingMatch.roundName.includes('Bán kết') && updatedThirdPlace) {
      if (editingMatch.id.includes('1')) {
        updatedThirdPlace = { ...updatedThirdPlace, teamA: loser };
      } else {
        updatedThirdPlace = { ...updatedThirdPlace, teamB: loser };
      }
    }

    const updatedBracket: BracketData = {
      ...currentBracket,
      rounds: updatedRounds,
      thirdPlaceMatch: updatedThirdPlace,
    };

    setCurrentBracket(updatedBracket);
    onSaveBracket(updatedBracket);
    setEditingMatch(null);
    soundEngine.playReveal();

    if (editingMatch.roundName.includes('Chung Kết') || editingMatch.id === 'FINAL') {
      soundEngine.playFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
        });
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-400" />
            <span>Sơ Đồ Thi Đấu Loại Trực Tiếp (Knockout Bracket)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sơ đồ hình cây bán kết - chung kết, tự động đẩy đội chiến thắng vào vòng sau khi cập nhật tỷ số
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {groupDraw && (
            <button
              onClick={handleGenerateFromGroups}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02]"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Tạo Sơ Đồ Từ Bảng Đấu (1A vs 2B)</span>
            </button>
          )}

          <button
            onClick={handleGeneratePureKnockout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Tạo Loại Trực Tiếp Toàn Bộ ({teams.length} Đội)</span>
          </button>

          <button
            onClick={onOpenLed}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Tv className="w-3.5 h-3.5 text-amber-300" />
            <span>Trình Chiếu LED</span>
          </button>
        </div>
      </div>

      {/* Main Bracket Interactive Tree */}
      {!currentBracket || currentBracket.rounds.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <GitFork className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-white">Chưa tạo sơ đồ thi đấu loại trực tiếp</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Bạn có thể tạo sơ đồ Bán kết & Chung kết tự động từ kết quả chia bảng (Nhất A gặp Nhì B, Nhất B gặp Nhì A) hoặc bốc thăm loại trực tiếp toàn bộ đội.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="overflow-x-auto pb-6">
            <div className="flex items-start gap-8 min-w-[700px] py-4">
              {currentBracket.rounds.map((round, rIdx) => (
                <div key={round.roundNumber} className="flex-1 space-y-4">
                  {/* Round Header */}
                  <div className="text-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-display font-extrabold uppercase tracking-wider text-amber-400">
                      {round.roundName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {round.matches.length} Trận Đấu
                    </span>
                  </div>

                  {/* Matches Column */}
                  <div className="space-y-6">
                    {round.matches.map((match) => {
                      const isComplete = match.winnerId !== undefined;
                      const winnerTeam =
                        match.winnerId === match.teamA?.id
                          ? match.teamA
                          : match.winnerId === match.teamB?.id
                          ? match.teamB
                          : null;

                      return (
                        <div
                          key={match.id}
                          onClick={() => handleOpenScoreModal(match)}
                          className={`rounded-2xl border p-3 transition-all cursor-pointer group shadow-lg ${
                            isComplete
                              ? 'bg-slate-900/90 border-slate-700'
                              : 'bg-slate-900/60 border-slate-800 hover:border-blue-500'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
                            <span>{match.roundName}</span>
                            <span>{match.court || 'Sân 1'}</span>
                          </div>

                          {/* Team A */}
                          <div
                            className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors mb-1.5 ${
                              match.winnerId === match.teamA?.id
                                ? 'bg-emerald-950/70 text-emerald-300 font-bold border border-emerald-800/60'
                                : 'bg-slate-950 text-slate-200'
                            }`}
                          >
                            <span className="truncate pr-2">
                              {match.teamA?.name || <span className="text-slate-600 italic">Chờ xác định...</span>}
                            </span>
                            <span className="font-mono font-bold tabular-nums">
                              {match.scoreA !== undefined ? match.scoreA : '-'}
                            </span>
                          </div>

                          {/* Team B */}
                          <div
                            className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                              match.winnerId === match.teamB?.id
                                ? 'bg-emerald-950/70 text-emerald-300 font-bold border border-emerald-800/60'
                                : 'bg-slate-950 text-slate-200'
                            }`}
                          >
                            <span className="truncate pr-2">
                              {match.teamB?.name || <span className="text-slate-600 italic">Chờ xác định...</span>}
                            </span>
                            <span className="font-mono font-bold tabular-nums">
                              {match.scoreB !== undefined ? match.scoreB : '-'}
                            </span>
                          </div>

                          <div className="mt-2 text-center text-[10px] text-slate-500 group-hover:text-blue-400 transition-colors">
                            {isComplete ? (
                              <span className="text-emerald-400 font-semibold">
                                Thắng: {winnerTeam?.name} (Bấm để sửa điểm)
                              </span>
                            ) : (
                              <span>Bấm để nhập kết quả trận</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Third place match if configured */}
          {currentBracket.thirdPlaceMatch && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 max-w-md mx-auto text-center space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">
                TRẬN TRANH HẠNG BA (ĐỒNG HẠNG BA)
              </span>

              <div
                onClick={() => handleOpenScoreModal(currentBracket.thirdPlaceMatch!)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-amber-400 transition-colors text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-200 truncate">
                    {currentBracket.thirdPlaceMatch.teamA?.name || 'Thua Bán kết 1'}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {currentBracket.thirdPlaceMatch.scoreA !== undefined ? currentBracket.thirdPlaceMatch.scoreA : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate">
                    {currentBracket.thirdPlaceMatch.teamB?.name || 'Thua Bán kết 2'}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {currentBracket.thirdPlaceMatch.scoreB !== undefined ? currentBracket.thirdPlaceMatch.scoreB : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Nhập Điểm Số Trận Đấu</h3>
              <span className="text-xs font-mono text-blue-400">{editingMatch.roundName}</span>
            </div>

            <div className="space-y-4 my-2">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {editingMatch.teamA?.name}
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
                  {editingMatch.teamB?.name}
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
                Lưu Điểm & Cập Nhật Nhánh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
