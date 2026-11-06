import React, { useState, useEffect } from 'react';
import { UserAccount } from '../../types/auth';
import { SchoolProfile } from '../../types';
import { SCHOOL_CONFIG } from '../../data/schoolConfig';
import { getStoredAccounts, saveAccounts, setCurrentUserId } from '../../services/authService';
import { subscribeToAccounts, getAccountDirectlyFromFirestore } from '../../services/firebase';
import { logAudit } from '../../services/auditLogger';
import { 
  LogIn, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Award, 
  Users, 
  AlertCircle, 
  Search,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

interface LoginPageProps {
  schoolConfig?: SchoolProfile;
  onLoginSuccess: (user: UserAccount | null) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  schoolConfig = SCHOOL_CONFIG,
  onLoginSuccess,
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getStoredAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Subscribe to real-time accounts and listen to changes
  useEffect(() => {
    const unsub = subscribeToAccounts((liveAccounts) => {
      if (liveAccounts && liveAccounts.length > 0) {
        setAccounts(liveAccounts);
        saveAccounts(liveAccounts);
      }
    });

    const handleLocalAccountsChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setAccounts(e.detail);
      }
    };
    window.addEventListener('bsan_accounts_changed', handleLocalAccountsChanged);

    return () => {
      unsub();
      window.removeEventListener('bsan_accounts_changed', handleLocalAccountsChanged);
    };
  }, []);

  const currentSchool = schoolConfig || SCHOOL_CONFIG;

  // Filter accounts by search term
  const filteredAccounts = accounts.filter((acc) => {
    const q = searchTerm.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.role.toLowerCase().includes(q) ||
      (acc.nip && acc.nip.includes(q)) ||
      acc.username.toLowerCase().includes(q)
    );
  });

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedAccount) {
      setErrorMsg('Harap pilih akun petugas terlebih dahulu.');
      return;
    }

    if (!pin.trim()) {
      setErrorMsg('Harap masukkan password / PIN akun Anda.');
      return;
    }

    const enteredPin = pin.trim();
    let verifiedAccount: UserAccount | null = null;
    const localExpectedPin = selectedAccount.pin || '1234';

    if (enteredPin === localExpectedPin) {
      verifiedAccount = selectedAccount;
    } else {
      // Cross-device password verification: query Firestore directly in case password was changed on another device
      setIsVerifying(true);
      try {
        const cloudAccount = await getAccountDirectlyFromFirestore(selectedAccount.id);
        if (cloudAccount && (cloudAccount.pin || '1234') === enteredPin) {
          verifiedAccount = cloudAccount;
          // Synchronize local accounts cache with cloud account
          setAccounts((prev) => {
            const updated = prev.map((a) => (a.id === cloudAccount.id ? cloudAccount : a));
            saveAccounts(updated);
            return updated;
          });
        }
      } catch (err) {
        console.warn('Direct Firestore verification error', err);
      } finally {
        setIsVerifying(false);
      }
    }

    if (!verifiedAccount) {
      setErrorMsg('Password / PIN yang Anda masukkan salah. Password default awal adalah 1234.');
      return;
    }

    // Success login
    setCurrentUserId(verifiedAccount.id);
    sessionStorage.setItem('bsan_active_session_unlocked', 'true');

    logAudit({
      actionType: 'LOGIN',
      module: 'Autentikasi',
      description: `Login sukses petugas: ${verifiedAccount.name} (${verifiedAccount.role})`,
      status: 'SUCCESS',
      forcedUser: {
        id: verifiedAccount.id,
        name: verifiedAccount.name,
        role: verifiedAccount.role,
      },
    });

    onLoginSuccess(verifiedAccount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#2F4CB7] to-[#1E293B] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Decorative background glow circles */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Branding */}
      <div className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between text-white pb-4">
        <div className="flex items-center gap-3">
          {currentSchool.logoUrl ? (
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md overflow-hidden flex items-center justify-center">
              <img src={currentSchool.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-white text-[#3B5BDB] flex items-center justify-center font-black shadow-md">
              <Award className="w-6 h-6 stroke-[2.5]" />
            </div>
          )}
          <div>
            <h1 className="font-black text-sm sm:text-base tracking-tight uppercase leading-tight">
              {currentSchool.name || 'SMP NEGERI 1 KANDANGAN'}
            </h1>
            <p className="text-xs text-blue-200 font-medium">
              Sistem Informasi Budaya Sekolah Aman dan Nyaman (BSAN)
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Sistem Resmi & Terverifikasi</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-white/30 overflow-hidden backdrop-blur-md">
          {/* Card Banner Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B5BDB] p-6 text-white text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Portal Masuk Petugas & Guru
            </h2>
            <p className="text-xs text-blue-100 mt-1">
              Silakan pilih akun Anda dan masukkan password untuk mengakses aplikasi.
            </p>
          </div>

          {/* Form Area */}
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-7 space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Select User / Account */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilih Nama Petugas / Guru:
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 text-left rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#3B5BDB]/40 bg-slate-50 flex items-center justify-between transition-colors cursor-pointer text-xs"
                >
                  {selectedAccount ? (
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{selectedAccount.name}</div>
                      <div className="text-[11px] text-blue-700 font-medium truncate">
                        {selectedAccount.role} · NIP: {selectedAccount.nip || '-'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 font-medium">-- Klik untuk mencari / memilih nama --</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 max-h-64 flex flex-col space-y-2">
                    <div className="relative px-2 pt-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ketik nama guru / jabatan..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#3B5BDB]"
                        autoFocus
                      />
                    </div>

                    <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                      {filteredAccounts.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">
                          Tidak ditemukan nama petugas yang cocok.
                        </div>
                      ) : (
                        filteredAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setIsDropdownOpen(false);
                              setErrorMsg(null);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl transition-colors text-xs flex items-center justify-between ${
                              selectedAccountId === acc.id
                                ? 'bg-blue-50 text-[#3B5BDB] font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="truncate font-semibold">{acc.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{acc.role}</div>
                            </div>
                            {selectedAccountId === acc.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#3B5BDB] shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PIN / Password Input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password / PIN Keamanan:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Masukkan password / PIN"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#3B5BDB]/40 font-mono tracking-wider text-slate-900 bg-slate-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPin ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 pt-0.5 px-1">
                <span>Password default awal: <strong className="font-mono text-blue-700">1234</strong></span>
              </div>
            </div>

            {/* Login Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#3B5BDB] hover:bg-[#2F4CB7] text-white text-xs font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-98 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem Aplikasi</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Card Info */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Tahun {currentSchool.footerYear || '2026'} · Budaya Sekolah Aman dan Nyaman (BSAN)
          </div>
        </div>
      </div>
    </div>
  );
};
