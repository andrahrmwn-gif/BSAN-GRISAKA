import React, { useState, useEffect } from 'react';
import { ViolationRecord, Student, SchoolProfile } from '../../types';
import { SCHOOL_CONFIG as DEFAULT_SCHOOL_CONFIG } from '../../data/schoolConfig';
import { Printer, X, FileText, FileSpreadsheet, FileDown, CheckCircle2, ExternalLink, Edit3 } from 'lucide-react';
import { exportSingleSuratToWord, exportSingleSuratToExcel, exportElementToPDF } from '../../utils/exportDocs';
import { LOGO_TEMANGGUNG_DATA_URL, LOGO_TUTWURI_DATA_URL } from '../../data/logoAssets';

interface SuratPernyataanModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: ViolationRecord | null;
  student: Student | null;
  schoolConfig?: SchoolProfile;
}

export const SuratPernyataanModal: React.FC<SuratPernyataanModalProps> = ({
  isOpen,
  onClose,
  violation,
  student,
  schoolConfig = DEFAULT_SCHOOL_CONFIG,
}) => {
  const [docType, setDocType] = useState<'surat_pernyataan' | 'panggilan_ortu' | 'slip_pelanggaran'>('surat_pernyataan');
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const getDefaultNomor = (type: string, violId: string) => {
    const numPart = violId ? violId.replace('viol-', '') : '001';
    if (type === 'surat_pernyataan') {
      return `Nomor: 421.3 / ${numPart} / KES / ${currentYear}`;
    } else if (type === 'panggilan_ortu') {
      return `Nomor : 421.3 / ${numPart} / BK / ${currentYear}`;
    } else {
      return `Nomor : 421.3 / ${numPart} / KTR / ${currentYear}`;
    }
  };

  // State for editable letter number per document type
  const [nomorMap, setNomorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (violation) {
      setNomorMap((prev) => ({
        surat_pernyataan: prev.surat_pernyataan || getDefaultNomor('surat_pernyataan', violation.id),
        panggilan_ortu: prev.panggilan_ortu || getDefaultNomor('panggilan_ortu', violation.id),
        slip_pelanggaran: prev.slip_pelanggaran || getDefaultNomor('slip_pelanggaran', violation.id),
      }));
    }
  }, [violation]);

  if (!isOpen || !violation || !student) return null;

  const currentConfig = schoolConfig || DEFAULT_SCHOOL_CONFIG;
  const currentNomor = nomorMap[docType] || getDefaultNomor(docType, violation.id);

  const handleNomorChange = (newVal: string) => {
    setNomorMap((prev) => ({
      ...prev,
      [docType]: newVal,
    }));
  };

  const showSuccessFeedback = (msg: string) => {
    setDownloadSuccessMsg(msg);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('surat-printable-area');
    if (el) {
      setIsExportingPdf(true);
      showSuccessFeedback('Sedang memproses unduhan PDF resmi...');
      const cleanName = `${docType}_${student.nama.replace(/\s+/g, '_')}_${violation.id}`;
      const res = await exportElementToPDF(el, cleanName, { singlePage: true });
      setIsExportingPdf(false);
      if (res.blobUrl) {
        setPdfDownloadUrl(res.blobUrl);
      }
      if (res.success) {
        showSuccessFeedback('File PDF resmi 1 halaman langsung terunduh otomatis!');
      } else {
        showSuccessFeedback('Pembuatan PDF terkendala. Gunakan tombol Cetak untuk opsi alternatif.');
      }
    }
  };

  const handlePrintDoc = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    exportSingleSuratToWord(docType, student, violation, currentConfig, currentNomor);
    showSuccessFeedback('Berhasil mengunduh dokumen Microsoft Word (.doc) 1 halaman');
  };

  const handleDownloadExcel = () => {
    exportSingleSuratToExcel(docType, student, violation, currentConfig);
    showSuccessFeedback('Berhasil mengunduh rekap spreadsheet Excel (.csv)');
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(violation.tanggal || Date.now()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-3 max-h-[96vh] flex flex-col">
        {/* Modal Header Bar (Hidden on Print) */}
        <div className="no-print bg-gradient-to-r from-[#1E3A8A] via-[#3451B2] to-[#3B5BDB] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Dokumen Administrasi Kesiswaan & Tata Tertib</h3>
              <p className="text-[11px] text-blue-100">
                Penerbitan Surat Resmi SMPN 1 Kandangan (Kabupaten Temanggung)
              </p>
            </div>
          </div>

          {/* Document Type Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl text-xs">
            <button
              onClick={() => setDocType('surat_pernyataan')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                docType === 'surat_pernyataan'
                  ? 'bg-white text-[#3B5BDB] font-bold shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Surat Pernyataan
            </button>
            <button
              onClick={() => setDocType('panggilan_ortu')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                docType === 'panggilan_ortu'
                  ? 'bg-white text-[#3B5BDB] font-bold shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Surat Panggilan Ortu
            </button>
            <button
              onClick={() => setDocType('slip_pelanggaran')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                docType === 'slip_pelanggaran'
                  ? 'bg-white text-[#3B5BDB] font-bold shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Slip Bukti Kontrol
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Unduh format dokumen Microsoft Word (.doc) 1 halaman"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh Word</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Unduh file PDF resmi A4 1 halaman"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={handlePrintDoc}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Cetak dokumen"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Unduh rekap surat format Excel (.csv)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editable Letter Number Sub-Bar */}
        <div className="no-print bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 shrink-0">
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Nomor Surat (Dapat Diedit):</span>
            </div>
            <input
              type="text"
              value={currentNomor}
              onChange={(e) => handleNomorChange(e.target.value)}
              placeholder="Contoh: 421.3 / 102 / KES / 2026"
              className="flex-1 max-w-md px-3 py-1 text-xs bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3B5BDB] font-mono font-bold text-slate-800 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccessMsg ? (
              <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg font-semibold animate-fade-in text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{downloadSuccessMsg}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Standar A4 · Margin 1,5 cm · Spasi 1,15 · 11pt Serif · 1 Halaman Rapi
              </div>
            )}
            {pdfDownloadUrl && (
              <a
                href={pdfDownloadUrl}
                download={`${docType}_${student.nama.replace(/\s+/g, '_')}_${violation.id}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 text-[#3B5BDB] font-bold rounded-lg text-[11px] transition-transform active:scale-95 shadow-xs border border-blue-200"
              >
                <span>Buka PDF</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Document Printable Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex justify-center items-start">
          <div 
            id="surat-printable-area" 
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#000000',
              width: '210mm',
              minHeight: '297mm',
              maxHeight: '297mm',
              padding: '15mm', // Margin 1.5 cm keliling
              boxSizing: 'border-box',
              fontFamily: "'Times New Roman', Times, 'Nimbus Roman No9 L', Georgia, serif",
              fontSize: '11pt',
              lineHeight: '1.15',
              overflow: 'hidden',
            }}
            className="print-area bg-white text-black shadow-2xl border border-slate-300 font-serif leading-[1.15] select-text"
          >
            {/* Kop Surat Resmi Sesuai Permintaan */}
            {/* Logo Pemda Temanggung di sebelah kiri, Logo Sekolah di sebelah kanan, SMPN 1 KANDANGAN di tengah (GRISAKA dihapus) */}
            <div className="border-b-[3px] border-double border-black pb-2 mb-3 text-center flex items-center justify-between gap-3">
              {/* Logo Pemda Temanggung (Sebelah Kiri) */}
              <div className="w-[65px] h-[75px] shrink-0 flex items-center justify-center">
                <img
                  src={LOGO_TEMANGGUNG_DATA_URL}
                  alt="Logo Pemda Temanggung"
                  className="max-h-[75px] max-w-[65px] object-contain"
                />
              </div>

              {/* Teks Kop Surat Resmi (Tengah) */}
              <div className="flex-1 text-center font-serif leading-[1.15]">
                <div className="text-[11pt] uppercase tracking-wider font-bold text-black">
                  PEMERINTAH KABUPATEN TEMANGGUNG
                </div>
                <div className="text-[11pt] uppercase tracking-wider font-bold text-black">
                  DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
                </div>
                <div className="text-[14pt] font-black tracking-wide text-black uppercase mt-0.5">
                  SMPN 1 KANDANGAN
                </div>
                <div className="text-[9pt] text-black mt-0.5">
                  Alamat: {currentConfig.address || 'Jl. Raya Kandangan - Temanggung, Kec. Kandangan'}, {currentConfig.city || 'Kabupaten Temanggung'} {currentConfig.postalCode || '56281'}
                </div>
                <div className="text-[8.5pt] text-black">
                  Telepon: {currentConfig.phone || '(0293) 490123'} · Email: {currentConfig.email || 'smpn1kandangan@temanggungkab.go.id'} · Laman: {currentConfig.website || 'smpn1kandangan-tmg.sch.id'}
                </div>
              </div>

              {/* Logo Sekolah (Sebelah Kanan) */}
              <div className="w-[65px] h-[75px] shrink-0 flex items-center justify-center">
                <img
                  src={currentConfig.logoUrl || LOGO_TUTWURI_DATA_URL}
                  alt="Logo Sekolah"
                  className="max-h-[75px] max-w-[65px] object-contain"
                />
              </div>
            </div>

            {/* Content for Surat Pernyataan Siswa */}
            {docType === 'surat_pernyataan' && (
              <div className="text-[11pt] leading-[1.15]">
                <div className="text-center mb-3">
                  <div className="text-[12pt] font-bold underline tracking-wide uppercase">
                    SURAT PERNYATAAN SISWA
                  </div>
                  <div className="text-[10.5pt] font-serif mt-0.5">
                    {currentNomor.startsWith('Nomor') ? currentNomor : `Nomor: ${currentNomor}`}
                  </div>
                </div>

                <p className="mb-2 text-justify">
                  Yang bertanda tangan di bawah ini, saya siswa SMPN 1 Kandangan:
                </p>

                <table className="w-full mb-2.5 text-[10.5pt] border-collapse leading-[1.15]">
                  <tbody>
                    <tr>
                      <td className="w-48 py-0.5 font-medium">Nama Lengkap Siswa</td>
                      <td className="w-3 py-0.5">:</td>
                      <td className="py-0.5 font-bold">{student.nama}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium">Nomor Induk Siswa (NISN)</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{student.nisn}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium">Kelas / Rombel</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">Kelas {student.kelas} (Jenjang {student.jenjang} SMP)</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium">Nama Orang Tua / Wali</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{student.namaOrtu}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium">No. WhatsApp Wali</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{student.noWaOrtu}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium">Alamat Rumah</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{student.alamat}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="mb-1.5 text-justify">
                  Dengan ini menyatakan dengan penuh kesadaran dan rasa tanggung jawab bahwa saya telah melakukan pelanggaran terhadap tata tertib sekolah, yaitu:
                </p>

                <div className="bg-slate-50 border border-slate-400 p-2 rounded-sm mb-2 text-[10pt] leading-[1.15]">
                  <div><strong>Pasal Tata Tertib :</strong> {violation.kodePasal} - {violation.pasalTitle}</div>
                  <div className="mt-0.5"><strong>Klasifikasi Pelanggaran :</strong> Tingkat {violation.tingkat} | <strong>Waktu & Lokasi :</strong> {violation.tanggal} pk {violation.waktu || '-'} WIB di {violation.lokasi || 'Sekolah'}</div>
                  <div className="mt-0.5"><strong>Uraian Kejadian :</strong> {violation.uraian}</div>
                  {violation.catatanKhusus && (
                    <div className="mt-0.5"><strong>Catatan Khusus :</strong> {violation.catatanKhusus}</div>
                  )}
                </div>

                <p className="mb-1 text-justify">
                  Sehubungan dengan pelanggaran tersebut, saya berjanji dengan sungguh-sungguh:
                </p>
                <ol className="list-decimal pl-5 space-y-0.5 text-justify text-[10.5pt] leading-[1.15] mb-2">
                  <li>Tidak akan mengulangi perbuatan pelanggaran tata tertib tersebut maupun pelanggaran tata tertib lainnya di SMPN 1 Kandangan.</li>
                  <li>Sanggup menaati seluruh tata tertib dan norma Budaya Sekolah Aman dan Nyaman (BSAN) dengan penuh kedisiplinan.</li>
                  <li>Bersedia menerima sanksi yang lebih berat hingga pemanggilan orang tua ke sekolah apabila di kemudian hari mengulangi pelanggaran tata tertib.</li>
                  <li>Sanggup menjalankan penugasan pembinaan positif yang ditetapkan oleh <strong>{violation.tahapPembinaan}</strong>.</li>
                </ol>

                <p className="mb-3 text-justify text-[10.5pt]">
                  Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak mana pun.
                </p>

                {/* Signatures based on Category */}
                <div className="grid grid-cols-2 gap-4 text-center text-[10.5pt] leading-[1.15]">
                  <div>
                    Mengetahui,<br />
                    <strong>Orang Tua / Wali Siswa</strong>
                    <div className="h-10"></div>
                    <u>( {student.namaOrtu} )</u>
                  </div>
                  <div>
                    Kandangan, {todayStr}<br />
                    <strong>Siswa yang Membuat Pernyataan</strong>
                    <div className="h-10"></div>
                    <u>( {student.nama} )</u>
                  </div>
                </div>

                {violation.tingkat === 'Ringan' && (
                  <div className="text-center text-[10.5pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Guru Piket / Wali Kelas</strong>
                      <div className="h-10"></div>
                      <u>( {violation.guruPencatat || 'Guru Piket / Wali Kelas'} )</u>
                    </div>
                  </div>
                )}

                {violation.tingkat === 'Sedang' && (
                  <div className="text-center text-[10.5pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Koordinator BK / Waka Kesiswaan</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.timKesiswaanName || currentConfig.bkName || 'Koordinator BK / Waka Kesiswaan'}</strong></u><br />
                      NIP. {currentConfig.timKesiswaanNip || currentConfig.bkNip || '-'}
                    </div>
                  </div>
                )}

                {violation.tingkat === 'Berat' && (
                  <div className="grid grid-cols-2 gap-4 text-center text-[10.5pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Waka Kesiswaan / Koordinator BK</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.timKesiswaanName || currentConfig.bkName || 'Drs. Subagyo, M.Pd.'}</strong></u><br />
                      NIP. {currentConfig.timKesiswaanNip || currentConfig.bkNip || '-'}
                    </div>
                    <div>
                      Mengetahui,<br />
                      <strong>Kepala SMPN 1 Kandangan</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br />
                      NIP. {currentConfig.principalNip || '19740512 199802 2 003'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content for Surat Panggilan Orang Tua */}
            {docType === 'panggilan_ortu' && (
              <div className="text-[11pt] leading-[1.15]">
                <div className="flex justify-between items-start mb-2.5 text-[10.5pt]">
                  <div>
                    <div>{currentNomor.startsWith('Nomor') ? currentNomor : `Nomor : ${currentNomor}`}</div>
                    <div>Lampiran : -</div>
                    <div>Perihal : <strong>Panggilan Orang Tua / Wali Siswa</strong></div>
                  </div>
                  <div className="text-right">
                    <div>Kandangan, {todayStr}</div>
                    <div className="font-bold text-red-700">Sifat: Penting / Segera</div>
                  </div>
                </div>

                <div className="mb-2 text-[10.5pt]">
                  Kepada Yth.<br />
                  Bapak / Ibu Orang Tua / Wali dari:<br />
                  <strong>{student.nama}</strong> (Kelas {student.kelas})<br />
                  di Tempat
                </div>

                <p className="mb-1.5 text-justify text-[10.5pt]">
                  Dengan hormat,
                </p>
                <p className="mb-2 text-justify text-[10.5pt]">
                  Sehubungan dengan proses pembinaan kedisiplinan dan monitoring Budaya Sekolah Aman dan Nyaman (BSAN) di SMPN 1 Kandangan, kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali murid pada:
                </p>

                <table className="w-full mb-2.5 text-[10.5pt] pl-4 border-collapse leading-[1.15]">
                  <tbody>
                    <tr>
                      <td className="w-36 py-0.5 font-semibold">Hari, Tanggal</td>
                      <td className="w-3 py-0.5">:</td>
                      <td className="py-0.5 font-bold">Menyesuaikan Jadwal Terlampir</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">Waktu</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">08.00 WIB - Selesai</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">Tempat</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">Ruang Bimbingan Konseling (BK) / Kesiswaan</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">Menemui</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5 font-semibold">{violation.tahapPembinaan}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-semibold">Keperluan</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">Konsultasi Pembinaan Perilaku & Tindak Lanjut Tata Tertib ({violation.kodePasal} - Tingkat {violation.tingkat})</td>
                    </tr>
                  </tbody>
                </table>

                <p className="mb-4 text-justify text-[10.5pt]">
                  Mengingat pentingnya koordinasi ini demi masa depan dan pembinaan karakter putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
                </p>

                {/* Signatures based on Category */}
                <div className="grid grid-cols-2 gap-4 text-center text-[10.5pt] leading-[1.15]">
                  <div>
                    Mengetahui,<br />
                    <strong>Orang Tua / Wali Siswa</strong>
                    <div className="h-10"></div>
                    <u>( {student.namaOrtu} )</u>
                  </div>
                  <div>
                    Kandangan, {todayStr}<br />
                    <strong>Siswa yang Bersangkutan</strong>
                    <div className="h-10"></div>
                    <u>( {student.nama} )</u>
                  </div>
                </div>

                {violation.tingkat === 'Ringan' && (
                  <div className="text-center text-[10.5pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Guru Piket / Wali Kelas</strong>
                      <div className="h-10"></div>
                      <u>( {violation.guruPencatat || 'Guru Piket / Wali Kelas'} )</u>
                    </div>
                  </div>
                )}

                {violation.tingkat === 'Sedang' && (
                  <div className="text-center text-[10.5pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Koordinator BK / Waka Kesiswaan</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.timKesiswaanName || currentConfig.bkName || 'Koordinator BK / Waka Kesiswaan'}</strong></u><br />
                      NIP. {currentConfig.timKesiswaanNip || currentConfig.bkNip || '-'}
                    </div>
                  </div>
                )}

                {violation.tingkat === 'Berat' && (
                  <div className="grid grid-cols-2 gap-4 text-center text-[10.5pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Waka Kesiswaan / Koordinator BK</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.timKesiswaanName || currentConfig.bkName || 'Drs. Subagyo, M.Pd.'}</strong></u><br />
                      NIP. {currentConfig.timKesiswaanNip || currentConfig.bkNip || '-'}
                    </div>
                    <div>
                      Mengetahui,<br />
                      <strong>Kepala SMPN 1 Kandangan</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br />
                      NIP. {currentConfig.principalNip || '19740512 199802 2 003'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content for Slip Bukti Kontrol Siswa */}
            {docType === 'slip_pelanggaran' && (
              <div className="text-[11pt] leading-[1.15]">
                <div className="text-center mb-3">
                  <div className="text-[12pt] font-bold uppercase tracking-wider underline">
                    KARTU KONTROL & SLIP PELANGGARAN SISWA
                  </div>
                  <div className="text-[10pt] font-serif mt-0.5">
                    {currentNomor.startsWith('Nomor') ? currentNomor : `Nomor : ${currentNomor}`}
                  </div>
                </div>

                <div className="border border-slate-400 rounded-sm p-3 bg-slate-50 mb-3 text-[10pt] leading-[1.15] space-y-1.5">
                  <div className="flex justify-between">
                    <span>ID Slip: <strong>{violation.id}</strong></span>
                    <span>Tanggal: <strong>{violation.tanggal} {violation.waktu || ''} WIB</strong></span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5">
                    <span>Nama Siswa: <strong>{student.nama}</strong> ({student.kelas})</span>
                    <span>NISN: <span>{student.nisn}</span></span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5">
                    <div>Pelanggaran: <strong>{violation.kodePasal} - {violation.pasalTitle}</strong></div>
                    <div className="text-slate-800 mt-0.5">{violation.uraian}</div>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5">
                    <span>Klasifikasi: <strong className="text-red-700 font-bold">Tingkat {violation.tingkat}</strong></span>
                    <span>Riwayat Kasus: <strong>R:{student.totalPelanggaranRingan} · S:{student.totalPelanggaranSedang} · B:{student.totalPelanggaranBerat}</strong></span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5 text-slate-800">
                    <div>Tahap Penanggung Jawab: <strong>{violation.tahapPembinaan}</strong></div>
                    <div>Petugas Pencatat: <strong>{violation.guruPencatat}</strong></div>
                  </div>
                </div>

                <div className="text-[9.5pt] text-slate-700 italic mb-4">
                  *Slip bukti kontrol ini wajib dibawa dan ditunjukkan saat proses konseling serta pembinaan tata tertib di ruang BK / Kesiswaan.
                </div>

                {/* Signatures based on Category */}
                <div className="grid grid-cols-2 gap-4 text-center text-[10.5pt] leading-[1.15]">
                  <div>
                    Mengetahui,<br />
                    <strong>Orang Tua / Wali Siswa</strong>
                    <div className="h-10"></div>
                    <u>( {student.namaOrtu} )</u>
                  </div>
                  <div>
                    Kandangan, {todayStr}<br />
                    <strong>Tanda Tangan Siswa</strong>
                    <div className="h-10"></div>
                    <u>( {student.nama} )</u>
                  </div>
                </div>

                {violation.tingkat === 'Ringan' && (
                  <div className="text-center text-[10pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Guru Piket / Wali Kelas</strong>
                      <div className="h-10"></div>
                      <u>( {violation.guruPencatat || 'Guru Piket / Wali Kelas'} )</u>
                    </div>
                  </div>
                )}

                {violation.tingkat === 'Sedang' && (
                  <div className="text-center text-[10pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Koordinator BK / Waka Kesiswaan</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.timKesiswaanName || currentConfig.bkName || 'Koordinator BK / Waka Kesiswaan'}</strong></u><br />
                      NIP. {currentConfig.timKesiswaanNip || currentConfig.bkNip || '-'}
                    </div>
                  </div>
                )}

                {violation.tingkat === 'Berat' && (
                  <div className="grid grid-cols-2 gap-4 text-center text-[10pt] leading-[1.15] mt-3">
                    <div>
                      Mengetahui,<br />
                      <strong>Waka Kesiswaan / Koordinator BK</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.timKesiswaanName || currentConfig.bkName || 'Drs. Subagyo, M.Pd.'}</strong></u><br />
                      NIP. {currentConfig.timKesiswaanNip || currentConfig.bkNip || '-'}
                    </div>
                    <div>
                      Mengetahui,<br />
                      <strong>Kepala SMPN 1 Kandangan</strong>
                      <div className="h-10"></div>
                      <u><strong>{currentConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br />
                      NIP. {currentConfig.principalNip || '19740512 199802 2 003'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
