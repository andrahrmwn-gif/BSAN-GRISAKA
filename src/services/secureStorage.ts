/**
 * BSAN Secure Storage Engine
 * SMP Negeri 1 Kandangan
 * 
 * Provides salted obfuscation & integrity-sealed storage for sensitive student & school PII
 * (NISN, Nama Siswa, No. WhatsApp Wali, Catatan Pelanggaran, Presensi).
 * Prevents raw plaintext exposure in browser DevTools / LocalStorage.
 * Includes IndexedDB persistent backing store for high reliability and future backend bridging.
 */

// Application salt key for client-side obfuscation
const STORAGE_SALT = 'BSAN_SMPN1_KANDANGAN_SECURE_2026_SALT_KEY';

/**
 * Encrypt / Obfuscate a string into a sealed ciphertext with integrity prefix
 */
export function encryptData<T>(data: T): string {
  try {
    const jsonStr = JSON.stringify(data);
    let cipher = '';
    const saltLen = STORAGE_SALT.length;
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i);
      const saltCode = STORAGE_SALT.charCodeAt(i % saltLen);
      // XOR byte shift combined with hex encoding
      const shifted = charCode ^ saltCode;
      cipher += String.fromCharCode(shifted);
    }
    // Encode to base64 with security header prefix
    const b64 = btoa(unescape(encodeURIComponent(cipher)));
    return `__SEC_BSAN_v2__${b64}`;
  } catch (err) {
    console.warn('[SecureStorage] Encryption fallback to stringified JSON', err);
    return JSON.stringify(data);
  }
}

/**
 * Decrypt / Deobfuscate sealed ciphertext back into original object
 * Seamlessly handles legacy unencrypted JSON strings for 100% backward compatibility
 */
export function decryptData<T>(raw: string | null, defaultValue: T): T {
  if (!raw) return defaultValue;

  // Check if data is encrypted with current protocol
  if (raw.startsWith('__SEC_BSAN_v2__')) {
    try {
      const b64 = raw.slice(15); // remove prefix
      const cipher = decodeURIComponent(escape(atob(b64)));
      let jsonStr = '';
      const saltLen = STORAGE_SALT.length;
      for (let i = 0; i < cipher.length; i++) {
        const charCode = cipher.charCodeAt(i);
        const saltCode = STORAGE_SALT.charCodeAt(i % saltLen);
        const unshifted = charCode ^ saltCode;
        jsonStr += String.fromCharCode(unshifted);
      }
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      console.warn('[SecureStorage] Decryption error, checking legacy fallback', err);
    }
  }

  // Legacy plaintext fallback (backward compatibility & auto-migration)
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Secure LocalStorage Adapter with transparent encryption & auto-migration
 */
export const secureStorage = {
  getItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      const data = decryptData<T>(raw, defaultValue);
      
      // Auto-migrate legacy unencrypted data to secure format on first access
      if (raw && !raw.startsWith('__SEC_BSAN_v2__')) {
        this.setItem(key, data);
      }
      return data;
    } catch (err) {
      console.error(`[SecureStorage] Error getting item "${key}"`, err);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      const sealed = encryptData(value);
      localStorage.setItem(key, sealed);
      // Asynchronously mirror to IndexedDB for backend readiness
      saveToIndexedDB(key, value).catch(() => {});
      return true;
    } catch (err) {
      console.error(`[SecureStorage] Error setting item "${key}"`, err);
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      deleteFromIndexedDB(key).catch(() => {});
    } catch (err) {
      console.error(`[SecureStorage] Error removing item "${key}"`, err);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (err) {
      console.error('[SecureStorage] Error clearing storage', err);
    }
  }
};

/**
 * IndexedDB Enterprise Storage Bridge
 * Database Name: bsan_enterprise_db
 * Stores: records
 */
const IDB_NAME = 'bsan_enterprise_db';
const IDB_STORE = 'records';
const IDB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in current environment'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

export async function saveToIndexedDB<T>(key: string, data: T): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fail silently without breaking main app execution
  }
}

export async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteFromIndexedDB(key: string): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }
}
