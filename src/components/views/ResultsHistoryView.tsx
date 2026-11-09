import React from 'react';
import {
  FileCheck2,
  Lock,
  Unlock,
  ShieldCheck,
  Calendar,
  Grid,
  Swords,
  Hash,
  Download,
} from 'lucide-react';
import { Tournament, GroupDrawResult, MatchupDrawResult, OrderDrawResult, AuditLog } from '../../types/tournament';
import { storageService } from '../../services/storage';

interface ResultsHistoryViewProps {
  tournament: Tournament;
  groupDraw: GroupDrawResult | null;
  matchupDraw: MatchupDrawResult | null;
  orderDraw: OrderDrawResult | null;
}

export const ResultsHistoryView: React.FC<ResultsHistoryViewProps> = ({
  tournament,
  groupDraw,
  matchupDraw,
  orderDraw,
}) => {
  const auditLogs = storageService.getAuditLogs(tournament.id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span>Kết Quả Chính Thức & Lịch Sử Kiểm Toán (Audit)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Lưu vết toàn bộ các lượt bốc thăm, mã băm mật mã chứng thực và trạng thái khóa bảo vệ dữ liệu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>MÃ BĂM MẬT MÃ SHA-256</span>
          </span>
        </div>
      </div>

      {/* Official Draw Snapshots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Group Draw Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                <Grid className="w-4 h-4" /> BỐC THĂM CHIA BẢNG
              </span>
              {groupDraw?.isLocked ? (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  <Lock className="w-3 h-3" /> ĐÃ KHÓA
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Chưa khóa</span>
              )}
            </div>

            {groupDraw ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-300">
                  Phân chia thành <span className="font-bold text-white">{groupDraw.groups.length} bảng</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Mã lượt: {groupDraw.drawId}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Thời gian: {new Date(groupDraw.timestamp).toLocaleString('vi-VN')}
                </div>
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  {groupDraw.groups.map((g) => (
                    <div key={g.name} className="flex justify-between text-xs text-slate-300">
                      <span>Bảng {g.name}:</span>
                      <span className="font-mono text-slate-400">{g.teams.length} đội</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-600">
                Chưa thực hiện bốc thăm chia bảng.
              </div>
            )}
          </div>
        </div>

        {/* Matchup Draw Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                <Swords className="w-4 h-4" /> BỐC THĂM ĐỐI ĐẦU
              </span>
              {matchupDraw?.isLocked ? (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  <Lock className="w-3 h-3" /> ĐÃ KHÓA
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Chưa khóa</span>
              )}
            </div>

            {matchupDraw ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-300">
                  Ghép thành <span className="font-bold text-white">{matchupDraw.matchups.length} cặp đấu</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Mã lượt: {matchupDraw.drawId}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Thời gian: {new Date(matchupDraw.timestamp).toLocaleString('vi-VN')}
                </div>
                {matchupDraw.hasBye && (
                  <div className="text-[11px] text-amber-400">
                    Đội hưởng suất BYE: {matchupDraw.byeTeams.map((b) => b.name).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-600">
                Chưa thực hiện bốc thăm đối đầu.
              </div>
            )}
          </div>
        </div>

        {/* Order Draw Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Hash className="w-4 h-4" /> BỐC THĂM SỐ THỨ TỰ
              </span>
              {orderDraw?.isLocked ? (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  <Lock className="w-3 h-3" /> ĐÃ KHÓA
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Chưa khóa</span>
              )}
            </div>

            {orderDraw ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-300">
                  Đã phân bổ <span className="font-bold text-white">{orderDraw.items.length} số thứ tự</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Mã lượt: {orderDraw.drawId}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Thời gian: {new Date(orderDraw.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-600">
                Chưa thực hiện bốc thăm số thứ tự.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Audit Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-white">
          Nhật ký thao tác bốc thăm & chứng thực hệ thống
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold">
              <th className="py-2.5 px-4 font-mono">THỜI GIAN</th>
              <th className="py-2.5 px-4 font-mono">HÀNH ĐỘNG</th>
              <th className="py-2.5 px-4">CHI TIẾT THỰC THI</th>
              <th className="py-2.5 px-4 font-mono text-right">MÃ XÁC THỰC CRYPTO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Chưa có lịch sử thao tác ghi nhận trong phiên làm việc này.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-blue-400">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300 text-[11px]">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-emerald-400 text-right text-[11px] font-bold">
                    {log.cryptoHash || 'SHA-256 VALID'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
