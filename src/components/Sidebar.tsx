import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Grid,
  Swords,
  Hash,
  MapPin,
  GitFork,
  CalendarDays,
  FileCheck2,
  Printer,
  CheckCircle2,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'tournament'
  | 'teams'
  | 'group_draw'
  | 'matchup_draw'
  | 'order_draw'
  | 'position_draw'
  | 'bracket'
  | 'schedule'
  | 'results'
  | 'reports'
  | 'testing';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  teamsCount: number;
  hasGroupDraw: boolean;
  hasMatchupDraw: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  teamsCount,
  hasGroupDraw,
  hasMatchupDraw,
}) => {
  const menuItems: {
    id: NavTab;
    label: string;
    sublabel?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    category?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Tổng quan giải đấu',
      icon: LayoutDashboard,
      category: 'QUẢN LÝ CHUNG',
    },
    {
      id: 'tournament',
      label: 'Cấu hình giải đấu',
      icon: Trophy,
    },
    {
      id: 'teams',
      label: 'Danh sách đội / VĐV',
      icon: Users,
      badge: teamsCount,
      badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
    },
    {
      id: 'group_draw',
      label: 'Bốc thăm chia bảng',
      icon: Grid,
      badge: hasGroupDraw ? 'Đã có' : undefined,
      badgeColor: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
      category: 'CÔNG CỤ BỐC THĂM',
    },
    {
      id: 'matchup_draw',
      label: 'Bốc thăm đối đầu',
      icon: Swords,
      badge: hasMatchupDraw ? 'Đã có' : undefined,
      badgeColor: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
    },
    {
      id: 'order_draw',
      label: 'Bốc thăm số thứ tự',
      icon: Hash,
    },
    {
      id: 'position_draw',
      label: 'Bốc vị trí & sân đấu',
      icon: MapPin,
    },
    {
      id: 'bracket',
      label: 'Sơ đồ thi đấu (Knockout)',
      icon: GitFork,
      category: 'SƠ ĐỒ & LỊCH ĐẤU',
    },
    {
      id: 'schedule',
      label: 'Lịch thi đấu vòng tròn',
      icon: CalendarDays,
    },
    {
      id: 'results',
      label: 'Kết quả & Lịch sử bốc',
      icon: FileCheck2,
      category: 'BÁO CÁO & XUẤT BẢNG',
    },
    {
      id: 'reports',
      label: 'Xuất biểu mẫu & In ấn',
      icon: Printer,
    },
    {
      id: 'testing',
      label: 'Kiểm thử & Tiêu chuẩn',
      icon: CheckCircle2,
      category: 'HỆ THỐNG',
    },
  ];

  return (
    <aside className="no-print w-64 shrink-0 bg-[#071322] border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
      <div className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <React.Fragment key={item.id}>
              {item.category && (
                <div className="pt-3 pb-1.5 px-3">
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 font-semibold uppercase">
                    {item.category}
                  </span>
                </div>
              )}
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="mt-auto p-3 m-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-300">Chuẩn Web Crypto</span>
          <span className="text-emerald-400 font-mono text-[10px]">AN TOÀN</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Thuật toán Fisher-Yates không thiên lệch, hỗ trợ phân chia hạt giống và tránh cùng đơn vị.
        </p>
      </div>
    </aside>
  );
};
