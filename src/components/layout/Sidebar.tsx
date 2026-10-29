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
  Sparkles,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeViolationsCount: number;
  pendingWaCount: number;
  schoolConfig: SchoolProfile;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  activeViolationsCount,
  pendingWaCount,
  schoolConfig,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Eksekutif',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'students',
      label: 'Database Siswa (Hub)',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'attendance',
      label: 'Presensi 24 Rombel',
      icon: <CalendarCheck className="w-5 h-5" />,
    },
    {
      id: 'violations',
      label: 'Buku Pelanggaran',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: activeViolationsCount > 0 ? activeViolationsCount : undefined,
    },
    {
      id: 'tatatertib',
      label: 'Pusat Tata Tertib',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Gateway',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: pendingWaCount > 0 ? pendingWaCount : undefined,
    },
    {
      id: 'reports',
      label: 'Laporan & Ekspor',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Pengaturan Sistem',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleSelect = (view: ViewMode) => {
    onSelectView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container: Fixed slide-over on mobile, sticky sidebar on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0B231E] text-white flex flex-col shrink-0 border-r border-[#163830] select-none h-screen transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        lg:static lg:translate-x-0 lg:sticky lg:top-0 lg:z-30
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#183d34]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {schoolConfig.logoUrl ? (
                <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center overflow-hidden shadow-lg shadow-[#83C532]/20 border border-[#83C532]/40 shrink-0">
                  <img
                    src={schoolConfig.logoUrl}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#83C532] to-[#4ade80] flex items-center justify-center text-[#0B231E] font-black shadow-lg shadow-[#83C532]/20 shrink-0">
                  <Award className="w-7 h-7 stroke-[2.5]" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white">BSAN</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#83C532]/20 text-[#83C532]">{schoolConfig.shortName || 'GRISAKA'}</span>
                </div>
                <div className="text-xs text-slate-300 font-medium truncate max-w-[150px]">{schoolConfig.name || 'SMPN 1 Kandangan'}</div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#163830] flex items-center justify-between text-[11px] text-slate-400">
            <span>NPSN: {schoolConfig.npsn}</span>
            <span className="text-emerald-400 font-semibold">{schoolConfig.city}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">
            Navigasi Utama
          </div>

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#153e35] text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#12332c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#83C532]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.id === 'violations'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#183d34] bg-[#081a16] text-[11px] text-slate-400 flex items-center justify-between">
          <div>
            <div className="font-semibold text-white">Sistem BSAN v2.2</div>
            <div>Kabupaten Temanggung</div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#83C532] shadow-sm shadow-[#83C532]"></div>
        </div>
      </aside>
    </>
  );
};
