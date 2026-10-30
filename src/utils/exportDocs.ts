import { Student, ViolationRecord, SchoolProfile } from '../types';
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
 * Export complete individual student violation slip and dossier to official Word (.doc) format
 * Includes official government school KOP (Pemerintah Kabupaten Temanggung), complete student bio,
 * disciplinary summary, full violation table with dates/pasal/uraian/pencatat, and formal signature blocks.
 */
export function exportStudentSlipToWord(
  student: Student,
  violations: ViolationRecord[],
  schoolConfig: SchoolProfile = SCHOOL_CONFIG
): void {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const studentViolations = (violations || [])
    .filter(v => v && v.studentId === student.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const hasBerat = (student.totalPelanggaranBerat || 0) > 0;
  const hasSedang = (student.totalPelanggaranSedang || 0) > 0;
  const hasRingan = (student.totalPelanggaranRingan || 0) > 0;

  let statusDisiplin = 'Sangat Disiplin (Nihil Catatan)';
  let keteranganDisiplin = 'Peserta didik tertib dan mematuhi seluruh norma Budaya Sekolah Aman dan Nyaman (BSAN).';
  if (hasBerat) {
    statusDisiplin = 'Peringatan Khusus / Sidang Kesiswaan (Tingkat Berat)';
    keteranganDisiplin = 'Memerlukan penanganan terpadu Kepala Sekolah, Tim Kesiswaan, dan pemanggilan orang tua.';
  } else if (hasSedang) {
    statusDisiplin = 'Perhatian Khusus / Konseling BK (Tingkat Sedang)';
    keteranganDisiplin = 'Memerlukan pembinaan intensif Guru BK dan penandatanganan kontrak perilaku.';
  } else if (hasRingan) {
    statusDisiplin = 'Tingkat Pembinaan Ringan';
    keteranganDisiplin = 'Dalam pendampingan Wali Kelas dan Guru Piket dengan penugasan edukatif.';
  }

  const rows = studentViolations.map((v, i) => `
    <tr>
      <td style="border:1px solid #333; padding:6px; text-align:center;">${i + 1}</td>
      <td style="border:1px solid #333; padding:6px;">
        <strong>${v.tanggal}</strong><br>
        <span style="font-size:8.5pt; color:#444;">${v.waktu || ''} WIB</span><br>
        <span style="font-size:8.5pt; color:#555; font-style:italic;">Lokasi: ${v.lokasi || 'Lingkungan Sekolah'}</span>
      </td>
      <td style="border:1px solid #333; padding:6px;">
        <strong>${v.kodePasal}</strong> - ${v.pasalTitle}
      </td>
      <td style="border:1px solid #333; padding:6px;">
        ${v.uraian}
        ${v.catatanKhusus ? `<div style="font-size:8.5pt; margin-top:4px; color:#92400E; background:#FEF3C7; padding:3px 6px; border-radius:4px;"><strong>Catatan Penanganan:</strong> ${v.catatanKhusus}</div>` : ''}
      </td>
      <td style="border:1px solid #333; padding:6px; text-align:center; font-weight:bold; color:${v.tingkat === 'Berat' ? '#DC2626' : v.tingkat === 'Sedang' ? '#D97706' : '#16A34A'};">
        ${v.tingkat}
      </td>
      <td style="border:1px solid #333; padding:6px;">
        <strong>${v.tahapPembinaan}</strong>
      </td>
      <td style="border:1px solid #333; padding:6px; text-align:center;">
        ${v.guruPencatat}
      </td>
    </tr>
  `).join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Slip_Kedisiplinan_${student.nama}_${student.kelas}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; color: #000; margin: 15mm; }
        .kop-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; text-align: center; }
        .kop-instansi { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 0; }
        .kop-sekolah { font-size: 15pt; font-weight: bold; letter-spacing: 0.5px; color: #0B231E; margin: 2px 0; }
        .kop-sub { font-size: 9pt; margin: 1px 0; color: #222; }
        h1 { font-size: 13pt; text-align: center; text-transform: uppercase; margin: 14px 0 2px 0; font-weight: bold; }
        .doc-no { text-align: center; font-size: 9.5pt; margin-bottom: 16px; color: #333; }
        .section-title { font-size: 10.5pt; font-weight: bold; text-transform: uppercase; background-color: #F1F5F9; padding: 4px 8px; border: 1px solid #CBD5E1; margin-top: 14px; margin-bottom: 6px; }
        table.bio-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10pt; }
        table.bio-table td { padding: 4px 6px; vertical-align: top; border: 1px solid #E2E8F0; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 16px; font-size: 9.5pt; }
        table.data-table th { border: 1px solid #333; padding: 6px; background-color: #E2E8F0; text-align: center; font-weight: bold; }
        .summary-box { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10pt; }
        .summary-box td { border: 1px solid #333; padding: 6px; text-align: center; }
        .ttd-table { width: 100%; margin-top: 28px; border: none; font-size: 10pt; }
        .ttd-table td { border: none; text-align: center; vertical-align: top; width: 25%; }
        .ttd-space { height: 60px; }
      </style>
    </head>
    <body>
      <!-- Official School Letterhead (KOP) -->
      <table class="kop-table">
        <tr>
          <td>
            <div class="kop-instansi">PEMERINTAH KABUPATEN TEMANGGUNG</div>
            <div class="kop-instansi">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
            <div class="kop-sekolah">${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} (${schoolConfig.shortName || 'GRISAKA'})</div>
            <div class="kop-sub">NPSN: ${schoolConfig.npsn || '20321456'} · Status Akreditasi: ${schoolConfig.accreditation || 'A'}</div>
            <div class="kop-sub">${schoolConfig.address || 'Jl. Raya Kandangan'}, ${schoolConfig.city || 'Kabupaten Temanggung'}, ${schoolConfig.province || 'Jawa Tengah'} ${schoolConfig.postalCode || '56281'}</div>
            <div class="kop-sub">Telp: ${schoolConfig.phone || '-'} · Email: ${schoolConfig.email || '-'} · Website: ${schoolConfig.website || '-'}</div>
          </td>
        </tr>
      </table>

      <h1>RAPOR REKAPITULASI & SLIP KONTROL KEDISIPLINAN SISWA</h1>
      <div class="doc-no">Nomor: 421.3 / ${student.nisn || '000'} / BSAN-GRISAKA / ${new Date().getFullYear()} · Dicetak: ${dateStr}</div>

      <!-- I. Identitas Siswa -->
      <div class="section-title">I. IDENTITAS PESERTA DIDIK</div>
      <table class="bio-table">
        <tr>
          <td style="width: 20%; font-weight: bold; background: #F8FAFC;">Nama Lengkap</td>
          <td style="width: 30%;"><strong>${student.nama}</strong></td>
          <td style="width: 20%; font-weight: bold; background: #F8FAFC;">Kelas / Jenjang</td>
          <td style="width: 30%;">Kelas ${student.kelas} / Jenjang ${student.jenjang} SMP</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #F8FAFC;">NISN</td>
          <td style="font-family: Courier New, monospace;">${student.nisn}</td>
          <td style="font-weight: bold; background: #F8FAFC;">Jenis Kelamin</td>
          <td>${student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #F8FAFC;">Nama Orang Tua / Wali</td>
          <td>${student.namaOrtu}</td>
          <td style="font-weight: bold; background: #F8FAFC;">No. WhatsApp Wali</td>
          <td style="font-family: Courier New, monospace;">${student.noWaOrtu}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #F8FAFC;">Presensi Hari Ini</td>
          <td><strong>${student.statusKehadiran}</strong></td>
          <td style="font-weight: bold; background: #F8FAFC;">Alamat Rumah</td>
          <td>${student.alamat}</td>
        </tr>
      </table>

      <!-- II. Rekapitulasi Status Kedisiplinan -->
      <div class="section-title">II. REKAPITULASI STATUS KEDISIPLINAN (BSAN)</div>
      <table class="summary-box">
        <tr style="background: #F1F5F9; font-weight: bold;">
          <td style="width: 25%;">Presensi Harian</td>
          <td style="width: 25%;">Kasus Ringan</td>
          <td style="width: 25%;">Kasus Sedang</td>
          <td style="width: 25%;">Kasus Berat</td>
        </tr>
        <tr>
          <td><strong>${student.statusKehadiran}</strong></td>
          <td><strong style="color: #2563EB;">${student.totalPelanggaranRingan || 0} Kasus</strong></td>
          <td><strong style="color: #D97706;">${student.totalPelanggaranSedang || 0} Kasus</strong></td>
          <td><strong style="color: #DC2626;">${student.totalPelanggaranBerat || 0} Kasus</strong></td>
        </tr>
        <tr>
          <td colspan="4" style="text-align: left; padding: 8px; font-size: 9.5pt; background: #FAFAFA;">
            <strong>Status Evaluasi:</strong> <span style="font-weight: bold;">${statusDisiplin}</span><br>
            <span style="font-style: italic; color: #4B5563;">${keteranganDisiplin}</span>
          </td>
        </tr>
      </table>

      <!-- III. Riwayat Pelanggaran -->
      <div class="section-title">III. DAFTAR LENGKAP RIWAYAT PELANGGARAN TATA TERTIB</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 4%;">No</th>
            <th style="width: 14%;">Waktu & Tempat</th>
            <th style="width: 20%;">Pasal Tata Tertib</th>
            <th style="width: 28%;">Uraian Pelanggaran & Catatan</th>
            <th style="width: 10%;">Klasifikasi</th>
            <th style="width: 14%;">Tahap Pembinaan</th>
            <th style="width: 10%;">Pencatat</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="7" style="text-align:center; padding:12px; font-style:italic; color:#4B5563;">Nihil catatan pelanggaran tata tertib sekolah. Peserta didik menunjukkan kepatuhan dan integritas yang tinggi dalam menerapkan norma Budaya Sekolah Aman dan Nyaman (BSAN).</td></tr>'}
        </tbody>
      </table>

      <!-- IV. Tanda Tangan Resmi -->
      <table class="ttd-table">
        <tr>
          <td>
            Mengetahui,<br>
            <strong>Orang Tua / Wali Siswa</strong>
            <div class="ttd-space"></div>
            <u><strong>( ${student.namaOrtu} )</strong></u>
          </td>
          <td>
            Mengetahui,<br>
            <strong>Wali Kelas ${student.kelas}</strong>
            <div class="ttd-space"></div>
            <u><strong>( Wali Kelas ${student.kelas} )</strong></u><br>
            <span style="font-size: 8.5pt;">NIP. ........................................</span>
          </td>
          <td>
            Mengetahui,<br>
            <strong>${schoolConfig.bkTitle || 'Guru Bimbingan Konseling'}</strong>
            <div class="ttd-space"></div>
            <u><strong>( ${schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.'} )</strong></u><br>
            <span style="font-size: 8.5pt;">NIP. ${schoolConfig.bkNip || '19780824 200501 2 008'}</span>
          </td>
          <td>
            Kandangan, ${dateStr}<br>
            <strong>Kepala Sekolah</strong>
            <div class="ttd-space"></div>
            <u><strong>( ${schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'} )</strong></u><br>
            <span style="font-size: 8.5pt;">NIP. ${schoolConfig.principalNip || '19740512 199802 2 003'}</span>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
  const filename = `Slip_Kedisiplinan_${student.nama.replace(/\s+/g, '_')}_${student.kelas}.doc`;
  triggerFileDownload(blob, filename);
}

/**
 * Export student violation history and metadata to Excel (.csv) with school header and bio blocks
 */
export function exportStudentSlipToExcel(
  student: Student,
  violations: ViolationRecord[],
  schoolConfig: SchoolProfile = SCHOOL_CONFIG
): void {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const studentViolations = (violations || [])
    .filter(v => v && v.studentId === student.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const csvRows: (string | number)[][] = [
    ['PEMERINTAH KABUPATEN TEMANGGUNG'],
    ['DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'],
    [`${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} (${schoolConfig.shortName || 'GRISAKA'}) - NPSN: ${schoolConfig.npsn || '20321456'}`],
    ['RAPOR REKAPITULASI & SLIP KONTROL KEDISIPLINAN SISWA (BSAN)'],
    [`Tanggal Cetak Dokumen: ${dateStr}`],
    [''],
    ['I. DATA IDENTITAS PESERTA DIDIK'],
    ['Nama Siswa', student.nama, 'Kelas', student.kelas, 'Jenjang', `${student.jenjang} SMP`],
    ['NISN', `="${student.nisn}"`, 'Jenis Kelamin', student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)', 'Presensi Hari Ini', student.statusKehadiran],
    ['Nama Orang Tua/Wali', student.namaOrtu, 'No. WA Ortu', `="${student.noWaOrtu}"`, 'Alamat', student.alamat],
    [''],
    ['II. REKAPITULASI KEDISIPLINAN'],
    ['Pelanggaran Ringan', `${student.totalPelanggaranRingan || 0} Kasus`, 'Pelanggaran Sedang', `${student.totalPelanggaranSedang || 0} Kasus`, 'Pelanggaran Berat', `${student.totalPelanggaranBerat || 0} Kasus`],
    [''],
    ['III. DAFTAR LENGKAP RIWAYAT PELANGGARAN'],
    ['No', 'Tanggal', 'Waktu', 'Lokasi', 'Kode Pasal', 'Pasal Tata Tertib', 'Uraian Pelanggaran', 'Catatan Penanganan', 'Klasifikasi', 'Tahap Pembinaan (SOP)', 'Guru Pencatat', 'Status Dokumen']
  ];

  if (studentViolations.length === 0) {
    csvRows.push([
      1,
      '-',
      '-',
      '-',
      '-',
      'Nihil Pelanggaran',
      'Peserta didik tercatat sangat disiplin dan mematuhi seluruh tata tertib BSAN.',
      '-',
      'Nihil',
      'Pembinaan Rutin Karakter',
      '-',
      'Tertib'
    ]);
  } else {
    studentViolations.forEach((v, i) => {
      csvRows.push([
        i + 1,
        v.tanggal,
        v.waktu ? `${v.waktu} WIB` : '-',
        v.lokasi || '-',
        v.kodePasal,
        v.pasalTitle,
        v.uraian,
        v.catatanKhusus || '-',
        v.tingkat,
        v.tahapPembinaan,
        v.guruPencatat,
        v.statusSurat || 'Tercatat'
      ]);
    });
  }

  csvRows.push(
    [''],
    [`Kandangan, ${dateStr}`],
    [`Kepala Sekolah: ${schoolConfig.principalName || 'Kepala Sekolah'} (NIP: ${schoolConfig.principalNip || '-'})`],
    [`Guru BK: ${schoolConfig.bkName || 'Guru BK'} (NIP: ${schoolConfig.bkNip || '-'})`],
    [`Tim Kesiswaan: ${schoolConfig.timKesiswaanName || 'Tim Kesiswaan'} (NIP: ${schoolConfig.timKesiswaanNip || '-'})`]
  );

  const csvContent = '\uFEFF' + csvRows.map(row =>
    row.map(cell => {
      let val = cell ?? '';
      if (typeof val === 'string') {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  ).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `Slip_Kedisiplinan_${student.nama.replace(/\s+/g, '_')}_${student.kelas}.csv`;
  triggerFileDownload(blob, filename);
}

/**
 * Export student slip directly to official PDF with Temanggung school KOP, bio, full violation table, and signatures
 */
export async function exportStudentSlipToPDF(
  student: Student,
  violations: ViolationRecord[],
  schoolConfig: SchoolProfile = SCHOOL_CONFIG,
  existingElement?: HTMLElement | null
): Promise<{ success: boolean; blobUrl?: string }> {
  const filename = `Rapor_Disiplin_${student.nama.replace(/\s+/g, '_')}_${student.kelas}`;

  if (existingElement) {
    return exportElementToPDF(existingElement, filename);
  }

  // If no existing element provided, find it in DOM or build a pristine offscreen element
  const domEl = document.getElementById('student-slip-printable-area');
  if (domEl) {
    return exportElementToPDF(domEl, filename);
  }

  // Create clean offscreen element with complete school KOP and tables
  const container = document.createElement('div');
  container.id = 'temp-pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.padding = '32px';
  container.style.fontFamily = "'Times New Roman', Times, serif";

  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const studentViolations = (violations || [])
    .filter(v => v && v.studentId === student.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const hasBerat = (student.totalPelanggaranBerat || 0) > 0;

  const rowsHtml = studentViolations.length === 0
    ? `<tr><td colspan="5" style="border:1px solid #000; padding:10px; text-align:center; font-style:italic;">Nihil catatan pelanggaran tata tertib sekolah. Peserta didik menunjukkan kepatuhan dan integritas yang tinggi dalam menerapkan norma Budaya Sekolah Aman dan Nyaman (BSAN).</td></tr>`
    : studentViolations.map((v, i) => `
      <tr>
        <td style="border:1px solid #000; padding:6px; text-align:center; font-family:Courier New, monospace;">${i + 1}</td>
        <td style="border:1px solid #000; padding:6px; font-size:9pt;">
          <strong>${v.tanggal}</strong><br>
          ${v.waktu ? `${v.waktu} WIB<br>` : ''}
          <span style="font-style:italic; font-size:8.5pt;">${v.lokasi || 'Sekolah'}</span>
        </td>
        <td style="border:1px solid #000; padding:6px; font-size:9pt;">
          <strong>${v.kodePasal} - ${v.pasalTitle}</strong><br>
          ${v.uraian}
          ${v.catatanKhusus ? `<br><small style="color:#b45309; font-style:italic;">Catatan: ${v.catatanKhusus}</small>` : ''}
        </td>
        <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:bold; font-size:9pt;">
          ${v.tingkat}
        </td>
        <td style="border:1px solid #000; padding:6px; font-size:8.5pt;">
          <strong>${v.tahapPembinaan}</strong><br>
          <span style="color:#555;">Pencatat: ${v.guruPencatat}</span>
        </td>
      </tr>
    `).join('');

  container.innerHTML = `
    <div style="border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 14px; text-align: center;">
      <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH KABUPATEN TEMANGGUNG</div>
      <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
      <div style="font-size: 15pt; font-weight: bold; color: #0B231E; margin: 2px 0;">${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} (${schoolConfig.shortName || 'GRISAKA'})</div>
      <div style="font-size: 9pt;">NPSN: ${schoolConfig.npsn || '20321456'} · Status Akreditasi: ${schoolConfig.accreditation || 'A'}</div>
      <div style="font-size: 9pt;">${schoolConfig.address || 'Jl. Raya Kandangan'}, ${schoolConfig.city || 'Kabupaten Temanggung'} · Jawa Tengah 56281</div>
      <div style="font-size: 8.5pt;">Telp: ${schoolConfig.phone || '-'} · Email: ${schoolConfig.email || '-'} · Website: ${schoolConfig.website || '-'}</div>
    </div>

    <div style="text-align: center; margin-bottom: 14px;">
      <div style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">
        LEMBAR KONTROL & RAPOR KEDISIPLINAN SISWA (BSAN)
      </div>
      <div style="font-size: 9pt; margin-top: 2px;">
        Dokumen Resmi Bimbingan Konseling & Kesiswaan · Dicetak pada: ${dateStr}
      </div>
    </div>

    <div style="border: 1px solid #000; padding: 8px 12px; margin-bottom: 12px; font-size: 9.5pt; font-family: Arial, sans-serif; background: #fafafa;">
      <div style="font-weight: bold; text-transform: uppercase; font-size: 10pt; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px;">
        I. IDENTITAS PESERTA DIDIK
      </div>
      <table style="width: 100%; font-size: 9.5pt; border-collapse: collapse;">
        <tr>
          <td style="width: 25%; padding: 2px 0;">Nama Lengkap</td>
          <td style="width: 3%;">:</td>
          <td style="width: 32%; font-weight: bold; font-size: 10.5pt;">${student.nama}</td>
          <td style="width: 18%; padding: 2px 0;">Kelas / Rombel</td>
          <td style="width: 3%;">:</td>
          <td style="width: 19%;">Kelas ${student.kelas} (Jenjang ${student.jenjang})</td>
        </tr>
        <tr>
          <td style="padding: 2px 0;">NISN</td>
          <td>:</td>
          <td style="font-family: monospace; font-weight: bold;">${student.nisn}</td>
          <td style="padding: 2px 0;">Jenis Kelamin</td>
          <td>:</td>
          <td>${student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0;">Nama Orang Tua/Wali</td>
          <td>:</td>
          <td style="font-weight: bold;">${student.namaOrtu}</td>
          <td style="padding: 2px 0;">No. WhatsApp Wali</td>
          <td>:</td>
          <td style="font-family: monospace;">${student.noWaOrtu}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0;">Alamat Rumah</td>
          <td>:</td>
          <td colspan="4">${student.alamat}</td>
        </tr>
      </table>
    </div>

    <div style="border: 1px solid #000; margin-bottom: 12px; font-size: 9.5pt; font-family: Arial, sans-serif;">
      <div style="background: #f1f5f9; padding: 4px 8px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000;">
        II. REKAPITULASI STATUS KEDISIPLINAN PESERTA DIDIK
      </div>
      <table style="width: 100%; text-align: center; border-collapse: collapse;">
        <tr>
          <td style="border-right: 1px solid #000; padding: 6px; width: 25%;">
            <div style="font-size: 8pt; text-transform: uppercase; color: #555;">Presensi Harian</div>
            <div style="font-weight: bold; font-size: 11pt; margin-top: 2px;">${student.statusKehadiran}</div>
          </td>
          <td style="border-right: 1px solid #000; padding: 6px; width: 25%;">
            <div style="font-size: 8pt; text-transform: uppercase; color: #555;">Pelanggaran Ringan</div>
            <div style="font-weight: bold; font-size: 11pt; color: #2563eb; margin-top: 2px;">${student.totalPelanggaranRingan || 0} Kasus</div>
          </td>
          <td style="border-right: 1px solid #000; padding: 6px; width: 25%;">
            <div style="font-size: 8pt; text-transform: uppercase; color: #555;">Pelanggaran Sedang</div>
            <div style="font-weight: bold; font-size: 11pt; color: #d97706; margin-top: 2px;">${student.totalPelanggaranSedang || 0} Kasus</div>
          </td>
          <td style="padding: 6px; width: 25%;">
            <div style="font-size: 8pt; text-transform: uppercase; color: #555;">Pelanggaran Berat</div>
            <div style="font-weight: bold; font-size: 11pt; color: ${hasBerat ? '#dc2626' : '#111'}; margin-top: 2px;">${student.totalPelanggaranBerat || 0} Kasus</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 14px; font-family: Arial, sans-serif;">
      <div style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; margin-bottom: 4px;">
        III. DAFTAR RIWAYAT PELANGGARAN TATA TERTIB RESMI
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9pt;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #000; padding: 5px; width: 4%;">No</th>
            <th style="border: 1px solid #000; padding: 5px; width: 18%;">Waktu & Tempat</th>
            <th style="border: 1px solid #000; padding: 5px;">Pasal & Deskripsi Pelanggaran</th>
            <th style="border: 1px solid #000; padding: 5px; width: 12%;">Klasifikasi</th>
            <th style="border: 1px solid #000; padding: 5px; width: 26%;">Bentuk Pembinaan & SOP</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 20px; font-family: Arial, sans-serif; font-size: 9.5pt;">
      <table style="width: 100%; border-collapse: collapse; text-align: center;">
        <tr>
          <td style="width: 25%; vertical-align: top;">
            Mengetahui,<br>
            <strong>Orang Tua / Wali</strong>
            <div style="height: 50px;"></div>
            <u><strong>( ${student.namaOrtu} )</strong></u>
          </td>
          <td style="width: 25%; vertical-align: top;">
            Mengetahui,<br>
            <strong>Guru BK / Konselor</strong>
            <div style="height: 50px;"></div>
            <u><strong>( ${schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.'} )</strong></u><br>
            <span style="font-size: 8pt; font-family: monospace;">NIP. ${schoolConfig.bkNip || '19780824 200501 2 008'}</span>
          </td>
          <td style="width: 25%; vertical-align: top;">
            Mengetahui,<br>
            <strong>Tim Kesiswaan</strong>
            <div style="height: 50px;"></div>
            <u><strong>( ${schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Tim Kesiswaan'} )</strong></u><br>
            <span style="font-size: 8pt; font-family: monospace;">NIP. ${schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '-'}</span>
          </td>
          <td style="width: 25%; vertical-align: top;">
            Kandangan, ${dateStr}<br>
            <strong>Kepala Sekolah</strong>
            <div style="height: 50px;"></div>
            <u><strong>( ${schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'} )</strong></u><br>
            <span style="font-size: 8pt; font-family: monospace;">NIP. ${schoolConfig.principalNip || '19740512 199802 2 003'}</span>
          </td>
        </tr>
      </table>
    </div>
  `;

  document.body.appendChild(container);
  try {
    const res = await exportElementToPDF(container, filename);
    document.body.removeChild(container);
    return res;
  } catch (err) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    throw err;
  }
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

  // Create isolated offscreen container to avoid viewport clipping and scrollbar constraints
  const offscreen = document.createElement('div');
  offscreen.style.position = 'fixed';
  offscreen.style.top = '-99999px';
  offscreen.style.left = '0';
  offscreen.style.width = '794px'; // Standard A4 width at 96 DPI
  offscreen.style.padding = '0';
  offscreen.style.margin = '0';
  offscreen.style.backgroundColor = '#ffffff';
  offscreen.style.color = '#000000';
  offscreen.style.zIndex = '-99999';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minHeight = 'auto';
  clone.style.height = 'auto';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.margin = '0';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';

  // Sanitize any modern CSS color functions (like oklch) that crash html2canvas
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((node) => {
    const el = node as HTMLElement;
    if (el.style) {
      // Force safe fallback colors if modern color strings exist
      const computed = window.getComputedStyle(el);
      if (computed.color && computed.color.includes('oklch')) {
        el.style.color = '#111827';
      }
      if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
        el.style.backgroundColor = '#ffffff';
      }
      if (computed.borderColor && computed.borderColor.includes('oklch')) {
        el.style.borderColor = '#000000';
      }
    }
  });

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  try {
    const totalHeight = Math.max(clone.scrollHeight, clone.offsetHeight, 1000);

    const canvas = await html2canvas(clone, {
      scale: options?.scale || 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: 794,
      height: totalHeight,
      windowWidth: 794,
      windowHeight: totalHeight,
      ignoreElements: (el) => el.classList?.contains('no-print') || el.classList?.contains('exclude-pdf')
    });

    document.body.removeChild(offscreen);

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

    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    triggerFileDownload(blob, cleanFilename);

    return { success: true, blobUrl };
  } catch (err) {
    if (document.body.contains(offscreen)) {
      document.body.removeChild(offscreen);
    }
    console.error('PDF canvas direct generation error, triggering window.print fallback...', err);
    window.print();
    return { success: false };
  }
}

export interface AttendanceExportRow {
  no: number;
  nisn: string;
  nama: string;
  kelas: string;
  gender: string;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  percent: string;
  keterangan?: string;
}

export interface AttendanceExportSummary {
  totalStudents: number;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  percentHadir: string;
}

/**
 * Export Attendance Report to clean CSV (opens in Excel & Google Sheets)
 */
export function exportAttendanceToCSV(
  periodLabel: string,
  kelasLabel: string,
  summary: AttendanceExportSummary,
  rows: AttendanceExportRow[],
  schoolConfig = SCHOOL_CONFIG
): void {
  const headers = ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alfa (A)', '% Kehadiran', 'Keterangan'];
  
  const csvRows = [
    `"PEMERINTAH KABUPATEN TEMANGGUNG"`,
    `"DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA"`,
    `"${schoolConfig.name} (${schoolConfig.shortName}) - NPSN: ${schoolConfig.npsn}"`,
    `"LAPORAN REKAPITULASI PRESENSI KEHADIRAN SISWA"`,
    `"Periode: ${periodLabel} | Rombel: ${kelasLabel}"`,
    `"Ringkasan: Total Siswa=${summary.totalStudents}, Hadir=${summary.hadir}, Sakit=${summary.sakit}, Izin=${summary.izin}, Alfa=${summary.alfa}, Rata-rata Kehadiran=${summary.percentHadir}"`,
    '',
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => [
      r.no,
      `="${r.nisn}"`,
      `"${r.nama.replace(/"/g, '""')}"`,
      `"${r.gender}"`,
      `"${r.kelas}"`,
      r.hadir,
      r.sakit,
      r.izin,
      r.alfa,
      `"${r.percent}"`,
      `"${(r.keterangan || '-').replace(/"/g, '""')}"`
    ].join(',')),
    '',
    `"Mengetahui Kepala Sekolah: ${schoolConfig.principalName} (NIP: ${schoolConfig.principalNip})"`,
    `"Dicetak pada: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(new Date())}"`
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, `Rekap_Presensi_${kelasLabel.replace(/\s+/g, '_')}_${periodLabel.replace(/[\s,]+/g, '_')}.csv`);
}

/**
 * Export Attendance Report to formatted Microsoft Word (.doc) with official KOP Surat and signatures
 */
export function exportAttendanceToWord(
  periodLabel: string,
  kelasLabel: string,
  summary: AttendanceExportSummary,
  rows: AttendanceExportRow[],
  schoolConfig = SCHOOL_CONFIG
): void {
  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const tableRows = rows.map(r => `
    <tr>
      <td style="border:1px solid #333; padding:5px; text-align:center;">${r.no}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center; font-family:Courier New, monospace;">${r.nisn}</td>
      <td style="border:1px solid #333; padding:5px; font-weight:500;">${r.nama}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center;">${r.gender}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center;">${r.kelas}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center; font-weight:bold; color:#15803D;">${r.hadir}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center; color:#B45309;">${r.sakit}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center; color:#1D4ED8;">${r.izin}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center; font-weight:bold; color:#DC2626;">${r.alfa}</td>
      <td style="border:1px solid #333; padding:5px; text-align:center; font-weight:bold;">${r.percent}</td>
      <td style="border:1px solid #333; padding:5px; font-size:9pt; color:#4B5563;">${r.keterangan || '-'}</td>
    </tr>
  `).join('');

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Rekap Presensi ${kelasLabel} - ${periodLabel}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.25; color: #000; margin: 20px; }
        .kop-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; text-align: center; }
        .kop-instansi { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0; }
        .kop-sekolah { font-size: 16pt; font-weight: bold; letter-spacing: 0.5px; color: #0B231E; margin: 2px 0; }
        .kop-sub { font-size: 9pt; margin: 1px 0; color: #333; }
        h2 { font-size: 13pt; text-align: center; text-transform: uppercase; margin: 16px 0 4px 0; font-weight: bold; }
        .sub-header { text-align: center; font-size: 10.5pt; margin-bottom: 16px; }
        .summary-box { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; background-color: #F8FAFC; }
        .summary-box td { border: 1px solid #CBD5E1; padding: 6px 10px; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 24px; font-size: 9.5pt; }
        table.data-table th { border: 1px solid #333; padding: 6px; background-color: #E2E8F0; text-align: center; font-weight: bold; font-size: 9pt; }
        .ttd-table { width: 100%; margin-top: 30px; border: none; }
        .ttd-table td { border: none; text-align: center; font-size: 10pt; vertical-align: top; width: 33.3%; }
        .ttd-space { height: 65px; }
      </style>
    </head>
    <body>
      <div class="kop-table">
        <div class="kop-instansi">PEMERINTAH KABUPATEN TEMANGGUNG</div>
        <div class="kop-instansi">DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA</div>
        <div class="kop-sekolah">${schoolConfig.name} (${schoolConfig.shortName})</div>
        <div class="kop-sub">NPSN: ${schoolConfig.npsn} | Status Akreditasi: ${schoolConfig.accreditation}</div>
        <div class="kop-sub">${schoolConfig.address}, ${schoolConfig.city}, ${schoolConfig.province} ${schoolConfig.postalCode}</div>
        <div class="kop-sub">Telp: ${schoolConfig.phone} | Website: ${schoolConfig.website} | Email: ${schoolConfig.email}</div>
      </div>

      <h2>REKAPITULASI PRESENSI & KEHADIRAN SISWA</h2>
      <div class="sub-header"><strong>Periode:</strong> ${periodLabel} &nbsp;|&nbsp; <strong>Rombongan Belajar:</strong> ${kelasLabel}</div>

      <table class="summary-box">
        <tr>
          <td><strong>Total Peserta Didik:</strong> ${summary.totalStudents} Siswa</td>
          <td><strong>Total Hadir (H):</strong> ${summary.hadir}</td>
          <td><strong>Sakit (S):</strong> ${summary.sakit}</td>
          <td><strong>Izin (I):</strong> ${summary.izin}</td>
          <td><strong>Alfa (A):</strong> ${summary.alfa}</td>
          <td><strong>Tingkat Kehadiran:</strong> <span style="font-weight:bold; color:#15803D;">${summary.percentHadir}</span></td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:30px;">NO</th>
            <th style="width:85px;">NISN</th>
            <th>NAMA SISWA</th>
            <th style="width:30px;">L/P</th>
            <th style="width:40px;">KLS</th>
            <th style="width:35px;">H</th>
            <th style="width:35px;">S</th>
            <th style="width:35px;">I</th>
            <th style="width:35px;">A</th>
            <th style="width:55px;">% HADIR</th>
            <th style="width:140px;">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="ttd-table">
        <tr>
          <td>
            Kandangan, ${dateFormatted}<br>
            Wali Kelas / Petugas Piket,
            <div class="ttd-space"></div>
            <strong><u>${kelasLabel.includes('Kelas') ? `Wali ${kelasLabel}` : 'Petugas Presensi BSAN'}</u></strong><br>
            NIP. ........................................
          </td>
          <td>
            <br>
            Tim Kesiswaan & Ketertiban,
            <div class="ttd-space"></div>
            <strong><u>${schoolConfig.timKesiswaanName || 'Tim Kesiswaan'}</u></strong><br>
            NIP. ${schoolConfig.timKesiswaanNip || '-'}
          </td>
          <td>
            Mengetahui,<br>
            Kepala ${schoolConfig.name},
            <div class="ttd-space"></div>
            <strong><u>${schoolConfig.principalName}</u></strong><br>
            NIP. ${schoolConfig.principalNip}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  triggerFileDownload(blob, `Rekap_Presensi_${kelasLabel.replace(/\s+/g, '_')}_${periodLabel.replace(/[\s,]+/g, '_')}.doc`);
}



