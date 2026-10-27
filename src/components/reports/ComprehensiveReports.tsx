import React, { useState } from 'react';
import { Student, ViolationRecord, SchoolProfile } from '../../types';
import { SCHOOL_CONFIG as DEFAULT_SCHOOL_CONFIG, KELAS_LIST } from '../../data/schoolConfig';
import { exportToCSV, exportToWordDocument } from '../../utils/exportDocs';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Award, 
  ChevronRight,
  TrendingDown,
  Building
} from 'lucide-react';

interface ComprehensiveReportsProps {
  students: Student[];
  violations: ViolationRecord[];
  schoolConfig?: SchoolProfile;
}

type PeriodType = 'harian' | 'mingguan' | 'bulanan' | 'semesteran';

export const ComprehensiveReports: React.FC<ComprehensiveReportsProps> = ({
  students,
  violations,
  schoolConfig = DEFAULT_SCHOOL_CONFIG,
}) => {
  const currentConfig = schoolConfig || DEFAULT_SCHOOL_CONFIG;
  const [period, setPeriod] = useState<PeriodType>('bulanan');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'analytics' | 'preview'>('analytics');

  // Filtered Students and Violations based on selected class
  const filteredStudents = selectedKelas === 'all'
    ? students
    : students.filter((s) => s.kelas === selectedKelas);

  const filteredViolations = selectedKelas === 'all'
    ? violations
    : violations.filter((v) => v.kelas === selectedKelas);

  // Stats calculation
  const totalStudents = filteredStudents.length;
  const hadirStudents = filteredStudents.filter((s) => s.statusKehadiran === 'Hadir');
  const attendanceRate = totalStudents > 0
    ? ((hadirStudents.length / totalStudents) * 100).toFixed(1) + '%'
    : '100.0%';

  const ringanCount = filteredViolations.filter((v) => v.tingkat === 'Ringan').length;
  const sedangCount = filteredViolations.filter((v) => v.tingkat === 'Sedang').length;
  const beratCount = filteredViolations.filter((v) => v.tingkat === 'Berat').length;

  const getPeriodLabel = () => {
    switch (period) {
      case 'harian':
        return `Harian (Hari Ini: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())})`;
      case 'mingguan':
        return 'Mingguan (7 Hari Terakhir)';
      case 'bulanan':
        return `Bulanan (Bulan ${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())})`;
      case 'semesteran':
        return 'Semester Ganjil TA 2026/2027';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportToWordDocument(
      `Laporan_Kedisiplinan_BSAN_${currentConfig.shortName || 'GRISAKA'}`,
      getPeriodLabel(),
      {
        totalStudents,
        totalHadir: hadirStudents.length,
        attendanceRate,
        totalViolations: filteredViolations.length,
        ringan: ringanCount,
        sedang: sedangCount,
        berat: beratCount,
      },
      filteredStudents,
      filteredViolations
    );
  };

  const handleExportExcel = () => {
    const data = filteredStudents.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      Nama_Lengkap: s.nama,
      Kelas: s.kelas,
      Jenjang: s.jenjang,
      Jenis_Kelamin: s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      Status_Presensi: s.statusKehadiran,
      Keterangan_Absen: s.keteranganKehadiran || '-',
      Kasus_Ringan: s.totalPelanggaranRingan,
      Kasus_Sedang: s.totalPelanggaranSedang,
      Kasus_Berat: s.totalPelanggaranBerat,
      Nama_Orang_Tua: s.namaOrtu,
      No_WA_Wali: s.noWaOrtu,
    }));
    exportToCSV(data, `Rekapitulasi_Kedisiplinan_SMPN1_Kandangan_${period}`);
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#83C532]"></span>
            <h2 className="text-base font-bold text-slate-900">
              Modul Pelaporan & Ekspor Data Komprehensif
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi analitik kedisiplinan dan ekspor multi-format resmi (PDF Siap Cetak, Word .doc, Excel .xlsx).
          </p>
        </div>

        {/* 3 Main Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format 1: PDF Siap Cetak */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            title="Cetak Laporan / Simpan PDF dengan Kop Resmi"
          >
            <Printer className="w-4 h-4 text-[#83C532]" />
            <span>1. Cetak / Simpan PDF</span>
          </button>

          {/* Format 2: Word Doc */}
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            title="Unduh Dokumen Word (.doc/.docx) untuk Disunting"
          >
            <FileText className="w-4 h-4" />
            <span>2. Unduh Word (.docx)</span>
          </button>

          {/* Format 3: Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            title="Unduh Rekap Spreadsheet Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>3. Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Period & View Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs w-full sm:w-auto">
          {(['harian', 'mingguan', 'bulanan', 'semesteran'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                period === p
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kelas Filter */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">Semua Rombel (7A - 9H)</option>
            {KELAS_LIST.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>

          {/* View Tab Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#0B231E] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analitik Ringkas
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#0B231E] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pratinjau Lembar Dokumen Resmi
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content: Analytics vs Document Preview */}
      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">
                Cakupan Populasi Siswa
              </span>
              <div className="text-2xl font-bold font-mono mt-2 text-slate-900">
                {totalStudents} <span className="text-xs font-sans text-slate-500">Siswa</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedKelas === 'all' ? 'Seluruh Kelas 7A s.d. 9H' : `Kelas Terpilih ${selectedKelas}`}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">
                Rata-Rata Kehadiran Siswa
              </span>
              <div className="text-2xl font-bold font-mono mt-2 text-emerald-800">
                {attendanceRate}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {hadirStudents.length} siswa hadir secara konsisten
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">
                Total Catatan Pelanggaran
              </span>
              <div className="text-2xl font-bold font-mono mt-2 text-amber-700">
                {filteredViolations.length} <span className="text-xs font-sans text-slate-500">Kasus</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Ringan: {ringanCount} · Sedang: {sedangCount} · Berat: {beratCount}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">
                Tingkat Efektivitas Pembinaan
              </span>
              <div className="text-2xl font-bold font-mono mt-2 text-[#0B231E]">
                {filteredViolations.length > 0
                  ? Math.round((filteredViolations.filter((v) => v.statusSurat === 'Selesai').length / filteredViolations.length) * 100)
                  : 100}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Melalui Konseling BK & Wali Kelas
              </div>
            </div>
          </div>

          {/* Table: Rekap Pelanggaran Periode Terpilih */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Rekapitulasi Pelanggaran Tata Tertib ({getPeriodLabel()})
                </h3>
                <p className="text-xs text-slate-500">
                  Data siap ekspor untuk evaluasi berkala bersama Dewan Guru dan Kepala Sekolah
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                {filteredViolations.length} Data
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">No</th>
                    <th className="py-3 px-4 font-bold">Tanggal</th>
                    <th className="py-3 px-4 font-bold">Nama Siswa</th>
                    <th className="py-3 px-3 font-bold">Kelas</th>
                    <th className="py-3 px-4 font-bold">Uraian Pelanggaran & Pasal</th>
                    <th className="py-3 px-3 font-bold text-center">Klasifikasi</th>
                    <th className="py-3 px-4 font-bold">Tahap Penanggung Jawab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Nihil catatan pelanggaran pada filter periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map((v, index) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{index + 1}</td>
                        <td className="py-3 px-4 font-mono text-slate-800">{v.tanggal}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{v.studentName}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {v.kelas}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-sm">
                          <span className="font-semibold text-slate-900">{v.kodePasal}:</span> {v.uraian}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                              v.tingkat === 'Berat'
                                ? 'bg-red-100 text-red-800 font-bold'
                                : v.tingkat === 'Sedang'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {v.tingkat}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{v.tahapPembinaan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab Content: Official Printed Letterhead Document Preview */
        <div className="flex justify-center bg-slate-200/70 p-6 rounded-3xl">
          <div className="print-area bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-12 shadow-xl rounded-2xl border border-slate-300 font-serif leading-relaxed text-xs">
            {/* Kop Surat Resmi Lembaga */}
            <div className="border-b-[3px] border-double border-black pb-4 mb-6 text-center flex items-center justify-between gap-4">
              {currentConfig.logoUrl && (
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <img
                    src={currentConfig.logoUrl}
                    alt="Logo Sekolah"
                    className="max-h-20 max-w-20 object-contain"
                  />
                </div>
              )}
              <div className="flex-1 text-center">
                <div className="text-xs uppercase tracking-wider font-bold">PEMERINTAH KABUPATEN TEMANGGUNG</div>
                <div className="text-xs uppercase tracking-wider font-bold">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
                <div className="text-xl font-black uppercase tracking-wide text-black mt-1">
                  {currentConfig.name} ({currentConfig.shortName})
                </div>
                <div className="text-[11px] text-black mt-0.5">
                  NPSN: {currentConfig.npsn}
                </div>
                <div className="text-[11px] text-black">
                  {currentConfig.address}, {currentConfig.city}, {currentConfig.province} {currentConfig.postalCode}
                </div>
                <div className="text-[10px] text-black">
                  Telp: {currentConfig.phone} · Website: {currentConfig.website} · Email: {currentConfig.email}
                </div>
              </div>
              {currentConfig.logoUrl && <div className="w-20 shrink-0"></div>}
            </div>

            {/* Document Title */}
            <div className="text-center mb-6">
              <div className="text-base font-bold uppercase underline tracking-wide">
                LAPORAN REKAPITULASI KEDISIPLINAN DAN KESISWAAN (BSAN)
              </div>
              <div className="text-xs font-sans text-slate-700 mt-1">
                Periode Pelaporan: <strong>{getPeriodLabel()}</strong>
              </div>
            </div>

            {/* Statistical Table Summary */}
            <table className="w-full border-collapse border border-black mb-6 text-xs font-sans">
              <tbody>
                <tr className="bg-slate-100">
                  <td className="border border-black p-2 font-bold w-1/4">Populasi Siswa Dievaluasi</td>
                  <td className="border border-black p-2 font-mono w-1/4">{totalStudents} Siswa</td>
                  <td className="border border-black p-2 font-bold w-1/4">Persentase Kehadiran</td>
                  <td className="border border-black p-2 font-mono w-1/4">{attendanceRate}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Total Pelanggaran</td>
                  <td className="border border-black p-2 font-mono">{filteredViolations.length} Kasus</td>
                  <td className="border border-black p-2 font-bold">Rincian Tingkat Kasus</td>
                  <td className="border border-black p-2">Ringan: {ringanCount} | Sedang: {sedangCount} | Berat: {beratCount}</td>
                </tr>
              </tbody>
            </table>

            {/* Table of Violations */}
            <div className="font-bold text-xs uppercase mb-2 font-sans">
              DAFTAR TINDAKAN KEDISIPLINAN DAN PEMBINAAN SISWA:
            </div>
            <table className="w-full border-collapse border border-black text-[11px] font-sans mb-8">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-1.5 text-center w-8">No</th>
                  <th className="border border-black p-1.5 text-center">Nama Lengkap Siswa</th>
                  <th className="border border-black p-1.5 text-center w-12">Kelas</th>
                  <th className="border border-black p-1.5 text-left">Pasal & Uraian Pelanggaran</th>
                  <th className="border border-black p-1.5 text-center w-20">Klasifikasi</th>
                  <th className="border border-black p-1.5 text-left">Tahap Pembinaan</th>
                </tr>
              </thead>
              <tbody>
                {filteredViolations.slice(0, 15).map((v, i) => (
                  <tr key={v.id}>
                    <td className="border border-black p-1.5 text-center font-mono">{i + 1}</td>
                    <td className="border border-black p-1.5 font-bold">{v.studentName}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{v.kelas}</td>
                    <td className="border border-black p-1.5"><strong>{v.kodePasal}:</strong> {v.uraian}</td>
                    <td className="border border-black p-1.5 text-center font-semibold">{v.tingkat}</td>
                    <td className="border border-black p-1.5 text-[10px]">{v.tahapPembinaan}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12 font-sans">
              <div>
                Mengetahui,<br />
                <strong>{currentConfig.timKesiswaanTitle || 'Wakasek Urusan Kesiswaan'}</strong><br /><br /><br /><br />
                <u><strong>{currentConfig.timKesiswaanName || currentConfig.wakasekName || 'Tim Kesiswaan'}</strong></u><br />
                NIP. {currentConfig.timKesiswaanNip || currentConfig.wakasekNip || '-'}
              </div>
              <div>
                Kandangan, {todayStr}<br />
                <strong>Kepala {currentConfig.name}</strong><br /><br /><br /><br />
                <u><strong>{currentConfig.principalName}</strong></u><br />
                NIP. {currentConfig.principalNip}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
