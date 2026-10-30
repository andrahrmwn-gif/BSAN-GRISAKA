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

      // Default clean attendance: all present, 0 violations
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
        statusKehadiran: 'Hadir',
        keteranganKehadiran: undefined,
        totalPelanggaranRingan: 0,
        totalPelanggaranSedang: 0,
        totalPelanggaranBerat: 0,
        totalPoinPelanggaran: 0
      });

      stdCounter++;
    }
  });

  return students;
};

export const INITIAL_STUDENTS: Student[] = generateRosterFor24Classes();

export const INITIAL_VIOLATIONS: ViolationRecord[] = [];

export const INITIAL_WA_LOGS: WhatsAppMessageLog[] = [];

