import React from 'react';
import { ViewMode, SchoolProfile } from '../../types';
import { UserAccount } from '../../types/auth';
import { 
  CloudSun, 
  PlusCircle, 
  MapPin, 
  ShieldCheck,
  Eye,
  User,
  ChevronDown,
  Lock,
  Menu
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  currentUser: UserAccount | null;
  onOpenQuickViolation: () => void;
  onOpenAccountSwitch: () => void;
  onSearchGlobal: (query: string) => void;
  searchQuery: string;
  schoolConfig: SchoolProfile;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentUser,
  onOpenQuickViolation,
  onOpenAccountSwitch,
  schoolConfig,
  onToggleMobileSidebar,
}) => {
  const isGuest = !currentUser;

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard Eksekutif & Real-Time';
      case 'students':
        return 'Database Siswa (Central Data Hub)';
      case 'attendance':
        return 'Presensi Siswa 24 Rombel & Rekap Kehadiran';
      case 'violations':
        return 'Buku Pelanggaran & Tata Tertib Otomatis';
      case 'tatatertib':
        return 'Pusat Tata Tertib & Pedoman Kedisiplinan';
      case 'whatsapp':
        return 'WhatsApp Gateway Notifikasi Otomatis';
      case 'reports':
        return 'Modul Pelaporan & Ekspor Data Komprehensif';
      case 'settings':
        return 'Pengaturan Sistem & Profil Sekolah';
      default:
        return 'Budaya Sekolah Aman dan Nyaman';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-3.5 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-30 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Hamburger & Breadcrumbs & View Name */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 transition-colors cursor-pointer shrink-0 border border-slate-200"
              title="Buka Menu Navigasi"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              <span>{schoolConfig.shortName || 'SMPN 1 Kandangan'}</span>
              <span>/</span>
              <span className="text-[#0B231E] font-semibold truncate">{getBreadcrumbTitle()}</span>
            </div>
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate">
              {getBreadcrumbTitle()}
            </h1>
          </div>
        </div>


        {/* Center / Right widgets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Real-Time Cloud Sync Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-800 text-[11px] font-bold shadow-2xs" title="Tersinkronisasi Real-Time multi-akun & lintas perangkat">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="tracking-tight">Real-Time Cloud</span>
          </div>

          {/* BMKG Weather Widget */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CloudSun className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>{schoolConfig.city || 'Kandangan, Temanggung'}</span>
                <span className="text-emerald-700 font-mono font-bold">27°C</span>
              </div>
              <div className="text-[10px] text-slate-600">
                Sejuk Berawan · Stasiun BMKG
              </div>
            </div>
          </div>

          {/* Account & Guest Mode Indicator (Top Bar Control) */}
          {isGuest ? (
            <button
              onClick={onOpenAccountSwitch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              title="Mode Tamu Aktif (Hanya Lihat). Klik untuk login salah satu dari 20 akun resmi petugas."
            >
              <div className="w-6 h-6 rounded-lg bg-amber-200 flex items-center justify-center text-amber-800">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="font-black text-[11px] leading-tight flex items-center gap-1">
                  <span>Mode Tamu</span>
                  <span className="text-[9px] bg-amber-200 px-1 py-0.2 rounded font-bold">Read-Only</span>
                </div>
                <div className="text-[10px] text-amber-700 font-bold">
                  Login 55 Akun &rarr;
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAccountSwitch}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              title="Klik untuk beralih akun petugas atau masuk ke Mode Tamu"
            >
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0"
                style={{ backgroundColor: currentUser.avatarColor || '#0B231E' }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-black text-slate-900 text-[11px] leading-tight truncate max-w-[150px]">
                  {currentUser.name.split(',')[0]}
                </div>
                <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#83C532]"></span>
                  <span>{currentUser.role}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          )}

          {/* Quick Action: Catat Pelanggaran */}
          <button
            onClick={onOpenQuickViolation}
            className={`flex items-center gap-2 px-3.5 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer ${
              isGuest 
                ? 'bg-slate-700 hover:bg-slate-800 opacity-90' 
                : 'bg-[#0B231E] hover:bg-[#143d34]'
            }`}
            title={isGuest ? 'Mode Tamu: Klik untuk melihat cara membuka akses input' : 'Catat Pelanggaran Siswa Baru'}
          >
            {isGuest ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : (
              <PlusCircle className="w-4 h-4 text-[#83C532]" />
            )}
            <span>Catat Pelanggaran</span>
          </button>
        </div>
      </div>
    </header>
  );
};
