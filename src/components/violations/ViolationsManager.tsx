import React, { useState } from 'react';
import { ViolationRecord, Student, SchoolProfile } from '../../types';
import { SCHOOL_CONFIG } from '../../data/schoolConfig';
import { getWhatsAppUrl, generateViolationMessage } from '../../utils/whatsapp';
import { exportViolationsToWord, exportViolationsToPrintPDF, exportToCSV } from '../../utils/exportDocs';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  Printer, 
  FileText, 
  MessageSquare, 
  Filter, 
  BookOpen,
  Download,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface ViolationsManagerProps {
  violations: ViolationRecord[];
  students: Student[];
  schoolConfig?: SchoolProfile;
  onOpenRecordModal: () => void;
  onOpenSuratModal: (violation: ViolationRecord) => void;
  onUpdateViolationStatus: (violationId: string, newStatus: 'Draft' | 'Diterbitkan' | 'Selesai') => void;
}

export const ViolationsManager: React.FC<ViolationsManagerProps> = ({
  violations,
  students,
  schoolConfig = SCHOOL_CONFIG,
  onOpenRecordModal,
  onOpenSuratModal,
  onUpdateViolationStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [pasalFilter, setPasalFilter] = useState<string>('all');
  const [kelasFilter, setKelasFilter] = useState<string>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filtered Violations
  const filteredViolations = violations.filter((v) => {
    const matchSearch =
      v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.guruPencatat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.kodePasal.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSeverity = severityFilter === 'all' || v.tingkat === severityFilter;
    const matchPasal = pasalFilter === 'all' || v.pasalNumber.toString() === pasalFilter;
    const matchKelas = kelasFilter === 'all' || v.kelas === kelasFilter;

    return matchSearch && matchSeverity && matchPasal && matchKelas;
  });

  const handleDownloadWord = () => {
    exportViolationsToWord(filteredViolations, schoolConfig);
  };

  const handleDownloadPDF = () => {
    setIsPdfModalOpen(true);
  };

  const handleDownloadExcel = () => {
    const data = filteredViolations.map((v, i) => ({
      No: i + 1,
      Tanggal: v.tanggal,
      Waktu: `${v.waktu || ''} WIB`,
      Lokasi: v.lokasi,
      Nama_Siswa: v.studentName,
      Kelas: v.kelas,
      Kode_Pasal: v.kodePasal,
      Pasal: v.pasalTitle,
      Uraian_Pelanggaran: v.uraian,
      Klasifikasi: v.tingkat,
      Tahap_Pembinaan: v.tahapPembinaan,
      Guru_Pencatat: v.guruPencatat,
      Status_Dokumen: v.statusSurat,
      Catatan_Khusus: v.catatanKhusus || '',
      No_WA_Ortu: v.noWaOrtu,
    }));
    exportToCSV(data, `Buku_Pelanggaran_Siswa_${schoolConfig.shortName || 'GRISAKA'}`);
  };

  return (
    <div className="space-y-6">
      {/* Banner & Actions Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <h2 className="text-base font-bold text-slate-900">
              Buku Catatan Pelanggaran & Kontrol Kedisiplinan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penjenjangan pembinaan resmi (Ringan, Sedang, Berat), penerbitan Surat Pernyataan Siswa, serta ekspor dokumen PDF dan Word SMPN 1 Kandangan.
          </p>
        </div>

        {/* Action Buttons: Add Violation, Word, PDF */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shadow-xs"
            title="Cetak atau Unduh Dokumen dalam format PDF Siap Cetak"
          >
            <Printer className="w-4 h-4 text-rose-600" />
            <span>Unduh / Cetak PDF</span>
          </button>

          <button
            onClick={handleDownloadWord}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-xl border border-blue-200 transition-colors shadow-xs"
            title="Unduh Rekap Pelanggaran dalam format Microsoft Word (.doc)"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Unduh Word (.doc)</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors shadow-xs"
            title="Unduh data dalam format CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={onOpenRecordModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-[#83C532]" />
            <span>Input Pelanggaran Baru</span>
          </button>
        </div>
      </div>

      {/* Disciplinary Level Guide Card (Purely Ringan, Sedang, Berat - No Points) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0B231E]" />
          <span>Alur Penjenjangan Pembinaan Tata Tertib Grisaka:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-900 text-[11px]">1. Pelanggaran Ringan (1x)</div>
            <div className="text-emerald-800 font-semibold text-[11px] mt-0.5">Guru Mapel / Piket</div>
            <p className="text-[10px] text-slate-500 mt-1">Teguran lisan, pengarahan karakter, catatan buku piket harian.</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200">
            <div className="font-bold text-emerald-950 text-[11px]">2. Ringan Berulang (2-3x)</div>
            <div className="text-emerald-800 font-semibold text-[11px] mt-0.5">Wali Kelas</div>
            <p className="text-[10px] text-slate-600 mt-1">Pembinaan personal, WA orang tua, penandatanganan Surat Pernyataan.</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div className="font-bold text-amber-950 text-[11px]">3. Pelanggaran Sedang (1-2x)</div>
            <div className="text-amber-800 font-semibold text-[11px] mt-0.5">Guru BK</div>
            <p className="text-[10px] text-slate-600 mt-1">Konseling individu/kelompok, penandatanganan kontrak perilaku.</p>
          </div>
          <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200">
            <div className="font-bold text-orange-950 text-[11px]">4. Sedang Berulang</div>
            <div className="text-orange-800 font-semibold text-[11px] mt-0.5">Wakasek Kesiswaan</div>
            <p className="text-[10px] text-slate-600 mt-1">Pemanggilan orang tua resmi, konferensi kasus, Surat Peringatan (SP).</p>
          </div>
          <div className="p-3 rounded-2xl bg-red-50/70 border border-red-200">
            <div className="font-bold text-red-950 text-[11px]">5. Pelanggaran Berat</div>
            <div className="text-red-800 font-semibold text-[11px] mt-0.5">Kepala Sekolah & Tim</div>
            <p className="text-[10px] text-slate-600 mt-1">Pemeriksaan khusus, sidang Dewan Guru, sanksi tegas / alih bina.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari siswa, uraian pasal, petugas..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">Semua Tingkat</option>
            <option value="Ringan">Ringan</option>
            <option value="Sedang">Sedang</option>
            <option value="Berat">Berat</option>
          </select>

          {/* Pasal Filter */}
          <select
            value={pasalFilter}
            onChange={(e) => setPasalFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">Semua Pasal (1 - 6)</option>
            <option value="1">Pasal 1: Seragam</option>
            <option value="2">Pasal 2: Rambut & Hiasan</option>
            <option value="3">Pasal 3: Kehadiran</option>
            <option value="4">Pasal 4: Ibadah & Belajar</option>
            <option value="5">Pasal 5: Pelanggaran Berat</option>
            <option value="6">Pasal 6: Lingkungan</option>
          </select>

          {/* Kelas Filter */}
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">Semua Rombel</option>
            {['7A', '7B', '7C', '7D', '8A', '8B', '8C', '8D', '9A', '9B', '9C', '9D'].map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-600 font-mono pl-2">
            Total: <strong className="text-slate-800">{filteredViolations.length}</strong> catatan
          </span>
        </div>
      </div>

      {/* Violations Table (Points column removed - strictly Ringan, Sedang, Berat) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">Waktu & Tempat</th>
                <th className="py-3 px-4 font-bold">Nama Siswa & Kelas</th>
                <th className="py-3 px-3 font-bold">Pasal Tata Tertib</th>
                <th className="py-3 px-4 font-bold">Uraian Kasus</th>
                <th className="py-3 px-3 font-bold text-center">Klasifikasi</th>
                <th className="py-3 px-4 font-bold">Tahap Pembinaan</th>
                <th className="py-3 px-3 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Tidak ditemukan data pelanggaran dengan filter ini.
                  </td>
                </tr>
              ) : (
                filteredViolations.map((v) => {
                  const studentObj = students.find((s) => s.id === v.studentId);
                  const waMessage = studentObj ? generateViolationMessage(studentObj, v) : '';
                  const waUrl = getWhatsAppUrl(v.noWaOrtu, waMessage);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{v.tanggal}</div>
                        <div className="text-[10px] text-slate-600 font-mono">{v.waktu} WIB</div>
                        <div className="text-[10px] text-slate-600 truncate max-w-[120px]">{v.lokasi}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.studentName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-[#0B231E] bg-[#0B231E]/10 px-1.5 py-0.2 rounded text-[10px]">
                            {v.kelas}
                          </span>
                          <span className="text-[10px] text-slate-600">Pencatat: {v.guruPencatat}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {v.kodePasal}
                        </span>
                        <div className="text-[10px] text-slate-600 mt-0.5 max-w-[110px] truncate">{v.pasalTitle}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <p className="line-clamp-2 leading-relaxed">{v.uraian}</p>
                        {v.catatanKhusus && (
                          <div className="text-[10px] text-amber-800 mt-0.5 italic">
                            Catatan: {v.catatanKhusus}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] ${
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
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 text-[11px] leading-tight">
                          {v.tahapPembinaan}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={v.statusSurat}
                          onChange={(e) => onUpdateViolationStatus(v.id, e.target.value as any)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-lg border focus:outline-hidden ${
                            v.statusSurat === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : v.statusSurat === 'Diterbitkan'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Diterbitkan">Diterbitkan</option>
                          <option value="Selesai">Selesai (Terbina)</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print & Generate Surat Pernyataan / Slip Button */}
                          <button
                            onClick={() => onOpenSuratModal(v)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B231E] hover:bg-[#143d34] text-white text-[11px] font-semibold transition-colors"
                            title="Cetak Surat Pernyataan Siswa atau Surat Panggilan"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#83C532]" />
                            <span>Surat & Slip</span>
                          </button>

                          {/* WhatsApp Parent Link */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            title="Kirim Panggilan/Pemberitahuan via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PRATINJAU DOKUMEN RESMI CETAK / UNDUH PDF */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[95vh] flex flex-col">
            {/* Modal Controls Bar (Hidden during Print) */}
            <div className="no-print bg-[#0B231E] px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                  <Printer className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Pratinjau Dokumen Resmi PDF Pelanggaran</h3>
                  <p className="text-[11px] text-slate-300">
                    Buku Register & Rekapitulasi Catatan Pelanggaran Siswa {schoolConfig.name || 'SMPN 1 Kandangan'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#83C532] hover:bg-[#94db3a] text-[#0B231E] font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF (Ctrl + P)</span>
                </button>

                <button
                  onClick={handleDownloadWord}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-300" />
                  <span>Unduh Word</span>
                </button>

                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable Viewport */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-100/80">
              <div className="print-area bg-white p-8 max-w-4xl mx-auto shadow-sm border border-slate-200 text-black font-serif">
                {/* Official Kop Surat Temanggung */}
                <div className="text-center pb-3 border-b-4 border-double border-black mb-6">
                  <div className="text-sm font-bold uppercase tracking-wider">
                    PEMERINTAH KABUPATEN TEMANGGUNG
                  </div>
                  <div className="text-sm font-bold uppercase tracking-wider">
                    DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
                  </div>
                  <div className="text-xl font-black text-[#0B231E] tracking-tight uppercase mt-0.5">
                    {schoolConfig.name} ({schoolConfig.shortName || 'GRISAKA'})
                  </div>
                  <div className="text-[11px] text-slate-700 font-sans mt-0.5">
                    NPSN: {schoolConfig.npsn} · {schoolConfig.address}, {schoolConfig.city}, {schoolConfig.province} {schoolConfig.postalCode}
                  </div>
                  <div className="text-[11px] text-slate-600 font-sans">
                    Telp: {schoolConfig.phone} | Website: {schoolConfig.website} | Email: {schoolConfig.email}
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h1 className="text-base font-bold uppercase tracking-wide underline font-sans text-slate-900">
                    BUKU REGISTER CATATAN DAN KONTROL PELANGGARAN SISWA
                  </h1>
                  <div className="text-xs text-slate-600 font-sans mt-1">
                    Tanggal Unduh / Cetak:{' '}
                    {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                  </div>
                </div>

                {/* Summary Meta */}
                <div className="grid grid-cols-4 gap-2 mb-4 font-sans text-xs border border-slate-300 p-2.5 bg-slate-50/50">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Kasus:</span>
                    <strong className="text-slate-900">{filteredViolations.length} Kasus</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kasus Ringan:</span>
                    <strong className="text-emerald-700">{filteredViolations.filter(v => v.tingkat === 'Ringan').length}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kasus Sedang:</span>
                    <strong className="text-amber-700">{filteredViolations.filter(v => v.tingkat === 'Sedang').length}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kasus Berat:</span>
                    <strong className="text-rose-700">{filteredViolations.filter(v => v.tingkat === 'Berat').length}</strong>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border border-black font-sans text-[11px] mb-8">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900">
                      <th className="border border-black p-2 text-center w-8">No</th>
                      <th className="border border-black p-2 text-left w-24">Waktu</th>
                      <th className="border border-black p-2 text-left">Nama Siswa</th>
                      <th className="border border-black p-2 text-center w-12">Kelas</th>
                      <th className="border border-black p-2 text-left">Pasal & Uraian Kasus</th>
                      <th className="border border-black p-2 text-center w-20">Klasifikasi</th>
                      <th className="border border-black p-2 text-left">Tahap Pembinaan</th>
                      <th className="border border-black p-2 text-left w-24">Pencatat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredViolations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border border-black p-4 text-center text-slate-500 italic">
                          Tidak ada catatan pelanggaran yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredViolations.map((v, i) => (
                        <tr key={v.id} className="align-top">
                          <td className="border border-black p-2 text-center font-mono">{i + 1}</td>
                          <td className="border border-black p-2 whitespace-nowrap">
                            {v.tanggal}<br />
                            <small className="text-slate-500 font-mono">{v.waktu || '07:30'} WIB</small>
                          </td>
                          <td className="border border-black p-2 font-bold text-slate-900">{v.studentName}</td>
                          <td className="border border-black p-2 text-center font-mono font-bold">{v.kelas}</td>
                          <td className="border border-black p-2">
                            <span className="font-semibold text-slate-900">{v.kodePasal}</span>: {v.uraian}
                          </td>
                          <td className="border border-black p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              v.tingkat === 'Berat' ? 'text-red-700 bg-red-100' :
                              v.tingkat === 'Sedang' ? 'text-amber-700 bg-amber-100' :
                              'text-emerald-700 bg-emerald-100'
                            }`}>
                              {v.tingkat}
                            </span>
                          </td>
                          <td className="border border-black p-2 text-[10px] leading-tight text-slate-700">
                            {v.tahapPembinaan}
                          </td>
                          <td className="border border-black p-2 text-[10px] text-slate-700">
                            {v.guruPencatat}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Formal Signatures (Tim Kesiswaan, Guru BK, Kepala Sekolah) */}
                <div className="grid grid-cols-3 gap-4 text-center font-sans text-xs mt-10 pt-4">
                  <div>
                    Mengetahui,<br />
                    <strong>{schoolConfig.timKesiswaanTitle || 'Wakasek Urusan Kesiswaan'}</strong>
                    <div className="h-16"></div>
                    <div className="font-bold underline">
                      {schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Tim Kesiswaan'}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                      NIP. {schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '-'}
                    </div>
                  </div>

                  <div>
                    Mengetahui,<br />
                    <strong>{schoolConfig.bkTitle || 'Koordinator Guru BK'}</strong>
                    <div className="h-16"></div>
                    <div className="font-bold underline">
                      {schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.'}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                      NIP. {schoolConfig.bkNip || '19780824 200501 2 008'}
                    </div>
                  </div>

                  <div>
                    Kandangan,{' '}
                    {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                    <br />
                    <strong>Kepala {schoolConfig.name || 'SMPN 1 Kandangan'}</strong>
                    <div className="h-16"></div>
                    <div className="font-bold underline">
                      {schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                      NIP. {schoolConfig.principalNip || '19740512 199802 2 003'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
