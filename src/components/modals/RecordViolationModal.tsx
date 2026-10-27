import React, { useState } from 'react';
import { Student, TataTertibItem, ViolationRecord, DisciplinaryStage } from '../../types';
import { TATA_TERTIB_ITEMS, determineDisciplinaryStage } from '../../data/rulesData';
import { 
  X, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles
} from 'lucide-react';

interface RecordViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudentId?: string;
  onSaveViolation: (violation: ViolationRecord) => void;
  onOpenSurat: (violation: ViolationRecord) => void;
  onOpenWa: (student: Student, violation: ViolationRecord) => void;
}

export const RecordViolationModal: React.FC<RecordViolationModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudentId,
  onSaveViolation,
  onOpenSurat,
  onOpenWa,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('p1-1');
  const [activePasalTab, setActivePasalTab] = useState<number>(1);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [searchRule, setSearchRule] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('Halaman Upacara / Piket');
  const [guruPencatat, setGuruPencatat] = useState<string>('Drs. Subagyo (Guru Piket)');
  const [catatanKhusus, setCatatanKhusus] = useState<string>('');
  const [customWaktu, setCustomWaktu] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [customTanggal, setCustomTanggal] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === (selectedStudentId || preselectedStudentId));
  const currentRule = TATA_TERTIB_ITEMS.find((r) => r.id === selectedRuleId) || TATA_TERTIB_ITEMS[0];

  // Calculate predicted stage based purely on Ringan, Sedang, Berat counts
  const currentRingan = (currentStudent?.totalPelanggaranRingan || 0) + (currentRule.tingkat === 'Ringan' ? 1 : 0);
  const currentSedang = (currentStudent?.totalPelanggaranSedang || 0) + (currentRule.tingkat === 'Sedang' ? 1 : 0);
  const currentBerat = (currentStudent?.totalPelanggaranBerat || 0) + (currentRule.tingkat === 'Berat' ? 1 : 0);

  const predictedStage: DisciplinaryStage = determineDisciplinaryStage(
    currentRule.tingkat,
    currentRingan,
    currentSedang,
    currentBerat
  );

  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nisn.includes(searchStudent) ||
      s.kelas.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const filteredRules = TATA_TERTIB_ITEMS.filter((r) => {
    const matchSearch =
      r.uraian.toLowerCase().includes(searchRule.toLowerCase()) ||
      r.kode.toLowerCase().includes(searchRule.toLowerCase()) ||
      r.pasalTitle.toLowerCase().includes(searchRule.toLowerCase());
    return searchRule ? matchSearch : r.pasal === activePasalTab;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) {
      alert('Pilih siswa terlebih dahulu!');
      return;
    }

    const newViolation: ViolationRecord = {
      id: `viol-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.nama,
      kelas: currentStudent.kelas,
      pasalId: currentRule.id,
      pasalNumber: currentRule.pasal,
      pasalTitle: currentRule.pasalTitle,
      kodePasal: currentRule.kode,
      uraian: currentRule.uraian,
      tingkat: currentRule.tingkat,
      poin: 0,
      tanggal: customTanggal,
      waktu: customWaktu,
      lokasi,
      guruPencatat,
      tahapPembinaan: predictedStage,
      statusSurat: 'Diterbitkan',
      catatanKhusus,
      noWaOrtu: currentStudent.noWaOrtu,
      namaOrtu: currentStudent.namaOrtu,
    };

    onSaveViolation(newViolation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#0B231E] px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#83C532] text-[#0B231E] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base">Input Pencatatan Pelanggaran Tata Tertib</h3>
              <p className="text-xs text-slate-300">
                Pedoman Resmi Tata Tertib SMPN 1 Kandangan (Kec. Kandangan, Kab. Temanggung)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Pemilihan Siswa */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>1. Identitas Siswa</span>
              {currentStudent && (
                <span className="text-emerald-700 font-semibold normal-case">
                  Kelas {currentStudent.kelas} · {currentStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              )}
            </label>

            {!preselectedStudentId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Cari nama, NISN, atau kelas..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/40"
                  />
                  <div className="mt-1 max-h-32 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-1 divide-y divide-slate-100">
                    {filteredStudents.slice(0, 8).map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`p-2 text-xs rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                          selectedStudentId === s.id
                            ? 'bg-[#0B231E] text-white font-medium'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{s.nama}</div>
                          <div className="text-[10px] opacity-75">NISN: {s.nisn} · Ortu: {s.namaOrtu}</div>
                        </div>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/10">
                          {s.kelas}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentStudent ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 text-sm">{currentStudent.nama}</div>
                    <div className="text-slate-600">Alamat: {currentStudent.alamat}</div>
                    <div className="text-slate-600">No WA Ortu: <span className="font-mono">{currentStudent.noWaOrtu}</span></div>
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-[11px]">
                      <span>Riwayat Kasus:</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Ringan: {currentStudent.totalPelanggaranRingan}
                      </span>
                      <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Sedang: {currentStudent.totalPelanggaranSedang}
                      </span>
                      <span className="font-semibold text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Berat: {currentStudent.totalPelanggaranBerat}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Pilih siswa dari daftar di samping untuk menghubungkan catatan pelanggaran.</span>
                  </div>
                )}
              </div>
            ) : (
              currentStudent && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{currentStudent.nama} ({currentStudent.kelas})</div>
                    <div className="text-slate-600">NISN: {currentStudent.nisn} · Wali: {currentStudent.namaOrtu} ({currentStudent.noWaOrtu})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Riwayat Kasus</div>
                    <div className="text-xs font-semibold text-slate-800">
                      R: {currentStudent.totalPelanggaranRingan} · S: {currentStudent.totalPelanggaranSedang} · B: {currentStudent.totalPelanggaranBerat}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Section 2: Pemilihan Pasal Tata Tertib */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Pilih Pasal Tata Tertib Resmi SMPN 1 Kandangan
              </label>
              <input
                type="text"
                value={searchRule}
                onChange={(e) => setSearchRule(e.target.value)}
                placeholder="Cari kata kunci tata tertib..."
                className="px-3 py-1 text-xs rounded-lg border border-slate-200 max-w-xs focus:ring-1 focus:ring-[#83C532]"
              />
            </div>

            {/* Pasal Tabs */}
            {!searchRule && (
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { num: 1, label: 'Pasal 1: Seragam' },
                  { num: 2, label: 'Pasal 2: Rambut & Hiasan' },
                  { num: 3, label: 'Pasal 3: Kehadiran' },
                  { num: 4, label: 'Pasal 4: Ibadah & Belajar' },
                  { num: 5, label: 'Pasal 5: Pelanggaran Berat' },
                  { num: 6, label: 'Pasal 6: Lingkungan & Fasilitas' },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.num}
                    onClick={() => setActivePasalTab(p.num)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      activePasalTab === p.num
                        ? 'bg-[#0B231E] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* List of rules - Zero points */}
            <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
              {filteredRules.map((rule) => {
                const isSelected = selectedRuleId === rule.id;

                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0B231E] bg-white ring-2 ring-[#0B231E]/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {rule.kode}
                        </span>
                        <span className="font-semibold text-slate-900">{rule.pasalTitle}</span>
                      </div>
                      <span
                        className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${
                          rule.tingkat === 'Berat'
                            ? 'bg-red-100 text-red-800'
                            : rule.tingkat === 'Sedang'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Klasifikasi: {rule.tingkat}
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-700 leading-relaxed font-medium">{rule.uraian}</p>
                    <div className="mt-1 text-[11px] text-slate-500 italic">
                      Sanksi Prosedural: {rule.sanksiDefault}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Waktu, Lokasi & Petugas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal & Waktu Kejadian
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customTanggal}
                  onChange={(e) => setCustomTanggal(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                />
                <input
                  type="time"
                  value={customWaktu}
                  onChange={(e) => setCustomWaktu(e.target.value)}
                  className="w-24 text-xs p-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lokasi Kejadian
              </label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Gerbang Utama / Kantin"
                className="w-full text-xs p-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Guru / Petugas Pencatat
              </label>
              <input
                type="text"
                value={guruPencatat}
                onChange={(e) => setGuruPencatat(e.target.value)}
                placeholder="Nama & Jabatan Guru"
                className="w-full text-xs p-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Section 4: Catatan Khusus */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan Penanganan / Fakta di Lapangan (Opsional)
            </label>
            <textarea
              rows={2}
              value={catatanKhusus}
              onChange={(e) => setCatatanKhusus(e.target.value)}
              placeholder="Tambahkan kronologi singkat atau barang bukti yang disita bila ada..."
              className="w-full text-xs p-2 rounded-xl border border-slate-200"
            />
          </div>

          {/* Section 5: Prediksi Penjenjangan Otomatis */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-900">
                Otomasi Penjenjangan Pembinaan Berdasarkan Klasifikasi:
              </div>
              <div className="text-emerald-800 font-semibold mt-0.5 text-sm">
                {predictedStage}
              </div>
              <div className="text-emerald-700/90 text-[11px] mt-1">
                Sistem secara otomatis menetapkan jenjang penanggung jawab (Piket ➔ Wali Kelas ➔ BK ➔ Wakasek Kesiswaan ➔ Kepala Sekolah) berdasarkan riwayat dan tingkat pelanggaran resmi.
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!currentStudent}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                currentStudent
                  ? 'bg-[#0B231E] hover:bg-[#143d34] text-white active:scale-95'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#83C532]" />
              <span>Simpan & Terbitkan Pelanggaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
