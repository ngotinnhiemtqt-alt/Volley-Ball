import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Save,
  Check,
  Calendar,
  MapPin,
  Building,
  Upload,
  Download,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Tournament, SportType, TournamentFormat } from '../../types/tournament';
import { storageService } from '../../services/storage';

interface TournamentMgmtViewProps {
  currentTournament: Tournament;
  tournaments: Tournament[];
  onSelectTournament: (id: string) => void;
  onUpdateTournament: (updated: Tournament) => void;
  onCreateTournament: (created: Tournament) => void;
  onDeleteTournament: (id: string) => void;
  onImportBackup: (jsonContent: string) => void;
  onExportBackup: () => void;
}

const SPORTS: SportType[] = [
  'Bóng chuyền',
  'Bóng đá',
  'Cầu lông',
  'Bóng bàn',
  'Bóng rổ',
  'Pickleball',
  'Kéo co',
  'Điền kinh',
  'Hội thao toàn diện',
  'Khác',
];

const FORMATS: { id: TournamentFormat; label: string; desc: string }[] = [
  {
    id: 'groups_knockout',
    label: 'Chia bảng kết hợp loại trực tiếp',
    desc: 'Bốc thăm chia thành các bảng thi đấu vòng tròn, các đội đứng đầu vào vòng loại trực tiếp (Bán kết / Chung kết)',
  },
  {
    id: 'single_elimination',
    label: 'Đấu loại trực tiếp (Knockout)',
    desc: 'Thi đấu loại dần qua từng vòng (Vòng loại, Tứ kết, Bán kết, Chung kết)',
  },
  {
    id: 'round_robin_single',
    label: 'Vòng tròn một lượt',
    desc: 'Mỗi đội gặp tất cả các đội còn lại đúng 1 lần tính điểm xếp hạng',
  },
  {
    id: 'round_robin_double',
    label: 'Vòng tròn hai lượt (Lượt đi - Lượt về)',
    desc: 'Mỗi đội gặp nhau 2 lượt sân nhà / sân khách',
  },
  {
    id: 'free_matchup',
    label: 'Bốc thăm đối đầu tự do',
    desc: 'Bốc thăm ngẫu nhiên từng cặp thi đấu theo từng lượt',
  },
  {
    id: 'order_only',
    label: 'Bốc thăm số thứ tự',
    desc: 'Xác định thứ tự ra sân, thứ tự thi đấu hoặc biểu diễn',
  },
];

export const TournamentMgmtView: React.FC<TournamentMgmtViewProps> = ({
  currentTournament,
  tournaments,
  onSelectTournament,
  onUpdateTournament,
  onCreateTournament,
  onDeleteTournament,
  onImportBackup,
  onExportBackup,
}) => {
  const [formData, setFormData] = useState<Tournament>({ ...currentTournament });
  const [isSaved, setIsSaved] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync form data if active tournament changes
  React.useEffect(() => {
    setFormData({ ...currentTournament });
  }, [currentTournament]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Vui lòng nhập tên giải đấu');
      return;
    }
    setErrorMsg(null);
    const updated = {
      ...formData,
      updatedAt: Date.now(),
    };
    onUpdateTournament(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCreateNew = () => {
    const newTour: Tournament = {
      id: 'TOUR_' + Date.now(),
      code: 'GD-' + Math.floor(100 + Math.random() * 900),
      name: 'Giải Thể Thao Mới 2027',
      sport: 'Bóng chuyền',
      organizer: 'Ban Tổ Chức Giải Thể Thao',
      location: 'Nhà thi đấu trung tâm',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      expectedTeamsCount: 8,
      format: 'groups_knockout',
      numberOfGroups: 2,
      advancePerGroup: 2,
      hasThirdPlaceMatch: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onCreateTournament(newTour);
    setFormData(newTour);
    setShowNewModal(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImportBackup(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Quản Lý Thông Tin Giải Đấu</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Thiết lập thông tin pháp lý, điều lệ thi đấu và chuyển đổi giữa các giải đấu khác nhau
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer border border-slate-700 transition-colors">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Nhập JSON</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
          <button
            onClick={onExportBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Xuất JSON</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Giải Mới</span>
          </button>
        </div>
      </div>

      {/* Tournament Selector */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
        <label className="text-xs font-semibold text-slate-300">
          Chọn giải đấu đang điều hành ({tournaments.length} giải có sẵn):
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTournament(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                t.id === currentTournament.id
                  ? 'bg-blue-600/30 text-blue-200 border-blue-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[200px]">{t.name}</span>
              {t.id === currentTournament.id && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Mã giải đấu</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
              placeholder="VD: BC-2011"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Tên giải đấu chính thức <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
              placeholder="VD: GIẢI BÓNG CHUYỀN CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Bộ môn thể thao</label>
            <select
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value as SportType })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Đơn vị tổ chức</label>
            <input
              type="text"
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
              placeholder="VD: Sở GD&ĐT - Công Đoàn Ngành"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Đơn vị phối hợp</label>
            <input
              type="text"
              value={formData.coOrganizer || ''}
              onChange={(e) => setFormData({ ...formData, coOrganizer: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
              placeholder="VD: Trung tâm VHTT Quận"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Địa điểm tổ chức</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                placeholder="VD: Nhà thi đấu đa năng"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Ngày bắt đầu</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Ngày kết thúc</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-slate-200">Thể thức thi đấu</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FORMATS.map((fmt) => (
              <label
                key={fmt.id}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  formData.format === fmt.id
                    ? 'bg-blue-950/40 border-blue-500 shadow-sm shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="tournamentFormat"
                    checked={formData.format === fmt.id}
                    onChange={() => setFormData({ ...formData, format: fmt.id })}
                    className="mt-0.5 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{fmt.label}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block leading-relaxed">{fmt.desc}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Group Configuration if group format */}
        {formData.format === 'groups_knockout' && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Số bảng đấu dự kiến</label>
              <select
                value={formData.numberOfGroups}
                onChange={(e) => setFormData({ ...formData, numberOfGroups: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
              >
                <option value={2}>2 Bảng (Bảng A, B)</option>
                <option value={3}>3 Bảng (Bảng A, B, C)</option>
                <option value={4}>4 Bảng (Bảng A, B, C, D)</option>
                <option value={6}>6 Bảng (A, B, C, D, E, F)</option>
                <option value={8}>8 Bảng (A - H)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Số đội vào vòng tiếp theo / bảng</label>
              <select
                value={formData.advancePerGroup}
                onChange={(e) => setFormData({ ...formData, advancePerGroup: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
              >
                <option value={1}>1 đội (Chỉ đội Nhất bảng)</option>
                <option value={2}>2 đội (Nhất & Nhì mỗi bảng)</option>
                <option value={4}>4 đội (Top 4 mỗi bảng)</option>
              </select>
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={formData.hasThirdPlaceMatch}
                  onChange={(e) => setFormData({ ...formData, hasThirdPlaceMatch: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300 font-medium">Có trận tranh Hạng Ba</span>
              </label>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Ghi chú & Điều lệ giải</label>
          <textarea
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
            placeholder="Ghi chú về quy định xếp hạng, tiêu chí phụ khi bằng điểm, v.v."
          />
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {tournaments.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Bạn có chắc chắn muốn xóa giải đấu "${formData.name}"?`)) {
                  onDeleteTournament(formData.id);
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa giải này</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01]"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã Lưu Thay Đổi!' : 'Lưu Cấu Hình Giải Đấu'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
