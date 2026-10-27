import React, { useState } from 'react';
import { ViolationRecord, Student, SchoolProfile } from '../../types';
import { SCHOOL_CONFIG as DEFAULT_SCHOOL_CONFIG } from '../../data/schoolConfig';
import { Printer, X, FileText, Download, FileSpreadsheet, FileDown, CheckCircle2 } from 'lucide-react';
import { exportSingleSuratToWord, exportSingleSuratToExcel, exportElementToPDF } from '../../utils/exportDocs';

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

  if (!isOpen || !violation || !student) return null;

  const currentConfig = schoolConfig || DEFAULT_SCHOOL_CONFIG;

  const showSuccessFeedback = (msg: string) => {
    setDownloadSuccessMsg(msg);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('surat-printable-area');
    if (el) {
      setIsExportingPdf(true);
      showSuccessFeedback('Sedang memproses unduhan dokumen PDF...');
      const cleanName = `${docType}_${student.nama.replace(/\s+/g, '_')}_${violation.id}`;
      await exportElementToPDF(el, cleanName);
      setIsExportingPdf(false);
      showSuccessFeedback('Berhasil mengunduh dokumen PDF resmi!');
    } else {
      window.print();
    }
  };

  const handlePrintDoc = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    exportSingleSuratToWord(docType, student, violation, currentConfig);
    showSuccessFeedback('Berhasil mengunduh dokumen Microsoft Word (.doc)');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[95vh] flex flex-col">
        {/* Modal Controls Bar (Hidden on Print) */}
        <div className="no-print bg-[#0B231E] px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#83C532] text-[#0B231E] flex items-center justify-center">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Dokumen Administrasi Kesiswaan & Tata Tertib</h3>
              <p className="text-[11px] text-slate-300">
                Penerbitan Surat Resmi SMP Negeri 1 Kandangan (Kabupaten Temanggung)
              </p>
            </div>
          </div>

          {/* Document Type Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl text-xs">
            <button
              onClick={() => setDocType('surat_pernyataan')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                docType === 'surat_pernyataan'
                  ? 'bg-[#83C532] text-[#0B231E] font-bold shadow-xs'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Surat Pernyataan
            </button>
            <button
              onClick={() => setDocType('panggilan_ortu')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                docType === 'panggilan_ortu'
                  ? 'bg-[#83C532] text-[#0B231E] font-bold shadow-xs'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Surat Panggilan Ortu
            </button>
            <button
              onClick={() => setDocType('slip_pelanggaran')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                docType === 'slip_pelanggaran'
                  ? 'bg-[#83C532] text-[#0B231E] font-bold shadow-xs'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Slip Bukti Kontrol
            </button>
          </div>

          {/* Download & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              title="Unduh format dokumen Microsoft Word (.doc) lengkap dengan Kop Surat & Tanda Tangan"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh Word</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              title="Unduh langsung file PDF resmi A4 siap kirim"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Mengunduh PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={handlePrintDoc}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              title="Buka dialog cetak fisik printer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              title="Unduh rekap surat ini dalam format spreadsheet Excel (.csv)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar with quick notification */}
        <div className="no-print bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Format Dokumen: <strong>{docType === 'surat_pernyataan' ? 'Surat Pernyataan Siswa' : docType === 'panggilan_ortu' ? 'Surat Panggilan Orang Tua' : 'Slip Bukti Kontrol'}</strong> untuk <strong>{student.nama}</strong> ({student.kelas})
            </span>
          </div>

          {downloadSuccessMsg ? (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg font-semibold animate-fade-in text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{downloadSuccessMsg}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 hidden sm:block">
              Tersedia dalam format Word (.doc), PDF, dan Excel (.csv) siap dikirim ke orang tua.
            </div>
          )}
        </div>

        {/* Document Printable Viewport */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          <div id="surat-printable-area" className="print-area bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-10 shadow-lg rounded-xl border border-slate-200 font-serif leading-relaxed text-sm">
            {/* Kop Surat Resmi - TEMANGGUNG */}
            <div className="border-b-[3px] border-double border-black pb-3 mb-6 text-center flex items-center justify-between gap-4">
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
                <div className="text-xl font-extrabold tracking-wide text-black uppercase mt-0.5">
                  {currentConfig.name || 'SMP NEGERI 1 KANDANGAN'} ({currentConfig.shortName || 'GRISAKA'})
                </div>
                <div className="text-[11px] text-black mt-0.5 font-sans">
                  NPSN: {currentConfig.npsn || '20321456'}
                </div>
                <div className="text-[11px] text-black">
                  {currentConfig.address || 'Kecamatan Kandangan'}, {currentConfig.city || 'Kabupaten Temanggung'}, {currentConfig.province || 'Jawa Tengah'} {currentConfig.postalCode || '56281'}
                </div>
                <div className="text-[10px] text-black font-sans">
                  Telp: {currentConfig.phone} · Website: {currentConfig.website} · Email: {currentConfig.email}
                </div>
              </div>
              {currentConfig.logoUrl && <div className="w-20 shrink-0"></div>}
            </div>

            {/* Content for Surat Pernyataan */}
            {docType === 'surat_pernyataan' && (
              <div>
                <div className="text-center mb-6">
                  <div className="text-base font-bold underline tracking-wide uppercase">
                    SURAT PERNYATAAN SISWA
                  </div>
                  <div className="text-xs font-mono font-medium">
                    Nomor: 421.3 / {violation.id.replace('viol-', '')} / KES / {new Date().getFullYear()}
                  </div>
                </div>

                <p className="mb-3 text-justify">
                  Yang bertanda tangan di bawah ini, saya siswa {currentConfig.name || 'SMP Negeri 1 Kandangan'}:
                </p>

                <table className="w-full mb-4 text-xs font-sans">
                  <tbody>
                    <tr>
                      <td className="w-40 py-1 font-semibold">Nama Lengkap Siswa</td>
                      <td className="w-4 py-1">:</td>
                      <td className="py-1 font-bold">{student.nama}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Nomor Induk Siswa (NISN)</td>
                      <td className="py-1">:</td>
                      <td className="py-1 font-mono">{student.nisn}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Kelas / Jenjang</td>
                      <td className="py-1">:</td>
                      <td className="py-1">Kelas {student.kelas} / Jenjang {student.jenjang} SMP</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Nama Orang Tua / Wali</td>
                      <td className="py-1">:</td>
                      <td className="py-1">{student.namaOrtu}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Alamat Rumah Tinggal</td>
                      <td className="py-1">:</td>
                      <td className="py-1">{student.alamat}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Nomor WhatsApp Wali</td>
                      <td className="py-1">:</td>
                      <td className="py-1 font-mono">{student.noWaOrtu}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="mb-2 text-justify">
                  Dengan ini mengakui dengan penuh kesadaran dan tanggung jawab bahwa saya telah melakukan pelanggaran terhadap Tata Tertib Sekolah, yaitu:
                </p>

                <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg mb-4 text-xs font-sans">
                  <div><strong>Pasal Tata Tertib :</strong> {violation.kodePasal} - {violation.pasalTitle}</div>
                  <div className="mt-1"><strong>Klasifikasi Pelanggaran :</strong> Tingkat {violation.tingkat}</div>
                  <div className="mt-1"><strong>Deskripsi Kejadian :</strong> {violation.uraian}</div>
                  <div className="mt-1"><strong>Waktu & Lokasi :</strong> {violation.tanggal} pk {violation.waktu} WIB di {violation.lokasi}</div>
                  {violation.catatanKhusus && (
                    <div className="mt-1"><strong>Catatan Khusus :</strong> {violation.catatanKhusus}</div>
                  )}
                </div>

                <p className="mb-2 text-justify">
                  Sehubungan dengan pelanggaran tersebut, saya berjanji dengan sungguh-sungguh:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-justify mb-4 text-xs">
                  <li>Tidak akan mengulangi perbuatan pelanggaran tata tertib tersebut maupun pelanggaran tata tertib lainnya di {currentConfig.name || 'SMP Negeri 1 Kandangan'}.</li>
                  <li>Sanggup mematuhi seluruh norma dan ketentuan Budaya Sekolah Aman dan Nyaman (BSAN) yang berlaku di sekolah dengan penuh kedisiplinan.</li>
                  <li>Bersedia menerima sanksi yang lebih berat, pemanggilan orang tua ke sekolah, hingga sidang pleno Dewan Guru apabila di kemudian hari saya mengulangi pelanggaran tata tertib.</li>
                  <li>Sanggup menjalankan seluruh bentuk pembinaan dan penugasan positif yang ditetapkan oleh <strong>{violation.tahapPembinaan}</strong>.</li>
                </ol>

                <p className="mb-6 text-justify text-xs">
                  Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dalam keadaan sadar dan tanpa paksaan dari pihak mana pun.
                </p>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 text-center text-xs mt-6">
                  <div>
                    Mengetahui,<br />
                    <strong>Orang Tua / Wali Siswa</strong><br /><br /><br /><br />
                    <u>( {student.namaOrtu} )</u>
                  </div>
                  <div>
                    Kandangan, {todayStr}<br />
                    <strong>Siswa yang Membuat Pernyataan</strong><br /><br /><br /><br />
                    <u>( {student.nama} )</u>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-xs mt-8 pt-4 border-t border-slate-200">
                  <div>
                    Guru Piket / Pencatat,<br /><br /><br /><br />
                    <u>( {violation.guruPencatat} )</u>
                  </div>
                  <div>
                    Mengetahui,<br />
                    <strong>Kepala {currentConfig.name || 'SMPN 1 Kandangan'}</strong><br /><br /><br /><br />
                    <u><strong>{currentConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br />
                    NIP. {currentConfig.principalNip || '19740512 199802 2 003'}
                  </div>
                </div>
              </div>
            )}

            {/* Content for Surat Panggilan Orang Tua */}
            {docType === 'panggilan_ortu' && (
              <div>
                <div className="flex justify-between items-start text-xs mb-4 font-sans">
                  <div>
                    <div>Nomor : 421.3 / {violation.id.replace('viol-', '')} / BK / {new Date().getFullYear()}</div>
                    <div>Lampiran : -</div>
                    <div>Perihal : <strong>Panggilan Orang Tua / Wali Siswa</strong></div>
                  </div>
                  <div className="text-right">
                    <div>Kandangan, {todayStr}</div>
                    <div className="font-semibold text-red-700">Sifat: Penting / Segera</div>
                  </div>
                </div>

                <div className="text-xs mb-4 font-sans">
                  Kepada Yth.<br />
                  Bapak / Ibu Orang Tua / Wali dari:<br />
                  <strong>{student.nama}</strong> (Kelas {student.kelas})<br />
                  di Tempat
                </div>

                <p className="text-xs mb-3 text-justify">
                  Dengan hormat,
                </p>
                <p className="text-xs mb-3 text-justify">
                  Sehubungan dengan proses pembinaan kedisiplinan dan monitoring Budaya Sekolah Aman dan Nyaman (BSAN) di {currentConfig.name || 'SMP Negeri 1 Kandangan'}, kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali murid pada:
                </p>

                <table className="w-full mb-4 text-xs font-sans pl-4">
                  <tbody>
                    <tr>
                      <td className="w-32 py-1 font-semibold">Hari, Tanggal</td>
                      <td className="w-4 py-1">:</td>
                      <td className="py-1 font-bold">Menyesuaikan Jadwal Terlampir</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Waktu</td>
                      <td className="py-1">:</td>
                      <td className="py-1 font-mono">08.00 WIB - Selesai</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Tempat</td>
                      <td className="py-1">:</td>
                      <td className="py-1">Ruang Bimbingan Konseling (BK) / Kesiswaan</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Menemui</td>
                      <td className="py-1">:</td>
                      <td className="py-1 font-semibold">{violation.tahapPembinaan}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">Keperluan</td>
                      <td className="py-1">:</td>
                      <td className="py-1">Konsultasi Pembinaan Perilaku & Tindak Lanjut Tata Tertib ({violation.kodePasal} - Tingkat {violation.tingkat})</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-xs mb-6 text-justify">
                  Mengingat pentingnya koordinasi ini demi masa depan dan karakter putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
                </p>

                <div className="grid grid-cols-3 gap-3 text-center text-xs mt-8">
                  <div>
                    Mengetahui,<br />
                    <strong>{currentConfig.bkTitle || 'Guru Bimbingan Konseling'}</strong><br /><br /><br /><br />
                    <u><strong>{currentConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.'}</strong></u><br />
                    NIP. {currentConfig.bkNip || '19780824 200501 2 008'}
                  </div>
                  <div>
                    Mengetahui,<br />
                    <strong>{currentConfig.timKesiswaanTitle || 'Tim Kesiswaan / Ketertiban'}</strong><br /><br /><br /><br />
                    <u><strong>{currentConfig.timKesiswaanName || currentConfig.wakasekName || 'Tim Kesiswaan'}</strong></u><br />
                    NIP. {currentConfig.timKesiswaanNip || currentConfig.wakasekNip || '-'}
                  </div>
                  <div>
                    Kandangan, {todayStr}<br />
                    <strong>Kepala {currentConfig.name || 'SMPN 1 Kandangan'}</strong><br /><br /><br /><br />
                    <u><strong>{currentConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br />
                    NIP. {currentConfig.principalNip || '19740512 199802 2 003'}
                  </div>
                </div>
              </div>
            )}

            {/* Content for Slip Bukti Kontrol Siswa */}
            {docType === 'slip_pelanggaran' && (
              <div>
                <div className="text-center mb-4">
                  <div className="text-sm font-bold uppercase tracking-wider underline">
                    KARTU KONTROL & SLIP PELANGGARAN SISWA
                  </div>
                  <div className="text-[11px] font-mono">BSAN GRISAKA · KABUPATEN TEMANGGUNG</div>
                </div>

                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 mb-4 text-xs font-sans space-y-2">
                  <div className="flex justify-between">
                    <span>ID Slip: <strong className="font-mono">{violation.id}</strong></span>
                    <span>Tanggal: <strong>{violation.tanggal} {violation.waktu} WIB</strong></span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span>Nama Siswa: <strong>{student.nama}</strong> ({student.kelas})</span>
                    <span>NISN: <span className="font-mono">{student.nisn}</span></span>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <div>Pelanggaran: <strong>{violation.kodePasal} - {violation.pasalTitle}</strong></div>
                    <div className="text-slate-700 mt-0.5">{violation.uraian}</div>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span>Klasifikasi: <strong className="text-red-700 font-bold">{violation.tingkat}</strong></span>
                    <span>Riwayat Kasus: <strong className="font-mono text-slate-800">R:{student.totalPelanggaranRingan} · S:{student.totalPelanggaranSedang} · B:{student.totalPelanggaranBerat}</strong></span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 text-slate-700">
                    <div>Tahap Penanggung Jawab: <strong>{violation.tahapPembinaan}</strong></div>
                    <div>Petugas Pencatat: <strong>{violation.guruPencatat}</strong></div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 italic mb-6">
                  *Slip ini wajib disimpan siswa dan ditunjukkan saat proses konseling/pembinaan di ruang BK atau Kesiswaan.
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-xs">
                  <div>
                    Tanda Tangan Siswa,<br /><br /><br /><br />
                    <u>( {student.nama} )</u>
                  </div>
                  <div>
                    Guru Piket / Pembina,<br /><br /><br /><br />
                    <u>( {violation.guruPencatat} )</u>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
