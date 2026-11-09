/**
 * BỐC THĂM THI ĐẤU PRO 2027
 * Cryptographic Draw Engine
 * Implements Web Crypto API unbiased sampling, Fisher-Yates shuffle,
 * Seed distribution, Backtracking CSP for unit conflict prevention,
 * Circle Method for Round-Robin scheduling, and Single Elimination Brackets.
 */

import {
  Team,
  GroupConfig,
  GroupDrawResult,
  Matchup,
  MatchupDrawResult,
  OrderItem,
  OrderDrawResult,
  BracketData,
  BracketMatch,
  ScheduleMatch,
} from '../types/tournament';

export class DrawEngine {
  /**
   * Generates a cryptographically secure random 32-bit unsigned integer
   */
  public static getRandomUint32(): number {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  }

  /**
   * Generates an unbiased random integer in [min, max] inclusive
   * using rejection sampling to eliminate modulo bias.
   */
  public static getRandomInt(min: number, max: number): number {
    if (min > max) throw new Error('min cannot be greater than max');
    if (min === max) return min;

    const range = max - min + 1;
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);

    let rand: number;
    do {
      rand = this.getRandomUint32();
    } while (rand >= limit);

    return min + (rand % range);
  }

  /**
   * Cryptographically secure Fisher-Yates array shuffle (in-place clone)
   */
  public static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.getRandomInt(0, i);
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  /**
   * Generates a SHA-256 or pseudo-cryptographic hash for draw verification
   */
  public static async computeAuditHash(payload: string): Promise<string> {
    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(payload + '_' + Date.now());
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16).toUpperCase();
      }
    } catch {
      // Fallback
    }
    // Fallback hash
    let hash = 0;
    const str = payload + Date.now();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  }

  /**
   * Validates if a group draw with unit constraint is mathematically feasible
   */
  public static validateUnitFeasibility(
    teams: Team[],
    groupCount: number,
    groupCapacities: number[]
  ): { feasible: boolean; reason?: string } {
    if (groupCount <= 0) return { feasible: false, reason: 'Số lượng bảng phải lớn hơn 0' };
    if (teams.length === 0) return { feasible: false, reason: 'Danh sách đội trống' };

    // Count teams per unit
    const unitCounts: { [unit: string]: number } = {};
    for (const team of teams) {
      const unit = (team.unit || 'Độc lập').trim();
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
      if (unitCounts[unit] > groupCount) {
        return {
          feasible: false,
          reason: `Đơn vị "${unit}" có ${unitCounts[unit]} đội, nhưng chỉ có ${groupCount} bảng đấu. Không thể xếp mỗi đội vào một bảng khác nhau mà không bị trùng đơn vị!`,
        };
      }
    }

    const totalCap = groupCapacities.reduce((a, b) => a + b, 0);
    if (teams.length > totalCap) {
      return {
        feasible: false,
        reason: `Tổng số đội (${teams.length}) vượt quá tổng sức chứa của các bảng (${totalCap}).`,
      };
    }

    return { feasible: true };
  }

  /**
   * Group Draw with Seeding and Backtracking CSP for same-unit avoidance
   */
  public static drawGroups(
    tournamentId: string,
    teams: Team[],
    config: GroupConfig
  ): GroupDrawResult {
    const { groupCount, groupNames, mode } = config;
    const logs: string[] = [];
    logs.push(`Khởi động thuật toán bốc thăm chia ${groupCount} bảng (${groupNames.join(', ')}) cho ${teams.length} đội.`);

    // Calculate capacities for each group
    const baseCapacity = Math.floor(teams.length / groupCount);
    const remainder = teams.length % groupCount;
    const capacities: number[] = [];
    for (let i = 0; i < groupCount; i++) {
      capacities.push(baseCapacity + (i < remainder ? 1 : 0));
    }

    // Initialize group buckets
    const groups: { name: string; teams: Team[] }[] = groupNames.map((name) => ({
      name,
      teams: [],
    }));

    if (teams.length === 0) {
      return {
        tournamentId,
        drawId: 'DRAW_GRP_' + Date.now(),
        timestamp: Date.now(),
        isLocked: false,
        groups,
        unassignedTeams: [],
        logs: ['Danh sách đội trống.'],
      };
    }

    // Sort or partition teams by seed if seeded mode is selected
    let orderedTeams: Team[] = [];

    if (mode === 'seeded') {
      // Group by seed level: 1, 2, 3... 0 (unseeded)
      const seedMap = new Map<number, Team[]>();
      teams.forEach((t) => {
        const seed = t.seedGroup && t.seedGroup > 0 ? t.seedGroup : 999;
        if (!seedMap.has(seed)) seedMap.set(seed, []);
        seedMap.get(seed)!.push(t);
      });

      const sortedSeeds = Array.from(seedMap.keys()).sort((a, b) => a - b);
      sortedSeeds.forEach((s) => {
        const seedTeams = seedMap.get(s)!;
        orderedTeams.push(...this.shuffle(seedTeams));
      });
      logs.push(`Phân bổ nhóm hạt giống: ưu tiên hạt giống phân bổ đều các bảng.`);
    } else {
      orderedTeams = this.shuffle(teams);
      logs.push(`Xáo trộn ngẫu nhiên toàn bộ danh sách đội bằng thuật toán Fisher-Yates.`);
    }

    if (mode === 'avoid_same_unit') {
      // Backtracking CSP to assign teams such that no two teams with the same unit are in the same group
      // if possible.
      const solution = this.backtrackGroupAssignment(
        orderedTeams,
        0,
        groups.map(() => [] as Team[]),
        capacities
      );

      if (solution) {
        for (let i = 0; i < groupCount; i++) {
          groups[i].teams = solution[i];
        }
        logs.push(`Áp dụng thành công ràng buộc: Không có đội cùng đơn vị trong cùng bảng.`);
      } else {
        // Fallback: Greedy assignment with minimal conflicts
        logs.push(`Cảnh báo: Không tìm thấy phương án hoàn hảo tuyệt đối không trùng đơn vị. Hệ thống tối ưu giảm thiểu trùng đơn vị nhất có thể.`);
        this.greedyGroupAssignment(orderedTeams, groups, capacities);
      }
    } else if (mode === 'seeded') {
      // Distribute seeds in snake or round-robin order across groups
      let groupIdx = 0;
      for (const team of orderedTeams) {
        // Find next group with capacity
        let placed = false;
        for (let attempt = 0; attempt < groupCount; attempt++) {
          const target = (groupIdx + attempt) % groupCount;
          if (groups[target].teams.length < capacities[target]) {
            groups[target].teams.push(team);
            groupIdx = (target + 1) % groupCount;
            placed = true;
            break;
          }
        }
        if (!placed) {
          // Fallback if full
          groups[0].teams.push(team);
        }
      }
    } else {
      // Standard random distribution filling groups evenly
      let gIdx = 0;
      for (const team of orderedTeams) {
        // Find next group with capacity
        while (groups[gIdx].teams.length >= capacities[gIdx]) {
          gIdx = (gIdx + 1) % groupCount;
        }
        groups[gIdx].teams.push(team);
        gIdx = (gIdx + 1) % groupCount;
      }
    }

    logs.push(`Bốc thăm hoàn tất: Phân bổ ${teams.length} đội vào ${groupCount} bảng.`);

    return {
      tournamentId,
      drawId: 'DRAW_GRP_' + Date.now(),
      timestamp: Date.now(),
      isLocked: false,
      groups,
      unassignedTeams: [],
      logs,
    };
  }

  /**
   * Backtracking solver for same-unit constraint
   */
  private static backtrackGroupAssignment(
    teams: Team[],
    teamIndex: number,
    currentGroups: Team[][],
    capacities: number[]
  ): Team[][] | null {
    if (teamIndex >= teams.length) {
      return currentGroups;
    }

    const team = teams[teamIndex];
    const unit = (team.unit || '').trim().toLowerCase();

    // Try placing this team into each available group
    // Shuffle group order to avoid bias toward earlier groups
    const groupIndices = this.shuffle(currentGroups.map((_, i) => i));

    for (const gIdx of groupIndices) {
      if (currentGroups[gIdx].length < capacities[gIdx]) {
        // Check unit conflict
        const hasSameUnit = unit !== '' && currentGroups[gIdx].some(
          (t) => (t.unit || '').trim().toLowerCase() === unit
        );

        if (!hasSameUnit) {
          currentGroups[gIdx].push(team);
          const result = this.backtrackGroupAssignment(teams, teamIndex + 1, currentGroups, capacities);
          if (result) return result;
          currentGroups[gIdx].pop(); // Backtrack
        }
      }
    }

    return null;
  }

  /**
   * Greedy fallback when pure zero-conflict CSP is not possible
   */
  private static greedyGroupAssignment(
    teams: Team[],
    groups: { name: string; teams: Team[] }[],
    capacities: number[]
  ) {
    for (const team of teams) {
      const unit = (team.unit || '').trim().toLowerCase();
      // Find group with capacity and minimum count of same unit
      let bestIdx = -1;
      let minUnitCount = Infinity;

      for (let i = 0; i < groups.length; i++) {
        if (groups[i].teams.length < capacities[i]) {
          const sameUnitInGroup = groups[i].teams.filter(
            (t) => (t.unit || '').trim().toLowerCase() === unit && unit !== ''
          ).length;

          if (sameUnitInGroup < minUnitCount) {
            minUnitCount = sameUnitInGroup;
            bestIdx = i;
          }
        }
      }

      if (bestIdx !== -1) {
        groups[bestIdx].teams.push(team);
      } else {
        // Just push to first group with space
        const avail = groups.find((g, i) => g.teams.length < capacities[i]);
        if (avail) avail.teams.push(team);
      }
    }
  }

  /**
   * Matchup Draw (Pairings)
   * Handles odd number of teams with fair BYE selection
   */
  public static drawMatchups(
    tournamentId: string,
    teams: Team[],
    options: { avoidSameUnit?: boolean; seededBye?: boolean } = {}
  ): MatchupDrawResult {
    const logs: string[] = [];
    logs.push(`Khởi động bốc thăm đối đầu cho ${teams.length} đội.`);

    if (teams.length === 0) {
      return {
        tournamentId,
        drawId: 'DRAW_MAT_' + Date.now(),
        timestamp: Date.now(),
        isLocked: false,
        matchups: [],
        hasBye: false,
        byeTeams: [],
        logs: ['Danh sách đội trống.'],
      };
    }

    let candidateTeams = [...teams];
    const isOdd = candidateTeams.length % 2 !== 0;
    const byeTeams: Team[] = [];

    // If odd, select a team for BYE
    if (isOdd) {
      if (options.seededBye) {
        // Prefer top seeded team for BYE
        candidateTeams.sort((a, b) => (a.seedGroup || 999) - (b.seedGroup || 999));
        const byeTeam = candidateTeams.shift()!;
        byeTeams.push(byeTeam);
        logs.push(`Đội ${byeTeam.name} (Hạt giống ${byeTeam.seedGroup || 'tự do'}) được chọn hưởng suất miễn thi đấu (BYE).`);
      } else {
        // Random BYE
        const byeIdx = this.getRandomInt(0, candidateTeams.length - 1);
        const byeTeam = candidateTeams.splice(byeIdx, 1)[0];
        byeTeams.push(byeTeam);
        logs.push(`Đội ${byeTeam.name} được bốc ngẫu nhiên nhận suất miễn thi đấu vòng 1 (BYE).`);
      }
    }

    // Shuffle remaining teams
    candidateTeams = this.shuffle(candidateTeams);

    // Pair teams
    const matchups: Matchup[] = [];
    let matchCounter = 1;

    if (options.avoidSameUnit) {
      // Pairwise heuristic to avoid same unit
      const unpaired = [...candidateTeams];
      while (unpaired.length >= 2) {
        const teamA = unpaired.shift()!;
        let partnerIdx = -1;
        const unitA = (teamA.unit || '').trim().toLowerCase();

        for (let i = 0; i < unpaired.length; i++) {
          const unitB = (unpaired[i].unit || '').trim().toLowerCase();
          if (unitA === '' || unitB === '' || unitA !== unitB) {
            partnerIdx = i;
            break;
          }
        }

        if (partnerIdx === -1) {
          // If no non-conflicting partner found, take next available
          partnerIdx = 0;
        }

        const teamB = unpaired.splice(partnerIdx, 1)[0];
        matchups.push({
          id: `MATCH_${matchCounter}`,
          matchNumber: matchCounter,
          teamA,
          teamB,
          court: `Sân ${((matchCounter - 1) % 4) + 1}`,
        });
        matchCounter++;
      }
    } else {
      for (let i = 0; i < candidateTeams.length; i += 2) {
        matchups.push({
          id: `MATCH_${matchCounter}`,
          matchNumber: matchCounter,
          teamA: candidateTeams[i],
          teamB: candidateTeams[i + 1],
          court: `Sân ${((matchCounter - 1) % 4) + 1}`,
        });
        matchCounter++;
      }
    }

    // Add BYE matchup if any
    if (byeTeams.length > 0) {
      byeTeams.forEach((byeTeam) => {
        matchups.push({
          id: `MATCH_${matchCounter}`,
          matchNumber: matchCounter,
          teamA: byeTeam,
          teamB: null,
          isBye: true,
          notes: 'Miễn thi đấu vòng 1 (Vào thẳng vòng tiếp theo)',
        });
        matchCounter++;
      });
    }

    logs.push(`Đã bốc thăm tạo thành ${matchups.length} cặp đấu.`);

    return {
      tournamentId,
      drawId: 'DRAW_MAT_' + Date.now(),
      timestamp: Date.now(),
      isLocked: false,
      matchups,
      hasBye: byeTeams.length > 0,
      byeTeams,
      logs,
    };
  }

  /**
   * Order / Sequence Draw
   * E.g., drawing numbers 1 to N without repetition
   */
  public static drawOrder(
    tournamentId: string,
    teams: Team[],
    startNumber: number = 1,
    excludedNumbers: number[] = []
  ): OrderDrawResult {
    const count = teams.length;
    const availablePool: number[] = [];
    let cur = startNumber;

    while (availablePool.length < count) {
      if (!excludedNumbers.includes(cur)) {
        availablePool.push(cur);
      }
      cur++;
    }

    const shuffledNumbers = this.shuffle(availablePool);
    const shuffledTeams = this.shuffle(teams);

    const items: OrderItem[] = shuffledTeams.map((team, idx) => ({
      orderNumber: shuffledNumbers[idx],
      team,
      timestamp: Date.now(),
    }));

    // Sort items by order number for clean presentation
    items.sort((a, b) => a.orderNumber - b.orderNumber);

    return {
      tournamentId,
      drawId: 'DRAW_ORD_' + Date.now(),
      timestamp: Date.now(),
      isLocked: false,
      items,
      availableNumbers: availablePool,
    };
  }

  /**
   * Round-Robin Tournament Schedule Generation using Berger Tables / Circle Method
   */
  public static generateRoundRobinSchedule(
    tournamentId: string,
    teams: Team[],
    groupName: string = 'A',
    options: {
      startDate?: string;
      startTime?: string;
      courts?: string[];
      matchDurationMin?: number;
      breakMin?: number;
      isDoubleRound?: boolean;
    } = {}
  ): ScheduleMatch[] {
    if (teams.length < 2) return [];

    const {
      startDate = new Date().toISOString().split('T')[0],
      startTime = '08:00',
      courts = ['Sân 1', 'Sân 2'],
      matchDurationMin = 45,
      breakMin = 15,
      isDoubleRound = false,
    } = options;

    const matches: ScheduleMatch[] = [];
    const pool = [...teams];
    const isOdd = pool.length % 2 !== 0;

    // If odd number of teams, add a dummy BYE team (null)
    const dummyByeTeam: Team = {
      id: '__BYE__',
      code: 'BYE',
      name: 'Miễn thi đấu',
      shortName: 'BYE',
      unit: '',
    };

    if (isOdd) {
      pool.push(dummyByeTeam);
    }

    const n = pool.length;
    const totalRounds = n - 1;
    const matchesPerRound = n / 2;

    let matchGlobalCounter = 1;

    // Time calculations
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let currentMatchDate = new Date(startDate);

    // Circle Method algorithm
    for (let round = 0; round < totalRounds; round++) {
      let roundMatchSlot = 0;

      for (let match = 0; match < matchesPerRound; match++) {
        const homeIdx = (round + match) % (n - 1);
        let awayIdx = (n - 1 - match + round) % (n - 1);

        if (match === 0) {
          awayIdx = n - 1;
        }

        const teamA = pool[homeIdx];
        const teamB = pool[awayIdx];

        // Skip if dummy BYE team
        if (teamA.id === '__BYE__' || teamB.id === '__BYE__') {
          continue;
        }

        // Alternate home/away to ensure fairness
        const isAlternate = round % 2 === 1;
        const actualTeamA = isAlternate ? teamB : teamA;
        const actualTeamB = isAlternate ? teamA : teamB;

        const courtIndex = roundMatchSlot % courts.length;
        const court = courts[courtIndex];

        // Calculate time
        const slotOffsetMinutes = Math.floor(roundMatchSlot / courts.length) * (matchDurationMin + breakMin) + round * (matchDurationMin + breakMin);
        const matchMinutesTotal = startHour * 60 + startMinute + slotOffsetMinutes;
        const matchHour = Math.floor(matchMinutesTotal / 60) % 24;
        const matchMin = matchMinutesTotal % 60;
        const timeStr = `${String(matchHour).padStart(2, '0')}:${String(matchMin).padStart(2, '0')}`;

        matches.push({
          id: `SCHED_${groupName}_R${round + 1}_M${matchGlobalCounter}`,
          roundNumber: round + 1,
          matchNumber: matchGlobalCounter,
          groupName,
          teamA: actualTeamA,
          teamB: actualTeamB,
          date: currentMatchDate.toISOString().split('T')[0],
          time: timeStr,
          court,
          status: 'scheduled',
        });

        matchGlobalCounter++;
        roundMatchSlot++;
      }
    }

    // If double round robin, repeat with swapped home/away
    if (isDoubleRound) {
      const firstLegCount = matches.length;
      for (let i = 0; i < firstLegCount; i++) {
        const m = matches[i];
        matches.push({
          id: `SCHED_${groupName}_LEG2_${m.matchNumber}`,
          roundNumber: m.roundNumber + totalRounds,
          matchNumber: matchGlobalCounter++,
          groupName,
          teamA: m.teamB, // Swap
          teamB: m.teamA,
          date: m.date,
          time: m.time,
          court: m.court,
          status: 'scheduled',
        });
      }
    }

    return matches;
  }

  /**
   * Generates a Single Elimination Knockout Bracket from teams or qualified group teams
   */
  public static generateKnockoutBracket(
    tournamentId: string,
    teams: Team[],
    options: {
      hasThirdPlace?: boolean;
      customRoundNames?: string[];
    } = {}
  ): BracketData {
    if (teams.length < 2) {
      return {
        tournamentId,
        rounds: [],
        isLocked: false,
      };
    }

    // Determine nearest power of 2
    let bracketSize = 2;
    while (bracketSize < teams.length) {
      bracketSize *= 2;
    }

    // Number of rounds: e.g., 8 teams -> 3 rounds (Tứ kết, Bán kết, Chung kết)
    const numRounds = Math.log2(bracketSize);

    // Standard round naming in Vietnamese
    const roundNameMap: { [remainingMatches: number]: string } = {
      1: 'Chung kết',
      2: 'Bán kết',
      4: 'Tứ kết',
      8: 'Vòng 1/8',
      16: 'Vòng 1/16',
    };

    const rounds: BracketData['rounds'] = [];
    const allMatchesById = new Map<string, BracketMatch>();

    // Pad teams with BYEs if needed
    const paddedTeams: (Team | null)[] = [...teams];
    while (paddedTeams.length < bracketSize) {
      paddedTeams.push(null);
    }

    // Build rounds from final backward to round 1 to link nextMatchId properly
    // Round matches counts: e.g., for 8 teams: Round 1 (4 matches), Round 2 (2 matches), Round 3 (1 match)
    const matchesPerRoundList: number[] = [];
    for (let r = 0; r < numRounds; r++) {
      matchesPerRoundList.push(bracketSize / Math.pow(2, r + 1));
    }

    // Build the bracket structure forward
    for (let r = 0; r < numRounds; r++) {
      const matchCount = matchesPerRoundList[r];
      const rNum = r + 1;
      const rName = options.customRoundNames?.[r] || roundNameMap[matchCount] || `Vòng ${rNum}`;

      const matches: BracketMatch[] = [];

      for (let m = 0; m < matchCount; m++) {
        const matchId = `BRACKET_R${rNum}_M${m + 1}`;
        const match: BracketMatch = {
          id: matchId,
          roundNumber: rNum,
          matchIndex: m,
          roundName: rName,
          teamA: null,
          teamB: null,
          court: `Sân ${(m % 2) + 1}`,
        };

        // If round 1, assign initial teams
        if (r === 0) {
          match.teamA = paddedTeams[m * 2] || null;
          match.teamB = paddedTeams[m * 2 + 1] || null;

          // If one team has BYE (other is null), auto advance
          if (match.teamA && !match.teamB) {
            match.winnerId = match.teamA.id;
          } else if (!match.teamA && match.teamB) {
            match.winnerId = match.teamB.id;
          }
        }

        matches.push(match);
        allMatchesById.set(matchId, match);
      }

      rounds.push({
        roundNumber: rNum,
        roundName: rName,
        matches,
      });
    }

    // Connect matches to the next round
    for (let r = 0; r < numRounds - 1; r++) {
      const currentRoundMatches = rounds[r].matches;
      const nextRoundMatches = rounds[r + 1].matches;

      for (let m = 0; m < currentRoundMatches.length; m++) {
        const nextMatchIdx = Math.floor(m / 2);
        const slot = m % 2 === 0 ? 'A' : 'B';
        const currentMatch = currentRoundMatches[m];
        const nextMatch = nextRoundMatches[nextMatchIdx];

        if (nextMatch) {
          currentMatch.nextMatchId = nextMatch.id;
          currentMatch.nextMatchSlot = slot;

          // If current match already has an auto-winner (BYE), put into next match
          if (currentMatch.winnerId) {
            const winningTeam = currentMatch.teamA?.id === currentMatch.winnerId ? currentMatch.teamA : currentMatch.teamB;
            if (slot === 'A') nextMatch.teamA = winningTeam;
            else nextMatch.teamB = winningTeam;
          }
        }
      }
    }

    let thirdPlaceMatch: BracketMatch | undefined;
    if (options.hasThirdPlace && numRounds >= 2) {
      thirdPlaceMatch = {
        id: 'BRACKET_3RD_PLACE',
        roundNumber: numRounds,
        matchIndex: 99,
        roundName: 'Tranh Hạng Ba',
        teamA: null,
        teamB: null,
        court: 'Sân 1',
      };
    }

    return {
      tournamentId,
      rounds,
      thirdPlaceMatch,
      isLocked: false,
    };
  }
}
