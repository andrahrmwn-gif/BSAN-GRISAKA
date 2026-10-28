import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../../types/auth';
import { 
  getStoredAccounts, 
  saveAccounts, 
  getCurrentUserId, 
  setCurrentUserId, 
  MAX_ACCOUNTS,
  addAccount,
  updateAccount,
  deleteAccount
} from '../../services/authService';
import { logAudit } from '../../services/auditLogger';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  LogIn, 
  Eye, 
  AlertCircle,
  Key,
  Shield,
  UserCheck
} from 'lucide-react';

interface AccountManagerProps {
  onAccountSwitched?: (user: UserAccount | null) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ onAccountSwitched }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getStoredAccounts());
  const [currentId, setCurrentId] = useState<string>(() => getCurrentUserId());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New account form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Guru Piket');
  const [newNip, setNewNip] = useState('');
  const [newPin, setNewPin] = useState('1234');

  useEffect(() => {
    setAccounts(getStoredAccounts());
    setCurrentId(getCurrentUserId());
  }, []);

  const handleSwitchAccount = (id: string) => {
    setCurrentUserId(id);
    setCurrentId(id);
    const user = accounts.find(a => a.id === id) || null;
    
    if (id === 'guest') {
      logAudit({
        actionType: 'LOGIN',
        module: 'Autentikasi',
        description: 'Beralih ke Mode Tamu (Guest - View Only)',
        status: 'SUCCESS'
      });
    } else if (user) {
      logAudit({
        actionType: 'LOGIN',
        module: 'Autentikasi',
        description: `Login sesi berhasil sebagai ${user.name} (${user.role})`,
        status: 'SUCCESS',
        forcedUser: { id: user.id, name: user.name, role: user.role }
      });
    }

    if (onAccountSwitched) {
      onAccountSwitched(user);
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!newName.trim() || !newUsername.trim()) {
      setFormMsg({ text: 'Nama dan Username wajib diisi', type: 'error' });
      return;
    }

    const res = addAccount({
      name: newName.trim(),
      username: newUsername.trim(),
      role: newRole,
      nip: newNip.trim() || '-',
      pin: newPin || '1234',
      isActive: true,
      canEdit: true,
      canDelete: newRole === 'Kepala Sekolah' || newRole === 'Wakasek Kesiswaan' || newRole === 'Tata Usaha (Admin)',
      canManageSettings: newRole === 'Kepala Sekolah' || newRole === 'Tata Usaha (Admin)',
      avatarColor: '#0B231E'
    });

    if (res.success) {
      logAudit({
        actionType: 'CREATE',
        module: 'Autentikasi',
        description: `Mendaftarkan akun baru: ${newName} (${newRole})`,
        status: 'SUCCESS'
      });

      setAccounts(getStoredAccounts());
      setIsAddModalOpen(false);
      setNewName('');
      setNewUsername('');
      setNewNip('');
      setFormMsg({ text: res.message, type: 'success' });
      setTimeout(() => setFormMsg(null), 3000);
    } else {
      setFormMsg({ text: res.message, type: 'error' });
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const res = updateAccount(editingAccount.id, {
      name: editingAccount.name,
      role: editingAccount.role,
      nip: editingAccount.nip,
      pin: editingAccount.pin,
      isActive: editingAccount.isActive,
      canEdit: editingAccount.canEdit,
      canDelete: editingAccount.canDelete,
      canManageSettings: editingAccount.canManageSettings
    });

    if (res.success) {
      logAudit({
        actionType: 'UPDATE',
        module: 'Autentikasi',
        description: `Memperbarui akun petugas: ${editingAccount.name} (${editingAccount.role})`,
        status: 'SUCCESS'
      });

      setAccounts(getStoredAccounts());
      setEditingAccount(null);
      setFormMsg({ text: 'Perubahan akun berhasil disimpan.', type: 'success' });
      setTimeout(() => setFormMsg(null), 3000);
    }
  };

  const handleDelete = (acc: UserAccount) => {
    if (window.confirm(`Yakin ingin menghapus akun ${acc.name} (${acc.role})? Tindakan ini akan mengosongkan 1 slot akun.`)) {
      const res = deleteAccount(acc.id);
      if (res.success) {
        logAudit({
          actionType: 'DELETE',
          module: 'Autentikasi',
          description: `Menghapus akun petugas: ${acc.name} (${acc.role})`,
          status: 'SUCCESS'
        });

        setAccounts(getStoredAccounts());
        setCurrentId(getCurrentUserId());
        setFormMsg({ text: res.message, type: 'success' });
        setTimeout(() => setFormMsg(null), 3000);
      }
    }
  };

  const rolesList: UserRole[] = [
    'Kepala Sekolah',
    'Wakasek Kesiswaan',
    'Guru BK',
    'Tim Kesiswaan & Ketertiban',
    'Guru Piket',
    'Wali Kelas',
    'Tata Usaha (Admin)'
  ];

  return (
    <div className="space-y-6">
      {/* Header & Quota Status */}
      <div className="bg-gradient-to-r from-[#0B231E] via-[#0f352b] to-[#124235] text-white p-6 rounded-3xl border border-[#1a4f40] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#83C532]" />
            <h3 className="font-extrabold text-base tracking-tight text-white">
              Manajemen Hak Akses & Kontrol 20 Akun Petugas
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Sistem dibatasi secara ketat maksimal <strong>{MAX_ACCOUNTS} akun resmi</strong> yang dapat login dan melakukan input/perubahan data. Akun di luar ini atau mode tamu hanya dapat melihat menu tanpa hak modifikasi.
          </p>
        </div>

        {/* Quota Counter Badge & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-black/40 border border-white/20 text-center">
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">
              Kuota Terdaftar
            </div>
            <div className="text-xl font-black font-mono text-white">
              {accounts.length} / {MAX_ACCOUNTS} <span className="text-xs font-normal text-slate-300">Akun</span>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={accounts.length >= MAX_ACCOUNTS}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#83C532] hover:bg-[#94db3a] disabled:opacity-40 disabled:hover:bg-[#83C532] text-[#0B231E] font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            title={accounts.length >= MAX_ACCOUNTS ? 'Kuota 20 akun penuh' : 'Tambah Akun Petugas Baru'}
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Akun ({MAX_ACCOUNTS - accounts.length} Sisa)</span>
          </button>
        </div>
      </div>

      {formMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
          formMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{formMsg.text}</span>
        </div>
      )}

      {/* Guest Mode Switch Bar */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">Mode Tamu (Guest View-Only)</span>
              {currentId === 'guest' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                  AKTIF SEKARANG
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Mode tanpa login: dapat membuka dan melihat seluruh grafik, buku pelanggaran, serta laporan, tetapi tidak dapat mengubah data.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSwitchAccount('guest')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentId === 'guest'
              ? 'bg-slate-300 text-slate-600 cursor-default'
              : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs'
          }`}
        >
          {currentId === 'guest' ? 'Sedang di Mode Tamu' : 'Beralih ke Mode Tamu'}
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc, index) => {
          const isCurrent = currentId === acc.id;

          return (
            <div
              key={acc.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-emerald-50/70 border-[#83C532] shadow-sm ring-2 ring-[#83C532]/40'
                  : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                      style={{ backgroundColor: acc.avatarColor || '#0B231E' }}
                    >
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {acc.name}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#83C532] text-[#0B231E] uppercase tracking-wider">
                            Akun Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-emerald-800">{acc.role}</span>
                        <span>·</span>
                        <span className="font-mono text-[10px]">Slot #{index + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Username & NIP:</span>
                    <span className="font-mono font-medium text-slate-800">{acc.username}</span>
                    <span className="block text-slate-400 font-mono text-[10px]">{acc.nip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hak Akses Data:</span>
                    <span className="font-semibold text-emerald-700">
                      {acc.canEdit ? '✓ Akses Penuh Input' : 'Hanya Lihat'}
                    </span>
                    <span className="block text-slate-400 text-[10px]">
                      {acc.canManageSettings ? 'Admin Sistem' : 'Operator Petugas'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingAccount(acc)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Ubah Rincian Akun"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={() => handleDelete(acc)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isCurrent ? (
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Sesi Berjalan</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSwitchAccount(acc.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#83C532]" />
                    <span>Login Akun Ini</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Tambah Akun Baru (Maks 20) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0B231E] text-[#83C532] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Tambah Akun Petugas ({accounts.length + 1} / {MAX_ACCOUNTS})
                  </h3>
                  <p className="text-[11px] text-slate-500">Maksimal 20 akun resmi terdaftar.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Sri Wahyuni, S.Pd., M.Si."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                    placeholder="nama.user"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Akses (4 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Jabatan *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    value={newNip}
                    onChange={(e) => setNewNip(e.target.value)}
                    placeholder="1980... atau '-'"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B231E] hover:bg-[#143d34] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan & Daftarkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Akun */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Ubah Akun Petugas ({editingAccount.name})
                  </h3>
                  <p className="text-[11px] text-slate-500">Perbarui wewenang atau rincian profil.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Jabatan</label>
                  <select
                    value={editingAccount.role}
                    onChange={(e) => setEditingAccount({ ...editingAccount, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP</label>
                  <input
                    type="text"
                    value={editingAccount.nip}
                    onChange={(e) => setEditingAccount({ ...editingAccount, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Akses</label>
                <input
                  type="password"
                  value={editingAccount.pin}
                  onChange={(e) => setEditingAccount({ ...editingAccount, pin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B231E] focus:outline-none font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200/80">
                <span className="block font-bold text-slate-700">Wewenang Operasi:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAccount.canEdit}
                    onChange={(e) => setEditingAccount({ ...editingAccount, canEdit: e.target.checked })}
                    className="rounded text-[#0B231E] focus:ring-[#0B231E]"
                  />
                  <span>Dapat menginput / mengedit catatan pelanggaran & siswa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAccount.canDelete}
                    onChange={(e) => setEditingAccount({ ...editingAccount, canDelete: e.target.checked })}
                    className="rounded text-[#0B231E] focus:ring-[#0B231E]"
                  />
                  <span>Dapat menghapus catatan pelanggaran</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
