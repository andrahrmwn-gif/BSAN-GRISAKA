import React, { useState, useMemo } from 'react';
import { AuditLogEntry, AuditActionType, AuditModule } from '../../types/auth';
import { getAuditLogs, exportAuditLogsToExcel, clearAuditLogs } from '../../services/auditLogger';
import { getStoredAccounts } from '../../services/authService';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw, 
  User, 
  Calendar, 
  AlertTriangle,
  Clock,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  FileSpreadsheet
} from 'lucide-react';

export const AuditLogTable: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const accounts = useMemo(() => getStoredAccounts(), []);

  const handleRefresh = () => {
    setLogs(getAuditLogs());
  };

  const handleClear = () => {
    if (window.confirm('PERINGATAN KEAMANAN: Anda yakin ingin mengosongkan riwayat audit log? Tindakan ini akan dicatat dalam log baru.')) {
      clearAuditLogs();
      setLogs(getAuditLogs());
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    exportAuditLogsToExcel(filteredLogs);
    setTimeout(() => setIsExporting(false), 800);
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch = 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.userRole.toLowerCase().includes(searchQuery.toLowerCase());

      const matchUser = selectedUserFilter === 'all' || log.userId === selectedUserFilter;
      const matchAction = selectedActionFilter === 'all' || log.actionType === selectedActionFilter;
      const matchModule = selectedModuleFilter === 'all' || log.module === selectedModuleFilter;

      return matchSearch && matchUser && matchAction && matchModule;
    });
  }, [logs, searchQuery, selectedUserFilter, selectedActionFilter, selectedModuleFilter]);

  // Statistics
  const todayStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  const todayCount = logs.filter(l => l.timestamp.includes(todayStr) || l.isoTimestamp?.startsWith(new Date().toISOString().slice(0, 10))).length;
  const deleteOrResetCount = logs.filter(l => l.actionType === 'DELETE' || l.actionType === 'RESET').length;
  const blockedCount = logs.filter(l => l.status === 'BLOCKED' || l.actionType === 'BLOCKED').length;

  const getActionBadge = (type: AuditActionType) => {
    switch (type) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">INPUT / CREATE</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">UPDATE / EDIT</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">DELETE / HAPUS</span>;
      case 'RESET':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 font-mono">RESET DATABASE</span>;
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">LOGIN SESI</span>;
      case 'SYNC':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">SYNC GDRIVE</span>;
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">DITOLAK (TAMU)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Log Identity */}
      <div className="bg-gradient-to-r from-[#0B231E] to-[#164136] text-white p-6 rounded-3xl border border-[#1e5445] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#83C532]" />
            <h3 className="font-extrabold text-base tracking-tight text-white">
              System Audit Log & Jejak Keamanan 20 Akun Petugas
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Merekam seluruh riwayat aktivitas secara real-time (input pelanggaran, pembaruan data siswa, penghapusan, reset data, dan pergantian sesi login) untuk menjamin akuntabilitas serta integritas data sekolah.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer"
            title="Segarkan Log"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#83C532]" />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#83C532] hover:bg-[#94db3a] text-[#0B231E] text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Ekspor seluruh rekaman audit log ke format Excel (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0B231E]" />
            <span>{isExporting ? 'Mengekspor...' : 'Ekspor Log (Excel)'}</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white text-xs font-semibold rounded-xl border border-rose-400/30 transition-all cursor-pointer"
            title="Kosongkan Riwayat Log (Hanya Administrator)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-300" />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Audit Log Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Catatan Audit</span>
            <Activity className="w-4 h-4 text-[#0B231E]" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {logs.length}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Semua jejak terekam aman</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Aktivitas Hari Ini</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {todayCount}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Sesi aktif terkini</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Aksi Hapus / Reset</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {deleteOrResetCount}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Operasi data sensitif</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Percobaan Ditolak (Tamu)</span>
            <Lock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono mt-1">
            {blockedCount}
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Proteksi mode baca aktif</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari deskripsi, nama petugas..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B231E]"
            />
          </div>

          {/* User Account Filter */}
          <div>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B231E] font-medium"
            >
              <option value="all">-- Semua Akun Petugas ({accounts.length}) --</option>
              <option value="guest">👁️ Mode Tamu (Guest View-Only)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.role})
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B231E] font-medium"
            >
              <option value="all">-- Semua Jenis Aksi --</option>
              <option value="CREATE">INPUT / CREATE</option>
              <option value="UPDATE">UPDATE / EDIT</option>
              <option value="DELETE">DELETE / HAPUS</option>
              <option value="RESET">RESET DATA</option>
              <option value="LOGIN">LOGIN SESI</option>
              <option value="SYNC">SYNC GDRIVE / SHEETS</option>
              <option value="BLOCKED">DITOLAK (MODE TAMU)</option>
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B231E] font-medium"
            >
              <option value="all">-- Semua Modul --</option>
              <option value="Pelanggaran">Buku Pelanggaran</option>
              <option value="Siswa">Database Siswa</option>
              <option value="Pengaturan">Pengaturan Profil & DB</option>
              <option value="Tata Tertib">Tata Tertib</option>
              <option value="WhatsApp">WhatsApp Gateway</option>
              <option value="Autentikasi">Autentikasi & Akun</option>
              <option value="Sistem">Sistem & Reset</option>
            </select>
          </div>
        </div>

        {/* Filter Indicator & Reset */}
        {(searchQuery || selectedUserFilter !== 'all' || selectedActionFilter !== 'all' || selectedModuleFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Menampilkan <strong>{filteredLogs.length}</strong> dari {logs.length} catatan aktivitas
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedUserFilter('all');
                setSelectedActionFilter('all');
                setSelectedModuleFilter('all');
              }}
              className="text-xs text-rose-700 hover:underline font-semibold"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-40">Waktu & Tanggal</th>
                <th className="py-3.5 px-4 w-52">Akun Petugas & Peran</th>
                <th className="py-3.5 px-3 w-32 text-center">Jenis Aksi</th>
                <th className="py-3.5 px-3 w-28">Modul</th>
                <th className="py-3.5 px-4">Deskripsi Aktivitas</th>
                <th className="py-3.5 px-3 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-sm text-slate-700">Tidak Ada Log Yang Sesuai</div>
                    <div className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci atau bersihkan filter pencarian.</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800 text-[11px]">
                        {log.timestamp.split(', ')[1] || log.timestamp}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.timestamp.split(', ')[0]}
                      </div>
                    </td>

                    {/* User & Role */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 leading-snug">
                        {log.userName}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#83C532]"></span>
                        <span>{log.userRole}</span>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getActionBadge(log.actionType)}
                    </td>

                    {/* Module */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        {log.module}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">
                        {log.description}
                      </div>
                      {log.details && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {log.details}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {log.status === 'BLOCKED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          Ditolak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sukses
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Audit trail aktif otomatis untuk seluruh 20 akun petugas SMPN 1 Kandangan.</span>
          </div>
          <span className="font-mono text-[11px]">
            Kapasitas: {logs.length} / 300 Catatan
          </span>
        </div>
      </div>
    </div>
  );
};
