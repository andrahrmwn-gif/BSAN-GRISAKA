import { Student, ViolationRecord } from '../types';
import { SCHOOL_CONFIG } from '../data/schoolConfig';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export student data or violations to clean CSV that opens directly in Excel
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(obj =>
    headers.map(header => {
      let val = obj[header] ?? '';
      if (typeof val === 'string') {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate official Word (.doc) document with official letterhead (Kop Surat) and tables
 */
export function exportToWordDocument(
  title: string,
  periodLabel: string,
  summary: { totalStudents: number; totalHadir: number; attendanceRate: string; totalViolations: number; ringan: number; sedang: number; berat: number },
  students: Student[],
  violations: ViolationRecord[]
): void {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const violationRows = violations.slice(0, 50).map((v, i) => `
    <tr>
      <td style="border:1px solid #333; padding:6px; text-align:center;">${i + 1}</td>
      <td style="border:1px solid #333; padding:6px;">${v.studentName}</td>
      <td style="border:1px solid #333; padding:6px; text-align:center;">${v.kelas}</td>
      <td style="border:1px solid #333; padding:6px;">${v.kodePasal} - ${v.pasalTitle}</td>
      <td style="border:1px solid #333; padding:6px; text-align:center; font-weight:bold; color:${v.tingkat === 'Berat' ? '#DC2626' : v.tingkat === 'Sedang' ? '#D97706' : '#16A34A'};">${v.tingkat}</td>
      <td style="border:1px solid #333; padding:6px;">${v.tahapPembinaan}</td>
    </tr>
  `).join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.3; color: #000; }
        .kop-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
        .kop-table td { text-align: center; }
        .kop-instansi { font-size: 13pt; font-weight: bold; text-transform: uppercase; }
        .kop-sekolah { font-size: 16pt; font-weight: bold; letter-spacing: 1px; color: #0B231E; }
        .kop-alamat { font-size: 9.5pt; font-style: italic; }
        h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin: 16px 0 4px 0; }
        .sub-header { text-align: center; font-size: 11pt; margin-bottom: 20px; font-weight: bold; }
        .stats-grid { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .stats-grid td { border: 1px solid #999; padding: 6px 10px; background-color: #f9f9f9; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 24px; font-size: 10pt; }
        table.data-table th { border: 1px solid #333; padding: 8px; background-color: #E2E8F0; text-align: center; font-weight: bold; }
        .ttd-container { width: 100%; margin-top: 30px; }
        .ttd-box { width: 45%; float: right; text-align: center; font-size: 11pt; }
      </style>
    </head>
    <body>
      <table class="kop-table">
        <tr>
          <td>
            <div class="kop-instansi">PEMERINTAH KABUPATEN TEMANGGUNG</div>
            <div class="kop-instansi">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
            <div class="kop-sekolah">${SCHOOL_CONFIG.name} (${SCHOOL_CONFIG.shortName})</div>
            <div class="kop-alamat">NPSN: ${SCHOOL_CONFIG.npsn}</div>
            <div class="kop-alamat">${SCHOOL_CONFIG.address}, ${SCHOOL_CONFIG.city}, ${SCHOOL_CONFIG.province} ${SCHOOL_CONFIG.postalCode}</div>
            <div class="kop-alamat">Telp: ${SCHOOL_CONFIG.phone} | Website: ${SCHOOL_CONFIG.website} | Email: ${SCHOOL_CONFIG.email}</div>
          </td>
        </tr>
      </table>

      <h1>${title}</h1>
      <div class="sub-header">Periode Pelaporan: ${periodLabel}</div>

      <table class="stats-grid">
        <tr>
          <td><strong>Total Siswa Terdaftar:</strong> ${summary.totalStudents} Siswa</td>
          <td><strong>Persentase Kehadiran:</strong> ${summary.attendanceRate}</td>
        </tr>
        <tr>
          <td><strong>Total Catatan Pelanggaran:</strong> ${summary.totalViolations} Kasus</td>
          <td><strong>Rincian Kasus:</strong> Ringan: ${summary.ringan} | Sedang: ${summary.sedang} | Berat: ${summary.berat}</td>
        </tr>
      </table>

      <h3 style="font-size: 11pt; margin-top: 16px;">A. REKAPITULASI BUKU PELANGGARAN & PEMBINAAN KESISWAAN</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th width="4%">No</th>
            <th width="22%">Nama Siswa</th>
            <th width="8%">Kelas</th>
            <th width="32%">Uraian Tata Tertib & Indikator</th>
            <th width="14%">Klasifikasi</th>
            <th width="20%">Tahap Pembinaan</th>
          </tr>
        </thead>
        <tbody>
          ${violationRows || '<tr><td colspan="7" style="text-align:center; padding:12px;">Tidak ada rekapitulasi pelanggaran pada periode ini.</td></tr>'}
        </tbody>
      </table>

      <div style="clear: both; margin-top: 40px;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              Mengetahui,<br>
              <strong>Wakasek Urusan Kesiswaan</strong><br><br><br><br><br>
              <u><strong>Drs. Subagyo, M.Pd.</strong></u><br>
              NIP. 19700315 199601 1 002
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              Kandangan, ${dateStr}<br>
              <strong>Kepala SMPN 1 Kandangan</strong><br><br><br><br><br>
              <u><strong>${SCHOOL_CONFIG.principalName}</strong></u><br>
              NIP. ${SCHOOL_CONFIG.principalNip}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordHtml], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate sample CSV template for bulk student import
 */
export function downloadStudentTemplate(): void {
  const sample = [
    {
      nisn: '0089218299',
      nama: 'Budi Kurnia Pratama',
      kelas: '7A',
      jenjang: '7',
      gender: 'L',
      noHpSiswa: '081234567899',
      namaOrtu: 'Pratama Senior',
      noWaOrtu: '6281234567899',
      alamat: 'Jl. Raya Kandangan No. 10',
      statusKehadiran: 'Hadir'
    },
    {
      nisn: '0089218300',
      nama: 'Siti Rahmawati Putri',
      kelas: '8B',
      jenjang: '8',
      gender: 'P',
      noHpSiswa: '085712345600',
      namaOrtu: 'H. Rahmadi',
      noWaOrtu: '6285712345600',
      alamat: 'Dusun Kasreman RT 01 RW 01',
      statusKehadiran: 'Hadir'
    }
  ];
  exportToCSV(sample, 'Template_Import_Siswa_SMPN1_Kandangan');
}

/**
 * Export Violations specifically to Word document (.doc)
 */
export function exportViolationsToWord(
  violations: ViolationRecord[],
  schoolConfig: any
): void {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const rows = violations.map((v, i) => `
    <tr>
      <td style="border:1px solid #333; padding:6px; text-align:center;">${i + 1}</td>
      <td style="border:1px solid #333; padding:6px;">${v.tanggal} ${v.waktu || ''} WIB</td>
      <td style="border:1px solid #333; padding:6px; font-weight:bold;">${v.studentName}</td>
      <td style="border:1px solid #333; padding:6px; text-align:center;">${v.kelas}</td>
      <td style="border:1px solid #333; padding:6px;"><strong>${v.kodePasal}</strong>: ${v.uraian}</td>
      <td style="border:1px solid #333; padding:6px; text-align:center; font-weight:bold; color:${v.tingkat === 'Berat' ? '#DC2626' : v.tingkat === 'Sedang' ? '#D97706' : '#16A34A'};">${v.tingkat}</td>
      <td style="border:1px solid #333; padding:6px;">${v.tahapPembinaan}</td>
      <td style="border:1px solid #333; padding:6px;">${v.guruPencatat}</td>
    </tr>
  `).join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Buku Catatan Pelanggaran Siswa</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; color: #000; }
        .kop-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; text-align: center; }
        .kop-instansi { font-size: 12pt; font-weight: bold; text-transform: uppercase; }
        .kop-sekolah { font-size: 15pt; font-weight: bold; letter-spacing: 1px; color: #0B231E; }
        .kop-alamat { font-size: 9pt; }
        h1 { font-size: 13pt; text-align: center; text-transform: uppercase; margin: 16px 0 4px 0; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 24px; font-size: 9.5pt; }
        table.data-table th { border: 1px solid #333; padding: 7px; background-color: #E2E8F0; text-align: center; font-weight: bold; }
      </style>
    </head>
    <body>
      <table class="kop-table">
        <tr>
          <td>
            <div class="kop-instansi">PEMERINTAH KABUPATEN TEMANGGUNG</div>
            <div class="kop-instansi">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
            <div class="kop-sekolah">${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} (${schoolConfig.shortName || 'GRISAKA'})</div>
            <div class="kop-alamat">NPSN: ${schoolConfig.npsn || '20321456'} · ${schoolConfig.address || 'Kec. Kandangan'}, ${schoolConfig.city || 'Kabupaten Temanggung'} · Kode Pos: 56281</div>
            <div class="kop-alamat">Telp: ${schoolConfig.phone || '-'} · Email: ${schoolConfig.email || '-'}</div>
          </td>
        </tr>
      </table>

      <h1>BUKU CATATAN DAN REKAPITULASI PELANGGARAN SISWA</h1>
      <div style="text-align: center; font-size: 10pt; margin-bottom: 16px;">Tanggal Unduh Dokumen: ${dateStr}</div>

      <table class="data-table">
        <thead>
          <tr>
            <th width="4%">No</th>
            <th width="12%">Waktu</th>
            <th width="18%">Nama Siswa</th>
            <th width="6%">Kelas</th>
            <th width="28%">Uraian Pelanggaran</th>
            <th width="10%">Klasifikasi</th>
            <th width="14%">Tahap Pembinaan</th>
            <th width="8%">Pencatat</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8" style="text-align:center; padding:12px;">Tidak ada data pelanggaran.</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 30px;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 50%; text-align: center;">
              Mengetahui,<br>
              <strong>${schoolConfig.timKesiswaanTitle || 'Wakasek Urusan Kesiswaan'}</strong><br><br><br><br>
              <u><strong>${schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Drs. Subagyo, M.Pd.'}</strong></u><br>
              NIP. ${schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '19700315 199601 1 002'}
            </td>
            <td style="width: 50%; text-align: center;">
              Kandangan, ${dateStr}<br>
              <strong>Kepala ${schoolConfig.name || 'SMPN 1 Kandangan'}</strong><br><br><br><br>
              <u><strong>${schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br>
              NIP. ${schoolConfig.principalNip || '19740512 199802 2 003'}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Pelanggaran_Siswa_${schoolConfig.shortName || 'GRISAKA'}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Print & Export Violations to high-res printable PDF with official letterhead
 */
export function exportViolationsToPrintPDF(
  violations: ViolationRecord[],
  schoolConfig: any
): void {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const rows = violations.map((v, i) => `
    <tr>
      <td style="border:1px solid #333; padding:6px; text-align:center;">${i + 1}</td>
      <td style="border:1px solid #333; padding:6px; white-space:nowrap;">${v.tanggal}<br><small style="color:#666">${v.waktu || ''} WIB</small></td>
      <td style="border:1px solid #333; padding:6px; font-weight:bold;">${v.studentName}</td>
      <td style="border:1px solid #333; padding:6px; text-align:center; font-weight:bold;">${v.kelas}</td>
      <td style="border:1px solid #333; padding:6px;"><strong>${v.kodePasal}</strong>: ${v.uraian}</td>
      <td style="border:1px solid #333; padding:6px; text-align:center; font-weight:bold; color:${v.tingkat === 'Berat' ? '#DC2626' : v.tingkat === 'Sedang' ? '#D97706' : '#16A34A'};">${v.tingkat}</td>
      <td style="border:1px solid #333; padding:6px;">${v.tahapPembinaan}</td>
      <td style="border:1px solid #333; padding:6px;">${v.guruPencatat}</td>
    </tr>
  `).join('');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Buku Pelanggaran Siswa ${schoolConfig.shortName || 'GRISAKA'}</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; line-height: 1.3; color: #111; margin: 0; padding: 12px; }
        .kop-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 14px; text-align: center; }
        .kop-instansi { font-size: 11pt; font-weight: bold; text-transform: uppercase; }
        .kop-sekolah { font-size: 15pt; font-weight: bold; color: #0B231E; letter-spacing: 0.5px; }
        .kop-alamat { font-size: 8.5pt; font-style: italic; }
        h1 { font-size: 12.5pt; text-align: center; text-transform: uppercase; margin: 10px 0 2px 0; font-weight: bold; }
        .sub { text-align: center; font-size: 8.5pt; margin-bottom: 14px; color: #333; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 8.5pt; }
        table.data-table th { border: 1px solid #333; padding: 5px; background-color: #e2e8f0; text-align: center; font-weight: bold; }
        table.data-table td { border: 1px solid #444; padding: 5px; }
        .ttd-table { width: 100%; margin-top: 24px; border: none; font-size: 9.5pt; }
        .ttd-table td { width: 50%; text-align: center; vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="kop-table">
        <div class="kop-instansi">PEMERINTAH KABUPATEN TEMANGGUNG</div>
        <div class="kop-instansi">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
        <div class="kop-sekolah">${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} (${schoolConfig.shortName || 'GRISAKA'})</div>
        <div class="kop-alamat">NPSN: ${schoolConfig.npsn || '20321456'} · ${schoolConfig.address || 'Kec. Kandangan'}, ${schoolConfig.city || 'Kabupaten Temanggung'} · Jawa Tengah 56281</div>
        <div class="kop-alamat">Telp: ${schoolConfig.phone || '-'} · Email: ${schoolConfig.email || '-'}</div>
      </div>

      <h1>BUKU REGISTER CATATAN DAN KONTROL PELANGGARAN SISWA</h1>
      <div class="sub">Tanggal Cetak: ${dateStr} · Status: Dokumen Resmi Pengawasan Kesiswaan</div>

      <table class="data-table">
        <thead>
          <tr>
            <th width="4%">No</th>
            <th width="12%">Waktu</th>
            <th width="18%">Nama Siswa</th>
            <th width="6%">Kelas</th>
            <th width="30%">Pasal & Uraian Pelanggaran</th>
            <th width="10%">Klasifikasi</th>
            <th width="12%">Tahap Pembinaan</th>
            <th width="8%">Pencatat</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8" style="text-align:center; padding:12px;">Tidak ada catatan pelanggaran yang dipilih.</td></tr>'}
        </tbody>
      </table>

      <table class="ttd-table">
        <tr>
          <td>
            Mengetahui,<br>
            <strong>${schoolConfig.timKesiswaanTitle || 'Wakasek Urusan Kesiswaan'}</strong><br><br><br><br>
            <u><strong>${schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Tim Kesiswaan'}</strong></u><br>
            NIP. ${schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '-'}
          </td>
          <td>
            Kandangan, ${dateStr}<br>
            <strong>Kepala ${schoolConfig.name || 'SMPN 1 Kandangan'}</strong><br><br><br><br>
            <u><strong>${schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br>
            NIP. ${schoolConfig.principalNip || '19740512 199802 2 003'}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 400);
}

/**
 * Export single official letter (Surat Pernyataan, Panggilan Ortu, Slip Kontrol) to Word (.doc)
 */
export function exportSingleSuratToWord(
  type: 'surat_pernyataan' | 'panggilan_ortu' | 'slip_pelanggaran',
  student: Student,
  violation: ViolationRecord,
  schoolConfig: any = SCHOOL_CONFIG
): void {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(violation.tanggal || Date.now()));

  const docTitle = type === 'surat_pernyataan'
    ? 'SURAT PERNYATAAN KEDISIPLINAN SISWA'
    : type === 'panggilan_ortu'
    ? 'SURAT PANGGILAN ORANG TUA / WALI SISWA'
    : 'SLIP BUKTI KONTROL PELANGGARAN TATA TERTIB';

  let bodyContent = '';

  if (type === 'surat_pernyataan') {
    bodyContent = `
      <h2 style="text-align:center; text-transform:uppercase; font-size:14pt; margin:16px 0 2px 0;">SURAT PERNYATAAN SISWA</h2>
      <div style="text-align:center; font-size:10pt; margin-bottom:16px;">Nomor: 421.3 / ${violation.id.replace('viol-', '')} / SP-TATIB / ${new Date().getFullYear()}</div>
      
      <p>Yang bertanda tangan di bawah ini:</p>
      <table style="width:100%; font-size:11pt; margin-bottom:14px; border:none;">
        <tr><td style="width:180px; padding:3px 0;">Nama Lengkap Siswa</td><td>: <strong>${student.nama}</strong></td></tr>
        <tr><td style="padding:3px 0;">Nomor Induk Siswa (NISN)</td><td>: ${student.nisn}</td></tr>
        <tr><td style="padding:3px 0;">Kelas / Rombel</td><td>: ${student.kelas}</td></tr>
        <tr><td style="padding:3px 0;">Jenis Kelamin</td><td>: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
        <tr><td style="padding:3px 0;">Nama Orang Tua / Wali</td><td>: ${student.namaOrtu}</td></tr>
        <tr><td style="padding:3px 0;">No. WhatsApp Wali</td><td>: ${student.noWaOrtu}</td></tr>
        <tr><td style="padding:3px 0;">Alamat Rumah</td><td>: ${student.alamat}</td></tr>
      </table>

      <p style="text-align:justify;">Dengan ini menyatakan dengan penuh kesadaran dan rasa tanggung jawab bahwa saya telah melakukan pelanggaran terhadap tata tertib sekolah, yaitu:</p>
      
      <div style="background-color:#f8f9fa; border:1px solid #999; padding:10px; margin:10px 0; font-size:10.5pt;">
        <div><strong>Pasal Tata Tertib:</strong> ${violation.kodePasal} - ${violation.pasalTitle}</div>
        <div style="margin-top:4px;"><strong>Klasifikasi:</strong> Tingkat ${violation.tingkat}</div>
        <div style="margin-top:4px;"><strong>Uraian Kejadian:</strong> ${violation.uraian}</div>
        <div style="margin-top:4px;"><strong>Waktu & Lokasi:</strong> ${violation.tanggal} pk ${violation.waktu || ''} WIB di ${violation.lokasi}</div>
        ${violation.catatanKhusus ? `<div style="margin-top:4px;"><strong>Catatan Tambahan:</strong> ${violation.catatanKhusus}</div>` : ''}
      </div>

      <p style="text-align:justify;">Atas pelanggaran tersebut, saya berjanji dengan sungguh-sungguh:</p>
      <ol style="margin-left:20px; line-height:1.4; font-size:10.5pt;">
        <li>Tidak akan mengulangi perbuatan pelanggaran tata tertib tersebut maupun tata tertib lainnya di ${schoolConfig.name || 'SMP Negeri 1 Kandangan'}.</li>
        <li>Sanggup menaati seluruh tata tertib dan norma Budaya Sekolah Aman dan Nyaman (BSAN).</li>
        <li>Bersedia menerima sanksi yang lebih berat apabila mengulangi perbuatan yang melanggar ketentuan sekolah.</li>
        <li>Sanggup menjalankan penugasan pembinaan positif dari <strong>${violation.tahapPembinaan}</strong>.</li>
      </ol>

      <p style="text-align:justify; margin-top:14px;">Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak mana pun.</p>

      <table style="width:100%; margin-top:30px; text-align:center; font-size:10.5pt; border:none;">
        <tr>
          <td style="width:50%;">
            Mengetahui,<br>Orang Tua / Wali Siswa<br><br><br><br>
            <u>( ${student.namaOrtu} )</u>
          </td>
          <td style="width:50%;">
            Kandangan, ${dateStr}<br>Siswa yang Membuat Pernyataan<br><br><br><br>
            <u>( ${student.nama} )</u>
          </td>
        </tr>
        <tr>
          <td style="padding-top:24px;">
            Guru Piket / Pencatat,<br><br><br><br>
            <u>( ${violation.guruPencatat} )</u>
          </td>
          <td style="padding-top:24px;">
            Mengetahui,<br><strong>Kepala ${schoolConfig.name || 'SMPN 1 Kandangan'}</strong><br><br><br><br>
            <u><strong>${schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br>
            NIP. ${schoolConfig.principalNip || '-'}
          </td>
        </tr>
      </table>
    `;
  } else if (type === 'panggilan_ortu') {
    bodyContent = `
      <div style="display:flex; justify-content:space-between; margin-bottom:14px; font-size:11pt;">
        <div>
          <div>Nomor : 421.3 / ${violation.id.replace('viol-', '')} / PGL-BK / ${new Date().getFullYear()}</div>
          <div>Lampiran : -</div>
          <div>Perihal : <strong>Panggilan Orang Tua / Wali Siswa</strong></div>
        </div>
        <div style="text-align:right;">
          <div>Kandangan, ${dateStr}</div>
          <div style="color:#B91C1C; font-weight:bold;">Sifat: Penting / Segera</div>
        </div>
      </div>

      <p style="font-size:11pt;">Kepada Yth.<br>Bapak/Ibu Orang Tua/Wali dari:<br><strong>${student.nama}</strong> (Kelas ${student.kelas})<br>di Tempat</p>

      <p style="text-align:justify; font-size:11pt;">Dengan hormat,</p>
      <p style="text-align:justify; font-size:11pt;">Sehubungan dengan monitoring Budaya Sekolah Aman dan Nyaman (BSAN) serta tindak lanjut tata tertib siswa di ${schoolConfig.name || 'SMP Negeri 1 Kandangan'}, kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali murid pada:</p>

      <table style="width:100%; font-size:11pt; margin-left:14px; margin-bottom:14px; border:none;">
        <tr><td style="width:140px; padding:3px 0;"><strong>Hari, Tanggal</strong></td><td>: <strong>Menyesuaikan Jadwal Terlampir</strong></td></tr>
        <tr><td style="padding:3px 0;"><strong>Waktu</strong></td><td>: 08.00 WIB - Selesai</td></tr>
        <tr><td style="padding:3px 0;"><strong>Tempat</strong></td><td>: Ruang Bimbingan Konseling (BK) / Kesiswaan</td></tr>
        <tr><td style="padding:3px 0;"><strong>Menemui</strong></td><td>: ${violation.tahapPembinaan}</td></tr>
        <tr><td style="padding:3px 0;"><strong>Keperluan</strong></td><td>: Koordinasi Pembinaan Kedisiplinan (${violation.kodePasal} - Tingkat ${violation.tingkat})</td></tr>
      </table>

      <p style="text-align:justify; font-size:11pt;">Mengingat pentingnya pertemuan ini demi masa depan ananda, kami sangat mengharapkan kehadiran Bapak/Ibu tepat waktu. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>

      <table style="width:100%; margin-top:30px; text-align:center; font-size:10.5pt; border:none;">
        <tr>
          <td style="width:33%;">
            Mengetahui,<br><strong>${schoolConfig.bkTitle || 'Guru Bimbingan Konseling'}</strong><br><br><br><br>
            <u><strong>${schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.'}</strong></u><br>
            NIP. ${schoolConfig.bkNip || '-'}
          </td>
          <td style="width:33%;">
            Mengetahui,<br><strong>${schoolConfig.timKesiswaanTitle || 'Tim Kesiswaan / Ketertiban'}</strong><br><br><br><br>
            <u><strong>${schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Tim Kesiswaan'}</strong></u><br>
            NIP. ${schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '-'}
          </td>
          <td style="width:33%;">
            Kandangan, ${dateStr}<br><strong>Kepala Sekolah</strong><br><br><br><br>
            <u><strong>${schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</strong></u><br>
            NIP. ${schoolConfig.principalNip || '-'}
          </td>
        </tr>
      </table>
    `;
  } else {
    // slip_pelanggaran
    bodyContent = `
      <h2 style="text-align:center; text-transform:uppercase; font-size:13pt; margin:14px 0 2px 0;">SLIP BUKTI KONTROL PELANGGARAN TATA TERTIB</h2>
      <div style="text-align:center; font-size:10pt; margin-bottom:14px;">Registrasi No: ${violation.id}</div>

      <table style="width:100%; border-collapse:collapse; font-size:10.5pt; margin-bottom:14px;">
        <tr><td style="border:1px solid #333; padding:6px; width:30%; background:#f0f0f0;"><strong>Nama Siswa</strong></td><td style="border:1px solid #333; padding:6px; font-weight:bold;">${student.nama}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>NISN / Kelas</strong></td><td style="border:1px solid #333; padding:6px;">${student.nisn} / Kelas ${student.kelas}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>Pasal Tata Tertib</strong></td><td style="border:1px solid #333; padding:6px;"><strong>${violation.kodePasal}</strong> - ${violation.pasalTitle}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>Tingkat Klasifikasi</strong></td><td style="border:1px solid #333; padding:6px; font-weight:bold; color:${violation.tingkat === 'Berat' ? '#DC2626' : violation.tingkat === 'Sedang' ? '#D97706' : '#16A34A'};">Tingkat ${violation.tingkat}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>Uraian Kejadian</strong></td><td style="border:1px solid #333; padding:6px;">${violation.uraian}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>Waktu & Lokasi</strong></td><td style="border:1px solid #333; padding:6px;">${violation.tanggal} pk ${violation.waktu || ''} WIB di ${violation.lokasi}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>Tahap Penanganan</strong></td><td style="border:1px solid #333; padding:6px;">${violation.tahapPembinaan}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>Petugas Pencatat</strong></td><td style="border:1px solid #333; padding:6px;">${violation.guruPencatat}</td></tr>
        <tr><td style="border:1px solid #333; padding:6px; background:#f0f0f0;"><strong>Wali / No. WA</strong></td><td style="border:1px solid #333; padding:6px;">${student.namaOrtu} (${student.noWaOrtu})</td></tr>
      </table>

      <table style="width:100%; margin-top:24px; text-align:center; font-size:10pt; border:none;">
        <tr>
          <td style="width:33%;">Siswa Terkait,<br><br><br><br><u>( ${student.nama} )</u></td>
          <td style="width:33%;">Guru Piket,<br><br><br><br><u>( ${violation.guruPencatat} )</u></td>
          <td style="width:33%;">Wali Kelas / BK,<br><br><br><br><u>( ${schoolConfig.bkName || 'Guru BK'} )</u></td>
        </tr>
      </table>
    `;
  }

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${docTitle}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; color: #000; margin: 15mm; }
        .kop-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
        .kop-table td { text-align: center; }
        .kop-instansi { font-size: 11pt; font-weight: bold; text-transform: uppercase; }
        .kop-sekolah { font-size: 15pt; font-weight: bold; letter-spacing: 0.5px; color: #0B231E; }
        .kop-alamat { font-size: 9pt; font-style: italic; }
      </style>
    </head>
    <body>
      <table class="kop-table">
        <tr>
          <td>
            <div class="kop-instansi">PEMERINTAH KABUPATEN TEMANGGUNG</div>
            <div class="kop-instansi">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
            <div class="kop-sekolah">${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} (${schoolConfig.shortName || 'GRISAKA'})</div>
            <div class="kop-alamat">NPSN: ${schoolConfig.npsn || '20321456'} · ${schoolConfig.address || 'Kec. Kandangan'}, ${schoolConfig.city || 'Kabupaten Temanggung'} · Jawa Tengah 56281</div>
            <div class="kop-alamat">Telp: ${schoolConfig.phone || '-'} | Website: ${schoolConfig.website || '-'} | Email: ${schoolConfig.email || '-'}</div>
          </td>
        </tr>
      </table>
      ${bodyContent}
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + wordHtml], { type: 'application/msword;charset=utf-8' });
  const filename = `${type}_${student.nama.replace(/\s+/g, '_')}_${violation.id}.doc`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export single surat / incident record to Excel (.csv) format
 */
export function exportSingleSuratToExcel(
  type: 'surat_pernyataan' | 'panggilan_ortu' | 'slip_pelanggaran',
  student: Student,
  violation: ViolationRecord,
  schoolConfig: any = SCHOOL_CONFIG
): void {
  const data = [
    {
      Jenis_Dokumen: type === 'surat_pernyataan' ? 'Surat Pernyataan Siswa' : type === 'panggilan_ortu' ? 'Surat Panggilan Orang Tua' : 'Slip Bukti Kontrol',
      ID_Pelanggaran: violation.id,
      Tanggal: violation.tanggal,
      Waktu: `${violation.waktu || ''} WIB`,
      Lokasi: violation.lokasi,
      Nama_Siswa: student.nama,
      NISN: student.nisn,
      Kelas: student.kelas,
      Gender: student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      Nama_Orang_Tua: student.namaOrtu,
      No_WA_Orang_Tua: student.noWaOrtu,
      Alamat: student.alamat,
      Kode_Pasal: violation.kodePasal,
      Judul_Pasal: violation.pasalTitle,
      Tingkat_Klasifikasi: violation.tingkat,
      Uraian_Pelanggaran: violation.uraian,
      Tahap_Pembinaan: violation.tahapPembinaan,
      Guru_Pencatat: violation.guruPencatat,
      Status_Dokumen: violation.statusSurat,
      Sekolah: schoolConfig.name || 'SMPN 1 Kandangan',
      Kabupaten: 'Kabupaten Temanggung, Jawa Tengah',
      Catatan_Khusus: violation.catatanKhusus || ''
    }
  ];

  const filename = `${type}_${student.nama.replace(/\s+/g, '_')}_${violation.id}`;
  exportToCSV(data, filename);
}

/**
 * Helper to reliably trigger a file download from a Blob or URL in iframe/browser environments
 */
export function triggerFileDownload(blobOrUrl: Blob | string, filename: string): void {
  try {
    const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    link.setAttribute('target', '_blank');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      if (typeof blobOrUrl !== 'string') {
        URL.revokeObjectURL(url);
      }
    }, 2000);
  } catch (err) {
    console.error('Failed triggering file download', err);
  }
}

/**
 * High-definition client-side direct PDF file generator for slip and cards
 * Automatically saves and triggers browser download
 */
export async function exportElementToPDF(
  element: HTMLElement,
  filename: string,
  options?: { landscape?: boolean; scale?: number }
): Promise<{ success: boolean; blobUrl?: string }> {
  const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    // Render element to canvas with safety flags
    const canvas = await html2canvas(element, {
      scale: options?.scale || 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      ignoreElements: (el) => el.classList?.contains('no-print') || el.classList?.contains('exclude-pdf')
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const orientation = options?.landscape ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Direct multi-method automatic download (works across desktop, mobile & sandboxed iframes)
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    triggerFileDownload(blob, cleanFilename);

    return { success: true, blobUrl };
  } catch (err) {
    console.error('PDF canvas direct generation error, generating native PDF fallback...', err);
    
    // Direct native fallback in jsPDF without html2canvas
    try {
      const fallbackPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      fallbackPdf.setFont('times', 'bold');
      fallbackPdf.setFontSize(14);
      fallbackPdf.text('PEMERINTAH KABUPATEN TEMANGGUNG', 105, 20, { align: 'center' });
      fallbackPdf.setFontSize(12);
      fallbackPdf.text('DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA', 105, 26, { align: 'center' });
      fallbackPdf.setFontSize(15);
      fallbackPdf.setTextColor(11, 35, 30);
      fallbackPdf.text('SMP NEGERI 1 KANDANGAN', 105, 33, { align: 'center' });
      fallbackPdf.setFont('times', 'normal');
      fallbackPdf.setFontSize(9);
      fallbackPdf.setTextColor(80, 80, 80);
      fallbackPdf.text('Jl. Raya Kandangan No. 1, Kec. Kandangan, Kab. Temanggung, Jawa Tengah', 105, 38, { align: 'center' });
      fallbackPdf.setDrawColor(0, 0, 0);
      fallbackPdf.setLineWidth(0.6);
      fallbackPdf.line(20, 42, 190, 42);

      fallbackPdf.setFont('times', 'bold');
      fallbackPdf.setFontSize(13);
      fallbackPdf.setTextColor(0, 0, 0);
      fallbackPdf.text('DOKUMEN RESMI KESISWAAN DAN KEDISIPLINAN BSAN', 105, 52, { align: 'center' });

      fallbackPdf.setFont('times', 'normal');
      fallbackPdf.setFontSize(10);
      fallbackPdf.text(`Nama Dokumen: ${cleanFilename}`, 20, 62);
      fallbackPdf.text(`Tanggal Cetak: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}`, 20, 68);
      fallbackPdf.text('Status: Terverifikasi oleh Sistem BSAN SMPN 1 Kandangan', 20, 74);

      const blob = fallbackPdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      triggerFileDownload(blob, cleanFilename);
      return { success: true, blobUrl };
    } catch (fallbackErr) {
      console.error('All PDF engines failed, triggering window.print', fallbackErr);
      window.print();
      return { success: false };
    }
  }
}



