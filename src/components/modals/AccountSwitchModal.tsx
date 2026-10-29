import React, { useState } from 'react';
import { UserAccount, UserRole } from '../../types/auth';
import { getStoredAccounts, getCurrentUserId, setCurrentUserId, MAX_ACCOUNTS, updateAccount } from '../../services/authService';
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
  AlertCircle,
  Search,
  Edit3,
  Filter
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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Quick Edit Account Modal
  const [editingAcc, setEditingAcc] = useState<UserAccount | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAccountToLogin = (acc: UserAccount) => {
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

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcc) return;

    const res = updateAccount(editingAcc.id, {
      name: editingAcc.name,
      nip: editingAcc.nip,
      pin: editingAcc.pin,
    });

    if (res.success) {
      logAudit({
        actionType: 'UPDATE',
        module: 'Autentikasi',
        description: `Memperbarui data akun (Nama/NIP/Password): ${editingAcc.name}`,
        status: 'SUCCESS',
      });

      const updated = getStoredAccounts();
      setAccounts(updated);
      setEditSuccessMsg('Nama, NIP, atau Password akun berhasil diperbarui!');
      setTimeout(() => {
        setEditSuccessMsg(null);
        setEditingAcc(null);
      }, 1500);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = 
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.nip.includes(searchQuery);

    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'wali') return matchesSearch && acc.role === 'Wali Kelas';
    if (roleFilter === 'piket') return matchesSearch && acc.role === 'Guru Piket';
    if (roleFilter === 'pimpinan') return matchesSearch && (acc.role === 'Kepala Sekolah' || acc.role === 'Wakasek Kesiswaan' || acc.role === 'Guru BK');
    if (roleFilter === 'tu') return matchesSearch && (acc.role === 'Tata Usaha (Admin)' || acc.role === 'Tim Kesiswaan & Ketertiban');

    return matchesSearch;
  });

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
                Tiap akun dapat dirubah Nama, NIP, dan Passwordnya. Mode Tamu berstatus view-only.
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
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
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
                  Dapat melihat seluruh grafik, presensi, & buku pelanggaran tanpa hak merubah data.
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

        {/* Modal Body: Quick Edit or PIN Entry or Accounts List */}
        {editingAcc ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Ubah Nama, NIP & Password Akun</h4>
                  <p className="text-[11px] text-slate-500">{editingAcc.username} ({editingAcc.role})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAcc(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {editSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={editingAcc.name}
                  onChange={(e) => setEditingAcc({ ...editingAcc, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    value={editingAcc.nip}
                    onChange={(e) => setEditingAcc({ ...editingAcc, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password / PIN Baru</label>
                  <input
                    type="password"
                    required
                    value={editingAcc.pin}
                    onChange={(e) => setEditingAcc({ ...editingAcc, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAcc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B231E] hover:bg-[#143d34] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        ) : selectedAccount ? (
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
              <p className="text-[11px] text-slate-400 font-mono">
                NIP. {selectedAccount.nip || '-'}
              </p>
            </div>

            <form onSubmit={handleConfirmLogin} className="max-w-xs mx-auto space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 text-center">
                  Masukkan PIN / Password Akun (Default: 1234)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    autoFocus
                    maxLength={10}
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
                  <p className="text-[11px] text-red-600 font-semibold text-center mt-1">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAcc(selectedAccount)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  Ubah Nama, NIP atau Password Akun Ini?
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* List of 55 Accounts with Search & Filter */
          <div className="p-5 space-y-3">
            {/* Search and Category Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari dari 55 akun (Nama, NIP, Peran, Rombel)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0B231E] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1 text-[11px]">
                {[
                  { id: 'all', label: 'Semua (55)' },
                  { id: 'wali', label: 'Wali Kelas (24)' },
                  { id: 'piket', label: 'Guru Piket (12)' },
                  { id: 'pimpinan', label: 'Pimpinan & BK' },
                  { id: 'tu', label: 'TU & Kesiswaan' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRoleFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      roleFilter === f.id
                        ? 'bg-[#0B231E] text-[#83C532]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredAccounts.map((acc, idx) => {
                  const isCurrent = currentId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isCurrent
                          ? 'bg-emerald-50/90 border-[#83C532] ring-1 ring-[#83C532]'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div 
                        onClick={() => handleSelectAccountToLogin(acc)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
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
                            <span className="font-mono text-slate-400">NIP: {acc.nip.split(' ')[0] || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAcc(acc);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ubah Nama, NIP atau Password"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectAccountToLogin(acc)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer ${
                            isCurrent
                              ? 'bg-[#83C532] text-[#0B231E] font-black'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isCurrent ? 'Aktif' : 'Login'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
