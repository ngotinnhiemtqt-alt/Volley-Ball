import React from 'react';
import {
  Trophy,
  Users,
  Grid,
  Calendar,
  Tv,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Tournament, Team, GroupDrawResult, MatchupDrawResult, ScheduleMatch } from '../../types/tournament';
import { NavTab } from '../Sidebar';

interface OverviewViewProps {
  tournament: Tournament;
  teams: Team[];
  groupDraw: GroupDrawResult | null;
  matchupDraw: MatchupDrawResult | null;
  schedule: ScheduleMatch[];
  onNavigate: (tab: NavTab) => void;
  onOpenLed: () => void;
  onResetDemo: () => void;
  onExportBackup: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  tournament,
  teams,
  groupDraw,
  matchupDraw,
  schedule,
  onNavigate,
  onOpenLed,
  onResetDemo,
  onExportBackup,
}) => {
  const seededTeamsCount = teams.filter((t) => t.seedGroup && t.seedGroup > 0).length;
  const groupsCount = groupDraw ? groupDraw.groups.length : tournament.numberOfGroups;

  // Workflow steps
  const steps = [
    {
      step: 1,
      title: 'Thiết lập giải đấu',
      desc: 'Thông tin, điều lệ, số bảng đấu và thể thức',
      completed: true,
      tab: 'tournament' as NavTab,
    },
    {
      step: 2,
      title: 'Danh sách đội & Hạt giống',
      desc: `${teams.length} đội tham dự (${seededTeamsCount} đội hạt giống)`,
      completed: teams.length >= 2,
      tab: 'teams' as NavTab,
    },
    {
      step: 3,
      title: 'Bốc thăm công khai',
      desc: groupDraw
        ? `Đã chia ${groupDraw.groups.length} bảng (${groupDraw.groups.map((g) => `Bảng ${g.name}: ${g.teams.length} đội`).join(', ')})`
        : 'Chưa bốc thăm chia bảng',
      completed: !!groupDraw,
      tab: 'group_draw' as NavTab,
    },
    {
      step: 4,
      title: 'Lịch thi đấu & Sơ đồ',
      desc: schedule.length > 0 ? `Đã xếp ${schedule.length} trận đấu vòng bảng` : 'Chưa tạo lịch thi đấu',
      completed: schedule.length > 0,
      tab: 'schedule' as NavTab,
    },
    {
      step: 5,
      title: 'Trình chiếu LED sự kiện',
      desc: 'Giao diện 16:9 toàn màn hình cho máy chiếu và LED',
      completed: !!groupDraw,
      isAction: true,
      action: onOpenLed,
    },
    {
      step: 6,
      title: 'Biên bản & Ký xác nhận',
      desc: 'In ấn biên bản Mẫu 01-06, chữ ký Ban tổ chức và các đoàn',
      completed: !!groupDraw,
      tab: 'reports' as NavTab,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F2744] via-[#102A43] to-[#0A192F] border border-blue-900/60 p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">
                {tournament.sport}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">
                {tournament.startDate} đến {tournament.endDate}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">{tournament.location}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              {tournament.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Hệ thống bốc thăm ngẫu nhiên bảo đảm tính công bằng tuyệt đối theo chuẩn Web Crypto API, hỗ trợ phân chia hạt giống, chống trùng đơn vị và trình chiếu trực tiếp trên màn hình LED sự kiện.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-3 shrink-0">
            <button
              onClick={onOpenLed}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Tv className="w-4 h-4 text-amber-200" />
              <span>TRÌNH CHIẾU LED 16:9</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('group_draw')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Grid className="w-3.5 h-3.5 text-blue-400" />
                <span>Bốc thăm bảng</span>
              </button>
              <button
                onClick={onExportBackup}
                title="Sao lưu JSON toàn bộ giải đấu"
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">{teams.length}</div>
            <div className="text-xs text-slate-400">Đội thi đấu ({seededTeamsCount} hạt giống)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">{groupsCount}</div>
            <div className="text-xs text-slate-400">Bảng đấu dự kiến</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">{schedule.length}</div>
            <div className="text-xs text-slate-400">Trận vòng tròn đã lập</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-400">Web Crypto API</div>
            <div className="text-xs text-slate-400">Thuật toán Fisher-Yates</div>
          </div>
        </div>
      </div>

      {/* Main Workflow Section */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Quy trình điều hành giải đấu</h2>
            <p className="text-xs text-slate-400">Thực hiện tuần tự các bước từ chuẩn bị danh sách đến bốc thăm và xuất biên bản</p>
          </div>
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
            title="Khôi phục lại dữ liệu mẫu chuẩn của Giải bóng chuyền 20/11"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Dữ liệu mẫu chuẩn</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((item) => (
            <div
              key={item.step}
              onClick={() => {
                if (item.isAction && item.action) {
                  item.action();
                } else if (item.tab) {
                  onNavigate(item.tab);
                }
              }}
              className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-600/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold">
                    BƯỚC 0{item.step}
                  </span>
                  {item.completed ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã sẵn sàng
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Cần thực hiện
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200">
                <span>Mở chức năng</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-blue-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Draw Status Summary */}
      {groupDraw && (
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Kết quả bốc thăm chia bảng hiện hành</h3>
            </div>
            <button
              onClick={() => onNavigate('group_draw')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Xem chi tiết & Bốc lại
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupDraw.groups.map((group) => (
              <div key={group.name} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-display font-bold text-base text-amber-400">
                    BẢNG {group.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {group.teams.length} đội
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {group.teams.map((t, idx) => (
                    <li key={t.id} className="flex items-center justify-between p-1.5 rounded bg-slate-900/50">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                        <span className="truncate font-medium">{t.name}</span>
                      </div>
                      {t.seedGroup && t.seedGroup > 0 ? (
                        <span className="text-[10px] text-amber-400 font-mono shrink-0">H{t.seedGroup}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
