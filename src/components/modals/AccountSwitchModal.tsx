import React, { useState } from 'react';
import { UserAccount } from '../../types/auth';
import { getStoredAccounts, getCurrentUserId, setCurrentUserId, MAX_ACCOUNTS } from '../../services/authService';
import { logAudit } from '../../services/auditLogger';
import { 
  Users, 
  LogIn, 
  Eye, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Key,
  Shield,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface AccountSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountChanged: (user: UserAccount | null) => void;
}

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({
  isOpen,
  onClose,
  onAccountChanged,
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getStoredAccounts());
  const [currentId, setCurrentId] = useState<string>(() => getCurrentUserId());
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAccountToLogin = (acc: UserAccount) => {
    // If account has default pin or no pin prompt needed, direct switch or prompt pin
    setSelectedAccount(acc);
    setEnteredPin('');
    setPinError(null);
  };

  const handleConfirmLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAccount) return;

    if (selectedAccount.pin && enteredPin && enteredPin !== selectedAccount.pin) {
      setPinError('PIN yang Anda masukkan salah. Default PIN: 1234');
      return;
    }

    setCurrentUserId(selectedAccount.id);
    setCurrentId(selectedAccount.id);

    logAudit({
      actionType: 'LOGIN',
      module: 'Autentikasi',
      description: `Login sesi berhasil: ${selectedAccount.name} (${selectedAccount.role})`,
      status: 'SUCCESS',
      forcedUser: { id: selectedAccount.id, name: selectedAccount.name, role: selectedAccount.role }
    });

    onAccountChanged(selectedAccount);
    onClose();
  };

  const handleSwitchToGuest = () => {
    setCurrentUserId('guest');
    setCurrentId('guest');

    logAudit({
      actionType: 'LOGIN',
      module: 'Autentikasi',
      description: 'Beralih ke Mode Tamu (Guest - View Only)',
      status: 'SUCCESS'
    });

    onAccountChanged(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="bg-[#0B231E] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#83C532] text-[#0B231E] flex items-center justify-center font-bold">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Pilih Akun Petugas BSAN ({accounts.length} / {MAX_ACCOUNTS} Terdaftar)
              </h3>
              <p className="text-xs text-slate-300">
                Akses input & edit dibatasi untuk maksimal 20 akun resmi. Mode Tamu hanya berhak melihat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Mode Option Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">Mode Tamu (Guest View-Only)</span>
                  {currentId === 'guest' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-200 text-amber-900">
                      SEDANG AKTIF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Dapat melihat seluruh grafik & buku pelanggaran tanpa izin modifikasi data.
                </p>
              </div>
            </div>

            <button
              onClick={handleSwitchToGuest}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentId === 'guest'
                  ? 'bg-slate-200 text-slate-600'
                  : 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs'
              }`}
            >
              Beralih ke Tamu
            </button>
          </div>
        </div>

        {/* PIN Entry View if an account is selected */}
        {selectedAccount ? (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <div 
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-xl font-black shadow-md"
                style={{ backgroundColor: selectedAccount.avatarColor || '#0B231E' }}
              >
                {selectedAccount.name.charAt(0)}
              </div>
              <h4 className="font-extrabold text-base text-slate-900 pt-2">
                {selectedAccount.name}
              </h4>
              <p className="text-xs text-emerald-800 font-semibold">
                {selectedAccount.role} · {selectedAccount.username}
              </p>
            </div>

            <form onSubmit={handleConfirmLogin} className="max-w-xs mx-auto space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 text-center">
                  Masukkan PIN Akun (Default: 1234)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    autoFocus
                    maxLength={6}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="••••"
                    className="w-full text-center pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base tracking-widest focus:ring-2 focus:ring-[#0B231E] focus:outline-none"
                  />
                </div>
                {pinError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 text-center">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0B231E] hover:bg-[#143d34] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Konfirmasi Login
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* List of 20 Accounts to Pick */
          <div className="p-6 max-h-96 overflow-y-auto space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Daftar 20 Akun Petugas Resmi Terdaftar:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {accounts.map((acc, idx) => {
                const isCurrent = currentId === acc.id;

                return (
                  <div
                    key={acc.id}
                    onClick={() => handleSelectAccountToLogin(acc)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-emerald-50/80 border-[#83C532] ring-1 ring-[#83C532]'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: acc.avatarColor || '#0B231E' }}
                      >
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          <span className="font-semibold text-emerald-800">{acc.role}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-400">#{idx + 1}</span>
                        </div>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#83C532] text-[#0B231E]">
                        Aktif
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold text-slate-400 group-hover:text-slate-800">
                        Pilih &rarr;
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Keamanan: Dibatasi maksimal 20 akun resmi BSAN.</span>
          <span className="font-mono text-[11px]">SMPN 1 Kandangan</span>
        </div>
      </div>
    </div>
  );
};
