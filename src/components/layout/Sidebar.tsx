import React from 'react';
import { ViewMode, SchoolProfile } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck,
  ShieldAlert, 
  MessageSquare, 
  FileSpreadsheet, 
  BookOpen, 
  Award,
  Settings,
  X,
  ChevronRight,
  Quote,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeViolationsCount: number;
  pendingWaCount: number;
  schoolConfig: SchoolProfile;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenAccountSwitch?: () => void;
  isGuest?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  activeViolationsCount,
  pendingWaCount,
  schoolConfig,
  isOpenMobile = false,
  onCloseMobile,
  onOpenAccountSwitch,
  isGuest = false,
}) => {
  const handleSelect = (view: ViewMode) => {
    if (isGuest && view !== 'dashboard') {
      return;
    }
    onSelectView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isDashboardActive = currentView === 'dashboard';

  return (
    <>
      {/* Mobile Backdrop Overlay with smooth fade */}
      <div 
        onClick={onCloseMobile}
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar Container: Gambar 1 Royal Indigo Blue Tone (#3B5BDB / #3451B2) & Gambar 2 Layout */}
      <aside 
        aria-hidden={!isOpenMobile}
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px] sm:w-72 max-w-[85vw] bg-gradient-to-b from-[#3451B2] via-[#3858D6] to-[#2F4CB7] text-white flex flex-col shrink-0 border-r border-[#4365E8]/40 select-none h-screen transition-transform duration-300 ease-in-out shadow-2xl
          ${isOpenMobile ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'}
          lg:static lg:translate-x-0 lg:pointer-events-auto lg:sticky lg:top-0 lg:z-30 lg:shadow-none lg:w-72
        `}
      >

        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {schoolConfig.logoUrl ? (
                <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center overflow-hidden shadow-md shadow-black/10 shrink-0">
                  <img
                    src={schoolConfig.logoUrl}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-white text-[#3B5BDB] flex items-center justify-center font-black shadow-md shadow-black/10 shrink-0">
                  <Award className="w-6 h-6 stroke-[2.5]" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-black text-sm tracking-tight text-white uppercase leading-tight truncate">
                  {schoolConfig.name || 'SMPN 1 KANDANGAN'}
                </div>
                <div className="text-[11px] text-blue-100/90 font-medium truncate mt-0.5">
                  Budaya Sekolah Aman & Nyaman
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-100 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {/* Main Dashboard Link (Gambar 2 Top Item) */}
          <button
            onClick={() => handleSelect('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
              isDashboardActive
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10'
                : 'text-blue-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-5 h-5 ${isDashboardActive ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span>Dashboard</span>
            </div>
            {isDashboardActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB]"></span>
            )}
          </button>

          {/* Section: DATA UTAMA (Matching Gambar 2) */}
          <div className="pt-4 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-blue-200/80">
            DATA UTAMA
          </div>

          {/* Database Siswa */}
          <button
            onClick={() => handleSelect('students')}
            disabled={isGuest}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isGuest
                ? 'opacity-40 cursor-not-allowed text-blue-200'
                : currentView === 'students'
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10 font-bold cursor-pointer'
                : 'text-blue-100 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Users className={`w-5 h-5 shrink-0 ${currentView === 'students' && !isGuest ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span className="truncate">Database Siswa</span>
            </div>
            {isGuest ? (
              <Lock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            ) : (
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'students' ? 'text-[#3B5BDB] rotate-90' : 'text-blue-300'}`} />
            )}
          </button>

          {/* Jenis Pelanggaran (Tata Tertib) */}
          <button
            onClick={() => handleSelect('tatatertib')}
            disabled={isGuest}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isGuest
                ? 'opacity-40 cursor-not-allowed text-blue-200'
                : currentView === 'tatatertib'
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10 font-bold cursor-pointer'
                : 'text-blue-100 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen className={`w-5 h-5 shrink-0 ${currentView === 'tatatertib' && !isGuest ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span className="truncate">Jenis Pelanggaran</span>
            </div>
            {isGuest ? (
              <Lock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            ) : (
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'tatatertib' ? 'text-[#3B5BDB] rotate-90' : 'text-blue-300'}`} />
            )}
          </button>

          {/* Kehadiran (Presensi) */}
          <button
            onClick={() => handleSelect('attendance')}
            disabled={isGuest}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isGuest
                ? 'opacity-40 cursor-not-allowed text-blue-200'
                : currentView === 'attendance'
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10 font-bold cursor-pointer'
                : 'text-blue-100 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <CalendarCheck className={`w-5 h-5 shrink-0 ${currentView === 'attendance' && !isGuest ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span className="truncate">Kehadiran</span>
            </div>
            {isGuest ? (
              <Lock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            ) : (
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'attendance' ? 'text-[#3B5BDB] rotate-90' : 'text-blue-300'}`} />
            )}
          </button>

          {/* Pelanggaran Siswa */}
          <button
            onClick={() => handleSelect('violations')}
            disabled={isGuest}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isGuest
                ? 'opacity-40 cursor-not-allowed text-blue-200'
                : currentView === 'violations'
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10 font-bold cursor-pointer'
                : 'text-blue-100 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <ShieldAlert className={`w-5 h-5 shrink-0 ${currentView === 'violations' && !isGuest ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span className="truncate">Pelanggaran Siswa</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isGuest ? (
                <Lock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              ) : (
                <>
                  {activeViolationsCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                      {activeViolationsCount}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 transition-transform ${currentView === 'violations' ? 'text-[#3B5BDB] rotate-90' : 'text-blue-300'}`} />
                </>
              )}
            </div>
          </button>

          {/* WhatsApp Gateway */}
          <button
            onClick={() => handleSelect('whatsapp')}
            disabled={isGuest}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isGuest
                ? 'opacity-40 cursor-not-allowed text-blue-200'
                : currentView === 'whatsapp'
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10 font-bold cursor-pointer'
                : 'text-blue-100 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <MessageSquare className={`w-5 h-5 shrink-0 ${currentView === 'whatsapp' && !isGuest ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span className="truncate">WhatsApp Gateway</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isGuest ? (
                <Lock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              ) : (
                <>
                  {pendingWaCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900">
                      {pendingWaCount}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 transition-transform ${currentView === 'whatsapp' ? 'text-[#3B5BDB] rotate-90' : 'text-blue-300'}`} />
                </>
              )}
            </div>
          </button>

          {/* Rekap & Laporan */}
          <button
            onClick={() => handleSelect('reports')}
            disabled={isGuest}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isGuest
                ? 'opacity-40 cursor-not-allowed text-blue-200'
                : currentView === 'reports'
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10 font-bold cursor-pointer'
                : 'text-blue-100 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileSpreadsheet className={`w-5 h-5 shrink-0 ${currentView === 'reports' && !isGuest ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span className="truncate">Rekap & Laporan</span>
            </div>
            {isGuest ? (
              <Lock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            ) : (
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'reports' ? 'text-[#3B5BDB] rotate-90' : 'text-blue-300'}`} />
            )}
          </button>

          {/* Pengaturan (Kunci Khusus Mode Tamu) */}
          <button
            onClick={() => handleSelect('settings')}
            disabled={isGuest}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isGuest
                ? 'opacity-35 cursor-not-allowed bg-black/10 text-rose-200'
                : currentView === 'settings'
                ? 'bg-white text-[#3B5BDB] shadow-md shadow-black/10 font-bold cursor-pointer'
                : 'text-blue-100 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
            title={isGuest ? 'Menu Pengaturan Terkunci: Mode Tamu tidak memiliki izin akses.' : 'Pengaturan'}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Settings className={`w-5 h-5 shrink-0 ${currentView === 'settings' && !isGuest ? 'text-[#3B5BDB]' : 'text-blue-200'}`} />
              <span className="truncate">Pengaturan</span>
            </div>
            {isGuest ? (
              <span className="flex items-center gap-1 text-[10px] bg-rose-500/80 px-2 py-0.5 rounded text-white font-bold">
                <Lock className="w-3 h-3" />
                <span>Terkunci</span>
              </span>
            ) : (
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'settings' ? 'text-[#3B5BDB] rotate-90' : 'text-blue-300'}`} />
            )}
          </button>

          {/* Quote Callout Box on Sidebar Bottom (Gambar 2 Exact Quote) */}
          <div className="pt-3">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-white shadow-inner">
              <div className="text-xl font-serif text-blue-200 leading-none">“</div>
              <p className="text-xs text-blue-50 font-medium leading-relaxed mt-0.5">
                Disiplin hari ini,<br />
                Prestasi esok hari,<br />
                Karakter selamanya.
              </p>
              <div className="text-[10px] text-blue-200 font-semibold mt-2 text-right">
                — {schoolConfig.shortName || 'SMPN 1 Kandangan'}
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};
