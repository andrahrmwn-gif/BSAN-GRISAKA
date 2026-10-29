import { Student, ViolationRecord, WhatsAppMessageLog } from '../types';
import { KELAS_LIST } from './schoolConfig';

// Names pool for realistic SMPN 1 Kandangan student roster
const FIRST_NAMES_MALE = [
  'Ahmad', 'Bagus', 'Dimas', 'Fajar', 'Galih', 'Hafizh', 'Irfan', 'Joko',
  'Kevin', 'Lukman', 'Maulana', 'Naufal', 'Oki', 'Pandu', 'Rangga', 'Surya',
  'Tegar', 'Wahyu', 'Yoga', 'Zidan', 'Bayu', 'Candra', 'Daffa', 'Eko',
  'Gilang', 'Ilham', 'Kurniawan', 'Muhammad', 'Rifqi', 'Satria'
];

const FIRST_NAMES_FEMALE = [
  'Anindya', 'Cantika', 'Dina', 'Eka', 'Fitri', 'Gita', 'Hana', 'Indah',
  'Jasmine', 'Karina', 'Lestari', 'Maya', 'Nabila', 'Putri', 'Rani', 'Siti',
  'Tiara', 'Ulfa', 'Vina', 'Wulan', 'Zahra', 'Alya', 'Bunga', 'Citra',
  'Dwi', 'Farida', 'Intan', 'Melati', 'Nurul', 'Salma'
];

const LAST_NAMES = [
  'Pratama', 'Saputra', 'Wicaksono', 'Kusuma', 'Ramadhan', 'Hidayat', 'Santoso',
  'Utomo', 'Wibowo', 'Nugroho', 'Setiawan', 'Permadi', 'Handayani', 'Lestari',
  'Anggraini', 'Rahmawati', 'Dewi', 'Safitri', 'Kurnia', 'Puspitasari'
];

const DUSUN_LIST = [
  'Dusun Krajan, Ds. Kandangan',
  'Dusun Blimbing, Ds. Blimbing',
  'Dusun Maron, Ds. Caruban',
  'Dusun Tlogowungu, Ds. Margolelo',
  'Dusun Kembangsari, Ds. Kandangan',
  'Dusun Kedungumpul, Ds. Kedungumpul',
  'Dusun Ngemplak, Ds. Malebo',
  'Dusun Baledono, Ds. Baledono',
  'Dusun Gesing, Ds. Gesing',
  'Dusun Rowocacing, Ds. Kandangan'
];

const PARENT_NAMES = [
  'Bambang Supriyanto', 'Suhartono', 'Budi Santoso', 'Agus Triono', 'H. Sudirman',
  'Andreas Taufiq', 'Ahmad Kusnan', 'Suwandi', 'Haryanto', 'Dwi Cahyono',
  'Slamet Riyadi', 'Purnomo', 'Widodo', 'Mulyadi', 'Joko Susanto'
];

// Helper to generate a realistic student roster across all 24 classes (7A-9H)
const generateRosterFor24Classes = (): Student[] => {
  const students: Student[] = [];
  let stdCounter = 1;

  KELAS_LIST.forEach((kelasName) => {
    const jenjangNum = parseInt(kelasName.charAt(0), 10) || 7;
    const baseNisnPrefix = jenjangNum === 7 ? '0089' : jenjangNum === 8 ? '0078' : '0067';
    
    // Generate 7-8 students for each class
    const count = 7;
    for (let i = 0; i < count; i++) {
      const isMale = (i % 2 === 0);
      const firstNameList = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
      const fName = firstNameList[(stdCounter * 7 + i * 3) % firstNameList.length];
      const lName = LAST_NAMES[(stdCounter * 5 + i * 2) % LAST_NAMES.length];
      const fullName = `${fName} ${lName}`;
      
      const padNum = String(stdCounter).padStart(3, '0');
      const id = `std-${padNum}`;
      const nisn = `${baseNisnPrefix}${String(218000 + stdCounter)}`;
      const phoneDigits = String(10000000 + stdCounter);
      const parentName = PARENT_NAMES[(stdCounter + i) % PARENT_NAMES.length];
      const dusun = DUSUN_LIST[(stdCounter + i) % DUSUN_LIST.length];

      // Initial attendance distribution
      let status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' = 'Hadir';
      let keterangan: string | undefined = undefined;

      if (stdCounter === 2) {
        status = 'Sakit';
        keterangan = 'Demam dan flu (surat dokter Puskesmas Kandangan)';
      } else if (stdCounter === 3) {
        status = 'Alfa';
        keterangan = 'Tidak hadir tanpa keterangan izin';
      } else if (stdCounter === 9) {
        status = 'Izin';
        keterangan = 'Izin mengikuti lomba OSN tingkat kabupaten';
      } else if (stdCounter === 14) {
        status = 'Sakit';
        keterangan = 'Tifus rawat jalan di rumah';
      } else if (stdCounter === 23) {
        status = 'Izin';
        keterangan = 'Keperluan keluarga di luar kota';
      } else if (stdCounter === 35) {
        status = 'Alfa';
        keterangan = 'Tanpa surat keterangan';
      }

      students.push({
        id,
        nisn,
        nama: fullName,
        kelas: kelasName,
        jenjang: jenjangNum,
        gender: isMale ? 'L' : 'P',
        noHpSiswa: `0812${phoneDigits}`,
        namaOrtu: parentName,
        noWaOrtu: `62812${phoneDigits}`,
        alamat: `${dusun}, Kec. Kandangan, Temanggung`,
        statusKehadiran: status,
        keteranganKehadiran: keterangan,
        totalPelanggaranRingan: stdCounter === 3 ? 2 : stdCounter === 6 ? 1 : 0,
        totalPelanggaranSedang: stdCounter === 3 ? 1 : 0,
        totalPelanggaranBerat: stdCounter === 13 ? 1 : 0,
        totalPoinPelanggaran: stdCounter === 3 ? 15 : stdCounter === 13 ? 50 : 0
      });

      stdCounter++;
    }
  });

  return students;
};

export const INITIAL_STUDENTS: Student[] = generateRosterFor24Classes();

export const INITIAL_VIOLATIONS: ViolationRecord[] = [
  {
    id: 'viol-001',
    studentId: 'std-013',
    studentName: 'Rangga Danendra',
    kelas: '9C',
    pasalId: 'p5-3',
    pasalNumber: 5,
    pasalTitle: 'Pelanggaran Berat & Tindak Kriminal',
    kodePasal: 'IND-05.3',
    uraian: 'Terlibat perkelahian fisik dengan teman sebaya di luar pagar sekolah saat jam istirahat kedua',
    tingkat: 'Berat',
    tanggal: '2026-10-24',
    waktu: '11:45',
    lokasi: 'Area Belakang Kantin SMPN 1 Kandangan',
    guruPencatat: 'Bambang Triyono, S.Pd.',
    tahapPembinaan: 'Wakasek Kesiswaan (Pemanggilan Ortu & SP)',
    statusSurat: 'Diterbitkan',
    catatanKhusus: 'Orang tua siswa telah dihubungi via WhatsApp resmi dan diundang hadir ke sekolah',
    noWaOrtu: '6282211998877',
    namaOrtu: 'Budi Santoso',
    poin: 50,
  },
  {
    id: 'viol-002',
    studentId: 'std-003',
    studentName: 'Bagus Dwi Wicaksono',
    kelas: '7B',
    pasalId: 'p3-2',
    pasalNumber: 3,
    pasalTitle: 'Disiplin Kehadiran & Ketepatan Waktu',
    kodePasal: 'IND-03.2',
    uraian: 'Terlambat masuk sekolah lebih dari 30 menit (pukul 07.35 WIB) tanpa surat keterangan izin orang tua',
    tingkat: 'Ringan',
    tanggal: '2026-10-25',
    waktu: '07:35',
    lokasi: 'Gerbang Depan SMPN 1 Kandangan',
    guruPencatat: 'Siti Aminah, S.Pd.',
    tahapPembinaan: 'Guru Mapel / Piket (Teguran Lisan & Buku Kontrol)',
    statusSurat: 'Selesai',
    catatanKhusus: 'Telah diberikan sanksi edukatif menyiram tanaman di taman literasi sekolah',
    noWaOrtu: '6285712349901',
    namaOrtu: 'Suhartono',
    poin: 5,
  },
  {
    id: 'viol-003',
    studentId: 'std-003',
    studentName: 'Bagus Dwi Wicaksono',
    kelas: '7B',
    pasalId: 'p2-1',
    pasalNumber: 2,
    pasalTitle: 'Kerapian Rambut & Penampilan Diri',
    kodePasal: 'IND-02.1',
    uraian: 'Rambut Putra tidak rapi pola 3-2-1 cm dan terdapat model garis (skin hair) di pelipis kanan',
    tingkat: 'Ringan',
    tanggal: '2026-10-26',
    waktu: '07:15',
    lokasi: 'Ruang Pemeriksaan Gerbang Utama',
    guruPencatat: 'Agus Triono, M.Pd.',
    tahapPembinaan: 'Wali Kelas (Pembinaan Personal & Surat Pernyataan)',
    statusSurat: 'Draft',
    catatanKhusus: 'Diberikan waktu 2 hari untuk merapikan potongan rambut sesuai standar Grisaka',
    noWaOrtu: '6285712349901',
    namaOrtu: 'Suhartono',
    poin: 10,
  },
  {
    id: 'viol-004',
    studentId: 'std-006',
    studentName: 'Farhan Maulana Akbar',
    kelas: '8A',
    pasalId: 'p1-1',
    pasalNumber: 1,
    pasalTitle: 'Ketentuan Seragam Sekolah',
    kodePasal: 'IND-01.1',
    uraian: 'Tidak memakai dasi resmi dan ikat pinggang bukan standar SMPN 1 Kandangan',
    tingkat: 'Ringan',
    tanggal: '2026-10-26',
    waktu: '07:20',
    lokasi: 'Halaman Upacara',
    guruPencatat: 'Dra. Endang Sulistyowati',
    tahapPembinaan: 'Wali Kelas (Pembinaan Personal & Surat Pernyataan)',
    statusSurat: 'Diterbitkan',
    catatanKhusus: 'Pelanggaran seragam ke-3, telah dibuatkan surat pernyataan binaan',
    noWaOrtu: '6281344556677',
    namaOrtu: 'H. Sudirman',
    poin: 5,
  },
];

export const INITIAL_WA_LOGS: WhatsAppMessageLog[] = [
  {
    id: 'wa-001',
    studentId: 'std-013',
    studentName: 'Rangga Danendra',
    kelas: '9C',
    recipientName: 'Bapak Budi Santoso',
    recipientPhone: '6282211998877',
    category: 'Panggilan Ortu',
    message: 'Yth. Bapak/Ibu Orang Tua/Wali dari Rangga Danendra (Kelas 9C). Diberitahukan bahwa ananda tercatat melakukan Pelanggaran Berat (Pasal 5: Perkelahian fisik). Mohon kehadiran Bapak/Ibu di Ruang Kesiswaan SMPN 1 Kandangan Kabupaten Temanggung besok pagi pukul 08.00 WIB untuk musyawarah penanganan bersama. Hormat kami, Kepala SMPN 1 Kandangan, Yuliana Dewi Marithawati, S.Pd., M.Pd.',
    timestamp: '2026-10-24 12:15 WIB',
    status: 'Terkirim',
    triggerType: 'Otomatis',
  },
  {
    id: 'wa-002',
    studentId: 'std-003',
    studentName: 'Bagus Dwi Wicaksono',
    kelas: '7B',
    recipientName: 'Bapak Suhartono',
    recipientPhone: '6285712349901',
    category: 'Absensi',
    message: 'Yth. Orang Tua/Wali Ananda Bagus Dwi Wicaksono (Kelas 7B). Sistem Presensi BSAN SMPN 1 Kandangan Temanggung mencatat bahwa Ananda pada hari ini belum hadir di sekolah (Status: ALFA). Mohon konfirmasi kondisi ananda ke Guru Piket/Wali Kelas. Terima kasih atas kerja samanya.',
    timestamp: '2026-10-26 08:00 WIB',
    status: 'Terkirim',
    triggerType: 'Otomatis',
  },
];
