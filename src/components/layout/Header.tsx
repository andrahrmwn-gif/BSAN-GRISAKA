import React from 'react';
import { ViewMode, SchoolProfile } from '../../types';
import { 
  CloudSun, 
  PlusCircle, 
  MapPin, 
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onOpenQuickViolation: () => void;
  onSearchGlobal: (query: string) => void;
  searchQuery: string;
  schoolConfig: SchoolProfile;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenQuickViolation,
  schoolConfig,
}) => {
  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard Eksekutif & Real-Time';
      case 'students':
        return 'Database Siswa (Central Data Hub)';
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
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-20 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Breadcrumbs & View Name */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{schoolConfig.shortName || 'SMPN 1 Kandangan'}</span>
            <span>/</span>
            <span className="text-[#0B231E] font-semibold">{getBreadcrumbTitle()}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {getBreadcrumbTitle()}
          </h1>
        </div>

        {/* Center / Right widgets (Time removed as requested) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* BMKG Weather Widget */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CloudSun className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>{schoolConfig.city || 'Kandangan, Kediri'}</span>
                <span className="text-emerald-700 font-mono font-bold">29°C</span>
              </div>
              <div className="text-[10px] text-slate-600">
                Cerah Berawan · BMKG Resmi
              </div>
            </div>
          </div>

          {/* Quick Action: Catat Pelanggaran */}
          <button
            onClick={onOpenQuickViolation}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-semibold rounded-xl shadow-sm transition-all duration-150 active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-[#83C532]" />
            <span>Catat Pelanggaran</span>
          </button>
        </div>
      </div>
    </header>
  );
};

