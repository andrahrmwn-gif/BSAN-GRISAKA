import React, { useState } from 'react';
import { UserAccount, UserRole, OFFICIAL_JABATAN_LIST } from '../../types/auth';
import { 
  getStoredAccounts, 
  getCurrentUserId, 
  setCurrentUserId, 
  MAX_ACCOUNTS, 
  updateAccount,
  addAccount 
} from '../../services/authService';
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
  Filter,
  UserPlus
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

  // New Account Modal State
  const [isAddingAcc, setIsAddingAcc] = useState(false);
  const [newAccForm, setNewAccForm] = useState({
    name: '',
    username: '',
    role: 'Guru' as UserRole,
    nip: '',
    pin: '1234',
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
  });
  const [addErrorMsg, setAddErrorMsg] = useState<string | null>(null);
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAccountToLogin = (acc: UserAccount) => {
    setSelectedAccount(acc);
    setEnteredPin('');
    setPinError(null);
  };

  const handleConfirmLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAccount) return;

    if (selectedAccount.pin) {
      if (!enteredPin.trim()) {
        setPinError('Harap masukkan PIN keamanan akun Anda.');
        return;
      }
      if (enteredPin.trim() !== selectedAccount.pin) {
        setPinError('PIN yang Anda masukkan salah. Masukkan PIN yang benar.');
        return;
      }
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
      role: editingAcc.role,
      nip: editingAcc.nip,
      pin: editingAcc.pin,
    });

    if (res.success) {
      logAudit({
        actionType: 'UPDATE',
        module: 'Autentikasi',
        description: `Memperbarui profil akun (Nama/NIP/Jabatan/Password): ${editingAcc.name} (${editingAcc.role})`,
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

  const handleOpenAddAccount = () => {
    setEditingAcc(null);
    setSelectedAccount(null);
    setIsAddingAcc(true);
    setAddErrorMsg(null);
    setAddSuccessMsg(null);
    setNewAccForm({
      name: '',
      username: '',
      role: 'Guru',
      nip: '',
      pin: '1234',
      canEdit: true,
      canDelete: false,
      canManageSettings: false,
    });
  };

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAddErrorMsg(null);

    if (!newAccForm.name.trim() || !newAccForm.username.trim()) {
      setAddErrorMsg('Nama Lengkap dan Username wajib diisi.');
      return;
    }

    const res = addAccount({
      name: newAccForm.name.trim(),
      username: newAccForm.username.trim().toLowerCase().replace(/\s+/g, '.'),
      role: newAccForm.role,
      nip: newAccForm.nip.trim() || '-',
      pin: newAccForm.pin || '1234',
      isActive: true,
      canEdit: newAccForm.canEdit,
      canDelete: newAccForm.canDelete || newAccForm.role === 'Kepala Sekolah' || newAccForm.role.includes('Tata Usaha'),
      canManageSettings: newAccForm.canManageSettings || newAccForm.role === 'Kepala Sekolah',
      avatarColor: '#2563EB',
    });

    if (res.success && res.account) {
      logAudit({
        actionType: 'CREATE',
        module: 'Autentikasi',
        description: `Mendaftarkan akun petugas baru: ${res.account.name} (${res.account.role})`,
        status: 'SUCCESS',
      });

      const updated = getStoredAccounts();
      setAccounts(updated);
      setAddSuccessMsg(res.message);
      setTimeout(() => {
        setIsAddingAcc(false);
        setAddSuccessMsg(null);
      }, 1500);
    } else {
      setAddErrorMsg(res.message);
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
    if (roleFilter === 'pimpinan') return matchesSearch && (acc.role === 'Kepala Sekolah' || acc.role.includes('Wakil Kepala Sekolah'));
    if (roleFilter === 'guru') return matchesSearch && acc.role === 'Guru';
    if (roleFilter === 'tu') return matchesSearch && (acc.role.toLowerCase().includes('tata usaha'));

    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#3451B2] to-[#3B5BDB] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold shadow-inner">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Pilih Akun Petugas BSAN ({accounts.length} / {MAX_ACCOUNTS} Terdaftar)
              </h3>
              <p className="text-xs text-blue-100">
                Tiap akun dapat dirubah Nama, NIP, dan Passwordnya. Mode Tamu berstatus view-only.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddAccount}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shadow-xs"
              title="Daftarkan akun atau petugas BSAN baru"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Akun</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-100 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

        {/* Modal Body: Add Account or Quick Edit or PIN Entry or Accounts List */}
        {isAddingAcc ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Tambah Akun / Petugas Baru
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Daftarkan akun petugas resmi ({accounts.length} / {MAX_ACCOUNTS} slot terisi)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingAcc(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{addSuccessMsg}</span>
              </div>
            )}

            {addErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd."
                  value={newAccForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoUsername = name
                      .toLowerCase()
                      .replace(/[^a-z0-9\s]/g, '')
                      .trim()
                      .replace(/\s+/g, '.');
                    setNewAccForm({ 
                      ...newAccForm, 
                      name, 
                      username: newAccForm.username || autoUsername 
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="nama.user"
                    value={newAccForm.username}
                    onChange={(e) => setNewAccForm({ ...newAccForm, username: e.target.value.toLowerCase().replace(/\s+/g, '.') })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Password / PIN Akses *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="1234"
                    value={newAccForm.pin}
                    onChange={(e) => setNewAccForm({ ...newAccForm, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Jabatan Petugas *
                  </label>
                  <select
                    value={newAccForm.role}
                    onChange={(e) => setNewAccForm({ ...newAccForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-bold text-slate-900 cursor-pointer"
                  >
                    {OFFICIAL_JABATAN_LIST.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    placeholder="1980... atau '-'"
                    value={newAccForm.nip}
                    onChange={(e) => setNewAccForm({ ...newAccForm, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-mono font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="block font-bold text-slate-800 text-[11px]">Wewenang Operasi:</span>
                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newAccForm.canEdit}
                    onChange={(e) => setNewAccForm({ ...newAccForm, canEdit: e.target.checked })}
                    className="rounded text-[#3B5BDB] focus:ring-[#3B5BDB]"
                  />
                  <span>Dapat menginput / mengedit catatan pelanggaran & presensi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newAccForm.canDelete}
                    onChange={(e) => setNewAccForm({ ...newAccForm, canDelete: e.target.checked })}
                    className="rounded text-[#3B5BDB] focus:ring-[#3B5BDB]"
                  />
                  <span>Dapat menghapus catatan pelanggaran</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddingAcc(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        ) : editingAcc ? (
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3B5BDB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Jabatan Petugas BSAN
                </label>
                <select
                  value={editingAcc.role}
                  onChange={(e) => setEditingAcc({ ...editingAcc, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3B5BDB] focus:outline-none font-bold text-slate-900 cursor-pointer text-xs"
                >
                  {OFFICIAL_JABATAN_LIST.map((jabatan) => (
                    <option key={jabatan} value={jabatan}>
                      {jabatan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    value={editingAcc.nip}
                    onChange={(e) => setEditingAcc({ ...editingAcc, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3B5BDB] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password / PIN Baru</label>
                  <input
                    type="password"
                    required
                    value={editingAcc.pin}
                    onChange={(e) => setEditingAcc({ ...editingAcc, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3B5BDB] focus:outline-none font-mono"
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
                  className="px-5 py-2 bg-[#3B5BDB] hover:bg-[#2F4CB7] text-white rounded-xl font-bold shadow-xs cursor-pointer"
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
                style={{ backgroundColor: selectedAccount.avatarColor || '#3B5BDB' }}
              >
                {selectedAccount.name.charAt(0)}
              </div>
              <h4 className="font-extrabold text-base text-slate-900 pt-2">
                {selectedAccount.name}
              </h4>
              <p className="text-xs text-blue-700 font-semibold">
                {selectedAccount.role} · {selectedAccount.username}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                NIP. {selectedAccount.nip || '-'}
              </p>
            </div>

            {selectedAccount.pin === '1234' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950">Peringatan Keamanan:</span> Akun ini masih menggunakan PIN bawaan standar (<span className="font-mono font-bold">1234</span>). Siapapun dapat masuk jika belum diganti. Disarankan segera mengganti PIN rahasia pribadi Anda.
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmLogin} className="max-w-xs mx-auto space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 text-center">
                  Masukkan PIN / Password Akun {selectedAccount.pin === '1234' ? '(Default: 1234)' : ''}
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
                    className="w-full text-center pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base tracking-widest focus:ring-2 focus:ring-[#3B5BDB] focus:outline-none"
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
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#3B5BDB] hover:bg-[#2F4CB7] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#3B5BDB] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: `Semua (${accounts.length})` },
                    { id: 'pimpinan', label: 'Pimpinan & Wakasek' },
                    { id: 'guru', label: 'Guru' },
                    { id: 'tu', label: 'Tata Usaha' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRoleFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        roleFilter === f.id
                          ? 'bg-[#3B5BDB] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddAccount}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Daftarkan akun atau petugas baru"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Akun Baru</span>
                </button>
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
                          ? 'bg-blue-50/90 border-[#3B5BDB] ring-1 ring-[#3B5BDB]'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div 
                        onClick={() => handleSelectAccountToLogin(acc)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: acc.avatarColor || '#3B5BDB' }}
                        >
                          {acc.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {acc.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <span className="font-semibold text-blue-700">{acc.role}</span>
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
                              ? 'bg-[#3B5BDB] text-white font-black'
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
