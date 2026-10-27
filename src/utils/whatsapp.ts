import { Student, ViolationRecord } from '../types';
import { SCHOOL_CONFIG } from '../data/schoolConfig';

/**
 * Clean phone number to standard international format (628...)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 5) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Generate formal WhatsApp greeting and message for attendance
 */
export function generateAttendanceMessage(student: Student): string {
  const statusStr = student.statusKehadiran.toUpperCase();
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  if (student.statusKehadiran === 'Alfa') {
    return `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *${student.nama}* (Kelas ${student.kelas}),\n\n` +
      `Melalui pesan resmi dari Sistem Informasi Budaya Sekolah Aman dan Nyaman (BSAN) ${SCHOOL_CONFIG.name} (${SCHOOL_CONFIG.shortName}), kami menginformasikan bahwa ananda pada hari *${dateStr}* tercatat *TIDAK HADIR TANPA KETERANGAN (ALFA)*.\n\n` +
      `Mohon konfirmasi terkait keberadaan ananda kepada pihak sekolah demi keselamatan dan ketertiban belajar siswa.\n\n` +
      `_Piket Kesiswaan & Tata Tertib SMPN 1 Kandangan_\n` +
      `Kepala Sekolah: ${SCHOOL_CONFIG.principalName}`;
  }

  if (student.statusKehadiran === 'Sakit') {
    return `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *${student.nama}* (Kelas ${student.kelas}),\n\n` +
      `Kami dari ${SCHOOL_CONFIG.name} telah menerima laporan bahwa ananda hari ini (*${dateStr}*) sedang berhalangan hadir dikarenakan *SAKIT*${student.keteranganKehadiran ? ' (' + student.keteranganKehadiran + ')' : ''}.\n\n` +
      `Keluarga besar ${SCHOOL_CONFIG.shortName} mendoakan semoga ananda lekas sembuh dan dapat beraktivitas kembali seperti sedia kala.\n\n` +
      `_Salam Hangat, Tim Kesiswaan SMPN 1 Kandangan_`;
  }

  return `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *${student.nama}* (Kelas ${student.kelas}),\n\n` +
    `Konfirmasi kehadiran ${SCHOOL_CONFIG.name}: Ananda tercatat berstatus *${statusStr}* pada hari *${dateStr}*${student.keteranganKehadiran ? ' (' + student.keteranganKehadiran + ')' : ''}.\n\n` +
    `Terima kasih atas kerja samanya dalam mengawal kedisiplinan dan budaya sekolah aman dan nyaman.\n\n` +
    `_Hormat kami, Tim Tata Tertib Grisaka_`;
}

/**
 * Generate formal WhatsApp message for violation notice & parent summon
 */
export function generateViolationMessage(student: Student, violation: ViolationRecord): string {
  const urgency = violation.tingkat === 'Berat' ? 'PANGGILAN MENDESAK' : violation.tingkat === 'Sedang' ? 'PEMBERITAHUAN & PEMANGGILAN' : 'CATATAN KEDISIPLINAN';
  
  return `*SURAT PEMBERITAHUAN RESMI - ${urgency}*\n` +
    `${SCHOOL_CONFIG.name} (${SCHOOL_CONFIG.shortName})\n` +
    `Motto: ${SCHOOL_CONFIG.motto}\n\n` +
    `Kepada Yth. Bapak/Ibu Orang Tua/Wali dari:\n` +
    `• Nama Siswa : *${student.nama}*\n` +
    `• NISN : ${student.nisn}\n` +
    `• Kelas : ${student.kelas}\n\n` +
    `Dengan hormat, kami menginformasikan catatan tata tertib siswa sebagai berikut:\n` +
    `• Waktu Kejadian : ${violation.tanggal} pk ${violation.waktu} WIB\n` +
    `• Lokasi : ${violation.lokasi}\n` +
    `• Pelanggaran : *${violation.pasalTitle} (${violation.kodePasal})*\n` +
    `• Keterangan : ${violation.uraian}\n` +
    `• Klasifikasi Pelanggaran : *Tingkat ${violation.tingkat}*\n` +
    `• Tahap Pembinaan : *${violation.tahapPembinaan}*\n\n` +
    (violation.tingkat === 'Berat' || violation.tingkat === 'Sedang'
      ? `Sehubungan dengan hal tersebut, kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali di Ruang Bimbingan Konseling (BK) / Kesiswaan SMPN 1 Kandangan untuk bersama-sama mendampingi ananda dalam proses pembinaan perilaku.\n\n`
      : `Pemberitahuan ini bertujuan agar Bapak/Ibu dapat memberikan arahan dan pendampingan di rumah demi terwujudnya lingkungan sekolah yang tertib, aman, dan nyaman.\n\n`) +
    `Atas perhatian dan kerja samanya, kami sampaikan terima kasih.\n\n` +
    `Kandangan, ${violation.tanggal}\n` +
    `Mengetahui,\n` +
    `*Kepala SMPN 1 Kandangan*\n` +
    `*${SCHOOL_CONFIG.principalName}*\n` +
    `NIP. ${SCHOOL_CONFIG.principalNip}`;
}

/**
 * Create full WhatsApp web link
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const formatted = formatPhoneNumber(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}
