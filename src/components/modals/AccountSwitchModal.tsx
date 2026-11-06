import React, { useState } from 'react';
import { UserAccount } from '../../types/auth';
import { getCurrentUser, updateAccount, updateAccountAsync } from '../../services/authService';
import { logAudit } from '../../services/auditLogger';
import { 
  User, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Key, 
  Shield, 
  AlertCircle,
  LogOut,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface AccountSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onAccountChanged?: (user: UserAccount | null) => void;
}

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({
  isOpen,
  onClose,
  currentUser: propUser,
  onLogout,
  onAccountChanged,
}) => {
  const activeUser = propUser || getCurrentUser();

  // Change Password state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogoutClick = () => {
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!activeUser) return;

    const currentExpectedPin = activeUser.pin || '1234';

    if (oldPin !== currentExpectedPin) {
      setErrorMsg('Password / PIN lama yang Anda masukkan salah.');
      return;
    }

    if (!newPin || newPin.trim().length < 4) {
      setErrorMsg('Password baru minimal 4 karakter.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    const res = await updateAccountAsync(activeUser.id, { pin: newPin.trim() });
    if (res.success) {
      setSuccessMsg('Password akun berhasil diperbarui! Gunakan password baru ini untuk login berikutnya.');
      logAudit({
        actionType: 'UPDATE',
        module: 'Autentikasi',
        description: `Ganti password akun sukses untuk: ${activeUser.name} (${activeUser.role})`,
        status: 'SUCCESS',
      });

      if (onAccountChanged) {
        onAccountChanged({ ...activeUser, pin: newPin.trim() });
      }

      setTimeout(() => {
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setShowPasswordChange(false);
        setSuccessMsg(null);
      }, 2000);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-fade-in">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#2F4CB7] to-[#3B5BDB] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold shadow-inner">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Profil Akun Petugas
              </h3>
              <p className="text-xs text-blue-100">
                Informasi akun sesi aktif saat ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-100 hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {activeUser ? (
            <>
              {/* Profile Card Summary */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md mb-3"
                  style={{ backgroundColor: activeUser.avatarColor || '#3B5BDB' }}
                >
                  {activeUser.name.charAt(0)}
                </div>

                <h4 className="font-extrabold text-base text-slate-900">
                  {activeUser.name}
                </h4>
                <div className="mt-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-[#1E3A8A] font-bold text-xs">
                    {activeUser.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-mono">
                  <span>NIP:</span>
                  <strong className="text-slate-800">{activeUser.nip || '-'}</strong>
                  <span className="mx-1">·</span>
                  <span>Username:</span>
                  <strong className="text-slate-800">{activeUser.username}</strong>
                </div>

                <div className="flex items-center gap-1.5 mt-3 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sesi Terautentikasi & Aktif</span>
                </div>
              </div>

              {/* Password Default Warning */}
              {activeUser.pin === '1234' && !showPasswordChange && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Password Masih Bawaan:</span> Akun Anda saat ini masih memakai password default (<code className="font-bold">1234</code>). Anda dapat mengganti password pribadi di bawah ini.
                  </div>
                </div>
              )}

              {/* Change Password Collapsible Section */}
              {showPasswordChange ? (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <Lock className="w-4 h-4 text-[#3B5BDB]" />
                      <span>Form Ubah Password Akun</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePasswordSubmit} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Password Lama:</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        required
                        value={oldPin}
                        onChange={(e) => setOldPin(e.target.value)}
                        placeholder="Masukkan password saat ini (default: 1234)"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3B5BDB] focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Password Baru:</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        required
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="Minimal 4 karakter"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3B5BDB] focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Ulangi Password Baru:</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="Ketik ulang password baru"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3B5BDB] focus:outline-hidden font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPins(!showPins)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPins ? 'Sembunyikan' : 'Lihat'} Teks</span>
                      </button>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2F4CB7] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Simpan Password Baru
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Ubah Password Akun Anda</span>
                </button>
              )}

              {/* Action Buttons: Logout & Close */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-900/10 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout / Keluar dari Akun</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-slate-500">
                Tidak ada akun aktif yang terautentikasi.
              </p>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="py-2.5 px-4 rounded-xl bg-[#3B5BDB] text-white text-xs font-bold cursor-pointer"
              >
                Menuju Halaman Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
