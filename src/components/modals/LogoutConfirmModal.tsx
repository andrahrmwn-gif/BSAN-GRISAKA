import React from 'react';
import { UserAccount } from '../../types/auth';
import { LogOut, AlertTriangle } from 'lucide-react';

interface LogoutConfirmModalProps {
  user: UserAccount | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  user,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-scale-up">
        {/* Top Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Konfirmasi Keluar Sistem</h3>
          <p className="text-xs text-slate-500 mt-1">
            Apakah Anda yakin ingin mengakhiri sesi kerja saat ini?
          </p>
        </div>

        {/* User preview */}
        {user && (
          <div className="p-4 mx-4 my-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: user.avatarColor || '#1E3A8A' }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.role}</div>
            </div>
          </div>
        )}

        <div className="px-5 pb-5 text-center">
          <p className="text-[11px] text-slate-500 mb-4">
            Demi privasi dan keamanan data siswa, pastikan Anda telah menyelesaikan pencatatan sebelum keluar.
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition cursor-pointer"
            >
              Ya, Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
