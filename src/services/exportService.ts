/**
 * BỐC THĂM THI ĐẤU PRO 2027
 * Export & Import Service (CSV, JSON, Print Reports)
 */

import { Team, GroupDrawResult, MatchupDrawResult, ScheduleMatch, Tournament } from '../types/tournament';

export class ExportService {
  /**
   * Triggers a browser download of a text/csv/json file
   */
  public static downloadFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export Teams list to CSV
   */
  public static exportTeamsToCsv(tournament: Tournament, teams: Team[]) {
    const headers = ['STT', 'Mã Đội', 'Tên Đội / VĐV', 'Tên Viết Tắt', 'Đơn Vị', 'HLV / Trưởng Đoàn', 'SĐT', 'Hạt Giống', 'Ghi Chú'];
    const rows = teams.map((team, idx) => [
      idx + 1,
      `"${team.code || ''}"`,
      `"${team.name}"`,
      `"${team.shortName || ''}"`,
      `"${team.unit || ''}"`,
      `"${team.coach || ''}"`,
      `"${team.phone || ''}"`,
      team.seedGroup ? `Hạt giống ${team.seedGroup}` : 'Không',
      `"${team.notes || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const safeName = tournament.name.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);
    this.downloadFile(`Danh_Sach_Doi_${safeName}.csv`, csvContent, 'text/csv;charset=utf-8');
  }

  /**
   * Parse CSV content into Team[]
   */
  public static parseTeamsFromCsv(csvText: string): { teams: Team[]; errors: string[] } {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const teams: Team[] = [];
    const errors: string[] = [];

    if (lines.length <= 1) {
      return { teams: [], errors: ['Tệp CSV không có dữ liệu đội thi đấu.'] };
    }

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple regex split for CSV with quotes
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleaned = cols.map((c) => c.replace(/^"|"$/g, '').trim());

      if (cleaned.length < 2) continue;

      const code = cleaned[1] || `D${String(i).padStart(2, '0')}`;
      const name = cleaned[2] || cleaned[1] || `Đội ${i}`;
      const shortName = cleaned[3] || name.substring(0, 6);
      const unit = cleaned[4] || '';
      const coach = cleaned[5] || '';
      const phone = cleaned[6] || '';
      const seedStr = cleaned[7] || '';
      let seedGroup = 0;
      if (seedStr.includes('1')) seedGroup = 1;
      else if (seedStr.includes('2')) seedGroup = 2;
      else if (seedStr.includes('3')) seedGroup = 3;

      teams.push({
        id: `TEAM_${Date.now()}_${i}`,
        code,
        name,
        shortName,
        unit,
        coach,
        phone,
        seedGroup,
      });
    }

    return { teams, errors };
  }

  /**
   * Export Group Draw Results to CSV
   */
  public static exportGroupDrawToCsv(tournament: Tournament, result: GroupDrawResult) {
    const rows: string[] = [];
    rows.push(`GIẢI ĐẤU:,"${tournament.name}"`);
    rows.push(`ĐƠN VỊ TỔ CHỨC:,"${tournament.organizer}"`);
    rows.push(`THỜI GIAN:,"${new Date(result.timestamp).toLocaleString('vi-VN')}"`);
    rows.push(`MÃ KẾT QUẢ:,"${result.drawId}"`);
    rows.push('');

    result.groups.forEach((grp) => {
      rows.push(`BẢNG ${grp.name}`);
      rows.push('Vị trí,Mã đội,Tên Đội,Đơn Vị,Nhóm Hạt Giống');
      grp.teams.forEach((team, idx) => {
        rows.push(`${grp.name}${idx + 1},"${team.code}","${team.name}","${team.unit || ''}",${team.seedGroup ? `Hạt giống ${team.seedGroup}` : 'Tự do'}`);
      });
      rows.push('');
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const safeName = tournament.name.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);
    this.downloadFile(`Ket_Qua_Chia_Bang_${safeName}.csv`, csvContent, 'text/csv;charset=utf-8');
  }

  /**
   * Export Matchups to CSV
   */
  public static exportMatchupsToCsv(tournament: Tournament, result: MatchupDrawResult) {
    const rows: string[] = [];
    rows.push(`GIẢI ĐẤU:,"${tournament.name}"`);
    rows.push(`BỐC THĂM ĐỐI ĐẦU`);
    rows.push(`THỜI GIAN:,"${new Date(result.timestamp).toLocaleString('vi-VN')}"`);
    rows.push('');
    rows.push('Trận,Đội 1 (Home),Đơn Vị 1,VS,Đội 2 (Away),Đơn Vị 2,Sân Thi Đấu,Ghi Chú');

    result.matchups.forEach((m) => {
      rows.push(
        `Trận ${m.matchNumber},"${m.teamA?.name || ''}","${m.teamA?.unit || ''}",VS,"${m.teamB?.name || (m.isBye ? 'MIỄN THI ĐẤU (BYE)' : '')}","${m.teamB?.unit || ''}","${m.court || ''}","${m.notes || ''}"`
      );
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const safeName = tournament.name.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);
    this.downloadFile(`Ket_Qua_Doi_Dau_${safeName}.csv`, csvContent, 'text/csv;charset=utf-8');
  }

  /**
   * Export Round Robin Schedule to CSV
   */
  public static exportScheduleToCsv(tournament: Tournament, schedule: ScheduleMatch[]) {
    const rows: string[] = [];
    rows.push(`LỊCH THI ĐẤU — ${tournament.name}`);
    rows.push(`Môn: ${tournament.sport} | Địa điểm: ${tournament.location}`);
    rows.push('');
    rows.push('Trận,Vòng,Bảng,Ngày,Giờ,Sân,Đội 1,Đội 2,Tỷ Số,Trạng Thái');

    schedule.forEach((m) => {
      rows.push(
        `${m.matchNumber},Vòng ${m.roundNumber},Bảng ${m.groupName},${m.date},${m.time},"${m.court}","${m.teamA.name}","${m.teamB.name}",${m.scoreA !== undefined ? `${m.scoreA} - ${m.scoreB}` : 'Chưa đấu'},${m.status}`
      );
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const safeName = tournament.name.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);
    this.downloadFile(`Lich_Thi_Dau_${safeName}.csv`, csvContent, 'text/csv;charset=utf-8');
  }

  /**
   * Browser Print Helper
   */
  public static printPage() {
    window.print();
  }
}
