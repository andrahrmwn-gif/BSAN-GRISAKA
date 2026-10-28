import React, { useState, useEffect } from 'react';
import { SchoolProfile, Student, ViolationRecord } from '../../types';
import { 
  Settings, 
  Upload, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  School, 
  UserCheck, 
  Image as ImageIcon, 
  FileText, 
  Award, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  DownloadCloud, 
  UploadCloud, 
  LogOut, 
  Database, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken, 
  syncDataToGoogleSheets, 
  pullDataFromGoogleSheets,
  findOrCreateDatabaseSpreadsheet,
  getStoredSpreadsheetId,
  getStoredLastSync
} from '../../services/googleWorkspace';
import { User } from 'firebase/auth';
import { AccountManager } from './AccountManager';
import { AuditLogTable } from './AuditLogTable';
import { isGuestMode, getCurrentUser } from '../../services/authService';
import { logAudit } from '../../services/auditLogger';
import { Users, Shield, History, Lock } from 'lucide-react';

interface SchoolSettingsViewProps {
  schoolConfig: SchoolProfile;
  students?: Student[];
  violations?: ViolationRecord[];
  onUpdateSchoolConfig: (newConfig: SchoolProfile) => void;
  onPullDataFromSheets?: (
    newStudents: Student[], 
    newViolations: ViolationRecord[], 
    partialConfig?: Partial<SchoolProfile>
  ) => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  schoolConfig,
  students = [],
  violations = [],
  onUpdateSchoolConfig,
  onPullDataFromSheets,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>({
    ...schoolConfig,
    timKesiswaanName: schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Tim Kesiswaan',
    timKesiswaanTitle: schoolConfig.timKesiswaanTitle || 'Tim Kesiswaan & Ketertiban',
    timKesiswaanNip: schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '-',
    bkName: schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.',
    bkTitle: schoolConfig.bkTitle || 'Koordinator Guru BK / Konselor Sekolah',
    bkNip: schoolConfig.bkNip || '19780824 200501 2 008',
  });
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(schoolConfig.logoUrl || '');

  // Google Drive & Sheets Sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getStoredSpreadsheetId());
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(
    getStoredSpreadsheetId() 
      ? `https://docs.google.com/spreadsheets/d/${getStoredSpreadsheetId()}/edit` 
      : null
  );
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getStoredLastSync());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPullConfirmOpen, setIsPullConfirmOpen] = useState(false);

  useEffect(() => {
    setFormData({
      ...schoolConfig,
      timKesiswaanName: schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Tim Kesiswaan',
      timKesiswaanTitle: schoolConfig.timKesiswaanTitle || 'Tim Kesiswaan & Ketertiban',
      timKesiswaanNip: schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '-',
      bkName: schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.',
      bkTitle: schoolConfig.bkTitle || 'Koordinator Guru BK / Konselor Sekolah',
      bkNip: schoolConfig.bkNip || '19780824 200501 2 008',
    });
    setLogoPreview(schoolConfig.logoUrl || '');
  }, [schoolConfig]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        findOrCreateDatabaseSpreadsheet(token)
          .then((res) => {
            setSpreadsheetId(res.id);
            setSpreadsheetUrl(res.url);
          })
          .catch((err) => console.log('Spreadsheet check error:', err));
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Harap unggah logo berukuran di bawah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setLogoPreview('');
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile_db' | 'accounts' | 'audit_log'>('profile_db');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isGuestMode()) {
      alert('Akses Ditolak: Anda saat ini berada dalam Mode Tamu (Guest - View Only). Hanya 20 akun petugas resmi yang berhak mengubah pengaturan.');
      logAudit({
        actionType: 'BLOCKED',
        module: 'Pengaturan',
        description: 'Percobaan simpan konfigurasi profil sekolah ditolak karena berada dalam Mode Tamu',
        status: 'BLOCKED'
      });
      return;
    }

    const updated: SchoolProfile = {
      ...formData,
      wakasekName: formData.timKesiswaanName,
      wakasekNip: formData.timKesiswaanNip,
    };
    onUpdateSchoolConfig(updated);
    
    logAudit({
      actionType: 'UPDATE',
      module: 'Pengaturan',
      description: 'Memperbarui identitas sekolah dan susunan pejabat penandatangan BSAN',
      status: 'SUCCESS'
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  // Google Login
  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        const sheetRes = await findOrCreateDatabaseSpreadsheet(res.accessToken);
        setSpreadsheetId(sheetRes.id);
        setSpreadsheetUrl(sheetRes.url);
        setSyncMessage({
          text: `Berhasil terhubung dengan Google Drive & Spreadsheet "${sheetRes.id}"`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setSyncMessage({
        text: `Gagal login ke Google: ${err?.message || 'Izin ditolak atau popup ditutup.'}`,
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Logout
  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setSyncMessage({ text: 'Berhasil memutuskan koneksi akun Google.', type: 'success' });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Push Data to Google Sheets
  const handlePushToSheets = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const signinRes = await googleSignIn();
        if (!signinRes) throw new Error('Silakan masuk ke akun Google Anda terlebih dahulu.');
        token = signinRes.accessToken;
        setGoogleUser(signinRes.user);
      }

      const res = await syncDataToGoogleSheets(token, students, violations, formData);
      setSpreadsheetId(res.id);
      setSpreadsheetUrl(res.url);
      setLastSyncTime(res.syncedAt);
      setSyncMessage({
        text: `Sukses! Seluruh data (${students.length} siswa, ${violations.length} catatan pelanggaran) tersinkronisasi ke Google Sheets.`,
        type: 'success',
      });
    } catch (err: any) {
      setSyncMessage({
        text: `Gagal menyinkronkan ke Google Sheets: ${err?.message || err}`,
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull Data from Google Sheets
  const handleConfirmPullFromSheets = async () => {
    setIsPullConfirmOpen(false);
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const signinRes = await googleSignIn();
        if (!signinRes) throw new Error('Silakan masuk ke akun Google Anda terlebih dahulu.');
        token = signinRes.accessToken;
        setGoogleUser(signinRes.user);
      }

      const id = spreadsheetId || getStoredSpreadsheetId();
      if (!id) throw new Error('Spreadsheet ID belum terdaftar di aplikasi.');

      const pulled = await pullDataFromGoogleSheets(token, id);
      if (onPullDataFromSheets) {
        onPullDataFromSheets(pulled.students, pulled.violations, pulled.partialConfig);
      }

      setSyncMessage({
        text: `Sukses memuat data dari Google Sheets (${pulled.students.length} siswa, ${pulled.violations.length} kasus).`,
        type: 'success',
      });
    } catch (err: any) {
      setSyncMessage({
        text: `Gagal memuat data dari Google Sheets: ${err?.message || err}`,
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#83C532]"></span>
            <h2 className="text-base font-bold text-slate-900">
              Pengaturan Sistem & Database Google Sheets / Drive
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan identitas sekolah, pejabat penandatangan (Kepala Sekolah & Tim Kesiswaan), logo resmi, dan integrasi Google Sheets sebagai database.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Berhasil Disimpan & Langsung Aktif!</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setActiveSettingsTab('profile_db')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSettingsTab === 'profile_db'
              ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Profil Sekolah & Database Cloud</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSettingsTab === 'accounts'
              ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen 20 Akun Petugas</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('audit_log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSettingsTab === 'audit_log'
              ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Log & Keamanan</span>
        </button>
      </div>

      {/* TAB 1: PROFIL SEKOLAH & GOOGLE SHEETS / DRIVE SYNC */}
      {activeSettingsTab === 'profile_db' && (
        <div className="space-y-6">
          {/* SECTION: INTEGRASI GOOGLE DRIVE & GOOGLE SHEETS SEBAGAI DATABASE */}
          <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 p-6 rounded-3xl border-2 border-emerald-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Database Cloud Google Drive & Google Sheets
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#83C532]/25 text-emerald-800 border border-emerald-300">
                  Aktif & Terintegrasi
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simpan data siswa, buku pelanggaran, dan konfigurasi sekolah secara langsung di spreadsheet akun Google Drive Anda.
              </p>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-2">
            {googleUser ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Google Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Belum Terhubung
              </span>
            )}
          </div>
        </div>

        {/* Sync Notifications */}
        {syncMessage && (
          <div className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}>
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
        )}

        {/* Main Content Area for Google Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Account & File Information */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Status Akun & Spreadsheet</span>
            </div>

            {googleUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  {googleUser.photoURL ? (
                    <img 
                      src={googleUser.photoURL} 
                      alt={googleUser.displayName || 'Google User'} 
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm">
                      {googleUser.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {googleUser.displayName || 'Akun Google Sekolah'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {googleUser.email}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    Dokumen Google Spreadsheet:{' '}
                    <strong className="text-slate-900">BSAN_Database_SMPN1_Kandangan</strong>
                  </div>
                  {lastSyncTime && (
                    <div className="text-[11px] text-slate-500">
                      Terakhir Disinkronkan:{' '}
                      <span className="font-mono font-medium text-slate-700">
                        {new Intl.DateTimeFormat('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(lastSyncTime))} WIB
                      </span>
                    </div>
                  )}
                </div>

                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors"
                  >
                    <span>Buka Database di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hubungkan dengan akun Google Drive sekolah Anda. Sistem akan membuat atau menghubungkan lembar kerja Google Sheets secara otomatis untuk menyimpan seluruh database siswa dan catatan pelanggaran secara permanen.
                </p>

                {/* Official Sign in with Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSyncing}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl shadow-xs transition-all active:scale-95 font-semibold text-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{isSyncing ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Sync Actions (Push & Pull) */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Aksi Sinkronisasi Dua Arah</span>
            </div>

            <div className="space-y-2.5">
              {/* Push Action */}
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-950">
                    Sinkronkan ke Google Sheets (Push)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                    Lokal ➔ Cloud
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Mengirimkan seluruh data murid ({students.length} siswa) dan buku pelanggaran ({violations.length} kasus) ke Google Spreadsheet secara terstruktur.
                </p>
                <button
                  type="button"
                  onClick={handlePushToSheets}
                  disabled={isSyncing}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-[#83C532]" />
                  <span>{isSyncing ? 'Sedang Menyinkronkan...' : 'Sinkronkan Database Sekarang'}</span>
                </button>
              </div>

              {/* Pull Action */}
              <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-950">
                    Tarik Data dari Google Sheets (Pull)
                  </span>
                  <span className="text-[10px] text-sky-700 font-mono font-semibold">
                    Cloud ➔ Lokal
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Memuat data siswa dan pelanggaran terbaru dari Google Sheets jika tim lain telah melakukan perubahan di spreadsheet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPullConfirmOpen(true)}
                  disabled={isSyncing || !googleUser}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <DownloadCloud className="w-4 h-4 text-sky-200" />
                  <span>Tarik / Muat Data dari Sheets</span>
                </button>
              </div>

              {googleUser && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putus Sambungan Akun Google</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Upload Logo Sekolah */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ImageIcon className="w-5 h-5 text-[#0B231E]" />
            <h3 className="font-bold text-sm text-slate-900">Logo Resmi Sekolah</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Logo Preview Box */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center p-2 overflow-hidden shadow-xs">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#0B231E] to-[#17483c] flex flex-col items-center justify-center text-[#83C532]">
                    <Award className="w-10 h-10 stroke-[2.5]" />
                    <span className="text-[10px] font-black mt-1 text-white">GRISAKA</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="font-semibold text-xs text-slate-800">
                Unggah Lambang / Logo Sekolah (PNG, JPG, SVG)
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Logo ini akan langsung tampil secara otomatis pada kop surat resmi, lembar PDF siap cetak, Surat Pernyataan Siswa, kartu slip, dan sidebar navigasi utama.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <label className="flex items-center gap-1.5 px-4 py-2 bg-[#0B231E] hover:bg-[#153e34] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-[#83C532]" />
                  <span>Pilih Berkas Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan Logo Bawaan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Data Pejabat & Penandatangan Dokumen Resmi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-[#0B231E]" />
            <h3 className="font-bold text-sm text-slate-900">
              Data Pejabat & Penandatangan Resmi Dokumen
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Kepala Sekolah */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-bold text-xs text-[#0B231E] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#83C532]" />
                  <span>Kepala Sekolah</span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-200/60 px-2 py-0.5 rounded-md">
                  Penanggung Jawab
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  placeholder="Contoh: Yuliana Dewi Marithawati, S.Pd., M.Pd."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP Kepala Sekolah *
                </label>
                <input
                  type="text"
                  required
                  value={formData.principalNip}
                  onChange={(e) => setFormData({ ...formData, principalNip: e.target.value })}
                  placeholder="Contoh: 19740512 199802 2 003"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40 text-slate-900"
                />
              </div>
            </div>

            {/* 2. Tim Kesiswaan / Wakasek Kesiswaan (Dapat Dirubah Bebas) */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
              <div className="font-bold text-xs text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tim Kesiswaan</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-200/80 px-2 py-0.5 rounded-md">
                  Dapat Dirubah
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Tim Kesiswaan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.timKesiswaanName || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timKesiswaanName: e.target.value,
                      wakasekName: e.target.value,
                    })
                  }
                  placeholder="Contoh: Drs. Subagyo, M.Pd."
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / NIK Pejabat Kesiswaan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.timKesiswaanNip || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timKesiswaanNip: e.target.value,
                      wakasekNip: e.target.value,
                    })
                  }
                  placeholder="Contoh: 19700315 199601 1 002"
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Sebutan Nomenklatur
                </label>
                <input
                  type="text"
                  value={formData.timKesiswaanTitle || 'Wakasek Urusan Kesiswaan & Ketertiban'}
                  onChange={(e) => setFormData({ ...formData, timKesiswaanTitle: e.target.value })}
                  placeholder="Contoh: Wakasek Urusan Kesiswaan & Ketertiban"
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40 text-slate-900"
                />
              </div>
            </div>

            {/* 3. Guru Bimbingan Konseling (BK) / Konselor (Dapat Dirubah Bebas) */}
            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200 space-y-3">
              <div className="font-bold text-xs text-sky-950 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-700" />
                  <span>Guru BK / Konselor</span>
                </div>
                <span className="text-[10px] text-sky-700 font-bold bg-sky-200/80 px-2 py-0.5 rounded-md">
                  Dapat Dirubah
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Guru BK *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bkName || ''}
                  onChange={(e) => setFormData({ ...formData, bkName: e.target.value })}
                  placeholder="Contoh: Sri Wahyuni, S.Pd., M.Si."
                  className="w-full text-xs p-2.5 rounded-xl border border-sky-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/40 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / NIK Guru BK *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bkNip || ''}
                  onChange={(e) => setFormData({ ...formData, bkNip: e.target.value })}
                  placeholder="Contoh: 19780824 200501 2 008"
                  className="w-full text-xs p-2.5 rounded-xl border border-sky-300 bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500/40 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Sebutan Nomenklatur BK
                </label>
                <input
                  type="text"
                  value={formData.bkTitle || 'Koordinator Guru BK / Konselor Sekolah'}
                  onChange={(e) => setFormData({ ...formData, bkTitle: e.target.value })}
                  placeholder="Contoh: Koordinator Guru BK / Konselor Sekolah"
                  className="w-full text-xs p-2.5 rounded-xl border border-sky-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/40 text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Informasi Lembaga & Kop Surat */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <School className="w-5 h-5 text-[#0B231E]" />
            <h3 className="font-bold text-sm text-slate-900">
              Identitas Instansi & Alamat Sekolah
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Resmi Sekolah *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Singkatan / Brand Sekolah *
              </label>
              <input
                type="text"
                required
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NPSN *
              </label>
              <input
                type="text"
                required
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kabupaten / Kota *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap Sekolah *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Resmi
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motto Budaya Sekolah Aman dan Nyaman (BSAN)
              </label>
              <input
                type="text"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#0B231E] hover:bg-[#143d34] text-white rounded-2xl text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#83C532]" />
            <span>Simpan Semua Perubahan</span>
          </button>
        </div>
      </form>
        </div>
      )}

      {/* TAB 2: MANAJEMEN 20 AKUN PETUGAS */}
      {activeSettingsTab === 'accounts' && (
        <AccountManager />
      )}

      {/* TAB 3: SYSTEM AUDIT LOG & KEAMANAN */}
      {activeSettingsTab === 'audit_log' && (
        <AuditLogTable />
      )}

      {/* Confirmation Modal for Pulling data from Google Sheets */}
      {isPullConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">
                Tarik & Timpa Data dari Google Sheets?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Aksi ini akan membaca data terbaru dari Google Spreadsheet <strong>BSAN_Database_SMPN1_Kandangan</strong> dan menimpa data siswa dan riwayat pelanggaran di aplikasi ini.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPullConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPullFromSheets}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Ya, Muat Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
