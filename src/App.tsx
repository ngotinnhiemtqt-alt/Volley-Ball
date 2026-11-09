/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { TournamentMgmtView } from './components/views/TournamentMgmtView';
import { TeamListView } from './components/views/TeamListView';
import { GroupDrawView } from './components/views/GroupDrawView';
import { MatchupDrawView } from './components/views/MatchupDrawView';
import { OrderDrawView } from './components/views/OrderDrawView';
import { PositionDrawView } from './components/views/PositionDrawView';
import { BracketView } from './components/views/BracketView';
import { ScheduleView } from './components/views/ScheduleView';
import { ResultsHistoryView } from './components/views/ResultsHistoryView';
import { ReportsPrintView } from './components/views/ReportsPrintView';
import { TestRunnerView } from './components/views/TestRunnerView';
import { LedPresentationModal } from './components/presentation/LedPresentationModal';

import {
  Tournament,
  Team,
  GroupDrawResult,
  MatchupDrawResult,
  OrderDrawResult,
  BracketData,
  ScheduleMatch,
} from './types/tournament';
import { storageService } from './services/storage';
import { ExportService } from './services/exportService';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Tournament and draw state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament>(() =>
    storageService.getActiveTournament()
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [groupDraw, setGroupDraw] = useState<GroupDrawResult | null>(null);
  const [matchupDraw, setMatchupDraw] = useState<MatchupDrawResult | null>(null);
  const [orderDraw, setOrderDraw] = useState<OrderDrawResult | null>(null);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleMatch[]>([]);

  // Navigation and modal state
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isLedOpen, setIsLedOpen] = useState<boolean>(false);

  // Load tournament and all associated data
  const loadTournamentData = useCallback((tournamentId: string) => {
    const tourList = storageService.getTournaments();
    setTournaments(tourList);
    const active = tourList.find((t) => t.id === tournamentId) || tourList[0];
    if (active) {
      setCurrentTournament(active);
      storageService.setActiveTournamentId(active.id);
      setTeams(storageService.getTeams(active.id));
      setGroupDraw(storageService.getGroupDrawResult(active.id));
      setMatchupDraw(storageService.getMatchupDrawResult(active.id));
      setOrderDraw(storageService.getOrderDrawResult(active.id));
      setBracketData(storageService.getBracketData(active.id));
      setSchedule(storageService.getSchedule(active.id));
    }
  }, []);

  // Initial load
  useEffect(() => {
    const activeId = storageService.getActiveTournamentId();
    loadTournamentData(activeId);

    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, loadTournamentData]);

  // BroadcastChannel multi-screen synchronization
  useEffect(() => {
    const channel = storageService.getBroadcastChannel();
    if (!channel) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'SWITCH_TOURNAMENT') {
        loadTournamentData(payload.tournamentId);
      } else if (payload?.tournamentId === currentTournament.id) {
        if (type === 'TEAMS_UPDATED') {
          setTeams(storageService.getTeams(currentTournament.id));
        } else if (type === 'GROUP_DRAW_UPDATED') {
          setGroupDraw(storageService.getGroupDrawResult(currentTournament.id));
        } else if (type === 'MATCHUP_DRAW_UPDATED') {
          setMatchupDraw(storageService.getMatchupDrawResult(currentTournament.id));
        } else if (type === 'ORDER_DRAW_UPDATED') {
          setOrderDraw(storageService.getOrderDrawResult(currentTournament.id));
        } else if (type === 'BRACKET_UPDATED') {
          setBracketData(storageService.getBracketData(currentTournament.id));
        } else if (type === 'SCHEDULE_UPDATED') {
          setSchedule(storageService.getSchedule(currentTournament.id));
        }
      }
    };

    channel.addEventListener('message', handleMessage);
    return () => channel.removeEventListener('message', handleMessage);
  }, [currentTournament.id, loadTournamentData]);

  // Global keyboard shortcuts: P for LED, Ctrl+P for Print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsLedOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleSelectTournament = (id: string) => {
    loadTournamentData(id);
  };

  const handleUpdateTournament = (updated: Tournament) => {
    const list = tournaments.map((t) => (t.id === updated.id ? updated : t));
    storageService.saveTournaments(list);
    setTournaments(list);
    setCurrentTournament(updated);
    storageService.addAuditLog({
      tournamentId: updated.id,
      action: 'Cập nhật giải đấu',
      drawType: 'group',
      details: `Đã lưu thay đổi thông tin giải "${updated.name}"`,
      cryptoHash: 'AUDIT_OK',
    });
  };

  const handleCreateTournament = (created: Tournament) => {
    const list = [created, ...tournaments];
    storageService.saveTournaments(list);
    setTournaments(list);
    loadTournamentData(created.id);
  };

  const handleDeleteTournament = (id: string) => {
    const list = tournaments.filter((t) => t.id !== id);
    if (list.length === 0) return;
    storageService.saveTournaments(list);
    setTournaments(list);
    loadTournamentData(list[0].id);
  };

  const handleSaveTeams = (newTeams: Team[]) => {
    setTeams(newTeams);
    storageService.saveTeams(currentTournament.id, newTeams);
    storageService.addAuditLog({
      tournamentId: currentTournament.id,
      action: 'Cập nhật danh sách đội',
      drawType: 'group',
      details: `Danh sách hiện có ${newTeams.length} đội tham dự`,
      cryptoHash: 'HASH_' + Date.now().toString(16),
    });
  };

  const handleSaveGroupDraw = (result: GroupDrawResult) => {
    setGroupDraw(result);
    storageService.saveGroupDrawResult(currentTournament.id, result);
    storageService.addAuditLog({
      tournamentId: currentTournament.id,
      action: 'Bốc thăm chia bảng',
      drawType: 'group',
      details: `Đã chia ${result.groups.length} bảng đấu cho ${teams.length} đội`,
      cryptoHash: result.drawId,
    });
  };

  const handleSaveMatchupDraw = (result: MatchupDrawResult) => {
    setMatchupDraw(result);
    storageService.saveMatchupDrawResult(currentTournament.id, result);
    storageService.addAuditLog({
      tournamentId: currentTournament.id,
      action: 'Bốc thăm đối đầu',
      drawType: 'matchup',
      details: `Đã tạo ${result.matchups.length} cặp đấu đối đầu`,
      cryptoHash: result.drawId,
    });
  };

  const handleSaveOrderDraw = (result: OrderDrawResult) => {
    setOrderDraw(result);
    storageService.saveOrderDrawResult(currentTournament.id, result);
    storageService.addAuditLog({
      tournamentId: currentTournament.id,
      action: 'Bốc thăm số thứ tự',
      drawType: 'order',
      details: `Đã cấp số thứ tự cho ${result.items.length} đội`,
      cryptoHash: result.drawId,
    });
  };

  const handleSaveBracket = (bracket: BracketData) => {
    setBracketData(bracket);
    storageService.saveBracketData(currentTournament.id, bracket);
    storageService.addAuditLog({
      tournamentId: currentTournament.id,
      action: 'Cập nhật sơ đồ thi đấu',
      drawType: 'bracket',
      details: `Sơ đồ có ${bracket.rounds.length} vòng loại trực tiếp`,
      cryptoHash: 'BRACKET_' + Date.now().toString(16),
    });
  };

  const handleSaveSchedule = (newSchedule: ScheduleMatch[]) => {
    setSchedule(newSchedule);
    storageService.saveSchedule(currentTournament.id, newSchedule);
    storageService.addAuditLog({
      tournamentId: currentTournament.id,
      action: 'Lập lịch thi đấu vòng tròn',
      drawType: 'schedule',
      details: `Đã lập ${newSchedule.length} trận đấu theo thể thức vòng tròn`,
      cryptoHash: 'SCHED_' + Date.now().toString(16),
    });
  };

  const handleResetToDemo = () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn nạp lại dữ liệu giải đấu mẫu "GIẢI BÓNG CHUYỀN CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11"?'
      )
    ) {
      storageService.resetToDefaultDemo();
      loadTournamentData(storageService.getActiveTournamentId());
      alert('Đã nạp lại dữ liệu mẫu thành công!');
    }
  };

  const handleExportBackup = () => {
    const json = storageService.exportFullBackup();
    const safeName = currentTournament.name.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 30);
    ExportService.downloadFile(`Sao_Luu_Giai_Dau_${safeName}.json`, json, 'application/json');
  };

  const handleImportBackup = (jsonContent: string) => {
    const res = storageService.importFullBackup(jsonContent);
    alert(res.message);
    if (res.success && res.tournamentId) {
      loadTournamentData(res.tournamentId);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#091525] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navbar */}
      <Navbar
        tournament={currentTournament}
        onOpenLed={() => setIsLedOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Workspace: Left Sidebar + Viewport Content */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          teamsCount={teams.length}
          hasGroupDraw={!!groupDraw}
          hasMatchupDraw={!!matchupDraw}
        />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewView
              tournament={currentTournament}
              teams={teams}
              groupDraw={groupDraw}
              matchupDraw={matchupDraw}
              schedule={schedule}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenLed={() => setIsLedOpen(true)}
              onResetDemo={handleResetToDemo}
              onExportBackup={handleExportBackup}
            />
          )}

          {activeTab === 'tournament' && (
            <TournamentMgmtView
              currentTournament={currentTournament}
              tournaments={tournaments}
              onSelectTournament={handleSelectTournament}
              onUpdateTournament={handleUpdateTournament}
              onCreateTournament={handleCreateTournament}
              onDeleteTournament={handleDeleteTournament}
              onImportBackup={handleImportBackup}
              onExportBackup={handleExportBackup}
            />
          )}

          {activeTab === 'teams' && (
            <TeamListView
              tournament={currentTournament}
              teams={teams}
              onSaveTeams={handleSaveTeams}
            />
          )}

          {activeTab === 'group_draw' && (
            <GroupDrawView
              tournament={currentTournament}
              teams={teams}
              groupDraw={groupDraw}
              onSaveGroupDraw={handleSaveGroupDraw}
              onOpenLed={() => setIsLedOpen(true)}
              onNavigateToSchedule={() => setActiveTab('schedule')}
            />
          )}

          {activeTab === 'matchup_draw' && (
            <MatchupDrawView
              tournament={currentTournament}
              teams={teams}
              matchupDraw={matchupDraw}
              onSaveMatchupDraw={handleSaveMatchupDraw}
              onOpenLed={() => setIsLedOpen(true)}
            />
          )}

          {activeTab === 'order_draw' && (
            <OrderDrawView
              tournament={currentTournament}
              teams={teams}
              orderDraw={orderDraw}
              onSaveOrderDraw={handleSaveOrderDraw}
              onOpenLed={() => setIsLedOpen(true)}
            />
          )}

          {activeTab === 'position_draw' && (
            <PositionDrawView
              tournament={currentTournament}
              teams={teams}
              onOpenLed={() => setIsLedOpen(true)}
            />
          )}

          {activeTab === 'bracket' && (
            <BracketView
              tournament={currentTournament}
              teams={teams}
              groupDraw={groupDraw}
              bracketData={bracketData}
              onSaveBracket={handleSaveBracket}
              onOpenLed={() => setIsLedOpen(true)}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              tournament={currentTournament}
              teams={teams}
              groupDraw={groupDraw}
              schedule={schedule}
              onSaveSchedule={handleSaveSchedule}
            />
          )}

          {activeTab === 'results' && (
            <ResultsHistoryView
              tournament={currentTournament}
              groupDraw={groupDraw}
              matchupDraw={matchupDraw}
              orderDraw={orderDraw}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPrintView
              tournament={currentTournament}
              teams={teams}
              groupDraw={groupDraw}
              matchupDraw={matchupDraw}
              orderDraw={orderDraw}
              schedule={schedule}
              bracketData={bracketData}
            />
          )}

          {activeTab === 'testing' && <TestRunnerView />}
        </main>
      </div>

      {/* LED Presentation Modal */}
      {isLedOpen && (
        <LedPresentationModal
          tournament={currentTournament}
          teams={teams}
          groupDraw={groupDraw}
          matchupDraw={matchupDraw}
          orderDraw={orderDraw}
          bracketData={bracketData}
          onClose={() => setIsLedOpen(false)}
        />
      )}
    </div>
  );
}
