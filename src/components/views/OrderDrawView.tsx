import React, { useState, useEffect } from 'react';
import {
  Hash,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Tv,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, Team, OrderDrawResult, OrderItem } from '../../types/tournament';
import { DrawEngine } from '../../services/drawEngine';
import { soundEngine } from '../../services/soundEngine';

interface OrderDrawViewProps {
  tournament: Tournament;
  teams: Team[];
  orderDraw: OrderDrawResult | null;
  onSaveOrderDraw: (result: OrderDrawResult) => void;
  onOpenLed: () => void;
}

export const OrderDrawView: React.FC<OrderDrawViewProps> = ({
  tournament,
  teams,
  orderDraw,
  onSaveOrderDraw,
  onOpenLed,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'wheel'>('cards');
  const [startNum, setStartNum] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeItem, setActiveItem] = useState<OrderItem | null>(null);
  const [drawnItems, setDrawnItems] = useState<OrderItem[]>([]);
  const [remainingTeams, setRemainingTeams] = useState<Team[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [rollingNumber, setRollingNumber] = useState<number>(1);

  // Initialize
  useEffect(() => {
    if (orderDraw) {
      setDrawnItems(orderDraw.items);
      const drawnIds = new Set(orderDraw.items.map((i) => i.team.id));
      setRemainingTeams(teams.filter((t) => !drawnIds.has(t.id)));
      setAvailableNumbers(orderDraw.availableNumbers);
    } else {
      resetBoard();
    }
  }, [orderDraw, teams]);

  const resetBoard = () => {
    setDrawnItems([]);
    setRemainingTeams([...teams]);
    const nums = Array.from({ length: teams.length }, (_, i) => startNum + i);
    setAvailableNumbers(nums);
    setActiveItem(null);
  };

  const handleDrawOne = () => {
    if (remainingTeams.length === 0 || availableNumbers.length === 0 || isSpinning) return;

    setIsSpinning(true);
    soundEngine.playTick();

    const teamToDraw = remainingTeams[0];

    // Rolling animation
    let count = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * availableNumbers.length);
      setRollingNumber(availableNumbers[randIdx]);
      soundEngine.playTick();
      count++;

      if (count > 12) {
        clearInterval(interval);
        // Cryptographic draw
        const chosenNumIdx = DrawEngine.getRandomInt(0, availableNumbers.length - 1);
        const chosenNum = availableNumbers[chosenNumIdx];

        const newItem: OrderItem = {
          orderNumber: chosenNum,
          team: teamToDraw,
          timestamp: Date.now(),
        };

        const nextDrawn = [...drawnItems, newItem];
        const nextAvail = availableNumbers.filter((n) => n !== chosenNum);
        const nextRemaining = remainingTeams.slice(1);

        setDrawnItems(nextDrawn);
        setAvailableNumbers(nextAvail);
        setRemainingTeams(nextRemaining);
        setActiveItem(newItem);
        setIsSpinning(false);
        soundEngine.playReveal();

        try {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignore
        }

        if (nextRemaining.length === 0) {
          soundEngine.playFanfare();
          onSaveOrderDraw({
            tournamentId: tournament.id,
            drawId: 'ORD_' + Date.now(),
            timestamp: Date.now(),
            isLocked: true,
            items: nextDrawn.sort((a, b) => a.orderNumber - b.orderNumber),
            availableNumbers: [],
          });
        }
      }
    }, 80);
  };

  const handleDrawAll = () => {
    if (teams.length === 0) return;

    const result = DrawEngine.drawOrder(tournament.id, teams, startNum);
    setDrawnItems(result.items);
    setRemainingTeams([]);
    setAvailableNumbers([]);
    setActiveItem(result.items[result.items.length - 1]);
    soundEngine.playFanfare();

    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {
      // Ignore
    }

    onSaveOrderDraw(result);
  };

  // Flip Card specific click
  const handleCardClick = (number: number) => {
    if (isSpinning || remainingTeams.length === 0) return;
    if (!availableNumbers.includes(number)) return;

    soundEngine.playFlip();
    const teamToDraw = remainingTeams[0];

    const newItem: OrderItem = {
      orderNumber: number,
      team: teamToDraw,
      timestamp: Date.now(),
    };

    const nextDrawn = [...drawnItems, newItem];
    const nextAvail = availableNumbers.filter((n) => n !== number);
    const nextRemaining = remainingTeams.slice(1);

    setDrawnItems(nextDrawn);
    setAvailableNumbers(nextAvail);
    setRemainingTeams(nextRemaining);
    setActiveItem(newItem);
    soundEngine.playReveal();

    if (nextRemaining.length === 0) {
      soundEngine.playFanfare();
      onSaveOrderDraw({
        tournamentId: tournament.id,
        drawId: 'ORD_' + Date.now(),
        timestamp: Date.now(),
        isLocked: true,
        items: nextDrawn.sort((a, b) => a.orderNumber - b.orderNumber),
        availableNumbers: [],
      });
    }
  };

  const allNumbersList = Array.from({ length: teams.length }, (_, i) => startNum + i);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-amber-400" />
            <span>Bốc Thăm Số Thứ Tự Thi Đấu & Biểu Diễn</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Xác định số thứ tự ra sân, lượt thi đấu ngẫu nhiên không lặp lại bằng chế độ thẻ lật hoặc vòng quay
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Thẻ Số Úp (Lật Thẻ)
            </button>
            <button
              onClick={() => setViewMode('wheel')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'wheel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vòng Quay Lăn Số
            </button>
          </div>

          <button
            onClick={onOpenLed}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Tv className="w-3.5 h-3.5 text-amber-300" />
            <span>Trình Chiếu LED</span>
          </button>

          <button
            onClick={resetBoard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm Lại</span>
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-300">
            Đang bốc cho đội:{' '}
            <span className="font-bold text-amber-400">
              {remainingTeams[0] ? remainingTeams[0].name : 'Đã bốc hết tất cả!'}
            </span>
          </span>
          <span className="text-xs text-slate-500 font-mono">
            (Còn lại {remainingTeams.length} / {teams.length} đội)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isSpinning || remainingTeams.length === 0}
            onClick={handleDrawOne}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {isSpinning ? 'Đang quay...' : 'Bốc Lượt Tiếp Theo'}
          </button>
          <button
            disabled={isSpinning || remainingTeams.length === 0}
            onClick={handleDrawAll}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            Bốc Hết Tất Cả
          </button>
        </div>
      </div>

      {/* Main Mode View */}
      {viewMode === 'cards' ? (
        /* Flip Cards Board */
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Nhấp vào bất kỳ thẻ số úp nào để mở số thứ tự cho đội{' '}
            <span className="text-white font-semibold">{remainingTeams[0]?.name || 'kế tiếp'}</span>:
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {allNumbersList.map((num) => {
              const matched = drawnItems.find((d) => d.orderNumber === num);
              const isAvailable = availableNumbers.includes(num);

              return (
                <div
                  key={num}
                  onClick={() => isAvailable && handleCardClick(num)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all duration-300 select-none ${
                    matched
                      ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/20 scale-[0.98]'
                      : isAvailable
                      ? 'bg-gradient-to-tr from-slate-900 to-[#102A43] border border-blue-500/40 hover:border-amber-400 hover:scale-105 cursor-pointer shadow-md'
                      : 'bg-slate-950/40 border border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="text-xl md:text-2xl font-display font-black tracking-tight tabular-nums">
                    {num}
                  </div>
                  {matched ? (
                    <div className="text-[10px] font-semibold truncate w-full mt-1 text-white/95">
                      {matched.team.shortName || matched.team.name}
                    </div>
                  ) : (
                    <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                      THẺ ÚP
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Slot Wheel Mode */
        <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0E1E34] to-[#071322] border border-blue-900/60 flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">
            CON SỐ ĐƯỢC CHỌN
          </span>
          <div className="w-36 h-36 rounded-3xl bg-slate-950 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 flex items-center justify-center">
            <span className="text-6xl font-display font-black text-amber-400 tabular-nums">
              {isSpinning ? rollingNumber : activeItem ? activeItem.orderNumber : '--'}
            </span>
          </div>
          {activeItem && !isSpinning && (
            <div className="text-base font-bold text-white">
              Đội nhận số {activeItem.orderNumber}: <span className="text-amber-300">{activeItem.team.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Bảng kết quả số thứ tự chính thức</span>
          <span className="text-slate-400 font-mono">Đã bốc {drawnItems.length} / {teams.length}</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
              <th className="py-2.5 px-4 font-mono w-20">SỐ TT</th>
              <th className="py-2.5 px-4">Tên Đội / Vận Động Viên</th>
              <th className="py-2.5 px-4">Đơn Vị</th>
              <th className="py-2.5 px-4 font-mono text-right">Thời Gian Xác Nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {drawnItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Chưa có đội nào nhận số thứ tự.
                </td>
              </tr>
            ) : (
              [...drawnItems]
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map((item) => (
                  <tr key={item.orderNumber} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-black text-base text-amber-400 tabular-nums">
                      {item.orderNumber}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">
                      {item.team.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {item.team.unit || 'Tự do'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-right">
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
