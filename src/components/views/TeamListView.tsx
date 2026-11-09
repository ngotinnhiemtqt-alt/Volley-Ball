import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Search,
  Upload,
  Download,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Sparkles,
  X,
  Shuffle,
} from 'lucide-react';
import { Team, Tournament } from '../../types/tournament';
import { ExportService } from '../../services/exportService';

interface TeamListViewProps {
  tournament: Tournament;
  teams: Team[];
  onSaveTeams: (teams: Team[]) => void;
}

export const TeamListView: React.FC<TeamListViewProps> = ({
  tournament,
  teams,
  onSaveTeams,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [seedFilter, setSeedFilter] = useState<string>('all');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // New/Edit form state
  const [formData, setFormData] = useState<Partial<Team>>({
    code: '',
    name: '',
    shortName: '',
    unit: '',
    coach: '',
    phone: '',
    seedGroup: 0,
    notes: '',
  });

  // Duplicates check
  const duplicateWarnings = useMemo(() => {
    const warnings: string[] = [];
    const nameMap = new Map<string, number>();
    const codeMap = new Map<string, number>();

    teams.forEach((t) => {
      const cleanName = t.name.trim().toLowerCase();
      const cleanCode = t.code.trim().toLowerCase();
      nameMap.set(cleanName, (nameMap.get(cleanName) || 0) + 1);
      if (cleanCode) codeMap.set(cleanCode, (codeMap.get(cleanCode) || 0) + 1);
    });

    nameMap.forEach((cnt, name) => {
      if (cnt > 1) {
        warnings.push(`Tên đội "${name}" bị trùng lặp ${cnt} lần.`);
      }
    });

    codeMap.forEach((cnt, code) => {
      if (cnt > 1) {
        warnings.push(`Mã đội "${code}" bị trùng lặp ${cnt} lần.`);
      }
    });

    return warnings;
  }, [teams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.coach && t.coach.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSeed =
        seedFilter === 'all'
          ? true
          : seedFilter === 'unseeded'
          ? !t.seedGroup || t.seedGroup === 0
          : t.seedGroup === Number(seedFilter);

      return matchSearch && matchSeed;
    });
  }, [teams, searchQuery, seedFilter]);

  // Seed group counts
  const seedStats = useMemo(() => {
    const s1 = teams.filter((t) => t.seedGroup === 1).length;
    const s2 = teams.filter((t) => t.seedGroup === 2).length;
    const s3 = teams.filter((t) => t.seedGroup === 3).length;
    const unseeded = teams.filter((t) => !t.seedGroup || t.seedGroup === 0).length;
    return { s1, s2, s3, unseeded };
  }, [teams]);

  const handleOpenAdd = () => {
    const nextCode = String(teams.length + 1).padStart(2, '0');
    setFormData({
      code: nextCode,
      name: `Đội ${nextCode}`,
      shortName: `Đ${nextCode}`,
      unit: '',
      coach: '',
      phone: '',
      seedGroup: 0,
      notes: '',
    });
    setEditingTeam(null);
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ ...team });
    setIsNewModalOpen(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingTeam) {
      // Update
      const updated = teams.map((t) =>
        t.id === editingTeam.id
          ? ({ ...t, ...formData } as Team)
          : t
      );
      onSaveTeams(updated);
    } else {
      // Create
      const newTeam: Team = {
        id: 'TEAM_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        code: formData.code || String(teams.length + 1).padStart(2, '0'),
        name: formData.name.trim(),
        shortName: formData.shortName || formData.name.substring(0, 6),
        unit: formData.unit?.trim() || '',
        coach: formData.coach || '',
        phone: formData.phone || '',
        seedGroup: Number(formData.seedGroup) || 0,
        notes: formData.notes || '',
      };
      onSaveTeams([...teams, newTeam]);
    }
    setIsNewModalOpen(false);
  };

  const handleDeleteTeam = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đội này khỏi danh sách?')) {
      onSaveTeams(teams.filter((t) => t.id !== id));
    }
  };

  const handleDuplicateTeam = (team: Team) => {
    const copy: Team = {
      ...team,
      id: 'TEAM_' + Date.now(),
      code: team.code + '_CP',
      name: team.name + ' (Bản sao)',
    };
    onSaveTeams([...teams, copy]);
  };

  const handleBulkImport = () => {
    const lines = bulkText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const newTeams: Team[] = lines.map((line, idx) => {
      // If line has tab, parse: Name \t Unit \t Seed
      const parts = line.split('\t').map((p) => p.trim());
      const name = parts[0];
      const unit = parts[1] || '';
      let seedGroup = 0;
      if (parts[2]) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) seedGroup = parsed;
      }

      const codeNum = teams.length + idx + 1;
      return {
        id: 'TEAM_' + Date.now() + '_' + idx,
        code: String(codeNum).padStart(2, '0'),
        name,
        shortName: name.substring(0, 6),
        unit,
        seedGroup,
      };
    });

    onSaveTeams([...teams, ...newTeams]);
    setBulkText('');
    setIsBulkModalOpen(false);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const { teams: imported, errors } = ExportService.parseTeamsFromCsv(text);
          if (imported.length > 0) {
            onSaveTeams([...teams, ...imported]);
            alert(`Đã nhập thành công ${imported.length} đội từ file CSV!`);
          } else {
            alert('Không thể nhận diện danh sách đội: ' + errors.join('\n'));
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Danh Sách Đội & Vận Động Viên</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý đội thi đấu, gán nhóm hạt giống và đơn vị trực thuộc để thuật toán bốc thăm xử lý
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Nhập nhiều đội (Dán text)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer border border-slate-700 transition-colors">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nhập CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>

          <button
            onClick={() => ExportService.exportTeamsToCsv(tournament, teams)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Đội Mới</span>
          </button>
        </div>
      </div>

      {/* Seed Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Tổng số đội:</span>
          <span className="text-sm font-bold font-mono text-white tabular-nums">{teams.length} đội</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-amber-400">Hạt giống 1:</span>
          <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">{seedStats.s1} đội</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-blue-400">Hạt giống 2:</span>
          <span className="text-sm font-bold font-mono text-blue-300 tabular-nums">{seedStats.s2} đội</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Không hạt giống:</span>
          <span className="text-sm font-bold font-mono text-slate-300 tabular-nums">{seedStats.unseeded} đội</span>
        </div>
      </div>

      {/* Duplicate / Validation Alerts */}
      {duplicateWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cảnh báo dữ liệu trùng lặp phát hiện:</span>
          </div>
          <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-0.5 pl-1">
            {duplicateWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên đội, mã, đơn vị..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSeedFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              seedFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({teams.length})
          </button>
          <button
            onClick={() => setSeedFilter('1')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              seedFilter === '1' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hạt giống 1 ({seedStats.s1})
          </button>
          <button
            onClick={() => setSeedFilter('2')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              seedFilter === '2' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hạt giống 2 ({seedStats.s2})
          </button>
          <button
            onClick={() => setSeedFilter('unseeded')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              seedFilter === 'unseeded' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tự do ({seedStats.unseeded})
          </button>
        </div>
      </div>

      {/* Teams Data Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
              <th className="py-3 px-3 w-12 text-center font-mono">STT</th>
              <th className="py-3 px-3 w-20 font-mono">Mã</th>
              <th className="py-3 px-4">Tên Đội / Vận Động Viên</th>
              <th className="py-3 px-4">Đơn Vị Trực Thuộc</th>
              <th className="py-3 px-3">HLV / Trưởng Đoàn</th>
              <th className="py-3 px-3 text-center">Hạt Giống</th>
              <th className="py-3 px-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Không tìm thấy đội nào phù hợp điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredTeams.map((team, index) => (
                <tr key={team.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500 tabular-nums">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-400">
                    {team.code}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
                      {team.name}
                    </div>
                    {team.shortName && team.shortName !== team.name && (
                      <div className="text-[11px] text-slate-500">Viết tắt: {team.shortName}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {team.unit || <span className="text-slate-600 italic">Tự do</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {team.coach ? (
                      <div>
                        <span>{team.coach}</span>
                        {team.phone && <span className="text-[10px] text-slate-500 block">{team.phone}</span>}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {team.seedGroup && team.seedGroup > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/70 text-amber-300 border border-amber-800/70">
                        Hạt giống {team.seedGroup}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Tự do</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDuplicateTeam(team)}
                        title="Tạo bản sao"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(team)}
                        title="Chỉnh sửa đội"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        title="Xóa đội"
                        className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Team */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{editingTeam ? 'Chỉnh Sửa Thông Tin Đội' : 'Thêm Đội Thi Đấu Mới'}</span>
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Mã đội</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Tên đội / Vận động viên <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
                    placeholder="VD: Đội bóng chuyền THPT Chu Văn An"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Tên viết tắt</label>
                  <input
                    type="text"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    placeholder="VD: CVA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Đơn vị / Cơ quan / CLB</label>
                  <input
                    type="text"
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    placeholder="VD: Trường THPT Chu Văn An"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">HLV / Trưởng đoàn</label>
                  <input
                    type="text"
                    value={formData.coach || ''}
                    onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Nhóm hạt giống</label>
                <select
                  value={formData.seedGroup || 0}
                  onChange={(e) => setFormData({ ...formData, seedGroup: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value={0}>Không hạt giống (Bốc thăm tự do)</option>
                  <option value={1}>Hạt giống số 1 (Đương kim vô địch / Đầu bảng)</option>
                  <option value={2}>Hạt giống số 2 (Á quân / Nhóm mạnh)</option>
                  <option value={3}>Hạt giống số 3</option>
                  <option value={4}>Hạt giống số 4</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Khi bốc thăm chế độ hạt giống, các đội cùng nhóm hạt giống sẽ được phân bố đều vào các bảng khác nhau.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                >
                  {editingTeam ? 'Cập Nhật' : 'Thêm Đội'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bulk Quick Paste */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Nhập Nhanh Nhiều Đội (Dán Văn Bản)</span>
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dán danh sách các đội vào khung bên dưới, mỗi dòng tương ứng một đội. Bạn có thể copy trực tiếp từ Excel hoặc Word.
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Đội bóng chuyền 01&#10;Đội bóng chuyền 02&#10;Đội bóng chuyền 03&#10;Đội bóng chuyền 04"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                Số dòng nhận diện: {bulkText.split(/\r?\n/).filter((l) => l.trim()).length}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  Nhập Vào Danh Sách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
