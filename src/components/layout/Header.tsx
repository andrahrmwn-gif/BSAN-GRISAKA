import React, { useState, useEffect } from 'react';
import { ViewMode, SchoolProfile } from '../../types';
import { UserAccount } from '../../types/auth';
import { 
  Menu,
  Bell,
  HelpCircle,
  User,
  ChevronDown
} from 'lucide-react';
import { getActiveNotificationActivities } from '../../services/announcementService';
import { NotificationPanel } from './NotificationPanel';
import { HelpGuideModal } from '../modals/HelpGuideModal';

interface HeaderProps {
  currentView: ViewMode;
  currentUser: UserAccount | null;
  onOpenQuickViolation: () => void;
  onOpenAccountSwitch: () => void;
  onSearchGlobal: (query: string) => void;
  searchQuery: string;
  schoolConfig: SchoolProfile;
  onToggleMobileSidebar?: () => void;
  onNavigate?: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentUser,
  onOpenAccountSwitch,
  onToggleMobileSidebar,
  onNavigate,
  schoolConfig,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState<number>(() => {
    return getActiveNotificationActivities().length;
  });

  // Re-calculate alert count periodically or on window focus
  useEffect(() => {
    const updateCount = () => {
      const active = getActiveNotificationActivities();
      setActiveAlertCount(active.length);
    };

    updateCount();
    window.addEventListener('focus', updateCount);
    return () => window.removeEventListener('focus', updateCount);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'students':
        return 'Database Siswa';
      case 'attendance':
        return 'Kehadiran Siswa';
      case 'violations':
        return 'Pelanggaran Siswa';
      case 'tatatertib':
        return 'Jenis Pelanggaran';
      case 'whatsapp':
        return 'WhatsApp Gateway';
      case 'reports':
        return 'Rekap & Laporan';
      case 'settings':
        return 'Pengaturan Sistem';
      default:
        return 'Dashboard';
    }
  };

  const userName = currentUser ? currentUser.name : 'Admin';
  const userRole = currentUser ? currentUser.role : 'Administrator';

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Hamburger & Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 transition-colors cursor-pointer shrink-0 border border-slate-200"
                title="Buka / Tutup Menu Navigasi"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5 text-slate-900" />
              </button>
            )}

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate leading-tight">
                {getViewTitle()}
              </h1>
              <p className="text-xs text-slate-600 font-semibold truncate hidden sm:block">
                Selamat datang, <span className="text-[#1E3A8A] font-bold">{userName}</span>! Berikut ringkasan data hari ini.
              </p>
            </div>
          </div>

          {/* Right: Notifications, Help, User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${
                  isNotificationOpen
                    ? 'bg-blue-100 text-[#1E3A8A]'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
                title={
                  activeAlertCount > 0
                    ? `${activeAlertCount} Pemberitahuan Kegiatan (H-5 s/d Hari H)`
                    : 'Pemberitahuan & Notifikasi Kegiatan'
                }
              >
                <Bell className="w-5 h-5" />
                {activeAlertCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {activeAlertCount}
                  </span>
                )}
              </button>
            </div>

            {/* Help Button */}
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Bantuan & Petunjuk Penggunaan BSAN"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Profile Chip with Avatar */}
            <button
              onClick={onOpenAccountSwitch}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-2xl hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer group"
              title="Klik untuk beralih akun petugas resmi"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-[#3B5BDB] text-white flex items-center justify-center font-black text-sm shadow-xs overflow-hidden">
                {currentUser ? (
                  <span>{currentUser.name.charAt(0)}</span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-black text-slate-900 group-hover:text-[#3B5BDB] transition-colors leading-tight">
                  {userName}
                </div>
                <div className="text-[10px] text-slate-600 font-bold truncate max-w-[160px]">
                  {userRole}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-colors hidden sm:block" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Help & Guide Modal */}
      <HelpGuideModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        schoolConfig={schoolConfig}
      />
    </>
  );
};
