import React, { useState } from 'react';
import { UserAccount } from '../../types/auth';
import { updateAccountAsync } from '../../services/authService';
import { ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

interface ForcePasswordChangeModalProps {
  user: UserAccount;
  onSuccess: (updatedUser: UserAccount) => void;
  onCancel: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Verify old password
    if (user.pin && oldPin !== user.pin) {
      setError('Password saat ini tidak cocok.');
      return;
    }

    // 2. Validate new password length
    if (newPin.trim().length < 4) {
      setError('Password baru minimal harus 4 karakter.');
      return;
    }

    // 3. Prohibit factory default
    if (newPin.trim() === '1234') {
      setError('Password baru tidak boleh menggunakan password bawaan "1234". Buat password yang unik.');
      return;
    }

    // 4. Verify match
    if (newPin !== confirmPin) {
      setError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = {
        pin: newPin.trim(),
        mustChangePassword: false,
        lastPasswordChange: new Date().toISOString(),
      };
      const res = await updateAccountAsync(user.id, updates);
      if (res.success) {
        onSuccess({
          ...user,
          ...updates,
        });
      } else {
        setError(res.message || 'Gagal memperbarui password. Silakan coba lagi.');
      }
    } catch {
      setError('Terjadi kendala jaringan saat menyimpan password baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header with Security Badge */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 relative">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 text-white shadow-inner">
              <ShieldAlert className="w-8 h-8 text-amber-200" />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-100 border border-amber-300/30 mb-1">
                Pembaruan Keamanan Wajib
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">Ganti Password Default</h3>
              <p className="text-xs text-amber-100/90 mt-1">
                Demi keamanan data siswa & sekolah, Anda diwajibkan mengganti password awal sebelum mengakses sistem.
              </p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-800">{user.name}</span>
            <span className="text-slate-400 block">{user.role}</span>
          </div>
          <span className="px-2 py-1 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[11px]">
            @{user.username}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password Saat Ini (Bawaan)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPins ? 'text' : 'password'}
                required
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password Baru (Min. 4 karakter)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPins ? 'text' : 'password'}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Buat password baru yang aman"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPins ? 'text' : 'password'}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ketik ulang password baru"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 transition"
              />
            </div>
          </div>

          {/* Toggle visibility */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPins ? 'Sembunyikan karakter' : 'Tampilkan karakter'}</span>
            </button>
            <span className="text-[11px] text-slate-400">Jangan gunakan 1234</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Batal & Keluar</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Password & Masuk</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
