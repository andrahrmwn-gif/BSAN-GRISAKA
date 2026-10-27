import React, { useState } from 'react';
import { TATA_TERTIB_ITEMS } from '../../data/rulesData';
import { SchoolProfile } from '../../types';
import { 
  BookOpen, 
  Search, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Gavel, 
  ChevronRight, 
  Sparkles, 
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  Users,
  Award,
  Clock,
  Compass
} from 'lucide-react';

interface TataTertibDocViewProps {
  schoolConfig: SchoolProfile;
  onSelectRuleForStudent?: (ruleId: string) => void;
}

export const TataTertibDocView: React.FC<TataTertibDocViewProps> = ({
  schoolConfig,
  onSelectRuleForStudent,
}) => {
  const [activePasal, setActivePasal] = useState<number>(1);
  const [searchWord, setSearchWord] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Enterprise KPI metadata for each pasal
  const pasalKPIData = [
    {
      num: 1,
      badge: 'REGULASI SERAGAM',
      title: 'PASAL 01: KETENTUAN TATA BUSANA, SERAGAM & ATRIBUT RESMI',
      subtitle: 'Standarisasi seragam harian (OSIS, Identitas Sekolah, Pramuka), kerapian berpakaian, dan larangan model modifikasi ketat.',
      totalIndikator: 5,
      klasifikasi: 'Ringan & Sedang',
      pic: 'Tim Ketertiban & Piket',
      targetKepatuhan: '100% Kerapian Busana',
      gradien: 'from-emerald-950 via-[#0B231E] to-[#124237]'
    },
    {
      num: 2,
      badge: 'ESTETIKA & KERAPIAN',
      title: 'PASAL 02: KERAPIAN RAMBUT, WAJAH & LARANGAN BERHIAS DIRI',
      subtitle: 'Standar potongan pola 3-2-1 cm / bros putra, larangan cat rambut/bleaching, tindik, tato, dan riasan kosmetik berlebih.',
      totalIndikator: 4,
      klasifikasi: 'Ringan & Sedang',
      pic: 'Wali Kelas & Guru BK',
      targetKepatuhan: '100% Standar Pola Bros',
      gradien: 'from-slate-900 via-[#102722] to-[#173e35]'
    },
    {
      num: 3,
      badge: 'PRESENSI & JAM MASUK',
      title: 'PASAL 03: TATA TERTIB KEHADIRAN, KETERLAMBATAN & PERIZINAN',
      subtitle: 'Ketentuan jam masuk tepat waktu pk 06.45 WIB, pencegahan membolos (alfa), prosedur izin tertulis, dan ketertiban KBM.',
      totalIndikator: 4,
      klasifikasi: 'Ringan & Sedang',
      pic: 'Guru Piket & Kesiswaan',
      targetKepatuhan: '> 98% Tingkat Hadir',
      gradien: 'from-teal-950 via-[#0B231E] to-[#0f3a30]'
    },
    {
      num: 4,
      badge: 'INTEGRITAS AKADEMIK',
      title: 'PASAL 04: KEWAJIBAN PEMBELAJARAN, UPACARA & IBADAH RELIGIUS',
      subtitle: 'Kedisiplinan tugas akademik, salat zuhur berjemaah / ibadah rohani non-muslim, ekstrakurikuler Pramuka wajib, dan literasi.',
      totalIndikator: 4,
      klasifikasi: 'Tingkat Ringan',
      pic: 'Guru Agama & Mapel',
      targetKepatuhan: '100% Keterlibatan Ibadah',
      gradien: 'from-cyan-950 via-[#0a2723] to-[#113a34]'
    },
    {
      num: 5,
      badge: 'NOL TOLERANSI / ZERO-TOLERANCE',
      title: 'PASAL 05: TINDAK KRIMINALITAS, PERUNDUNGAN & PELANGGARAN BERAT',
      subtitle: 'Larangan mutlak narkoba, rokok/vape, miras, tawuran, bullying fisik/siber, judi online/slot, perbuatan asusila, dan senjata tajam.',
      totalIndikator: 7,
      klasifikasi: 'Tingkat Berat',
      pic: 'Kepala Sekolah & Tim Khusus',
      targetKepatuhan: '0 Insiden Kriminalitas',
      gradien: 'from-rose-950 via-[#260f14] to-[#1a0b10]'
    },
    {
      num: 6,
      badge: 'FASILITAS & LINGKUNGAN',
      title: 'PASAL 06: KETERTIBAN LINGKUNGAN, SARPRAS & ZERO-PLASTIC',
      subtitle: 'Pemeliharaan fasilitas sekolah, larangan vandalisme, penertiban kendaraan bermotor, etika gawai (smartphone), dan adiwiyata.',
      totalIndikator: 4,
      klasifikasi: 'Ringan & Sedang',
      pic: 'Tim Sarpras & Kebersihan',
      targetKepatuhan: '100% Bebas Sampah Plastik',
      gradien: 'from-emerald-950 via-[#0f2e27] to-[#173e35]'
    },
  ];

  const currentKPI = pasalKPIData.find((p) => p.num === activePasal) || pasalKPIData[0];

  const filteredItems = TATA_TERTIB_ITEMS.filter((item) => {
    const matchSearch = searchWord === '' || 
      item.uraian.toLowerCase().includes(searchWord.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchWord.toLowerCase()) ||
      item.sanksiDefault.toLowerCase().includes(searchWord.toLowerCase());

    const matchPasal = searchWord ? true : item.pasal === activePasal;
    const matchSeverity = severityFilter === 'all' || item.tingkat === severityFilter;

    return matchSearch && matchPasal && matchSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#0B231E] text-white p-6 lg:p-8 rounded-3xl border border-[#1b5042] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-[#83C532]/25 text-[#83C532] font-bold">
                KODIFIKASI HUKUM & TATA TERTIB SEKOLAH
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">SK Kepala {schoolConfig.name || 'SMPN 1 Kandangan'}</span>
            </div>

            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
              Pusat Dokumen Tata Tertib & Pedoman BSAN
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Kompilasi pasal regulasi, target kepatuhan indikator kedisiplinan, serta penjenjangan sanksi resmi berbasis Budaya Sekolah Aman dan Nyaman (BSAN) Grisaka Temanggung.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="Cari indikator, kode aturan, sanksi..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-white/20 bg-black/20 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#83C532]/60"
            />
          </div>
        </div>
      </div>

      {/* Alur Penjenjangan Sanksi (Berdasarkan Akumulasi Kasus - Zero Points) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-[#0B231E]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Alur Hierarki Penjenjangan Sanksi & Pembinaan Kedisiplinan:
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Berdasarkan Akumulasi Kasus</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Level 1 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-700 text-white">
                  TAHAP 1
                </span>
                <span className="text-[11px] font-bold text-emerald-800">Kasus Ringan (1x)</span>
              </div>
              <div className="font-bold text-slate-900 text-xs mt-2">Guru Mapel / Piket</div>
              <p className="text-[11px] text-slate-600 mt-1">Teguran lisan, edukasi karakter, pencatatan di buku kontrol piket harian.</p>
            </div>
            <div className="mt-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span>Pelanggaran Ringan Awal</span>
            </div>
          </div>

          {/* Level 2 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-700 text-white">
                  TAHAP 2
                </span>
                <span className="text-[11px] font-bold text-blue-800">Ringan Berulang (2-3x)</span>
              </div>
              <div className="font-bold text-slate-900 text-xs mt-2">Wali Kelas</div>
              <p className="text-[11px] text-slate-600 mt-1">Pembinaan personal, komunikasi WA wali murid, dan penerbitan Surat Pernyataan Siswa.</p>
            </div>
            <div className="mt-2 text-[10px] text-blue-700 font-semibold flex items-center gap-1">
              <span>Pernyataan Siswa</span>
            </div>
          </div>

          {/* Level 3 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-700 text-white">
                  TAHAP 3
                </span>
                <span className="text-[11px] font-bold text-amber-800">Kasus Sedang (1-2x)</span>
              </div>
              <div className="font-bold text-slate-900 text-xs mt-2">Guru Bimbingan Konseling</div>
              <p className="text-[11px] text-slate-600 mt-1">Konseling individu/kelompok, penandatanganan kontrak perilaku, pemantauan khusus.</p>
            </div>
            <div className="mt-2 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
              <span>Kontrak Perilaku BK</span>
            </div>
          </div>

          {/* Level 4 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-orange-700 text-white">
                  TAHAP 4
                </span>
                <span className="text-[11px] font-bold text-orange-800">Sedang Berulang / SP</span>
              </div>
              <div className="font-bold text-slate-900 text-xs mt-2">Wakasek Urusan Kesiswaan</div>
              <p className="text-[11px] text-slate-600 mt-1">Pemanggilan orang tua resmi ke sekolah, konferensi kasus, penandatanganan SP resmi.</p>
            </div>
            <div className="mt-2 text-[10px] text-orange-700 font-semibold flex items-center gap-1">
              <span>Surat Peringatan (SP)</span>
            </div>
          </div>

          {/* Level 5 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-red-700 text-white">
                  TAHAP 5
                </span>
                <span className="text-[11px] font-bold text-red-800">Pelanggaran Berat</span>
              </div>
              <div className="font-bold text-slate-900 text-xs mt-2">Kepala Sekolah & Tim Terpadu</div>
              <p className="text-[11px] text-slate-600 mt-1">Sidang Dewan Kehormatan Guru, skorsing, hingga tindakan alih bina peserta didik.</p>
            </div>
            <div className="mt-2 text-[10px] text-red-700 font-semibold flex items-center gap-1">
              <span>Sidang Pleno & Skorsing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pasal Selector Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {pasalKPIData.map((pasal) => {
          const isActive = activePasal === pasal.num && !searchWord;
          return (
            <button
              key={pasal.num}
              onClick={() => {
                setActivePasal(pasal.num);
                setSearchWord('');
              }}
              className={`p-3 rounded-2xl text-left border transition-all ${
                isActive
                  ? 'bg-[#0B231E] border-[#0B231E] text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-[#83C532] text-[#0B231E]' : 'bg-slate-100 text-slate-700'
                }`}>
                  PASAL {pasal.num}
                </span>
                <span className={`text-[10px] font-bold ${
                  pasal.num === 5 ? 'text-red-500' : isActive ? 'text-emerald-300' : 'text-slate-500'
                }`}>
                  {pasal.totalIndikator} Aturan
                </span>
              </div>
              <div className="font-bold text-xs mt-1.5 line-clamp-1">
                {pasal.badge}
              </div>
            </button>
          );
        })}
      </div>

      {/* COOL ENTERPRISE KPI BANNER FOR THE SELECTED PASAL */}
      {!searchWord && (
        <div className={`p-6 lg:p-7 rounded-3xl bg-gradient-to-r ${currentKPI.gradien} text-white shadow-lg space-y-4`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-[#83C532] font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-[#83C532]" />
                <span>KPI PROTOKOL KEPATUHAN SISWA</span>
              </div>
              <h2 className="text-lg lg:text-xl font-black text-white tracking-tight">
                {currentKPI.title}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {currentKPI.subtitle}
              </p>
            </div>
          </div>

          {/* 4 Distinct KPI Stat Cards for this Pasal */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* KPI 1 */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                Total Indikator Aturan
              </div>
              <div className="text-xl font-black font-mono text-[#83C532] mt-0.5">
                {currentKPI.totalIndikator} Butir
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Standar Peraturan Sekolah</div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                Klasifikasi Pelanggaran
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {currentKPI.klasifikasi}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Tingkat Penindakan Sanksi</div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                Penanggung Jawab Utama
              </div>
              <div className="text-xl font-black text-white mt-0.5 truncate">
                {currentKPI.pic}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Aparatur Pembinaan Grisaka</div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                Target Kepatuhan BSAN
              </div>
              <div className="text-xl font-black text-[#83C532] mt-0.5">
                {currentKPI.targetKepatuhan}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Sasaran Mutu Karakter</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Count Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0B231E]" />
          <span>Rincian Indikator Pelanggaran & Sanksi Prosedural:</span>
          <span className="font-mono text-slate-500 font-normal">({filteredItems.length} indikator)</span>
        </div>

        {/* Filter by severity */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Tingkat:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="all">Semua Tingkat</option>
            <option value="Ringan">Ringan Saja</option>
            <option value="Sedang">Sedang Saja</option>
            <option value="Berat">Berat Saja</option>
          </select>
        </div>
      </div>

      {/* ELEGANT INDIKATOR CARDS LIST (UNDERNEATH KPI) - ZERO POINTS */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
            Tidak ditemukan indikator tata tertib dengan kriteria pencarian ini.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isBerat = item.tingkat === 'Berat';
            const isSedang = item.tingkat === 'Sedang';

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#0B231E]/40 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Code, Pasal, & Text */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-[#0B231E] text-white">
                        {item.kode}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {item.pasalTitle}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isBerat
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : isSedang
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        Klasifikasi: {item.tingkat}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 leading-relaxed pt-1">
                      {item.uraian}
                    </p>

                    {/* Sanksi & Prosedur Pembinaan */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        Sanksi Default & Prosedur Pembinaan:
                      </div>
                      <div className="text-slate-800 font-medium">
                        {item.sanksiDefault}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Action Button */}
                  {onSelectRuleForStudent && (
                    <div className="shrink-0 self-end md:self-center">
                      <button
                        onClick={() => onSelectRuleForStudent(item.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0B231E] hover:bg-[#143d34] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Pilih Indikator Ini</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#83C532]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
