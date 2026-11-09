/**
 * BỐC THĂM THI ĐẤU PRO 2027
 * TypeScript Type Definitions
 */

export type SportType = 
  | 'Bóng chuyền'
  | 'Bóng đá'
  | 'Cầu lông'
  | 'Bóng bàn'
  | 'Bóng rổ'
  | 'Kéo co'
  | 'Điền kinh'
  | 'Pickleball'
  | 'Hội thao toàn diện'
  | 'Khác';

export type TournamentFormat = 
  | 'groups_knockout' // Chia bảng kết hợp loại trực tiếp
  | 'single_elimination' // Đấu loại trực tiếp
  | 'round_robin_single' // Vòng tròn 1 lượt
  | 'round_robin_double' // Vòng tròn 2 lượt
  | 'free_matchup' // Bốc thăm đối đầu tự do
  | 'order_only'; // Bốc thăm số thứ tự

export interface Team {
  id: string; // e.g., "TEAM_01"
  code: string; // e.g., "01" or "BC-01"
  name: string; // e.g., "Đội bóng chuyền 01"
  shortName: string; // e.g., "ĐBC 01"
  unit: string; // e.g., "THPT Chuyên Hà Nội - Amsterdam"
  coach?: string; // HLV / Trưởng đoàn
  phone?: string;
  seedGroup?: number; // 0 = Không hạt giống, 1 = Hạt giống số 1, 2 = Hạt giống số 2, v.v.
  color?: string; // Accent color hex
  logo?: string;
  notes?: string;
}

export interface Tournament {
  id: string;
  code: string;
  name: string;
  sport: SportType;
  organizer: string; // Đơn vị tổ chức
  coOrganizer?: string; // Đơn vị phối hợp
  location: string;
  startDate: string;
  endDate: string;
  expectedTeamsCount: number;
  format: TournamentFormat;
  numberOfGroups: number; // e.g., 2, 4
  advancePerGroup: number; // e.g., 2 (Nhất, Nhì mỗi bảng)
  hasThirdPlaceMatch: boolean;
  notes?: string;
  bannerUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GroupConfig {
  groupCount: number;
  groupNames: string[]; // ['A', 'B', 'C', 'D']
  maxTeamsPerGroup?: number;
  balanced: boolean;
  mode: 'random' | 'seeded' | 'avoid_same_unit';
  seedRules?: { [seedLevel: number]: 'distribute_evenly' | 'random' };
}

export interface GroupDrawResult {
  tournamentId: string;
  drawId: string;
  timestamp: number;
  isLocked: boolean;
  groups: {
    name: string; // 'A', 'B', etc.
    teams: Team[];
  }[];
  unassignedTeams: Team[];
  logs: string[];
}

export interface Matchup {
  id: string;
  matchNumber: number;
  teamA: Team | null;
  teamB: Team | null; // null if BYE
  isBye?: boolean;
  groupName?: string;
  court?: string;
  scheduledTime?: string;
  scoreA?: number;
  scoreB?: number;
  winnerTeamId?: string;
  notes?: string;
}

export interface MatchupDrawResult {
  tournamentId: string;
  drawId: string;
  timestamp: number;
  isLocked: boolean;
  matchups: Matchup[];
  hasBye: boolean;
  byeTeams: Team[];
  logs: string[];
}

export interface OrderItem {
  orderNumber: number;
  team: Team;
  timestamp: number;
}

export interface OrderDrawResult {
  tournamentId: string;
  drawId: string;
  timestamp: number;
  isLocked: boolean;
  items: OrderItem[];
  availableNumbers: number[];
}

export interface BracketMatch {
  id: string;
  roundNumber: number; // 1 = R16 / Tứ kết, etc.
  matchIndex: number; // index in round
  roundName: string; // "Vòng loại", "Tứ kết", "Bán kết", "Chung kết", "Tranh hạng ba"
  teamA: Team | null;
  teamB: Team | null;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  nextMatchId?: string;
  nextMatchSlot?: 'A' | 'B';
  court?: string;
  time?: string;
}

export interface BracketData {
  tournamentId: string;
  rounds: {
    roundNumber: number;
    roundName: string;
    matches: BracketMatch[];
  }[];
  thirdPlaceMatch?: BracketMatch;
  isLocked: boolean;
}

export interface ScheduleMatch {
  id: string;
  roundNumber: number;
  matchNumber: number;
  groupName: string;
  teamA: Team;
  teamB: Team;
  date: string;
  time: string;
  court: string;
  scoreA?: number;
  scoreB?: number;
  status: 'scheduled' | 'live' | 'finished';
}

export interface AuditLog {
  id: string;
  tournamentId: string;
  action: string;
  drawType: 'group' | 'matchup' | 'order' | 'position' | 'schedule' | 'bracket';
  timestamp: number;
  details: string;
  cryptoHash: string; // Audit integrity hash
}
