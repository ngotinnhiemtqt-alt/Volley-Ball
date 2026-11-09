/**
 * BỐC THĂM THI ĐẤU PRO 2027
 * Storage & State Persistence Service with BroadcastChannel Multi-Screen Sync
 */

import {
  Tournament,
  Team,
  GroupDrawResult,
  MatchupDrawResult,
  OrderDrawResult,
  BracketData,
  ScheduleMatch,
  AuditLog,
} from '../types/tournament';

const STORAGE_KEYS = {
  TOURNAMENTS: 'tournament_draw_tournaments_v1',
  ACTIVE_TOURNAMENT_ID: 'tournament_draw_active_id_v1',
  TEAMS_PREFIX: 'tournament_draw_teams_',
  GROUP_DRAW_PREFIX: 'tournament_draw_group_res_',
  MATCHUP_DRAW_PREFIX: 'tournament_draw_matchup_res_',
  ORDER_DRAW_PREFIX: 'tournament_draw_order_res_',
  BRACKET_PREFIX: 'tournament_draw_bracket_',
  SCHEDULE_PREFIX: 'tournament_draw_schedule_',
  AUDIT_LOGS_PREFIX: 'tournament_draw_audit_',
  DARK_MODE: 'tournament_draw_theme_dark',
};

// Default Sample Tournament (As specified in Section XVIII of prompt)
const DEFAULT_TOURNAMENT: Tournament = {
  id: 'TOUR_DEMO_2027',
  code: 'BC-2011',
  name: 'GIẢI BÓNG CHUYỀN CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11',
  sport: 'Bóng chuyền',
  organizer: 'Sở Giáo Dục & Đào Tạo — Công Đoàn Ngành Giáo Dục',
  coOrganizer: 'Trung Tâm Văn Hóa Thể Thao Quận',
  location: 'Nhà Thi Đấu Đa Năng Thể Thao Trung Tâm',
  startDate: '2027-11-18',
  endDate: '2027-11-20',
  expectedTeamsCount: 8,
  format: 'groups_knockout',
  numberOfGroups: 2,
  advancePerGroup: 2,
  hasThirdPlaceMatch: true,
  notes: 'Giải đấu truyền thống chào mừng Ngày Nhà giáo Việt Nam 20/11. 8 đội chia làm 2 bảng A và B, thi đấu vòng tròn 1 lượt chọn 2 đội nhất nhì mỗi bảng vào bán kết và chung kết.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const DEFAULT_TEAMS: Team[] = [
  {
    id: 'TEAM_01',
    code: '01',
    name: 'Đội bóng chuyền 01',
    shortName: 'ĐBC 01',
    unit: 'THPT Chuyên Hà Nội - Amsterdam',
    coach: 'Nguyễn Văn An',
    phone: '0912 345 678',
    seedGroup: 1, // Hạt giống 1
    color: '#168BFF',
    notes: 'Đương kim vô địch giải năm trước',
  },
  {
    id: 'TEAM_02',
    code: '02',
    name: 'Đội bóng chuyền 02',
    shortName: 'ĐBC 02',
    unit: 'THPT Chu Văn An',
    coach: 'Trần Văn Bình',
    phone: '0983 222 333',
    seedGroup: 1, // Hạt giống 1
    color: '#FF8C32',
    notes: 'Á quân giải năm trước',
  },
  {
    id: 'TEAM_03',
    code: '03',
    name: 'Đội bóng chuyền 03',
    shortName: 'ĐBC 03',
    unit: 'THPT Kim Liên',
    coach: 'Lê Hoàng Cường',
    phone: '0904 111 222',
    seedGroup: 2, // Hạt giống 2
    color: '#10B981',
    notes: 'Hạng ba giải năm trước',
  },
  {
    id: 'TEAM_04',
    code: '04',
    name: 'Đội bóng chuyền 04',
    shortName: 'ĐBC 04',
    unit: 'THPT Việt Đức',
    coach: 'Phạm Đức Dũng',
    phone: '0977 444 555',
    seedGroup: 2, // Hạt giống 2
    color: '#8B5CF6',
    notes: 'Đội triển vọng',
  },
  {
    id: 'TEAM_05',
    code: '05',
    name: 'Đội bóng chuyền 05',
    shortName: 'ĐBC 05',
    unit: 'THPT Thăng Long',
    coach: 'Hoàng Minh Tuấn',
    phone: '0915 666 777',
    seedGroup: 0,
    color: '#EC4899',
  },
  {
    id: 'TEAM_06',
    code: '06',
    name: 'Đội bóng chuyền 06',
    shortName: 'ĐBC 06',
    unit: 'THPT Yên Hòa',
    coach: 'Vũ Quốc Huy',
    phone: '0936 888 999',
    seedGroup: 0,
    color: '#F59E0B',
  },
  {
    id: 'TEAM_07',
    code: '07',
    name: 'Đội bóng chuyền 07',
    shortName: 'ĐBC 07',
    unit: 'THPT Phan Đình Phùng',
    coach: 'Đặng Tuấn Anh',
    phone: '0948 123 321',
    seedGroup: 0,
    color: '#06B6D4',
  },
  {
    id: 'TEAM_08',
    code: '08',
    name: 'Đội bóng chuyền 08',
    shortName: 'ĐBC 08',
    unit: 'THPT Trần Phú',
    coach: 'Ngô Tấn Tài',
    phone: '0988 654 321',
    seedGroup: 0,
    color: '#14B8A6',
  },
];

class StorageService {
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('TOURNAMENT_DRAW_LED_CHANNEL');
      } catch {
        // Fallback
      }
    }
  }

  public getBroadcastChannel(): BroadcastChannel | null {
    return this.broadcastChannel;
  }

  public notifyLedScreen(message: { type: string; payload: unknown }) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {
        // Ignore
      }
    }
  }

  // --- Tournaments ---
  public getTournaments(): Tournament[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
      if (!data) {
        this.saveTournaments([DEFAULT_TOURNAMENT]);
        this.saveTeams(DEFAULT_TOURNAMENT.id, DEFAULT_TEAMS);
        this.setActiveTournamentId(DEFAULT_TOURNAMENT.id);
        return [DEFAULT_TOURNAMENT];
      }
      return JSON.parse(data);
    } catch {
      return [DEFAULT_TOURNAMENT];
    }
  }

  public saveTournaments(tournaments: Tournament[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
    } catch (e) {
      console.error('Save tournaments failed', e);
    }
  }

  public getActiveTournament(): Tournament {
    const list = this.getTournaments();
    const activeId = this.getActiveTournamentId();
    const found = list.find((t) => t.id === activeId);
    return found || list[0] || DEFAULT_TOURNAMENT;
  }

  public getActiveTournamentId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID) || DEFAULT_TOURNAMENT.id;
  }

  public setActiveTournamentId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, id);
    this.notifyLedScreen({ type: 'SWITCH_TOURNAMENT', payload: { tournamentId: id } });
  }

  // --- Teams ---
  public getTeams(tournamentId: string): Team[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS_PREFIX + tournamentId);
      if (!data) {
        if (tournamentId === DEFAULT_TOURNAMENT.id) {
          this.saveTeams(tournamentId, DEFAULT_TEAMS);
          return DEFAULT_TEAMS;
        }
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public saveTeams(tournamentId: string, teams: Team[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS_PREFIX + tournamentId, JSON.stringify(teams));
      this.notifyLedScreen({ type: 'TEAMS_UPDATED', payload: { tournamentId, count: teams.length } });
    } catch (e) {
      console.error('Save teams failed', e);
    }
  }

  // --- Group Draw Results ---
  public getGroupDrawResult(tournamentId: string): GroupDrawResult | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROUP_DRAW_PREFIX + tournamentId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveGroupDrawResult(tournamentId: string, result: GroupDrawResult) {
    try {
      localStorage.setItem(STORAGE_KEYS.GROUP_DRAW_PREFIX + tournamentId, JSON.stringify(result));
      this.notifyLedScreen({ type: 'GROUP_DRAW_UPDATED', payload: { tournamentId, result } });
    } catch (e) {
      console.error('Save group draw failed', e);
    }
  }

  // --- Matchup Draw Results ---
  public getMatchupDrawResult(tournamentId: string): MatchupDrawResult | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHUP_DRAW_PREFIX + tournamentId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveMatchupDrawResult(tournamentId: string, result: MatchupDrawResult) {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHUP_DRAW_PREFIX + tournamentId, JSON.stringify(result));
      this.notifyLedScreen({ type: 'MATCHUP_DRAW_UPDATED', payload: { tournamentId, result } });
    } catch (e) {
      console.error('Save matchup draw failed', e);
    }
  }

  // --- Order Draw Results ---
  public getOrderDrawResult(tournamentId: string): OrderDrawResult | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDER_DRAW_PREFIX + tournamentId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveOrderDrawResult(tournamentId: string, result: OrderDrawResult) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDER_DRAW_PREFIX + tournamentId, JSON.stringify(result));
      this.notifyLedScreen({ type: 'ORDER_DRAW_UPDATED', payload: { tournamentId, result } });
    } catch (e) {
      console.error('Save order draw failed', e);
    }
  }

  // --- Bracket Data ---
  public getBracketData(tournamentId: string): BracketData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRACKET_PREFIX + tournamentId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveBracketData(tournamentId: string, data: BracketData) {
    try {
      localStorage.setItem(STORAGE_KEYS.BRACKET_PREFIX + tournamentId, JSON.stringify(data));
      this.notifyLedScreen({ type: 'BRACKET_UPDATED', payload: { tournamentId, data } });
    } catch (e) {
      console.error('Save bracket failed', e);
    }
  }

  // --- Schedule ---
  public getSchedule(tournamentId: string): ScheduleMatch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE_PREFIX + tournamentId);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveSchedule(tournamentId: string, matches: ScheduleMatch[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE_PREFIX + tournamentId, JSON.stringify(matches));
      this.notifyLedScreen({ type: 'SCHEDULE_UPDATED', payload: { tournamentId, count: matches.length } });
    } catch (e) {
      console.error('Save schedule failed', e);
    }
  }

  // --- Audit Logs ---
  public getAuditLogs(tournamentId: string): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS_PREFIX + tournamentId);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    try {
      const logs = this.getAuditLogs(log.tournamentId);
      const newEntry: AuditLog = {
        ...log,
        id: 'LOG_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
      };
      logs.unshift(newEntry);
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS_PREFIX + log.tournamentId, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error('Add audit log failed', e);
    }
  }

  // --- Backup Export / Import ---
  public exportFullBackup(): string {
    const active = this.getActiveTournament();
    const backup = {
      exportVersion: '1.0',
      timestamp: Date.now(),
      exportedAt: new Date().toISOString(),
      tournament: active,
      teams: this.getTeams(active.id),
      groupDrawResult: this.getGroupDrawResult(active.id),
      matchupDrawResult: this.getMatchupDrawResult(active.id),
      orderDrawResult: this.getOrderDrawResult(active.id),
      bracketData: this.getBracketData(active.id),
      schedule: this.getSchedule(active.id),
      auditLogs: this.getAuditLogs(active.id),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importFullBackup(jsonContent: string): { success: boolean; message: string; tournamentId?: string } {
    try {
      const data = JSON.parse(jsonContent);
      if (!data.tournament || !data.tournament.id) {
        return { success: false, message: 'Tệp JSON không hợp lệ hoặc thiếu thông tin giải đấu.' };
      }

      const tour = data.tournament as Tournament;
      const tournaments = this.getTournaments();
      const existingIdx = tournaments.findIndex((t) => t.id === tour.id);

      if (existingIdx >= 0) {
        tournaments[existingIdx] = tour;
      } else {
        tournaments.unshift(tour);
      }

      this.saveTournaments(tournaments);
      this.setActiveTournamentId(tour.id);

      if (Array.isArray(data.teams)) {
        this.saveTeams(tour.id, data.teams);
      }
      if (data.groupDrawResult) {
        this.saveGroupDrawResult(tour.id, data.groupDrawResult);
      }
      if (data.matchupDrawResult) {
        this.saveMatchupDrawResult(tour.id, data.matchupDrawResult);
      }
      if (data.orderDrawResult) {
        this.saveOrderDrawResult(tour.id, data.orderDrawResult);
      }
      if (data.bracketData) {
        this.saveBracketData(tour.id, data.bracketData);
      }
      if (Array.isArray(data.schedule)) {
        this.saveSchedule(tour.id, data.schedule);
      }

      return {
        success: true,
        message: `Khôi phục thành công giải đấu "${tour.name}" với ${data.teams?.length || 0} đội.`,
        tournamentId: tour.id,
      };
    } catch (err) {
      return { success: false, message: 'Lỗi đọc tệp JSON: ' + (err instanceof Error ? err.message : String(err)) };
    }
  }

  // --- Reset to Default Demo ---
  public resetToDefaultDemo() {
    this.saveTournaments([DEFAULT_TOURNAMENT]);
    this.saveTeams(DEFAULT_TOURNAMENT.id, DEFAULT_TEAMS);
    this.setActiveTournamentId(DEFAULT_TOURNAMENT.id);
    localStorage.removeItem(STORAGE_KEYS.GROUP_DRAW_PREFIX + DEFAULT_TOURNAMENT.id);
    localStorage.removeItem(STORAGE_KEYS.MATCHUP_DRAW_PREFIX + DEFAULT_TOURNAMENT.id);
    localStorage.removeItem(STORAGE_KEYS.ORDER_DRAW_PREFIX + DEFAULT_TOURNAMENT.id);
    localStorage.removeItem(STORAGE_KEYS.BRACKET_PREFIX + DEFAULT_TOURNAMENT.id);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE_PREFIX + DEFAULT_TOURNAMENT.id);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS_PREFIX + DEFAULT_TOURNAMENT.id);
  }
}

export const storageService = new StorageService();
