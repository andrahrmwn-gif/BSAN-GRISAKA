import React from 'react';
import { ViewMode, SchoolProfile } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  MessageSquare, 
  FileSpreadsheet, 
  BookOpen, 
  Award,
  Sparkles,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeViolationsCount: number;
  pendingWaCount: number;
  schoolConfig: SchoolProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  activeViolationsCount,
  pendingWaCount,
  schoolConfig,
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

  return (
    <aside className="w-72 bg-[#0B231E] text-white flex flex-col shrink-0 border-r border-[#163830] select-none h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#183d34]">
        <div className="flex items-center gap-3">
          {schoolConfig.logoUrl ? (
            <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center overflow-hidden shadow-lg shadow-[#83C532]/20 border border-[#83C532]/40">
              <img
                src={schoolConfig.logoUrl}
                alt="Logo Sekolah"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#83C532] to-[#4ade80] flex items-center justify-center text-[#0B231E] font-black shadow-lg shadow-[#83C532]/20">
              <Award className="w-7 h-7 stroke-[2.5]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">BSAN</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#83C532]/20 text-[#83C532]">{schoolConfig.shortName || 'GRISAKA'}</span>
            </div>
            <div className="text-xs text-slate-300 font-medium truncate max-w-[150px]">{schoolConfig.name || 'SMPN 1 Kandangan'}</div>
          </div>
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
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
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
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-[#83C532] text-[#0B231E]'
                      : 'bg-[#1e4a3f] text-emerald-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-[#183d34] bg-[#081a16]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#173e35] border border-[#23584c] flex items-center justify-center text-sm font-bold text-[#83C532]">
            BK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {schoolConfig.timKesiswaanName || 'Tim Kesiswaan & BK'}
            </div>
          </div>
          <div title="Sistem Aktif" className="text-[#83C532]">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>
    </aside>
  );
};
