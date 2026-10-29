import { AttendanceRecapRow, SchoolProfile, AttendancePeriod } from '../types';
import { exportElementToPDF } from './exportDocs';

export const getPeriodLabel = (period: AttendancePeriod, targetDate: string): string => {
  const d = new Date(targetDate);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  if (period === 'harian') {
    return `Harian (${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()})`;
  }
  if (period === 'mingguan') {
    return `Mingguan (Pekan Berjalan - ${monthNames[d.getMonth()]} ${d.getFullYear()})`;
  }
  if (period === 'bulanan') {
    return `Bulanan (Bulan ${monthNames[d.getMonth()]} ${d.getFullYear()})`;
  }
  if (period === 'semester') {
    const sem = d.getMonth() >= 6 ? '1 (Ganjil)' : '2 (Genap)';
    const th1 = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return `Semester ${sem} Tahun Pelajaran ${th1}/${th1 + 1}`;
  }
  if (period === 'tahunan') {
    const th = d.getFullYear();
    return `Tahunan (Tahun Pelajaran ${th}/${th + 1})`;
  }
  return period;
};

/**
 * Export Attendance Recap to Microsoft Word (.doc)
 */
export const exportAttendanceToWord = (
  recapRows: AttendanceRecapRow[],
  period: AttendancePeriod,
  kelas: string,
  targetDate: string,
  schoolConfig: SchoolProfile,
  waliKelasName?: string
): void => {
  const periodLabel = getPeriodLabel(period, targetDate);
  const scopeLabel = kelas === 'all' ? 'Seluruh Kelas (24 Rombel)' : `Kelas ${kelas}`;
  
  const totalSiswa = recapRows.length;
  const totalHadir = recapRows.reduce((acc, r) => acc + r.totalHadir, 0);
  const totalSakit = recapRows.reduce((acc, r) => acc + r.totalSakit, 0);
  const totalIzin = recapRows.reduce((acc, r) => acc + r.totalIzin, 0);
  const totalAlfa = recapRows.reduce((acc, r) => acc + r.totalAlfa, 0);
  const avgKehadiran = totalSiswa > 0 
    ? Math.round(recapRows.reduce((acc, r) => acc + r.persentaseHadir, 0) / totalSiswa)
    : 100;

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const rowsHtml = recapRows.map((r, i) => `
    <tr>
      <td style="text-align: center; padding: 6px; border: 1px solid #000;">${i + 1}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000; font-family: monospace;">${r.nisn}</td>
      <td style="padding: 6px 8px; border: 1px solid #000; font-weight: bold;">${r.nama}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000;">${r.kelas}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000;">${r.gender}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000; font-weight: bold; color: #047857;">${r.totalHadir}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000; color: #b45309;">${r.totalSakit}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000; color: #0369a1;">${r.totalIzin}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000; color: #b91c1c; font-weight: bold;">${r.totalAlfa}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid #000; font-weight: bold;">${r.persentaseHadir}%</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 11px;">${r.keteranganTerakhir || '-'}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Rekap Presensi Siswa - ${schoolConfig.shortName || 'SMPN 1 Kandangan'}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; line-height: 1.3; }
        .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
        .kop-instansi { font-size: 12pt; font-weight: bold; letter-spacing: 1px; }
        .kop-dinas { font-size: 13pt; font-weight: bold; letter-spacing: 1px; }
        .kop-sekolah { font-size: 16pt; font-weight: bold; margin: 3px 0; }
        .kop-alamat { font-size: 9.5pt; font-style: italic; }
        .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase; }
        .subtitle { text-align: center; font-size: 11pt; margin-bottom: 16px; font-weight: bold; }
        .meta-table { width: 100%; margin-bottom: 12px; font-size: 10.5pt; }
        .meta-table td { padding: 3px 0; }
        .recap-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
        .recap-table th { background-color: #f1f5f9; padding: 8px 6px; border: 1px solid #000; text-align: center; font-weight: bold; }
        .stat-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; margin-bottom: 12px; font-size: 10.5pt; }
        .sig-container { width: 100%; margin-top: 32px; page-break-inside: avoid; }
        .sig-box { width: 32%; text-align: center; vertical-align: top; font-size: 10.5pt; }
        .sig-space { height: 75px; }
      </style>
    </head>
    <body>
      <!-- KOP SURAT RESMI -->
      <div class="kop">
        <div class="kop-instansi">PEMERINTAH KABUPATEN TEMANGGUNG</div>
        <div class="kop-dinas">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
        <div class="kop-sekolah">${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'}</div>
        <div class="kop-alamat">${schoolConfig.address || 'Jl. Raya Kandangan - Temanggung'}, ${schoolConfig.city || 'Kabupaten Temanggung'} ${schoolConfig.postalCode || '56281'} · Telp: ${schoolConfig.phone || '(0293) 490123'} · Email: ${schoolConfig.email || 'smpn1kandangan@temanggungkab.go.id'}</div>
      </div>

      <div class="title">REKAPITULASI PRESENSI KEHADIRAN SISWA</div>
      <div class="subtitle">PERIODE: ${periodLabel.toUpperCase()}</div>

      <table class="meta-table">
        <tr>
          <td style="width: 18%;"><strong>Satuan Pendidikan</strong></td>
          <td style="width: 2%;">:</td>
          <td style="width: 45%;">${schoolConfig.name}</td>
          <td style="width: 15%;"><strong>Tingkat / Rombel</strong></td>
          <td style="width: 2%;">:</td>
          <td style="width: 18%; font-weight: bold;">${scopeLabel}</td>
        </tr>
        <tr>
          <td><strong>NPSN / Akreditasi</strong></td>
          <td>:</td>
          <td>${schoolConfig.npsn || '20321456'} (Akreditasi ${schoolConfig.accreditation || 'A'})</td>
          <td><strong>Tanggal Cetak</strong></td>
          <td>:</td>
          <td>${todayStr}</td>
        </tr>
      </table>

      <!-- Ringkasan Statistik -->
      <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; margin-bottom: 14px; font-size: 10pt; text-align: center;">
        <tr style="background: #e2e8f0; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 6px;">Total Siswa</td>
          <td style="border: 1px solid #000; padding: 6px; color: #047857;">Hadir (H)</td>
          <td style="border: 1px solid #000; padding: 6px; color: #b45309;">Sakit (S)</td>
          <td style="border: 1px solid #000; padding: 6px; color: #0369a1;">Izin (I)</td>
          <td style="border: 1px solid #000; padding: 6px; color: #b91c1c;">Alpa (A)</td>
          <td style="border: 1px solid #000; padding: 6px;">Rata-Rata Kehadiran</td>
        </tr>
        <tr style="font-weight: bold; font-size: 11pt;">
          <td style="border: 1px solid #000; padding: 6px;">${totalSiswa} Siswa</td>
          <td style="border: 1px solid #000; padding: 6px; color: #047857;">${totalHadir}</td>
          <td style="border: 1px solid #000; padding: 6px; color: #b45309;">${totalSakit}</td>
          <td style="border: 1px solid #000; padding: 6px; color: #0369a1;">${totalIzin}</td>
          <td style="border: 1px solid #000; padding: 6px; color: #b91c1c;">${totalAlfa}</td>
          <td style="border: 1px solid #000; padding: 6px; color: #047857;">${avgKehadiran}%</td>
        </tr>
      </table>

      <!-- Tabel Rincian Siswa -->
      <table class="recap-table">
        <thead>
          <tr>
            <th style="width: 4%;">No</th>
            <th style="width: 12%;">NISN</th>
            <th style="width: 25%;">Nama Lengkap Siswa</th>
            <th style="width: 7%;">Kelas</th>
            <th style="width: 5%;">L/P</th>
            <th style="width: 7%;">H</th>
            <th style="width: 7%;">S</th>
            <th style="width: 7%;">I</th>
            <th style="width: 7%;">A</th>
            <th style="width: 8%;">% Hadir</th>
            <th style="width: 11%;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- LEMBAR TANDA TANGAN RESMI -->
      <table class="sig-container">
        <tr>
          <td class="sig-box">
            Mengetahui,<br>
            <strong>${kelas !== 'all' ? `Wali Kelas ${kelas}` : 'Koordinator Guru Piket'}</strong>
            <div class="sig-space"></div>
            <strong><u>${waliKelasName || (kelas !== 'all' ? `Wali Kelas ${kelas}` : 'Siti Aminah, S.Pd.')}</u></strong><br>
            NIP. ${kelas !== 'all' ? '-' : '19840311 200902 2 006'}
          </td>
          <td class="sig-box">
            Mengetahui,<br>
            <strong>Wakasek Urusan Kesiswaan</strong>
            <div class="sig-space"></div>
            <strong><u>${schoolConfig.wakasekName || schoolConfig.timKesiswaanName || 'Andi Prasetyo, S.Pd.'}</u></strong><br>
            NIP. ${schoolConfig.wakasekNip || '19800315 200604 1 007'}
          </td>
          <td class="sig-box">
            Kandangan, ${todayStr}<br>
            <strong>Kepala ${schoolConfig.name || 'SMPN 1 Kandangan'}</strong>
            <div class="sig-space"></div>
            <strong><u>${schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}</u></strong><br>
            NIP. ${schoolConfig.principalNip || '19740512 199802 2 003'}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
  const filename = `Rekap_Presensi_${scopeLabel.replace(/\s+/g, '_')}_${period}_${targetDate}.doc`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};

/**
 * Export Attendance Recap to Microsoft Excel / CSV
 */
export const exportAttendanceToExcel = (
  recapRows: AttendanceRecapRow[],
  period: AttendancePeriod,
  kelas: string,
  targetDate: string,
  schoolConfig: SchoolProfile
): void => {
  const periodLabel = getPeriodLabel(period, targetDate);
  const scopeLabel = kelas === 'all' ? 'Seluruh Kelas (24 Rombel)' : `Kelas ${kelas}`;

  const headerMeta = [
    `PEMERINTAH KABUPATEN TEMANGGUNG - DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA`,
    `${schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'}`,
    `REKAPITULASI PRESENSI KEHADIRAN SISWA`,
    `Periode: ${periodLabel} | Rombel: ${scopeLabel} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`,
    ``, // blank line
  ];

  const tableHeaders = [
    'No',
    'NISN',
    'Nama Siswa',
    'Kelas',
    'Gender',
    'Hadir (H)',
    'Sakit (S)',
    'Izin (I)',
    'Alpa (A)',
    'Total Pertemuan',
    'Persentase Hadir (%)',
    'Keterangan'
  ];

  const dataRows = recapRows.map((r, i) => [
    i + 1,
    `'${r.nisn}`,
    `"${r.nama.replace(/"/g, '""')}"`,
    r.kelas,
    r.gender,
    r.totalHadir,
    r.totalSakit,
    r.totalIzin,
    r.totalAlfa,
    r.totalHari,
    `${r.persentaseHadir}%`,
    `"${(r.keteranganTerakhir || '-').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\ufeff' + [
    ...headerMeta,
    tableHeaders.join(','),
    ...dataRows.map(row => row.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `Rekap_Presensi_${scopeLabel.replace(/\s+/g, '_')}_${period}_${targetDate}.csv`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};
