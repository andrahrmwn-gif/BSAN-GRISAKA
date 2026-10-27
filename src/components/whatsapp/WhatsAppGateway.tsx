import React, { useState, useEffect } from 'react';
import { Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile } from '../../types';
import { SCHOOL_CONFIG } from '../../data/schoolConfig';
import { 
  getWhatsAppUrl, 
  formatPhoneNumber 
} from '../../utils/whatsapp';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Clock, 
  Search, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  FileText,
  UserCheck,
  Settings,
  Sparkles,
  RotateCcw,
  Save,
  CheckCircle2,
  Edit2,
  Smartphone,
  Eye,
  Info
} from 'lucide-react';

export interface WaTemplates {
  absensi_alfa: string;
  absensi_sakit: string;
  absensi_izin: string;
  pelanggaran_ringan: string;
  pelanggaran_sedang: string;
  pelanggaran_berat: string;
}

const STORAGE_KEY_TEMPLATES = 'bsan_wa_templates_v2';

export const DEFAULT_WA_TEMPLATES: WaTemplates = {
  absensi_alfa: `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *{nama_siswa}* (Kelas {kelas}),\n\nMelalui pesan resmi dari Sistem Budaya Sekolah Aman dan Nyaman (BSAN) {nama_sekolah}, kami menginformasikan bahwa ananda pada hari *{tanggal}* tercatat *TIDAK HADIR TANPA KETERANGAN (ALFA)*.\n\nMohon konfirmasi dan klarifikasi terkait keberadaan ananda kepada pihak sekolah demi keselamatan dan ketertiban belajar siswa.\n\n_Piket Kesiswaan & Tata Tertib {nama_sekolah}_\nKepala Sekolah: {nama_kepsek}`,

  absensi_sakit: `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *{nama_siswa}* (Kelas {kelas}),\n\nKami dari {nama_sekolah} telah menerima laporan bahwa ananda hari ini (*{tanggal}*) sedang berhalangan hadir dikarenakan *SAKIT* {keterangan}.\n\nKeluarga besar sekolah mendoakan ananda lekas sembuh dan dapat beraktivitas kembali seperti sedia kala.\n\n_Salam Hangat, Tim Kesiswaan {nama_sekolah}_`,

  absensi_izin: `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *{nama_siswa}* (Kelas {kelas}),\n\nKonfirmasi kehadiran {nama_sekolah}: Ananda tercatat berstatus *IZIN* pada hari ini (*{tanggal}*) {keterangan}.\n\nTerima kasih atas kerja samanya dalam mengawal kedisiplinan dan budaya sekolah aman dan nyaman.\n\n_Hormat kami, Tim Tata Tertib {nama_sekolah}_`,

  pelanggaran_ringan: `*SURAT PEMBERITAHUAN RESMI - PEMBINAAN KEDISIPLINAN*\n{nama_sekolah}\n\nKepada Yth. Bapak/Ibu Orang Tua/Wali dari:\n• Nama Siswa : *{nama_siswa}*\n• NISN : {nisn}\n• Kelas : {kelas}\n\nDengan hormat, kami menginformasikan catatan tata tertib siswa sebagai berikut:\n• Waktu & Lokasi : {tanggal} pk {waktu} WIB ({lokasi})\n• Pelanggaran : *{pasal}*\n• Uraian : {uraian}\n• Klasifikasi : *Tingkat Ringan*\n• Tindakan Pembinaan : *{tahap_pembinaan}*\n\nPemberitahuan ini bertujuan agar Bapak/Ibu dapat memberikan bimbingan positif di rumah demi kedisiplinan dan kepribadian ananda.\n\n_Tim Kesiswaan {nama_sekolah}_`,

  pelanggaran_sedang: `*SURAT PEMBERITAHUAN RESMI - PEMANGGILAN TATA TERTIB*\n{nama_sekolah}\n\nKepada Yth. Bapak/Ibu Orang Tua/Wali dari:\n• Nama Siswa : *{nama_siswa}*\n• NISN : {nisn}\n• Kelas : {kelas}\n\nDengan hormat, kami menginformasikan catatan pelanggaran tata tertib tingkat SEDANG:\n• Kejadian : {tanggal} pk {waktu} WIB di {lokasi}\n• Pasal Pelanggaran : *{pasal}*\n• Deskripsi : {uraian}\n• Klasifikasi : *Tingkat Sedang*\n• Tahap Pembinaan : *{tahap_pembinaan}*\n\nSehubungan dengan hal tersebut, kami mengharap kehadiran Bapak/Ibu ke sekolah untuk bersama-sama mendampingi ananda dalam pembinaan perilaku di Ruang BK / Kesiswaan.\n\n_Tim Kesiswaan & Guru BK {nama_sekolah}_`,

  pelanggaran_berat: `*SURAT PANGGILAN MENDESAK ORANG TUA / WALI (TINGKAT BERAT)*\n{nama_sekolah} (Temanggung, Jawa Tengah)\n\nKepada Yth. Bapak/Ibu Orang Tua/Wali dari:\n• Nama Siswa : *{nama_siswa}*\n• NISN : {nisn}\n• Kelas : {kelas}\n\nDengan hormat, sehubungan dengan pelanggaran tata tertib KATEGORI BERAT yang memerlukan penanganan khusus:\n• Pasal : *{pasal}*\n• Keterangan : {uraian}\n• Waktu & Lokasi : {tanggal} pk {waktu} WIB ({lokasi})\n• Tahap Penanganan : *{tahap_pembinaan}*\n\nKami MENGHARAP DENGAN SANGAT KEHADIRAN Bapak/Ibu Orang Tua/Wali di Ruang Bimbingan Konseling / Kepala Sekolah {nama_sekolah} besok pagi pukul 08.00 WIB demi masa depan dan pembinaan komprehensif putra/putri Bapak/Ibu.\n\nMengetahui,\n*Kepala {nama_sekolah}*\n*{nama_kepsek}*`,
};

interface WhatsAppGatewayProps {
  students: Student[];
  violations: ViolationRecord[];
  waLogs: WhatsAppMessageLog[];
  schoolConfig?: SchoolProfile;
  onAddLog: (log: WhatsAppMessageLog) => void;
}

export const WhatsAppGateway: React.FC<WhatsAppGatewayProps> = ({
  students,
  violations,
  waLogs,
  schoolConfig = SCHOOL_CONFIG,
  onAddLog,
}) => {
  const [activeTab, setActiveTab] = useState<'absensi' | 'pelanggaran' | 'templates' | 'logs'>('absensi');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Templates State
  const [templates, setTemplates] = useState<WaTemplates>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (stored) {
        return { ...DEFAULT_WA_TEMPLATES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed reading WA templates', e);
    }
    return DEFAULT_WA_TEMPLATES;
  });

  const [activeTemplateCondition, setActiveTemplateCondition] = useState<keyof WaTemplates>('absensi_alfa');
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);

  // Per-card edited text overrides (for quick inline edits)
  const [inlineEditedTexts, setInlineEditedTexts] = useState<Record<string, string>>({});
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);

  const currentSchool = schoolConfig || SCHOOL_CONFIG;

  // Filter students who are absent (Sakit, Izin, Alfa)
  const absentStudents = students.filter((s) => {
    const isAbsent = s.statusKehadiran !== 'Hadir';
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.namaOrtu.toLowerCase().includes(searchTerm.toLowerCase());
    return isAbsent && matchSearch;
  });

  // Filter urgent violations
  const urgentViolations = violations.filter((v) => {
    const isUrgent = v.tingkat === 'Berat' || v.tingkat === 'Sedang' || v.statusSurat === 'Diterbitkan';
    const matchSearch =
      v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.pasalTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return isUrgent && matchSearch;
  });

  // Template Parser
  const parseTemplate = (
    templateKey: keyof WaTemplates,
    params: {
      student: Student;
      violation?: ViolationRecord;
    }
  ): string => {
    const tmpl = templates[templateKey] || DEFAULT_WA_TEMPLATES[templateKey];
    const { student, violation } = params;

    const todayStr = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());

    const replacements: Record<string, string> = {
      nama_siswa: student.nama,
      kelas: student.kelas,
      nisn: student.nisn,
      nama_ortu: student.namaOrtu,
      tanggal: violation?.tanggal || todayStr,
      waktu: violation?.waktu || '07:30',
      lokasi: violation?.lokasi || 'Lingkungan Sekolah',
      keterangan: student.keteranganKehadiran ? `(${student.keteranganKehadiran})` : '',
      pasal: violation ? `${violation.kodePasal} - ${violation.pasalTitle}` : '',
      uraian: violation?.uraian || '',
      tingkat: violation?.tingkat || '',
      tahap_pembinaan: violation?.tahapPembinaan || 'Wali Kelas & Guru BK',
      nama_sekolah: currentSchool.name || 'SMP Negeri 1 Kandangan',
      nama_kepsek: currentSchool.principalName || 'Kepala Sekolah',
    };

    let result = tmpl;
    for (const [key, val] of Object.entries(replacements)) {
      result = result.split(`{${key}}`).join(val);
    }
    return result;
  };

  const getGeneratedAttendanceMessage = (student: Student): string => {
    if (inlineEditedTexts[`att-${student.id}`]) {
      return inlineEditedTexts[`att-${student.id}`];
    }
    if (student.statusKehadiran === 'Alfa') {
      return parseTemplate('absensi_alfa', { student });
    }
    if (student.statusKehadiran === 'Sakit') {
      return parseTemplate('absensi_sakit', { student });
    }
    return parseTemplate('absensi_izin', { student });
  };

  const getGeneratedViolationMessage = (student: Student, violation: ViolationRecord): string => {
    if (inlineEditedTexts[`viol-${violation.id}`]) {
      return inlineEditedTexts[`viol-${violation.id}`];
    }
    if (violation.tingkat === 'Berat') {
      return parseTemplate('pelanggaran_berat', { student, violation });
    }
    if (violation.tingkat === 'Sedang') {
      return parseTemplate('pelanggaran_sedang', { student, violation });
    }
    return parseTemplate('pelanggaran_ringan', { student, violation });
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDispatchWa = (
    student: Student,
    category: 'Absensi' | 'Pelanggaran' | 'Panggilan Ortu',
    customMessage: string,
    phone: string
  ) => {
    const formattedPhone = formatPhoneNumber(phone);
    const waUrl = getWhatsAppUrl(formattedPhone, customMessage);

    // Record log
    const newLog: WhatsAppMessageLog = {
      id: `wa-${Date.now()}`,
      studentId: student.id,
      studentName: student.nama,
      kelas: student.kelas,
      recipientName: student.namaOrtu,
      recipientPhone: formattedPhone,
      category,
      message: customMessage,
      timestamp: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()) + ' WIB',
      status: 'Terkirim',
      triggerType: 'Manual',
    };

    onAddLog(newLog);

    // Open WhatsApp
    window.open(waUrl, '_blank');
  };

  // Save customized templates to localStorage
  const handleSaveTemplates = () => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
      setTemplateSavedMsg(true);
      setTimeout(() => setTemplateSavedMsg(false), 3000);
    } catch (err) {
      console.error('Failed saving templates', err);
    }
  };

  // Reset to default templates
  const handleResetTemplates = () => {
    if (window.confirm('Kembalikan seluruh kalimat template WhatsApp ke format standar bawaan sekolah?')) {
      setTemplates(DEFAULT_WA_TEMPLATES);
      localStorage.removeItem(STORAGE_KEY_TEMPLATES);
      setTemplateSavedMsg(true);
      setTimeout(() => setTemplateSavedMsg(false), 3000);
    }
  };

  // Insert variable into active template
  const handleInsertVariable = (variableKey: string) => {
    const placeholder = `{${variableKey}}`;
    setTemplates((prev) => ({
      ...prev,
      [activeTemplateCondition]: prev[activeTemplateCondition] + ' ' + placeholder,
    }));
  };

  // Sample student for live preview
  const sampleStudent: Student = {
    id: 'sample-1',
    nisn: '0089234125',
    nama: 'Bintang Pratama',
    kelas: '8C',
    jenjang: 8,
    gender: 'L',
    noHpSiswa: '081234567890',
    namaOrtu: 'H. Bambang Sudarmo',
    noWaOrtu: '6281234567890',
    alamat: 'Kec. Kandangan, Temanggung',
    statusKehadiran: activeTemplateCondition === 'absensi_sakit' ? 'Sakit' : activeTemplateCondition === 'absensi_izin' ? 'Izin' : 'Alfa',
    keteranganKehadiran: 'Demam tinggi / Surat Dokter',
    totalPelanggaranRingan: 1,
    totalPelanggaranSedang: 1,
    totalPelanggaranBerat: 0,
  };

  const sampleViolation: ViolationRecord = {
    id: 'viol-sample-1',
    studentId: 'sample-1',
    studentName: 'Bintang Pratama',
    kelas: '8C',
    pasalId: 'p-1',
    pasalNumber: 2,
    pasalTitle: 'Keterlambatan Masuk Sekolah & Presensi',
    kodePasal: 'PASAL-02',
    uraian: 'Terlambat masuk sekolah lebih dari 30 menit saat jam pertama dimulai',
    tingkat: activeTemplateCondition === 'pelanggaran_berat' ? 'Berat' : activeTemplateCondition === 'pelanggaran_sedang' ? 'Sedang' : 'Ringan',
    tanggal: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
    waktu: '07:35',
    lokasi: 'Gerbang Utama & Pos Piket',
    guruPencatat: 'Tim Piket Kesiswaan',
    tahapPembinaan: 'Guru BK (Konseling Individu & Kontrak Perilaku)',
    statusSurat: 'Diterbitkan',
    noWaOrtu: '6281234567890',
    namaOrtu: 'H. Bambang Sudarmo',
  };

  const previewText = parseTemplate(activeTemplateCondition, {
    student: sampleStudent,
    violation: sampleViolation,
  });

  const conditionsList: { id: keyof WaTemplates; label: string; tag: string; color: string }[] = [
    { id: 'absensi_alfa', label: '1. Presensi: Alfa / Tanpa Keterangan', tag: 'Alfa', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    { id: 'absensi_sakit', label: '2. Presensi: Sakit (Doa & Empati)', tag: 'Sakit', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: 'absensi_izin', label: '3. Presensi: Izin (Konfirmasi)', tag: 'Izin', color: 'bg-sky-100 text-sky-800 border-sky-300' },
    { id: 'pelanggaran_ringan', label: '4. Pelanggaran: Tingkat Ringan', tag: 'Ringan', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'pelanggaran_sedang', label: '5. Pelanggaran: Tingkat Sedang (Wali/BK)', tag: 'Sedang', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: 'pelanggaran_berat', label: '6. Pelanggaran: Tingkat Berat (Panggilan)', tag: 'Berat', color: 'bg-red-100 text-red-800 border-red-300' },
  ];

  const availableVariables = [
    { key: 'nama_siswa', label: 'Nama Siswa' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'nisn', label: 'NISN' },
    { key: 'nama_ortu', label: 'Nama Orang Tua' },
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'waktu', label: 'Waktu' },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'keterangan', label: 'Keterangan Presensi' },
    { key: 'pasal', label: 'Pasal Tata Tertib' },
    { key: 'uraian', label: 'Uraian Pelanggaran' },
    { key: 'tingkat', label: 'Tingkat (Ringan/Sedang/Berat)' },
    { key: 'tahap_pembinaan', label: 'Tahap Pembinaan' },
    { key: 'nama_sekolah', label: 'Nama Sekolah' },
    { key: 'nama_kepsek', label: 'Nama Kepala Sekolah' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-base font-bold text-slate-900">
              Modul WhatsApp Gateway & Kustomisasi Pesan Resmi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penghubung komunikasi otomatis dan personal ke Orang Tua/Wali murid untuk notifikasi presensi dan tata tertib {currentSchool.shortName || 'GRISAKA'}.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('absensi')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'absensi'
                ? 'bg-[#0B231E] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Presensi ({absentStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('pelanggaran')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'pelanggaran'
                ? 'bg-[#0B231E] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Panggilan & Pelanggaran ({urgentViolations.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-[#83C532] text-[#0B231E] shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900 bg-white/70'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Kalimat WA (Template)</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-[#0B231E] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Log Riwayat ({waLogs.length})
          </button>
        </div>
      </div>

      {/* SEARCH BAR (For Absensi & Pelanggaran tabs) */}
      {(activeTab === 'absensi' || activeTab === 'pelanggaran') && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa, kelas, atau wali murid..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            Format kalimat otomatis sinkron dengan <strong>Template Aktif</strong>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ABSENSI & KETIDAKHADIRAN */}
      {/* ========================================================================= */}
      {activeTab === 'absensi' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Notifikasi Ketidakhadiran Siswa Hari Ini</div>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Daftar siswa tercatat Sakit, Izin, atau Alfa. Kalimat pesan diambil dari template yang dapat diedit sewaktu-waktu.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('templates')}
              className="text-xs text-emerald-800 hover:text-emerald-950 underline font-semibold shrink-0"
            >
              Ubah Template Kalimat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {absentStudents.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center text-slate-500 rounded-3xl border border-slate-200">
                Semua siswa hadir hari ini atau tidak ada siswa yang cocok dengan pencarian.
              </div>
            ) : (
              absentStudents.map((student) => {
                const currentText = getGeneratedAttendanceMessage(student);
                const isCopied = copiedId === student.id;
                const isEditing = inlineEditingId === `att-${student.id}`;

                return (
                  <div
                    key={student.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {student.kelas}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{student.nama}</span>
                        </div>
                        <span
                          className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                            student.statusKehadiran === 'Alfa'
                              ? 'bg-red-100 text-red-800 font-bold'
                              : student.statusKehadiran === 'Sakit'
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-sky-100 text-sky-800 font-bold'
                          }`}
                        >
                          {student.statusKehadiran}
                        </span>
                      </div>

                      <div className="mt-1.5 text-xs text-slate-600">
                        <span>Penerima: <strong>{student.namaOrtu}</strong></span>
                        <span className="mx-2">·</span>
                        <span className="font-mono text-emerald-800 font-bold">WA: {student.noWaOrtu}</span>
                      </div>

                      {/* Message Box or Inline Editor */}
                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={currentText}
                            onChange={(e) =>
                              setInlineEditedTexts((prev) => ({
                                ...prev,
                                [`att-${student.id}`]: e.target.value,
                              }))
                            }
                            rows={6}
                            className="w-full text-xs font-mono p-3 rounded-xl border-2 border-emerald-400 focus:outline-hidden bg-emerald-50/20"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setInlineEditingId(null)}
                              className="px-2.5 py-1 text-xs bg-emerald-700 text-white rounded-lg font-bold"
                            >
                              Selesai Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-line font-mono max-h-36 overflow-y-auto leading-relaxed">
                          {currentText}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() =>
                          setInlineEditingId(isEditing ? null : `att-${student.id}`)
                        }
                        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Tutup Editor' : 'Edit Khusus Siswa Ini'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyMessage(student.id, currentText)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 transition-colors"
                          title="Salin Teks Pesan"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                        </button>

                        <button
                          onClick={() => handleDispatchWa(student, 'Absensi', currentText, student.noWaOrtu)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-transform active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim via WA</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PANGGILAN & PELANGGARAN TATA TERTIB */}
      {/* ========================================================================= */}
      {activeTab === 'pelanggaran' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Notifikasi Pelanggaran & Pemanggilan Orang Tua</div>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Pemberitahuan resmi kasus tata tertib tingkat Ringan, Sedang, atau Berat. Kalimat otomatis mengambil template aktif.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('templates')}
              className="text-xs text-amber-900 hover:text-black underline font-semibold shrink-0"
            >
              Ubah Template Kalimat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentViolations.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center text-slate-500 rounded-3xl border border-slate-200">
                Tidak ada kasus pelanggaran yang membutuhkan pemanggilan orang tua saat ini.
              </div>
            ) : (
              urgentViolations.map((v) => {
                const student = students.find((s) => s.id === v.studentId);
                if (!student) return null;
                const currentText = getGeneratedViolationMessage(student, v);
                const isCopied = copiedId === v.id;
                const isEditing = inlineEditingId === `viol-${v.id}`;

                return (
                  <div
                    key={v.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {v.kelas}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{v.studentName}</span>
                        </div>
                        <span
                          className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                            v.tingkat === 'Berat'
                              ? 'bg-red-100 text-red-800 font-bold'
                              : v.tingkat === 'Sedang'
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-emerald-100 text-emerald-800 font-bold'
                          }`}
                        >
                          Tingkat {v.tingkat}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        <span>Wali: <strong>{v.namaOrtu}</strong></span>
                        <span className="mx-2">·</span>
                        <span className="font-mono text-emerald-800 font-bold">{v.noWaOrtu}</span>
                      </div>

                      <div className="mt-2 text-xs text-slate-700">
                        <div>Pasal: <strong>{v.kodePasal} - {v.pasalTitle}</strong></div>
                        <div className="text-[11px] text-slate-500 italic mt-0.5">{v.tahapPembinaan}</div>
                      </div>

                      {/* Message Box or Inline Editor */}
                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={currentText}
                            onChange={(e) =>
                              setInlineEditedTexts((prev) => ({
                                ...prev,
                                [`viol-${v.id}`]: e.target.value,
                              }))
                            }
                            rows={8}
                            className="w-full text-xs font-mono p-3 rounded-xl border-2 border-amber-400 focus:outline-hidden bg-amber-50/20"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setInlineEditingId(null)}
                              className="px-2.5 py-1 text-xs bg-amber-700 text-white rounded-lg font-bold"
                            >
                              Selesai Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-line font-mono max-h-40 overflow-y-auto leading-relaxed">
                          {currentText}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() =>
                          setInlineEditingId(isEditing ? null : `viol-${v.id}`)
                        }
                        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Tutup Editor' : 'Edit Khusus Kasus Ini'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyMessage(v.id, currentText)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                        </button>

                        <button
                          onClick={() => handleDispatchWa(student, 'Panggilan Ortu', currentText, v.noWaOrtu)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0B231E] hover:bg-[#143d34] text-white font-semibold text-xs shadow-xs transition-transform active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5 text-[#83C532]" />
                          <span>Kirim via WA</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEMPLATE & FORMAT KALIMAT WA EDITOR (BEBERAPA KEADAAN) */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#83C532]" />
                <h3 className="font-bold text-base text-slate-900">
                  Kustomisasi Kalimat WhatsApp Berdasarkan Keadaan
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sesuaikan struktur kalimat untuk berbagai skenario presensi dan tata tertib. Gunakan variabel otomatis agar nama, pasal, dan tanggal terisi secara otomatis.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetTemplates}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                title="Kembalikan semua ke kalimat default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar</span>
              </button>

              <button
                onClick={handleSaveTemplates}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0B231E] hover:bg-[#153e34] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
              >
                <Save className="w-4 h-4 text-[#83C532]" />
                <span>Simpan Perubahan Kalimat</span>
              </button>
            </div>
          </div>

          {templateSavedMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Format kalimat WhatsApp berhasil disimpan dan kini aktif digunakan untuk seluruh pengiriman!</span>
            </div>
          )}

          {/* Condition Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Keadaan / Skenario Pesan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {conditionsList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTemplateCondition(item.id)}
                  className={`p-3 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                    activeTemplateCondition === item.id
                      ? 'border-[#0B231E] bg-[#0B231E] text-white shadow-md'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${item.color}`}>
                    {item.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Column: Textarea & Variables */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Isi Template Teks Kalimat:</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {templates[activeTemplateCondition].length} Karakter
                  </span>
                </div>

                <textarea
                  value={templates[activeTemplateCondition]}
                  onChange={(e) =>
                    setTemplates((prev) => ({
                      ...prev,
                      [activeTemplateCondition]: e.target.value,
                    }))
                  }
                  rows={13}
                  className="w-full text-xs font-mono p-4 rounded-2xl border-2 border-slate-300 focus:outline-hidden focus:border-[#83C532] focus:ring-2 focus:ring-[#83C532]/30 leading-relaxed bg-slate-50"
                  placeholder="Ketik kalimat template di sini..."
                />
              </div>

              {/* Clickable Variable Tags */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-[#83C532]" />
                  <span>Klik Variabel untuk Menyisipkan ke Kalimat:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableVariables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      className="px-2.5 py-1 bg-white hover:bg-[#83C532] hover:text-[#0B231E] border border-slate-200 hover:border-[#83C532] rounded-lg text-xs font-mono font-medium text-slate-700 transition-all active:scale-95 shadow-2xs"
                      title={`Sisipkan {${v.key}}`}
                    >
                      +{'{' + v.key + '}'} <span className="text-[10px] text-slate-400 font-sans">({v.label})</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  Tips format WA: Gunakan bintang *teks* untuk tebal, garis bawah _teks_ untuk miring.
                </p>
              </div>
            </div>

            {/* Right Column: WhatsApp Live Preview Phone Mockup */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Pratinjau Nyata di WhatsApp:</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500 font-sans">Simulasi Penerima</span>
              </div>

              {/* WhatsApp Interface Mockup */}
              <div className="bg-[#EFEAE2] rounded-3xl border-4 border-slate-800 overflow-hidden shadow-xl flex flex-col h-[480px]">
                {/* WA Top Bar */}
                <div className="bg-[#075E54] text-white p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                    BK
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">Tim Kesiswaan {currentSchool.shortName || 'SMPN 1'}</div>
                    <div className="text-[10px] text-emerald-200">Online resmi sekolah</div>
                  </div>
                </div>

                {/* Chat Background & Message Bubble */}
                <div className="flex-1 p-4 overflow-y-auto space-y-2 flex flex-col justify-end">
                  <div className="self-end max-w-[90%] bg-[#E7FFDB] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-sm border border-emerald-200/60 text-xs whitespace-pre-line leading-relaxed font-sans">
                    {previewText}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>08:15</span>
                      <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                  </div>
                </div>

                {/* WA Input Bar Mockup */}
                <div className="bg-slate-100 p-2 border-t border-slate-200 text-slate-400 text-xs flex items-center justify-between px-4">
                  <span>Pesan terenkripsi resmi end-to-end</span>
                  <Send className="w-4 h-4 text-[#075E54]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RIWAYAT LOG WHATSAPP TERKIRIM */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Riwayat Pengiriman Pesan WhatsApp Gateway
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total Log: {waLogs.length} Pesan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Waktu Pengiriman</th>
                  <th className="py-3 px-4 font-bold">Siswa & Kelas</th>
                  <th className="py-3 px-4 font-bold">Penerima (Wali Murid)</th>
                  <th className="py-3 px-3 font-bold">Kategori</th>
                  <th className="py-3 px-4 font-bold">Isi Ringkas Pesan</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Belum ada pesan yang dikirim melalui gateway.
                    </td>
                  </tr>
                ) : (
                  waLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.studentName}</div>
                        <span className="font-mono text-[10px] text-slate-500">Kelas {log.kelas}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{log.recipientName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{log.recipientPhone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold text-[10px]">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                        {log.message}
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
