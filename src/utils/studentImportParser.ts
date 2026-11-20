import * as XLSX from 'xlsx';
import { AttendanceStatus, Gender, Student } from '../types';

export interface ParseStudentFileResult {
  students: Student[];
  detectedColumns: string[];
  skippedRows: number;
  totalRawRows: number;
  fileName: string;
  sheetName?: string;
  error?: string;
}

type StudentFieldKey =
  | 'nisn'
  | 'nama'
  | 'kelas'
  | 'jenjang'
  | 'gender'
  | 'noHpSiswa'
  | 'namaOrtu'
  | 'noWaOrtu'
  | 'alamat'
  | 'statusKehadiran'
  | 'keteranganKehadiran'
  | 'totalPoinPelanggaran'
  | 'totalPelanggaranRingan'
  | 'totalPelanggaranSedang'
  | 'totalPelanggaranBerat';

const HEADER_ALIASES: Record<string, StudentFieldKey> = {
  // NISN
  nisn: 'nisn',
  no_induk: 'nisn',
  nomor_induk: 'nisn',
  nis: 'nisn',
  // Nama
  nama: 'nama',
  nama_lengkap: 'nama',
  nama_siswa: 'nama',
  nama_murid: 'nama',
  nama_peserta_didik: 'nama',
  peserta_didik: 'nama',
  // Kelas
  kelas: 'kelas',
  rombel: 'kelas',
  nama_rombel: 'kelas',
  kelas_rombel: 'kelas',
  // Jenjang
  jenjang: 'jenjang',
  tingkat: 'jenjang',
  tingkat_pendidikan: 'jenjang',
  // Gender
  gender: 'gender',
  jenis_kelamin: 'gender',
  kelamin: 'gender',
  jk: 'gender',
  lp: 'gender',
  l_p: 'gender',
  // No HP Siswa
  nohpsiswa: 'noHpSiswa',
  no_hp_siswa: 'noHpSiswa',
  hp_siswa: 'noHpSiswa',
  no_hp: 'noHpSiswa',
  hp: 'noHpSiswa',
  telepon: 'noHpSiswa',
  telp_siswa: 'noHpSiswa',
  // Nama Orang Tua / Wali
  namaortu: 'namaOrtu',
  nama_ortu: 'namaOrtu',
  nama_orang_tua: 'namaOrtu',
  nama_orangtua: 'namaOrtu',
  orang_tua: 'namaOrtu',
  orang_tua_wali: 'namaOrtu',
  nama_orang_tua_wali: 'namaOrtu',
  nama_wali: 'namaOrtu',
  wali: 'namaOrtu',
  // No WA Orang Tua
  nowaortu: 'noWaOrtu',
  no_wa_ortu: 'noWaOrtu',
  no_wa_orang_tua: 'noWaOrtu',
  no_wa_orangtua: 'noWaOrtu',
  no_wa: 'noWaOrtu',
  wa_ortu: 'noWaOrtu',
  wa_wali: 'noWaOrtu',
  no_hp_ortu: 'noWaOrtu',
  hp_ortu: 'noWaOrtu',
  telepon_ortu: 'noWaOrtu',
  no_telp_ortu: 'noWaOrtu',
  // Alamat
  alamat: 'alamat',
  alamat_rumah: 'alamat',
  domisili: 'alamat',
  // Status Kehadiran
  statuskehadiran: 'statusKehadiran',
  status_kehadiran: 'statusKehadiran',
  kehadiran: 'statusKehadiran',
  presensi: 'statusKehadiran',
  status_presensi: 'statusKehadiran',
  // Keterangan Kehadiran
  keterangankehadiran: 'keteranganKehadiran',
  keterangan_kehadiran: 'keteranganKehadiran',
  keterangan: 'keteranganKehadiran',
  // Pelanggaran counters
  totalpoinpelanggaran: 'totalPoinPelanggaran',
  total_poin_pelanggaran: 'totalPoinPelanggaran',
  poin_pelanggaran: 'totalPoinPelanggaran',
  totalpelanggaranringan: 'totalPelanggaranRingan',
  pelanggaran_ringan: 'totalPelanggaranRingan',
  totalpelanggaransedang: 'totalPelanggaranSedang',
  pelanggaran_sedang: 'totalPelanggaranSedang',
  totalpelanggaranberat: 'totalPelanggaranBerat',
  pelanggaran_berat: 'totalPelanggaranBerat',
};

const normalizeHeaderKey = (raw: string): string => {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const cleanCellValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Strip Excel text formula wrapper e.g. ="0089218299"
  const eqMatch = str.match(/^="([\s\S]*)"$/);
  if (eqMatch) {
    str = eqMatch[1].trim();
  }
  return str;
};

const normalizeClassName = (raw: string): string => {
  const cleaned = raw.trim().replace(/[\s-]+/g, '').toUpperCase();
  if (!cleaned) return '';
  // Handle formats like "VIIA" / "VIII B" / "IX-C" if encountered
  if (cleaned.startsWith('VIII')) return `8${cleaned.slice(4)}`;
  if (cleaned.startsWith('VII')) return `7${cleaned.slice(3)}`;
  if (cleaned.startsWith('IX')) return `9${cleaned.slice(2)}`;
  return cleaned;
};

const parseGender = (raw: string): Gender => {
  const v = raw.trim().toLowerCase();
  if (v === 'p' || v.startsWith('perempuan') || v === 'pr' || v === 'wanita' || v === 'f' || v === 'female') {
    return 'P';
  }
  return 'L';
};

const parseAttendanceStatus = (raw: string): AttendanceStatus => {
  const v = raw.trim().toLowerCase();
  if (v === 'sakit' || v === 's') return 'Sakit';
  if (v === 'izin' || v === 'i') return 'Izin';
  if (v === 'alfa' || v === 'alpa' || v === 'a') return 'Alfa';
  return 'Hadir';
};

const parseSafeInt = (raw: string, fallback = 0): number => {
  const num = parseInt(String(raw || '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * RFC-4180 compliant CSV/TSV/semicolon parser that respects quoted fields & escaped quotes
 */
const parseDelimitedTextToMatrix = (text: string): string[][] => {
  const cleanText = text.replace(/^\uFEFF/, '');
  // Auto-detect delimiter from first non-empty line outside quotes
  const firstLine = cleanText.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  const countDelimiterOutsideQuotes = (line: string, delim: string): number => {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (!inQuotes && ch === delim) count++;
    }
    return count;
  };

  const candidates: Array<{ d: string; count: number }> = [
    { d: ',', count: countDelimiterOutsideQuotes(firstLine, ',') },
    { d: ';', count: countDelimiterOutsideQuotes(firstLine, ';') },
    { d: '\t', count: countDelimiterOutsideQuotes(firstLine, '\t') },
  ];
  candidates.sort((a, b) => b.count - a.count);
  const delimiter = candidates[0].count > 0 ? candidates[0].d : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        currentRow.push(cleanCellValue(currentField));
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(cleanCellValue(currentField));
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(cleanCellValue(currentField));
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(cleanCellValue(currentField));
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell !== ''));
};

/**
 * Extract exact 2D string matrix from an XLSX worksheet while avoiding scientific notation for long numeric IDs/phones
 */
const extractWorksheetMatrix = (sheet: XLSX.WorkSheet): string[][] => {
  const ref = sheet['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const rows: string[][] = [];

  for (let R = range.s.r; R <= range.e.r; R++) {
    const row: string[] = [];
    let hasNonEmpty = false;
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[addr];
      let val = '';
      if (cell) {
        if (cell.t === 'n') {
          // If Excel rendered scientific notation (e.g. 6.28123E+12), read raw integer number instead
          if (typeof cell.w === 'string' && !/[eE][+-]?\d+/.test(cell.w)) {
            val = cleanCellValue(cell.w);
          } else if (typeof cell.v === 'number') {
            val = Number.isInteger(cell.v) ? String(cell.v) : String(cell.v);
          }
        } else {
          val = cleanCellValue(cell.w ?? cell.v);
        }
      }
      if (val !== '') hasNonEmpty = true;
      row.push(val);
    }
    if (hasNonEmpty) {
      rows.push(row);
    }
  }
  return rows;
};

/**
 * Parse uploaded student database file (.xlsx, .xls, .csv, .txt) into exact Student[] records
 */
export const parseStudentDatabaseFile = async (
  file: File,
  existingStudents: Student[]
): Promise<ParseStudentFileResult> => {
  try {
    const lowerName = file.name.toLowerCase();
    const isExcelBinary = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.ods');

    let matrix: string[][] = [];
    let sheetName: string | undefined;

    if (isExcelBinary) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstNonEmptySheet =
        workbook.SheetNames.find((name) => {
          const s = workbook.Sheets[name];
          return s && s['!ref'];
        }) || workbook.SheetNames[0];

      if (!firstNonEmptySheet || !workbook.Sheets[firstNonEmptySheet]) {
        return {
          students: [],
          detectedColumns: [],
          skippedRows: 0,
          totalRawRows: 0,
          fileName: file.name,
          error: 'File Excel tidak memiliki lembar kerja (worksheet) yang valid.',
        };
      }
      sheetName = firstNonEmptySheet;
      matrix = extractWorksheetMatrix(workbook.Sheets[firstNonEmptySheet]);
    } else {
      const text = await file.text();
      matrix = parseDelimitedTextToMatrix(text);
    }

    if (matrix.length < 2) {
      return {
        students: [],
        detectedColumns: [],
        skippedRows: 0,
        totalRawRows: matrix.length,
        fileName: file.name,
        sheetName,
        error: 'File tidak berisi baris data murid yang valid (minimal harus ada baris judul kolom dan 1 baris data).',
      };
    }

    // Locate the header row within first 10 rows
    let headerRowIndex = 0;
    let bestScore = -1;
    for (let i = 0; i < Math.min(10, matrix.length); i++) {
      let score = 0;
      matrix[i].forEach((cell) => {
        const key = normalizeHeaderKey(cell);
        if (HEADER_ALIASES[key]) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        headerRowIndex = i;
      }
    }

    const headerCells = matrix[headerRowIndex];
    const columnMap = new Map<number, StudentFieldKey>();
    const detectedColumns: string[] = [];

    headerCells.forEach((rawHeader, idx) => {
      const norm = normalizeHeaderKey(rawHeader);
      const mapped = HEADER_ALIASES[norm];
      if (mapped && !Array.from(columnMap.values()).includes(mapped)) {
        columnMap.set(idx, mapped);
        detectedColumns.push(`${rawHeader.trim()} → ${mapped}`);
      }
    });

    // If no standard headers were matched at all, reject rather than importing garbage
    const mappedFields = new Set(columnMap.values());
    if (!mappedFields.has('nama') && !mappedFields.has('nisn')) {
      return {
        students: [],
        detectedColumns: [],
        skippedRows: 0,
        totalRawRows: matrix.length,
        fileName: file.name,
        sheetName,
        error:
          'Format judul kolom tidak dikenali. Pastikan baris header memiliki minimal kolom "nama" (atau "Nama_Lengkap") dan "nisn" / "kelas" sesuai template.',
      };
    }

    const existingByNisn = new Map<string, Student>();
    const existingByNameClass = new Map<string, Student>();
    existingStudents.forEach((s) => {
      if (s.nisn) existingByNisn.set(s.nisn.trim(), s);
      if (s.nama && s.kelas) {
        existingByNameClass.set(`${s.nama.trim().toLowerCase()}::${s.kelas.trim().toUpperCase()}`, s);
      }
    });

    const parsedStudents: Student[] = [];
    const usedIds = new Set<string>();
    let skippedRows = 0;
    const baseTs = Date.now();

    for (let r = headerRowIndex + 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || row.every((c) => !c || c.trim() === '')) {
        continue;
      }

      const record: Partial<Record<StudentFieldKey, string>> = {};
      columnMap.forEach((fieldKey, colIdx) => {
        record[fieldKey] = cleanCellValue(row[colIdx] ?? '');
      });

      const nama = (record.nama || '').trim();
      const nisn = (record.nisn || '').trim();

      // Skip repeated header rows or summary/footer rows with no name
      if (!nama || normalizeHeaderKey(nama) === 'nama' || normalizeHeaderKey(nama) === 'nama_lengkap') {
        skippedRows++;
        continue;
      }

      const rawKelas = record.kelas || '';
      const kelas = normalizeClassName(rawKelas) || '7A';
      const jenjangNum = record.jenjang ? parseSafeInt(record.jenjang, 0) : 0;
      const jenjang =
        jenjangNum >= 7 && jenjangNum <= 9
          ? jenjangNum
          : parseSafeInt(kelas.replace(/\D/g, '').charAt(0), 7);

      const matchedExisting =
        (nisn ? existingByNisn.get(nisn) : undefined) ||
        existingByNameClass.get(`${nama.toLowerCase()}::${kelas.toUpperCase()}`);

      let id = matchedExisting?.id || `std-up-${baseTs}-${r}`;
      if (usedIds.has(id)) {
        id = `std-up-${baseTs}-${r}-${Math.random().toString(36).slice(2, 6)}`;
      }
      usedIds.add(id);

      const student: Student = {
        id,
        nisn: nisn || (matchedExisting?.nisn ?? ''),
        nama,
        kelas,
        jenjang: jenjang >= 7 && jenjang <= 9 ? jenjang : 7,
        gender: parseGender(record.gender || matchedExisting?.gender || 'L'),
        noHpSiswa: record.noHpSiswa ?? '',
        namaOrtu: record.namaOrtu ?? '',
        noWaOrtu: record.noWaOrtu ?? '',
        alamat: record.alamat ?? '',
        statusKehadiran: record.statusKehadiran
          ? parseAttendanceStatus(record.statusKehadiran)
          : (matchedExisting?.statusKehadiran || 'Hadir'),
        keteranganKehadiran: record.keteranganKehadiran ?? (matchedExisting?.keteranganKehadiran || ''),
        totalPoinPelanggaran: record.totalPoinPelanggaran !== undefined && record.totalPoinPelanggaran !== ''
          ? parseSafeInt(record.totalPoinPelanggaran, 0)
          : (matchedExisting?.totalPoinPelanggaran || 0),
        totalPelanggaranRingan: record.totalPelanggaranRingan !== undefined && record.totalPelanggaranRingan !== ''
          ? parseSafeInt(record.totalPelanggaranRingan, 0)
          : (matchedExisting?.totalPelanggaranRingan || 0),
        totalPelanggaranSedang: record.totalPelanggaranSedang !== undefined && record.totalPelanggaranSedang !== ''
          ? parseSafeInt(record.totalPelanggaranSedang, 0)
          : (matchedExisting?.totalPelanggaranSedang || 0),
        totalPelanggaranBerat: record.totalPelanggaranBerat !== undefined && record.totalPelanggaranBerat !== ''
          ? parseSafeInt(record.totalPelanggaranBerat, 0)
          : (matchedExisting?.totalPelanggaranBerat || 0),
      };

      parsedStudents.push(student);
    }

    if (parsedStudents.length === 0) {
      return {
        students: [],
        detectedColumns,
        skippedRows,
        totalRawRows: matrix.length - headerRowIndex - 1,
        fileName: file.name,
        sheetName,
        error: 'Tidak ada data murid yang dapat dibaca dari file tersebut. Periksa kembali isi kolom nama dan kelas.',
      };
    }

    return {
      students: parsedStudents,
      detectedColumns,
      skippedRows,
      totalRawRows: matrix.length - headerRowIndex - 1,
      fileName: file.name,
      sheetName,
    };
  } catch (err) {
    console.error('Failed parsing student database file:', err);
    return {
      students: [],
      detectedColumns: [],
      skippedRows: 0,
      totalRawRows: 0,
      fileName: file.name,
      error: `Gagal membaca file "${file.name}". Pastikan file merupakan CSV atau Excel (.xlsx / .xls) yang valid dan tidak rusak.`,
    };
  }
};
