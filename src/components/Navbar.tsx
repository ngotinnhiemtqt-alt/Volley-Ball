import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Tournament } from '../types/tournament';
import { soundEngine } from '../services/soundEngine';

interface NavbarProps {
  tournament: Tournament;
  onOpenLed: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  tournament,
  onOpenLed,
  darkMode,
  onToggleDarkMode,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('vi-VN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    soundEngine.setMuted(next);
    setIsMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="no-print h-16 border-b border-slate-800 bg-[#0A192F] px-4 lg:px-6 flex items-center justify-between gap-4 z-30 sticky top-0">
      {/* Brand Zone: 1-line Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <div className="w-full h-full bg-[#091525] rounded-[10px] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-lg tracking-wider text-white uppercase">
              BỐC THĂM PRO <span className="text-amber-400">2027</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-blue-400 bg-blue-950/70 border border-blue-800/60 px-1.5 py-0.5 rounded">
              OFFLINE
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs font-medium">
            Công bằng · Minh bạch · Chuyên nghiệp
          </span>
        </div>
      </div>

      {/* Center Zone: Active Tournament Indicator */}
      <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 max-w-md lg:max-w-xl truncate">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-xs font-medium text-slate-300 truncate">
          {tournament.name}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-xs font-mono text-amber-400/90 shrink-0">
          {tournament.sport}
        </span>
      </div>

      {/* Right Action Zone: Utilities & LED Launcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="tabular-nums font-semibold text-slate-200">{timeStr}</span>
        </div>

        {/* Audio Mute Toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Bật âm thanh (Web Audio API)' : 'Tắt âm thanh'}
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Dark/Light mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title="Toàn màn hình (F11 / Phím F)"
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:flex"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* LED Presentation Launcher Button */}
        <button
          onClick={onOpenLed}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] border border-blue-400/30 whitespace-nowrap"
          title="Mở màn hình trình chiếu LED 16:9 (Phím tắt: P)"
        >
          <Tv className="w-4 h-4 text-amber-300" />
          <span className="font-semibold tracking-wide">TRÌNH CHIẾU LED</span>
          <span className="hidden xl:inline text-[10px] font-mono bg-blue-900/60 px-1 rounded text-blue-200">
            [P]
          </span>
        </button>
      </div>
    </header>
  );
};
