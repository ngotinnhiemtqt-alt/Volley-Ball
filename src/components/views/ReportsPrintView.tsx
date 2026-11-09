import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Download,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import {
  Tournament,
  Team,
  GroupDrawResult,
  MatchupDrawResult,
  OrderDrawResult,
  ScheduleMatch,
  BracketData,
} from '../../types/tournament';
import { ExportService } from '../../services/exportService';

interface ReportsPrintViewProps {
  tournament: Tournament;
  teams: Team[];
  groupDraw: GroupDrawResult | null;
  matchupDraw: MatchupDrawResult | null;
  orderDraw: OrderDrawResult | null;
  schedule: ScheduleMatch[];
  bracketData: BracketData | null;
}

type ReportTemplate = 'mau_01' | 'mau_02' | 'mau_03' | 'mau_04' | 'mau_05' | 'mau_06';

export const ReportsPrintView: React.FC<ReportsPrintViewProps> = ({
  tournament,
  teams,
  groupDraw,
  matchupDraw,
  orderDraw,
  schedule,
  bracketData,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>('mau_06');

  const templates: { id: ReportTemplate; name: string; desc: string }[] = [
    {
      id: 'mau_06',
      name: 'Mẫu 06: Biên Bản Bốc Thăm Chính Thức (Có Chữ Ký)',
      desc: 'Biên bản pháp lý có xác nhận của BTC, Trọng tài và Trưởng đoàn',
    },
    {
      id: 'mau_01',
      name: 'Mẫu 01: Báo Cáo Kết Quả Chia Bảng',
      desc: 'Danh sách các bảng đấu A, B, C, D chi tiết',
    },
    {
      id: 'mau_02',
      name: 'Mẫu 02: Báo Cáo Kết Quả Đối Đầu',
      desc: 'Danh sách các cặp đấu kèm sân và lượt thi đấu',
    },
    {
      id: 'mau_03',
      name: 'Mẫu 03: Báo Cáo Số Thứ Tự Thi Đấu',
      desc: 'Bảng số thứ tự xuất phát / biểu diễn của các đội',
    },
    {
      id: 'mau_04',
      name: 'Mẫu 04: Sơ Đồ Thi Đấu Loại Trực Tiếp',
      desc: 'Sơ đồ hình cây Bán kết, Chung kết',
    },
    {
      id: 'mau_05',
      name: 'Mẫu 05: Lịch Thi Đấu Chi Tiết Toàn Giải',
      desc: 'Lịch thi đấu theo ngày, giờ, sân và bảng đấu',
    },
  ];

  const handlePrint = () => {
    ExportService.printPage();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Control Navigation Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span>Xuất Biểu Mẫu & Biên Bản Bốc Thăm In Ấn</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Định dạng chuẩn A4 phục vụ lưu trữ hồ sơ giải đấu, đóng dấu và ký xác nhận chính thức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            <span>IN BIÊN BẢN / LƯU PDF [Ctrl+P]</span>
          </button>
        </div>
      </div>

      {/* Template Switcher Tabs */}
      <div className="no-print grid grid-cols-2 md:grid-cols-3 gap-2">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setSelectedTemplate(tpl.id)}
            className={`p-3 rounded-xl border text-left transition-all text-xs ${
              selectedTemplate === tpl.id
                ? 'bg-blue-950/60 border-blue-500 text-white shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-slate-200 truncate">{tpl.name}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tpl.desc}</div>
          </button>
        ))}
      </div>

      {/* Printable Sheet Area (Styled for white paper A4 format) */}
      <div className="p-8 md:p-12 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-300 print-card min-h-[900px] text-xs">
        {/* National Header / Formal Letterhead */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
          <div className="flex justify-between items-start text-[11px] font-semibold text-slate-700">
            <div className="text-left uppercase">
              {tournament.organizer || 'BAN TỔ CHỨC GIẢI THỂ THAO'}<br />
              <span className="font-normal text-[10px]">Số: ..... /BB-BT2027</span>
            </div>
            <div className="text-right uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
              <span className="font-normal text-[10px] underline">Độc lập – Tự do – Hạnh phúc</span>
            </div>
          </div>

          <div className="pt-6">
            <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide text-slate-950">
              {selectedTemplate === 'mau_06' && 'BIÊN BẢN KẾT QUẢ BỐC THĂM THI ĐẤU CHÍNH THỨC'}
              {selectedTemplate === 'mau_01' && 'BẢNG TỔNG HỢP KẾT QUẢ BỐC THĂM CHIA BẢNG'}
              {selectedTemplate === 'mau_02' && 'BẢNG KẾT QUẢ BỐC THĂM CẶP ĐẤU ĐỐI ĐẦU'}
              {selectedTemplate === 'mau_03' && 'BẢNG XÁC ĐỊNH SỐ THỨ TỰ THI ĐẤU'}
              {selectedTemplate === 'mau_04' && 'SƠ ĐỒ THI ĐẤU LOẠI TRỰC TIẾP'}
              {selectedTemplate === 'mau_05' && 'LỊCH THI ĐẤU CHÍNH THỨC TOÀN GIẢI'}
            </h2>
            <div className="text-sm font-semibold text-blue-800 uppercase mt-1">
              {tournament.name}
            </div>
            <div className="text-[11px] text-slate-600 italic mt-0.5">
              Môn thi đấu: {tournament.sport} · Địa điểm: {tournament.location}
            </div>
          </div>
        </div>

        {/* General Meta Information */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-[11px]">
          <div>
            <p><strong>Thời gian tổ chức:</strong> Từ {tournament.startDate} đến {tournament.endDate}</p>
            <p><strong>Đơn vị phối hợp:</strong> {tournament.coOrganizer || 'Không có'}</p>
          </div>
          <div className="text-right">
            <p><strong>Tổng số đội / VĐV tham dự:</strong> {teams.length} đội</p>
            <p><strong>Thời điểm lập biên bản:</strong> {new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>

        {/* Template-Specific Body Content */}
        <div className="py-6 space-y-6">
          {/* Mau 06: Official Protocol (All in one summary) */}
          {selectedTemplate === 'mau_06' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold uppercase text-slate-900 pb-2 mb-2 border-b border-slate-300">
                  I. HÌNH THỨC VÀ QUY CHẾ BỐC THĂM
                </h3>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Bốc thăm công khai trước sự chứng kiến của Ban tổ chức, Tổ trọng tài và đại diện các đội bóng/vận động viên tham gia. Thuật toán phân bổ ngẫu nhiên dựa trên bộ sinh số ngẫu nhiên Web Crypto API không thiên lệch, phân bổ đều nhóm hạt giống và hạn chế các đội cùng đơn vị trực thuộc nằm chung bảng đấu.
                </p>
              </div>

              <div>
                <h3 className="font-bold uppercase text-slate-900 pb-2 mb-2 border-b border-slate-300">
                  II. KẾT QUẢ BỐC THĂM CHIA BẢNG CHÍNH THỨC
                </h3>
                {groupDraw ? (
                  <div className="grid grid-cols-2 gap-4">
                    {groupDraw.groups.map((group) => (
                      <div key={group.name} className="border border-slate-300 rounded p-3">
                        <div className="font-bold text-center text-sm pb-1 mb-2 border-b border-slate-300 text-blue-900">
                          BẢNG {group.name}
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px]">
                          {group.teams.map((t) => (
                            <li key={t.id} className="text-slate-800">
                              <span className="font-semibold">{t.name}</span>
                              {t.unit && <span className="text-slate-500"> ({t.unit})</span>}
                              {t.seedGroup ? <span className="font-bold text-amber-700"> [Hạt giống {t.seedGroup}]</span> : ''}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-slate-500">Chưa có kết quả chia bảng.</p>
                )}
              </div>

              {matchupDraw && matchupDraw.matchups.length > 0 && (
                <div>
                  <h3 className="font-bold uppercase text-slate-900 pb-2 mb-2 border-b border-slate-300">
                    III. KẾT QUẢ BỐC THĂM ĐỐI ĐẦU
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {matchupDraw.matchups.map((m) => (
                      <div key={m.id} className="p-2 border border-slate-200 rounded">
                        <strong>Trận {m.matchNumber}:</strong> {m.teamA?.name} <strong>VS</strong> {m.teamB?.name || 'MIỄN ĐẤU (BYE)'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mau 01: Group Draw Details */}
          {selectedTemplate === 'mau_01' && (
            <div className="space-y-4">
              {groupDraw?.groups.map((grp) => (
                <div key={grp.name} className="space-y-2">
                  <h4 className="font-bold text-blue-900 uppercase">BẢNG ĐẤU {grp.name}</h4>
                  <table className="w-full text-left border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="p-2 w-12 text-center">STT</th>
                        <th className="p-2 w-20">Mã Đội</th>
                        <th className="p-2">Tên Đội Thi Đấu</th>
                        <th className="p-2">Đơn Vị Trực Thuộc</th>
                        <th className="p-2 text-center">Hạt Giống</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {grp.teams.map((t, idx) => (
                        <tr key={t.id}>
                          <td className="p-2 text-center">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold">{t.code}</td>
                          <td className="p-2 font-semibold">{t.name}</td>
                          <td className="p-2">{t.unit || 'Tự do'}</td>
                          <td className="p-2 text-center">
                            {t.seedGroup ? `Hạt giống ${t.seedGroup}` : 'Tự do'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Mau 05: Schedule Full Table */}
          {selectedTemplate === 'mau_05' && (
            <div>
              <table className="w-full text-left border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 w-12 text-center">Trận</th>
                    <th className="p-2">Vòng</th>
                    <th className="p-2">Bảng</th>
                    <th className="p-2">Ngày & Giờ</th>
                    <th className="p-2">Sân</th>
                    <th className="p-2">Cặp Thi Đấu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {schedule.map((m) => (
                    <tr key={m.id}>
                      <td className="p-2 text-center font-bold">{m.matchNumber}</td>
                      <td className="p-2">Vòng {m.roundNumber}</td>
                      <td className="p-2 font-bold">Bảng {m.groupName}</td>
                      <td className="p-2">{m.date} ({m.time})</td>
                      <td className="p-2">{m.court}</td>
                      <td className="p-2 font-semibold">
                        {m.teamA.name} <span className="font-normal">vs</span> {m.teamB.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signatures Footer (Essential for Official Tournament Protocol) */}
        <div className="pt-8 mt-12 border-t-2 border-slate-900 grid grid-cols-3 text-center text-[11px] gap-6">
          <div className="space-y-16">
            <p className="font-bold uppercase">ĐẠI DIỆN CÁC ĐOÀN / ĐỘI<br /><span className="font-normal italic">(Ký và ghi rõ họ tên)</span></p>
            <p className="text-slate-400">............................................</p>
          </div>

          <div className="space-y-16">
            <p className="font-bold uppercase">TỔ TRỌNG TÀI ĐIỀU HÀNH<br /><span className="font-normal italic">(Ký và ghi rõ họ tên)</span></p>
            <p className="text-slate-400">............................................</p>
          </div>

          <div className="space-y-16">
            <p className="font-bold uppercase">TRƯỞNG BAN TỔ CHỨC<br /><span className="font-normal italic">(Ký tên, đóng dấu)</span></p>
            <p className="text-slate-400">............................................</p>
          </div>
        </div>
      </div>
    </div>
  );
};
