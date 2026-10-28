import React, { useState } from 'react';
import { Student, Gender, AttendanceStatus } from '../../types';
import { KELAS_LIST } from '../../data/schoolConfig';
import { exportToCSV, downloadStudentTemplate } from '../../utils/exportDocs';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  Filter, 
  Eye, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet,
  School,
  GraduationCap,
  Layers,
  Lock
} from 'lucide-react';
import { isGuestMode } from '../../services/authService';

interface StudentCentralHubProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onBulkImport: (newStudents: Student[]) => void;
  onOpenRecordViolation: (studentId: string) => void;
  onSelectStudentProfile?: (student: Student) => void;
}

export const StudentCentralHub: React.FC<StudentCentralHubProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkImport,
  onOpenRecordViolation,
  onSelectStudentProfile,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState<string>('all');
  const [kelasFilter, setKelasFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // Form State
  const initialForm: Omit<Student, 'id' | 'totalPoinPelanggaran' | 'totalPelanggaranRingan' | 'totalPelanggaranSedang' | 'totalPelanggaranBerat'> = {
    nisn: '',
    nama: '',
    kelas: '7A',
    jenjang: 7,
    gender: 'L',
    noHpSiswa: '',
    namaOrtu: '',
    noWaOrtu: '',
    alamat: '',
    statusKehadiran: 'Hadir',
    keteranganKehadiran: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.namaOrtu.toLowerCase().includes(searchTerm.toLowerCase());

    const matchJenjang = jenjangFilter === 'all' || s.jenjang.toString() === jenjangFilter;
    const matchKelas = kelasFilter === 'all' || s.kelas === kelasFilter;
    const matchGender = genderFilter === 'all' || s.gender === genderFilter;

    return matchSearch && matchJenjang && matchKelas && matchGender;
  });

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.nama || !formData.noWaOrtu) {
      alert('Mohon isi NISN, Nama Lengkap, dan Nomor WhatsApp Orang Tua.');
      return;
    }

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        ...formData,
        jenjang: parseInt(formData.kelas.charAt(0)) || 7,
      };
      onUpdateStudent(updated);
      setEditingStudent(null);
    } else {
      const newStd: Student = {
        ...formData,
        id: `std-${Date.now()}`,
        jenjang: parseInt(formData.kelas.charAt(0)) || 7,
        totalPoinPelanggaran: 0,
        totalPelanggaranRingan: 0,
        totalPelanggaranSedang: 0,
        totalPelanggaranBerat: 0,
      };
      onAddStudent(newStd);
      setIsAddModalOpen(false);
    }

    setFormData(initialForm);
  };

  const openEditModal = (student: Student) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 20 akun petugas resmi yang berhak mengubah biodata siswa.');
      return;
    }
    setEditingStudent(student);
    setFormData({
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      jenjang: student.jenjang,
      gender: student.gender,
      noHpSiswa: student.noHpSiswa,
      namaOrtu: student.namaOrtu,
      noWaOrtu: student.noWaOrtu,
      alamat: student.alamat,
      statusKehadiran: student.statusKehadiran,
      keteranganKehadiran: student.keteranganKehadiran || '',
    });
  };

  // CSV Import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 20 akun petugas resmi yang berhak mengimpor data siswa.');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          alert('File tidak memuat data yang valid.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const newStudents: Student[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 4) {
            const nisn = cols[0] || `00892${Date.now().toString().slice(-5)}`;
            const nama = cols[1] || 'Siswa Baru';
            const kelas = cols[2] || '7A';
            const gender = (cols[4] === 'P' ? 'P' : 'L') as Gender;

            newStudents.push({
              id: `std-imp-${Date.now()}-${i}`,
              nisn,
              nama,
              kelas,
              jenjang: parseInt(kelas.charAt(0)) || 7,
              gender,
              noHpSiswa: cols[5] || '081234567890',
              namaOrtu: cols[6] || 'Orang Tua Siswa',
              noWaOrtu: cols[7] || '6281234567890',
              alamat: cols[8] || 'Kec. Kandangan, Kediri',
              statusKehadiran: 'Hadir',
              totalPoinPelanggaran: 0,
              totalPelanggaranRingan: 0,
              totalPelanggaranSedang: 0,
              totalPelanggaranBerat: 0,
            });
          }
        }

        if (newStudents.length > 0) {
          onBulkImport(newStudents);
          alert(`Berhasil mengimpor ${newStudents.length} siswa ke sistem BSAN.`);
        }
      } catch (err) {
        console.error('Import error', err);
        alert('Gagal memproses file. Pastikan format file sesuai dengan template CSV/Excel.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportAll = () => {
    const exportData = filteredStudents.map((s) => ({
      NISN: s.nisn,
      Nama_Lengkap: s.nama,
      Kelas: s.kelas,
      Jenjang: s.jenjang,
      Jenis_Kelamin: s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      Status_Kehadiran: s.statusKehadiran,
      Total_Poin_Pelanggaran: s.totalPoinPelanggaran,
      Pelanggaran_Ringan: s.totalPelanggaranRingan,
      Pelanggaran_Sedang: s.totalPelanggaranSedang,
      Pelanggaran_Berat: s.totalPelanggaranBerat,
      Nama_Orang_Tua: s.namaOrtu,
      No_WA_Orang_Tua: s.noWaOrtu,
      Alamat: s.alamat,
    }));
    exportToCSV(exportData, `Data_Siswa_SMPN1_Kandangan_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#83C532]"></span>
            <h2 className="text-base font-bold text-slate-900">
              Database Siswa Terpusat (Central Data Hub)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Single Source of Truth untuk data profil, presensi harian, dan akumulasi buku kontrol tata tertib siswa.
          </p>
        </div>

        {/* Buttons: Template, Upload, Export, Add */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadStudentTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
            title="Download Template Format CSV/Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Template</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Massal</span>
            <input
              type="file"
              accept=".csv, .txt, .xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Data</span>
          </button>

          <button
            onClick={() => {
              if (isGuestMode()) {
                alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 20 akun petugas resmi yang berhak menambah siswa baru.');
                return;
              }
              setFormData(initialForm);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#83C532]" />
            <span>Tambah Siswa Manual</span>
          </button>
        </div>
      </div>

      {/* Dedicated Class Dropdown Tracking Bar (7A - 9H) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Dropdown 7A - 9H */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0B231E] text-[#83C532] flex items-center justify-center font-bold shadow-xs">
                <School className="w-5 h-5" />
              </div>
              <div>
                <label htmlFor="kelas-dropdown" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  PILIH KELAS / TRACKING ROMBEL
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    id="kelas-dropdown"
                    value={kelasFilter}
                    onChange={(e) => {
                      setKelasFilter(e.target.value);
                      if (e.target.value !== 'all') {
                        setJenjangFilter('all');
                      }
                    }}
                    className="font-bold text-sm bg-slate-50 border-2 border-slate-300 hover:border-[#83C532] rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#83C532] text-slate-800 transition-all cursor-pointer shadow-xs min-w-[200px]"
                  >
                    <option value="all">Semua Rombel (7A - 9H)</option>
                    <optgroup label="── JENJANG 7 (7A - 7H) ──">
                      {['7A', '7B', '7C', '7D', '7E', '7F', '7G', '7H'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} ({students.filter((s) => s.kelas === k).length} Siswa)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── JENJANG 8 (8A - 8H) ──">
                      {['8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} ({students.filter((s) => s.kelas === k).length} Siswa)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── JENJANG 9 (9A - 9H) ──">
                      {['9A', '9B', '9C', '9D', '9E', '9F', '9G', '9H'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} ({students.filter((s) => s.kelas === k).length} Siswa)
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {kelasFilter !== 'all' && (
                    <button
                      onClick={() => setKelasFilter('all')}
                      className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors border border-rose-200"
                      title="Kembali ke semua kelas"
                    >
                      Reset Kelas
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Jenjang Badges */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-400 font-medium mr-1">Jenjang:</span>
              {(['all', '7', '8', '9'] as const).map((j) => (
                <button
                  key={j}
                  onClick={() => {
                    setJenjangFilter(j);
                    if (j !== 'all') setKelasFilter('all');
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                    jenjangFilter === j && kelasFilter === 'all'
                      ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {j === 'all' ? 'Semua' : `Kelas ${j}`}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input & Gender Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, NISN, atau wali..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40"
              />
            </div>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden text-slate-700 font-medium"
            >
              <option value="all">Semua Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
        </div>

        {/* Live Tracking Summary Strip for Selected Class / Rombel */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {kelasFilter !== 'all' ? `Tracking Rombel ${kelasFilter}:` : 'Tracking Keseluruhan Siswa:'}
              </span>
              <span className="font-mono font-bold bg-[#0B231E] text-white px-2.5 py-0.5 rounded-lg text-xs">
                {filteredStudents.length} Siswa
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Hadir: <strong>{filteredStudents.filter((s) => s.statusKehadiran === 'Hadir').length}</strong>
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Sakit: <strong>{filteredStudents.filter((s) => s.statusKehadiran === 'Sakit').length}</strong>
              </span>
              <span className="flex items-center gap-1 text-sky-700">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                Izin: <strong>{filteredStudents.filter((s) => s.statusKehadiran === 'Izin').length}</strong>
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Alfa: <strong>{filteredStudents.filter((s) => s.statusKehadiran === 'Alfa').length}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span>Total Catatan Tata Tertib:</span>
            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
              {filteredStudents.reduce(
                (acc, s) => acc + (s.totalPelanggaranRingan || 0) + (s.totalPelanggaranSedang || 0) + (s.totalPelanggaranBerat || 0),
                0
              )} Kasus
            </span>
          </div>
        </div>
      </div>

      {/* Main Students Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">No</th>
                <th className="py-3 px-4 font-bold">Nama Lengkap & NISN</th>
                <th className="py-3 px-3 font-bold">Kelas</th>
                <th className="py-3 px-3 font-bold">L/P</th>
                <th className="py-3 px-3 font-bold">Presensi</th>
                <th className="py-3 px-4 font-bold">Status Kedisiplinan</th>
                <th className="py-3 px-4 font-bold">Orang Tua / Wali</th>
                <th className="py-3 px-4 font-bold">No. WA Ortu</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Tidak ditemukan data siswa dengan kriteria filter tersebut.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const hasBerat = student.totalPelanggaranBerat > 0;
                  const hasSedang = student.totalPelanggaranSedang > 0;
                  const hasRingan = student.totalPelanggaranRingan > 0;
                  const hasAny = hasBerat || hasSedang || hasRingan;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectStudentProfile ? onSelectStudentProfile(student) : setProfileStudent(student)}
                          className="font-bold text-slate-900 hover:text-emerald-800 text-left cursor-pointer group flex items-center gap-1.5"
                          title="Buka Slip Detail Siswa"
                        >
                          <span className="group-hover:underline">{student.nama}</span>
                        </button>
                        <div className="text-[10px] text-slate-600 font-mono">NISN: {student.nisn}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#0B231E] bg-[#0B231E]/10 px-2 py-0.5 rounded">
                          {student.kelas}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            student.gender === 'L'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            student.statusKehadiran === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.statusKehadiran === 'Sakit'
                              ? 'bg-amber-100 text-amber-800'
                              : student.statusKehadiran === 'Izin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800 font-bold'
                          }`}
                        >
                          {student.statusKehadiran}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                              hasBerat
                                ? 'bg-red-100 text-red-800 font-bold'
                                : hasSedang
                                ? 'bg-amber-100 text-amber-800'
                                : hasRingan
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {hasBerat ? 'Pelanggaran Berat' : hasSedang ? 'Pelanggaran Sedang' : hasRingan ? 'Pelanggaran Ringan' : 'Disiplin / Tertib'}
                          </span>
                          {hasAny ? (
                            <div className="text-[10px] text-slate-500 font-mono">
                              R:{student.totalPelanggaranRingan} · S:{student.totalPelanggaranSedang} · B:{student.totalPelanggaranBerat}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-700">Nihil Pelanggaran</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {student.namaOrtu}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {student.noWaOrtu}
                      </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectStudentProfile ? onSelectStudentProfile(student) : setProfileStudent(student)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Lihat Slip & Detail Siswa Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                          title="Edit Data Siswa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenRecordViolation(student.id)}
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                          title="Catat Pelanggaran Siswa"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (isGuestMode()) {
                              alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 20 akun petugas resmi yang berhak menghapus data siswa.');
                              return;
                            }
                            setDeletingStudent(student);
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

      {/* Modal: Tambah / Edit Siswa */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#0B231E] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">
                {editingStudent ? 'Edit Informasi Siswa' : 'Tambah Siswa Baru ke Database'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="Contoh: 0089218201"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama sesuai akta"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas *
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  >
                    {KELAS_LIST.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Presensi Hari Ini
                  </label>
                  <select
                    value={formData.statusKehadiran}
                    onChange={(e) => setFormData({ ...formData, statusKehadiran: e.target.value as AttendanceStatus })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Orang Tua / Wali *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaOrtu}
                    onChange={(e) => setFormData({ ...formData, namaOrtu: e.target.value })}
                    placeholder="Nama orang tua/wali"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp Ortu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noWaOrtu}
                    onChange={(e) => setFormData({ ...formData, noWaOrtu: e.target.value })}
                    placeholder="Contoh: 628123456789"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Rumah / Domisili
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Dusun / Desa, RT/RW, Kec. Kandangan"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan / Alasan Absensi (Bila Sakit/Izin/Alfa)
                </label>
                <input
                  type="text"
                  value={formData.keteranganKehadiran || ''}
                  onChange={(e) => setFormData({ ...formData, keteranganKehadiran: e.target.value })}
                  placeholder="Contoh: Demam, Ada acara keluarga"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Siswa */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-900">
              Konfirmasi Penghapusan Siswa
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus data <strong>{deletingStudent.nama}</strong> (NISN: {deletingStudent.nisn}) dari sistem BSAN? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deletingStudent.id);
                  setDeletingStudent(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Profil Lengkap Siswa */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B231E] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#83C532]" />
                <h3 className="font-bold text-sm">Profil Siswa & Riwayat Kedisiplinan</h3>
              </div>
              <button
                onClick={() => setProfileStudent(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{profileStudent.nama}</h4>
                  <div className="text-slate-500 font-mono mt-0.5">NISN: {profileStudent.nisn} · Kelas {profileStudent.kelas}</div>
                  <div className="text-slate-600 mt-1">{profileStudent.alamat}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Status Kedisiplinan</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {profileStudent.totalPelanggaranBerat > 0 ? (
                      <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Kasus Berat</span>
                    ) : profileStudent.totalPelanggaranSedang > 0 ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Kasus Sedang</span>
                    ) : profileStudent.totalPelanggaranRingan > 0 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Kasus Ringan</span>
                    ) : (
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Sangat Disiplin</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Nama Orang Tua:</span>
                  <div className="font-semibold text-slate-800">{profileStudent.namaOrtu}</div>
                </div>
                <div>
                  <span className="text-slate-500">No. WhatsApp Wali:</span>
                  <div className="font-mono font-semibold text-slate-800">{profileStudent.noWaOrtu}</div>
                </div>
                <div>
                  <span className="text-slate-500">Status Presensi:</span>
                  <div className="font-semibold text-emerald-800">{profileStudent.statusKehadiran}</div>
                </div>
                <div>
                  <span className="text-slate-500">Jenis Kelamin:</span>
                  <div className="font-semibold text-slate-800">
                    {profileStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="font-semibold text-slate-800">Rincian Riwayat Pelanggaran:</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                    <div className="text-slate-600 text-[10px]">Ringan</div>
                    <div className="font-bold font-mono text-emerald-800 text-sm">
                      {profileStudent.totalPelanggaranRingan}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                    <div className="text-slate-600 text-[10px]">Sedang</div>
                    <div className="font-bold font-mono text-amber-800 text-sm">
                      {profileStudent.totalPelanggaranSedang}
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-2 rounded-xl">
                    <div className="text-slate-600 text-[10px]">Berat</div>
                    <div className="font-bold font-mono text-red-800 text-sm">
                      {profileStudent.totalPelanggaranBerat}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setProfileStudent(null);
                    onOpenRecordViolation(profileStudent.id);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  Catat Pelanggaran Siswa Ini
                </button>
                <button
                  onClick={() => setProfileStudent(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
