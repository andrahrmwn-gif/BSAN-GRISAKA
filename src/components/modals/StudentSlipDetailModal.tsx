import React, { useState } from 'react';
import { Student, ViolationRecord, SchoolProfile } from '../../types';
import { getWhatsAppUrl, generateAttendanceMessage } from '../../utils/whatsapp';
import { 
  X, 
  Printer, 
  MessageSquare, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  User, 
  Layers,
  AlertOctagon,
  Info,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { exportToCSV, exportElementToPDF } from '../../utils/exportDocs';

interface StudentSlipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  violations: ViolationRecord[];
  schoolConfig: SchoolProfile;
  onOpenRecordViolation: (studentId: string) => void;
  onOpenSurat: (violation: ViolationRecord) => void;
}

export const StudentSlipDetailModal: React.FC<StudentSlipDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  violations,
  schoolConfig,
  onOpenRecordViolation,
  onOpenSurat,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'document'>('timeline');

  if (!isOpen || !student) return null;

  // Filter student violations and sort newest first
  const studentViolations = violations
    .filter((v) => v.studentId === student.id)
    .sort((a, b) => new Date(`${b.tanggal}T${b.waktu || '00:00'}`).getTime() - new Date(`${a.tanggal}T${a.waktu || '00:00'}`).getTime());

  const hasBerat = student.totalPelanggaranBerat > 0;
  const hasSedang = student.totalPelanggaranSedang > 0;
  const hasRingan = student.totalPelanggaranRingan > 0;

  // Disciplinary status label purely based on Ringan, Sedang, Berat (No points)
  const getDisciplineStatus = () => {
    if (hasBerat) {
      return { 
        label: 'Peringatan Khusus / Sidang Kesiswaan (Tingkat Berat)', 
        subtext: 'Penanganan khusus Kepala Sekolah & pemanggilan orang tua',
        bg: 'bg-rose-50 text-rose-900 border-rose-300',
        badgeBg: 'bg-rose-600 text-white',
        icon: <AlertOctagon className="w-4 h-4 text-rose-600" />
      };
    }
    if (hasSedang) {
      return { 
        label: 'Perhatian Khusus / Konseling BK (Tingkat Sedang)', 
        subtext: 'Membutuhkan kontrak perilaku & bimbingan intensif',
        bg: 'bg-amber-50 text-amber-900 border-amber-300',
        badgeBg: 'bg-amber-600 text-white',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
      };
    }
    if (hasRingan) {
      return { 
        label: 'Tingkat Pembinaan Ringan', 
        subtext: 'Dalam pendampingan wali kelas & guru piket',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        badgeBg: 'bg-blue-600 text-white',
        icon: <Info className="w-4 h-4 text-blue-600" />
      };
    }
    return { 
      label: 'Sangat Disiplin (Nihil Catatan)', 
      subtext: 'Mempertahankan integritas dan kepatuhan standar BSAN',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeBg: 'bg-emerald-600 text-white',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    };
  };

  const discipline = getDisciplineStatus();

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handlePrintSlip = () => {
    if (activeTab !== 'document') {
      setActiveTab('document');
      setTimeout(() => {
        window.print();
      }, 200);
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (activeTab !== 'document') {
      setActiveTab('document');
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const el = document.getElementById('student-slip-printable-area');
    if (el) {
      setIsExportingPdf(true);
      const filename = `Rapor_Disiplin_${student.nama.replace(/\s+/g, '_')}_${student.kelas}`;
      await exportElementToPDF(el, filename);
      setIsExportingPdf(false);
    } else {
      window.print();
    }
  };

  const handleDownloadWord = () => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Rapor Kedisiplinan - ${student.nama}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; line-height: 1.3; margin: 15mm; }
          .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #333; padding: 6px; font-size: 10pt; }
          th { background: #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="kop">
          <div style="font-size:11pt; font-weight:bold;">PEMERINTAH KABUPATEN TEMANGGUNG</div>
          <div style="font-size:11pt; font-weight:bold;">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
          <div style="font-size:15pt; font-weight:bold; color:#0B231E;">${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'}</div>
          <div style="font-size:9pt; font-style:italic;">${schoolConfig.address}, ${schoolConfig.city}, ${schoolConfig.province}</div>
        </div>
        <h2 style="text-align:center; text-transform:uppercase; font-size:13pt;">RAPOR REKAPITULASI KEDISIPLINAN SISWA</h2>
        <p><strong>Nama:</strong> ${student.nama} | <strong>NISN:</strong> ${student.nisn} | <strong>Kelas:</strong> ${student.kelas} | <strong>Presensi:</strong> ${student.statusKehadiran}</p>
        <p><strong>Ringan:</strong> ${student.totalPelanggaranRingan} | <strong>Sedang:</strong> ${student.totalPelanggaranSedang} | <strong>Berat:</strong> ${student.totalPelanggaranBerat}</p>
        <table>
          <thead>
            <tr><th>No</th><th>Tanggal</th><th>Kode</th><th>Pelanggaran</th><th>Tingkat</th><th>Tahap Pembinaan</th></tr>
          </thead>
          <tbody>
            ${studentViolations.map((v, i) => `<tr><td style="text-align:center;">${i+1}</td><td>${v.tanggal}</td><td>${v.kodePasal}</td><td>${v.uraian}</td><td style="text-align:center;">${v.tingkat}</td><td>${v.tahapPembinaan}</td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;">Nihil catatan pelanggaran.</td></tr>'}
          </tbody>
        </table>
        <table style="width:100%; margin-top:24px; border:none; text-align:center;">
          <tr>
            <td style="border:none;">Mengetahui,<br>Orang Tua / Wali<br><br><br><br><u>( ${student.namaOrtu} )</u></td>
            <td style="border:none;">Kandangan, ${todayStr}<br>Kepala Sekolah<br><br><br><br><u><strong>${schoolConfig.principalName || 'Kepala Sekolah'}</strong></u></td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rapor_Disiplin_${student.nama.replace(/\s+/g, '_')}_${student.kelas}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    const data = studentViolations.length > 0 
      ? studentViolations.map((v, i) => ({
          No: i + 1,
          Nama_Siswa: student.nama,
          NISN: student.nisn,
          Kelas: student.kelas,
          Tanggal: v.tanggal,
          Waktu: v.waktu,
          Kode_Pasal: v.kodePasal,
          Pasal: v.pasalTitle,
          Uraian: v.uraian,
          Klasifikasi: v.tingkat,
          Tahap_Pembinaan: v.tahapPembinaan,
          Guru_Pencatat: v.guruPencatat,
          Status_Dokumen: v.statusSurat,
          Nama_Ortu: student.namaOrtu,
          No_WA: student.noWaOrtu,
        }))
      : [{
          No: 1,
          Nama_Siswa: student.nama,
          NISN: student.nisn,
          Kelas: student.kelas,
          Status_Kehadiran: student.statusKehadiran,
          Total_Pelanggaran: 0,
          Catatan: 'Nihil Catatan Pelanggaran - Sangat Disiplin',
          Nama_Ortu: student.namaOrtu,
          No_WA: student.noWaOrtu,
        }];
    exportToCSV(data, `Slip_Disiplin_${student.nama.replace(/\s+/g, '_')}_${student.kelas}`);
  };

  const attendanceWa = generateAttendanceMessage(student);
  const attendanceWaUrl = getWhatsAppUrl(student.noWaOrtu, attendanceWa);

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* Modal Top Header Bar */}
        <div className="no-print bg-[#0B231E] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#83C532] text-[#0B231E] flex items-center justify-center font-bold shadow-md shadow-[#83C532]/20">
              <User className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">
                  Slip Kedisiplinan & Rapor Pelanggaran Siswa
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/10 text-emerald-300 font-bold">
                  {student.kelas} · {student.nisn}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sistem Terpadu Budaya Sekolah Aman dan Nyaman {schoolConfig.shortName || 'GRISAKA'} (Kab. Temanggung)
              </p>
            </div>
          </div>

          {/* View Tab Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-[#83C532] text-[#0B231E] font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Linimasa</span>
              </button>

              <button
                onClick={() => setActiveTab('document')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'document'
                    ? 'bg-[#83C532] text-[#0B231E] font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lembar Rapor</span>
              </button>
            </div>

            {/* Direct Downloads: Word, PDF, Excel */}
            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
              title="Unduh Rapor Siswa dalam format Word (.doc)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
              title="Unduh langsung dokumen PDF resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Mengunduh...' : 'PDF'}</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
              title="Unduh Rekap dalam format Excel (.csv)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-slate-50/60">
          {activeTab === 'timeline' ? (
            /* TAB 1: INTERACTIVE DOSSIER & PELANGGARAN HISTORY TIMELINE */
            <div className="space-y-6">
              {/* Student Identity Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B231E] to-[#15463a] text-[#83C532] flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                    {student.nama.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {student.nama}
                      </h2>
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-[#0B231E] text-white">
                        Kelas {student.kelas}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>NISN: <strong className="font-mono text-slate-800">{student.nisn}</strong></span>
                      <span>·</span>
                      <span>Jenjang {student.jenjang} SMP</span>
                      <span>·</span>
                      <span>{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col sm:items-end gap-1.5 w-full md:w-auto">
                  <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-semibold ${discipline.bg}`}>
                    {discipline.icon}
                    <span>{discipline.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status Presensi Hari Ini:{' '}
                    <span className={`font-bold ${student.statusKehadiran === 'Hadir' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {student.statusKehadiran}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 KPI Metric Cards (Zero Points) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">Presensi Hari Ini</div>
                  <div className="text-2xl font-black font-mono mt-1">{student.statusKehadiran}</div>
                  <div className="text-[11px] text-emerald-100 truncate mt-0.5">{student.keteranganKehadiran || 'Hadir Mengikuti KBM'}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-700 to-cyan-800 text-white p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Kasus Ringan</div>
                  <div className="text-2xl font-black font-mono mt-1">{student.totalPelanggaranRingan}</div>
                  <div className="text-[11px] text-blue-100 mt-0.5">Teguran & Buku Piket</div>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200">Kasus Sedang</div>
                  <div className="text-2xl font-black font-mono mt-1">{student.totalPelanggaranSedang}</div>
                  <div className="text-[11px] text-amber-100 mt-0.5">Konseling Guru BK</div>
                </div>

                <div className="bg-gradient-to-br from-rose-700 to-red-900 text-white p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-200">Kasus Berat</div>
                  <div className="text-2xl font-black font-mono mt-1">{student.totalPelanggaranBerat}</div>
                  <div className="text-[11px] text-rose-100 mt-0.5">Kepala Sekolah & Tim Terpadu</div>
                </div>
              </div>

              {/* Personal Dossier & Parent Guardian Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Domisili & Kontak Siswa</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Alamat Rumah:</span>
                      <span className="font-semibold text-slate-900 leading-relaxed">{student.alamat}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Nomor Telepon / Seluler Siswa:</span>
                      <span className="font-mono text-slate-900 font-semibold">{student.noHpSiswa || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Data Orang Tua / Wali Murid</span>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Nama Orang Tua / Wali:</span>
                        <span className="font-bold text-slate-900 text-sm">{student.namaOrtu}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Nomor WhatsApp Wali:</span>
                        <span className="font-mono font-bold text-slate-900">{student.noWaOrtu}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <a
                      href={attendanceWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Hubungi Orang Tua via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* DEDICATED 'PELANGGARAN HISTORY' TIMELINE */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Linimasa Rekam Jejak Pelanggaran (Violation History Timeline)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Kronologi pelanggaran tata tertib dan perkembangan tahap pembinaan peserta didik
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
                    {studentViolations.length} Peristiwa Tercatat
                  </span>
                </div>

                {studentViolations.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      Nihil Catatan Pelanggaran
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Peserta didik ini memiliki rekam jejak perilaku yang sangat baik dan mematuhi seluruh peraturan BSAN.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
                    {studentViolations.map((v) => {
                      const isBerat = v.tingkat === 'Berat';
                      const isSedang = v.tingkat === 'Sedang';

                      return (
                        <div key={v.id} className="relative pl-6 group">
                          {/* Timeline node */}
                          <div
                            className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-white ${
                              isBerat
                                ? 'border-red-600 ring-4 ring-red-100'
                                : isSedang
                                ? 'border-amber-500 ring-4 ring-amber-100'
                                : 'border-emerald-600 ring-4 ring-emerald-100'
                            }`}
                          />

                          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{v.tanggal}</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-xs text-slate-500 font-mono">{v.waktu} WIB</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-xs text-slate-600 italic">Lokasi: {v.lokasi}</span>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  isBerat
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : isSedang
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                Tingkat {v.tingkat}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-xs border border-emerald-200">
                                  {v.kodePasal}
                                </span>
                                <span>{v.pasalTitle}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/70">
                                {v.uraian}
                              </p>
                            </div>

                            {v.catatanKhusus && (
                              <div className="text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 italic">
                                <strong>Catatan Penanganan:</strong> {v.catatanKhusus}
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <div className="text-[11px] text-slate-500">
                                  Tahap Pembinaan: <strong className="text-emerald-900">{v.tahapPembinaan}</strong>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Petugas Pencatat: {v.guruPencatat}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenSurat(v);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-semibold shadow-xs transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#83C532]" />
                                <span>Buka Surat Resmi</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: PRATINJAU LEMBAR RAPOR RESMI (PRINT-READY PREVIEW) */
            <div className="flex justify-center">
              <div id="student-slip-printable-area" className="print-area bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-10 lg:p-12 shadow-xl rounded-2xl border border-slate-300 font-serif leading-relaxed text-xs">
                {/* Official School Letterhead (Kop Surat) - TEMANGGUNG */}
                <div className="border-b-[3px] border-double border-black pb-4 mb-6 text-center flex items-center justify-between gap-4">
                  {schoolConfig.logoUrl && (
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                      <img
                        src={schoolConfig.logoUrl}
                        alt="Logo Sekolah"
                        className="max-h-20 max-w-20 object-contain"
                      />
                    </div>
                  )}

                  <div className="flex-1 text-center">
                    <div className="text-xs uppercase tracking-wider font-bold">PEMERINTAH KABUPATEN TEMANGGUNG</div>
                    <div className="text-xs uppercase tracking-wider font-bold">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
                    <div className="text-xl font-black uppercase tracking-wide text-black mt-0.5">
                      {schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} ({schoolConfig.shortName || 'GRISAKA'})
                    </div>
                    <div className="text-[11px] text-black mt-0.5 font-sans">
                      NPSN: {schoolConfig.npsn}
                    </div>
                    <div className="text-[11px] text-black">
                      {schoolConfig.address}, {schoolConfig.city}, {schoolConfig.province} {schoolConfig.postalCode}
                    </div>
                    <div className="text-[10px] text-black font-sans">
                      Telp: {schoolConfig.phone} · Website: {schoolConfig.website} · Email: {schoolConfig.email}
                    </div>
                  </div>

                  {schoolConfig.logoUrl && <div className="w-20 shrink-0"></div>}
                </div>

                {/* Report Document Title */}
                <div className="text-center mb-6">
                  <div className="text-base font-bold uppercase underline tracking-wide">
                    LEMBAR KONTROL & RAPOR KEDISIPLINAN SISWA (BSAN)
                  </div>
                  <div className="text-xs font-sans text-slate-600 mt-1">
                    Dokumen Resmi Bimbingan Konseling & Kesiswaan · Dicetak pada: {todayStr}
                  </div>
                </div>

                {/* Student Personal Dossier Table */}
                <div className="border border-black p-4 mb-6 font-sans text-xs bg-slate-50/50">
                  <div className="font-bold uppercase text-[11px] mb-2 border-b border-black pb-1">
                    I. IDENTITAS PESERTA DIDIK
                  </div>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="w-44 py-1 font-semibold text-slate-600">Nama Lengkap Siswa</td>
                        <td className="w-4 py-1">:</td>
                        <td className="py-1 font-bold text-slate-900 text-sm">{student.nama}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Nomor Induk Siswa Nasional (NISN)</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-mono font-bold">{student.nisn}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Kelas / Jenjang Pendidikan</td>
                        <td className="py-1">:</td>
                        <td className="py-1">Kelas {student.kelas} / Jenjang {student.jenjang} SMP</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Jenis Kelamin</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Nama Orang Tua / Wali</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-bold">{student.namaOrtu}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">No. WhatsApp Orang Tua / Wali</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-mono">{student.noWaOrtu}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Alamat Rumah Tinggal</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{student.alamat}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Disciplinary Summary Ledger - ZERO POINTS */}
                <div className="border border-black mb-6 font-sans text-xs">
                  <div className="bg-slate-100 p-2 font-bold uppercase text-[11px] border-b border-black">
                    II. REKAPITULASI STATUS KEDISIPLINAN PESERTA DIDIK
                  </div>
                  <div className="grid grid-cols-4 text-center divide-x divide-black p-3">
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Presensi Harian</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{student.statusKehadiran}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pelanggaran Ringan</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{student.totalPelanggaranRingan} Kasus</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pelanggaran Sedang</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{student.totalPelanggaranSedang} Kasus</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pelanggaran Berat</div>
                      <div className={`text-base font-bold mt-0.5 ${hasBerat ? 'text-red-700' : 'text-slate-900'}`}>
                        {student.totalPelanggaranBerat} Kasus
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Violations Ledger Table - ZERO POINTS */}
                <div className="font-sans mb-8">
                  <div className="font-bold text-xs uppercase mb-2">
                    III. DAFTAR RIWAYAT PELANGGARAN TATA TERTIB RESMI
                  </div>
                  <table className="w-full border-collapse border border-black text-[11px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5 text-center w-8">No</th>
                        <th className="border border-black p-1.5 text-center w-28">Waktu & Tempat</th>
                        <th className="border border-black p-1.5 text-left">Pasal & Deskripsi Pelanggaran</th>
                        <th className="border border-black p-1.5 text-center w-20">Klasifikasi</th>
                        <th className="border border-black p-1.5 text-left w-48">Bentuk Pembinaan & SOP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentViolations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-black p-4 text-center text-slate-500 italic">
                            Nihil catatan pelanggaran tata tertib. Siswa tercatat mematuhi norma BSAN dengan baik.
                          </td>
                        </tr>
                      ) : (
                        studentViolations.map((v, i) => (
                          <tr key={v.id}>
                            <td className="border border-black p-1.5 text-center font-mono">{i + 1}</td>
                            <td className="border border-black p-1.5 text-center">
                              <div>{v.tanggal}</div>
                              <div className="text-[10px] text-slate-600 font-mono">{v.waktu} WIB</div>
                              <div className="text-[10px] italic">{v.lokasi}</div>
                            </td>
                            <td className="border border-black p-1.5">
                              <strong>{v.kodePasal} - {v.pasalTitle}:</strong> {v.uraian}
                              {v.catatanKhusus && (
                                <div className="text-[10px] text-slate-600 italic mt-0.5">
                                  Catatan: {v.catatanKhusus}
                                </div>
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-center font-semibold">{v.tingkat}</td>
                            <td className="border border-black p-1.5 text-[10px]">
                              <div className="font-semibold">{v.tahapPembinaan}</div>
                              <div className="text-slate-600">Oleh: {v.guruPencatat}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Formal Signatures Block */}
                <div className="font-sans text-xs pt-4 border-t border-black">
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div>
                      Mengetahui,<br />
                      <strong>Orang Tua / Wali</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">( {student.namaOrtu} )</div>
                    </div>

                    <div>
                      Mengetahui,<br />
                      <strong>{schoolConfig.bkTitle || 'Guru BK / Konselor'}</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">( {schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.'} )</div>
                      <div className="text-[10px] text-slate-600 font-mono">NIP. {schoolConfig.bkNip || '19780824 200501 2 008'}</div>
                    </div>

                    <div>
                      Mengetahui,<br />
                      <strong>{schoolConfig.timKesiswaanTitle || 'Tim Kesiswaan'}</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">( {schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Drs. Subagyo, M.Pd.'} )</div>
                      <div className="text-[10px] text-slate-600 font-mono">NIP. {schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '19700315 199601 1 002'}</div>
                    </div>

                    <div>
                      Kandangan, {todayStr}<br />
                      <strong>Kepala Sekolah</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">
                        ( {schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'} )
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        NIP. {schoolConfig.principalNip || '19740512 199802 2 003'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
