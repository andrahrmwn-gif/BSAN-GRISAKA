import React from 'react';
import { Clock, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';

interface SessionTimeoutModalProps {
  remainingSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  remainingSeconds,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-scale-up text-center">
        {/* Header */}
        <div className="bg-amber-500 text-white p-6 relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-3 shadow-inner">
            <Clock className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Sesi Hampir Berakhir</h3>
          <p className="text-xs text-amber-100 mt-1">
            Tidak ada aktivitas terdeteksi pada sistem
          </p>
        </div>

        {/* Countdown Body */}
        <div className="p-6">
          <div className="my-2">
            <span className="text-4xl font-extrabold text-slate-800 font-mono tracking-tight">
              00:{remainingSeconds.toString().padStart(2, '0')}
            </span>
            <p className="text-xs text-slate-500 mt-2">
              Demi perlindungan data siswa & kerahasiaan sekolah, Anda akan otomatis keluar jika waktu habis.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onStayLoggedIn}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Tetap Masuk (Lanjutkan Aktivitas)</span>
            </button>
            <button
              type="button"
              onClick={onLogoutNow}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
