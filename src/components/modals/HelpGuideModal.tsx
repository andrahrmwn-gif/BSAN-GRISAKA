import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  ShieldCheck, 
  CalendarCheck, 
  AlertTriangle, 
  FileText, 
  Users, 
  Volume2, 
  PhoneCall, 
  CheckCircle2, 
  Download, 
  Search,
  ExternalLink
} from 'lucide-react';
import { SchoolProfile } from '../../types';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolConfig?: SchoolProfile;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  schoolConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'violations' | 'accounts' | 'announcements' | 'faq'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#2563EB] text-white px-6 py-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold shadow-inner">
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                Pusat Bantuan & Petunjuk Penggunaan BSAN
                <span className="text-[10px] font-bold bg-white/20 text-blue-100 px-2 py-0.5 rounded-full">
                  v2.0
                </span>
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                {schoolConfig?.name || 'SMPN 1 KANDANGAN'} • Budaya Sekolah Aman & Nyaman
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-100 hover:text-white transition-colors cursor-pointer"
            title="Tutup Bantuan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/80 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
          {[
            { id: 'overview', label: 'Ringkasan Sistem', icon: BookOpen },
            { id: 'attendance', label: 'Presensi 24 Rombel', icon: CalendarCheck },
            { id: 'violations', label: 'Buku Pelanggaran', icon: AlertTriangle },
            { id: 'announcements', label: 'Pengumuman & Bel', icon: Volume2 },
            { id: 'accounts', label: 'Akun Petugas DAPODIK', icon: Users },
            { id: 'faq', label: 'Tanya Jawab (FAQ)', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#3B5BDB] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 leading-relaxed text-xs sm:text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-[#1E3A8A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Apa itu Aplikasi BSAN?</h4>
                  <p className="text-slate-700 text-xs mt-1">
                    <strong>BSAN (Budaya Sekolah Aman & Nyaman)</strong> adalah sistem tata kelola kesiswaan, pemantauan kehadiran 24 rombel (7A - 9H), pencatatan buku kontrol pelanggaran siswa, serta rekapitulasi pelaporan terpadu resmi untuk SMPN 1 Kandangan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Dashboard Eksekutif
                  </h5>
                  <p className="text-slate-600 text-[11px]">
                    Menampilkan 7 KPI metrik solid cerah, 2 kartu aksi cepat (Catat Pelanggaran & Catat Kehadiran), grafik kehadiran per kelas, cuaca real-time BMKG, serta jam digital resmi.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Sinkronisasi Realtime
                  </h5>
                  <p className="text-slate-600 text-[11px]">
                    Setiap perubahan data (presensi, pelanggaran, profil petugas) otomatis tersinkronisasi secara langsung ke cloud Firebase dan tampil realtime di perangkat guru lain tanpa reload.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    Ekspor Multi-Format
                  </h5>
                  <p className="text-slate-600 text-[11px]">
                    Mendukung unduh laporan dalam format <strong>PDF</strong>, <strong>Microsoft Word (.doc)</strong>, dan <strong>Excel (.csv)</strong> lengkap dengan KOP Sekolah resmi dan tanda tangan.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Integrasi WhatsApp Otomatis
                  </h5>
                  <p className="text-slate-600 text-[11px]">
                    Kirim pesan pemberitahuan ketidakhadiran atau pelanggaran langsung ke nomor WA Orang Tua siswa hanya dengan sekali klik tautan WhatsApp API resmi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                Panduan Presensi Siswa 24 Rombel (7A - 9H)
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-700 list-disc list-inside bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <li>
                  <strong>Cek Kehadiran Setiap Saat:</strong> Pada dashboard, Anda dapat memantau presensi hari ini maupun tanggal terdahulu dengan memilih tanggal pada navigasi tanggal.
                </li>
                <li>
                  <strong>4 KPI Interaktif:</strong> Klik pada kartu <em>Hadir</em>, <em>Sakit</em>, <em>Izin</em>, atau <em>Alpa</em> untuk membuka popup modal rincian daftar siswa lengkap dengan nomor kontak orang tua.
                </li>
                <li>
                  <strong>Urutan Siswa:</strong> Daftar siswa pada menu presensi selalu otomatis terurut rapi berdasarkan nomor absen / alfabetis terkecil ke terbesar.
                </li>
                <li>
                  <strong>Hasil Unduhan Berurutan:</strong> Saat mengunduh data presensi (Excel / CSV), data otomatis dikelompokkan dan diurutkan dari kelas terkecil (7A) ke terbesar (9H) dan nama terkecil ke terbesar.
                </li>
                <li>
                  <strong>Tombol Cepat:</strong> Gunakan tombol <em>"Tandai Semua Hadir"</em> untuk mengisi 1 kelas secara instan, lalu cukup ubah siswa yang berhalangan sakit atau izin.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'violations' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Pencatatan Buku Kontrol & Sanksi Pelanggaran
              </h4>
              <div className="space-y-3 text-xs text-slate-700">
                <p>
                  Sistem pelanggaran siswa dibagi menjadi 3 kategori bobot berdasarkan Tata Tertib Resmi:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center font-bold">
                  <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
                    <span>Ringan (5 - 15 Poin)</span>
                    <p className="text-[10px] font-normal text-amber-700 mt-1">Terlambat, atribut seragam tidak lengkap</p>
                  </div>
                  <div className="p-3 bg-orange-50 text-orange-900 border border-orange-200 rounded-xl">
                    <span>Sedang (20 - 45 Poin)</span>
                    <p className="text-[10px] font-normal text-orange-700 mt-1">Membolos, melompat pagar, bermain HP di kelas</p>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl">
                    <span>Berat (50 - 100 Poin)</span>
                    <p className="text-[10px] font-normal text-rose-700 mt-1">Merokok, perkelahian, perundungan, miras</p>
                  </div>
                </div>
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <strong>Penerbitan Surat & Slip Detail:</strong>
                  <p className="text-[11px] text-blue-900 mt-1">
                    Buka slip detail siswa untuk melihat seluruh riwayat pelanggaran, akumulasi poin, serta mencetak <strong>Surat Peringatan (SP)</strong> atau <strong>Surat Panggilan Orang Tua</strong> dalam format Word (.doc) dan PDF yang siap dicetak dan ditandatangani.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                Informasi Kegiatan, Pengumuman & Notifikasi Suara Bel
              </h4>
              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p>
                  Fitur <strong>Informasi & Pengumuman</strong> di dashboard kini dilengkapi sistem manajemen penuh:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Tambah Kegiatan:</strong> Masukkan nama kegiatan, tanggal, waktu, dan lokasi.</li>
                  <li><strong>Edit & Hapus:</strong> Perbarui jadwal atau hapus agenda yang sudah kadaluarsa.</li>
                  <li>
                    <strong>Notifikasi H-5 sampai Hari H:</strong> Sistem secara cerdas menghitung selisih hari. Kegiatan yang akan berlangsung dalam kurun waktu 5 hari sebelum hari H (H-5, H-4, H-3, H-2, H-1) hingga Hari H akan menampilkan lencana peringatan warna khusus.
                  </li>
                  <li>
                    <strong>Suara Bel Sekolah (Chime):</strong> Dilengkapi sintesis nada bel sekolah 3 nada harmonis (E5 - G5 - C6) berbasis Web Audio API yang berbunyi saat memantau kegiatan aktif atau tombol lonceng ditekan.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Akun Petugas Resmi & Pengaturan Profil
              </h4>
              <div className="space-y-3 text-xs text-slate-700">
                <p>
                  Seluruh akun petugas resmi BSAN diimpor langsung dari <strong>SK Pembagian Tugas Guru DAPODIK SMPN 1 Kandangan</strong>:
                </p>
                <div className="p-3 bg-slate-100 rounded-xl space-y-1 font-mono text-[11px]">
                  <div>• Default Password / PIN login: <strong>1234</strong></div>
                  <div>• Tiap petugas berhak mengubah Nama Lengkap, NIP, Password, dan Jabatan.</div>
                </div>
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-900 block mb-1">Daftar Pilihan Jabatan Resmi:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-emerald-800 font-semibold">
                    <span>1. Kepala Sekolah</span>
                    <span>2. Wakil Kepala Sekolah Bidang Akademik</span>
                    <span>3. Wakil Kepala Sekolah Bidang Non Akademik</span>
                    <span>4. Wakil Kepala Sekolah Bidang Kesiswaan</span>
                    <span>5. Guru</span>
                    <span>6. Kepala/koordinator Tata Usaha</span>
                    <span>7. Staff Tata Usaha</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  Q: Apa itu Mode Tamu (Guest)?
                </div>
                <p className="text-[11px] text-slate-600">
                  A: Mode Tamu bersifat <em>View-Only</em> (hanya membaca). Pengguna dalam mode tamu dapat melihat dashboard dan laporan, tetapi dicegah untuk menginput, mengubah, atau menghapus data demi keamanan sistem. Untuk mencatat data, beralihlah ke salah satu akun petugas resmi.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  Q: Bagaimana jika tidak sengaja menghapus data atau ingin membersihkan data contoh?
                </div>
                <p className="text-[11px] text-slate-600">
                  A: Pada menu Pengaturan terdapat tombol <em>"Bersihkan & Reset Data Contoh"</em>. Fitur ini akan mengosongkan seluruh data dummy presensi dan pelanggaran secara clean dan higienis serta tersinkronisasi ke seluruh perangkat.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  Q: Apakah aplikasi dapat dibuka dari smartphone atau tablet?
                </div>
                <p className="text-[11px] text-slate-600">
                  A: Ya, aplikasi BSAN responsif secara penuh di berbagai ukuran layar. Sidebar navigasi otomatis berubah menjadi overlay drawer di mobile sehingga tidak menutupi isi konten.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Butuh bantuan teknis lebih lanjut? Hubungi Tim Kesiswaan / Tim IT SMPN 1 Kandangan
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
          >
            Tutup Bantuan
          </button>
        </div>
      </div>
    </div>
  );
};
