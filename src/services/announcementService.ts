/**
 * School Announcements & Activities Management Service
 * Supports CRUD, persistent storage, and automatic 5-day-to-Day-H alert calculation
 */

export interface SchoolActivity {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  date?: string;      // Alias for startDate for convenience
  endDate?: string;   // YYYY-MM-DD
  time?: string;      // e.g. "07.00 WIB"
  location?: string;
  description?: string;
  priority?: 'high' | 'normal';
  createdAt: string;
}

import { syncActivityToFirestore, deleteActivityFromFirestore, bulkSyncActivitiesToFirestore } from './firebase';
import { getRealtimeDateYMD } from '../utils/dateUtils';

const STORAGE_KEY = 'bsan_grisaka_announcements_v1';
const INITIALIZED_KEY = 'bsan_grisaka_announcements_initialized_v2';

// Seed initial default activities relative to current date and school calendar
function generateDefaultActivities(): SchoolActivity[] {
  const today = new Date();
  const formatYMD = (d: Date) => getRealtimeDateYMD(d);

  const in2Days = new Date(today);
  in2Days.setDate(today.getDate() + 2);

  const in4Days = new Date(today);
  in4Days.setDate(today.getDate() + 4);

  const in10Days = new Date(today);
  in10Days.setDate(today.getDate() + 10);

  return [
    {
      id: 'act-001',
      title: 'Upacara Peringatan Hari Besar & Apel Disiplin BSAN',
      startDate: formatYMD(in2Days),
      date: formatYMD(in2Days),
      endDate: formatYMD(in2Days),
      time: '07.00 WIB',
      location: 'Lapangan Utama SMPN 1 Kandangan',
      description: 'Seluruh peserta didik mengenakan seragam OSIS lengkap dan tertib.',
      priority: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-002',
      title: 'Sosialisasi & Workshop Budaya Sekolah Aman dan Nyaman (BSAN)',
      startDate: formatYMD(in4Days),
      date: formatYMD(in4Days),
      endDate: formatYMD(in4Days),
      time: '08.30 - 11.30 WIB',
      location: 'Aula Graha Tama Grisaka',
      description: 'Dihadiri Tim Kesiswaan, Guru BK, Perwakilan Wali Murid, dan Pengurus OSIS.',
      priority: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-003',
      title: 'Penilaian Sumatif & Evaluasi Sikap Karakter Terpadu',
      startDate: formatYMD(in10Days),
      date: formatYMD(in10Days),
      endDate: formatYMD(new Date(today.getTime() + 17 * 86400000)),
      time: '07.30 WIB',
      location: 'Ruang Kelas 7A - 9H',
      description: 'Penilaian terpadu akademik dan evaluasi rekapitulasi kepatuhan tata tertib semester.',
      priority: 'normal',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-004',
      title: 'Kegiatan Class Meeting & Pentas Seni Budaya Pelajar',
      startDate: '2026-11-20',
      date: '2026-11-20',
      endDate: '2026-11-23',
      time: '08.00 - 13.00 WIB',
      location: 'Kampus SMPN 1 Kandangan',
      description: 'Lomba antar-rombel bidang olahraga tradisional dan kreasi seni budaya Temanggung.',
      priority: 'normal',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function isAnnouncementsInitialized(): boolean {
  try {
    return localStorage.getItem(INITIALIZED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getStoredActivities(): SchoolActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const initialized = localStorage.getItem(INITIALIZED_KEY) === 'true';

    // If never initialized before and no storage, seed defaults once
    if (raw === null && !initialized) {
      const defaults = generateDefaultActivities();
      localStorage.setItem(INITIALIZED_KEY, 'true');
      saveActivities(defaults);
      return defaults;
    }

    // If initialized but empty or null, return empty array - NEVER re-seed deleted activities!
    if (raw === null || raw.trim() === '' || raw === '[]') {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        date: item.startDate || item.date,
        startDate: item.startDate || item.date,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed reading announcements from storage', err);
    return [];
  }
}

export function saveActivities(activities: SchoolActivity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    localStorage.setItem(INITIALIZED_KEY, 'true');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bsan_activities_changed', { detail: activities }));
    }
  } catch (err) {
    console.error('Failed saving announcements', err);
  }
}

export function addActivity(activity: Partial<SchoolActivity> & { title: string; date?: string; startDate?: string }): SchoolActivity[] {
  const existing = getStoredActivities();
  const effectiveDate = activity.startDate || activity.date || getRealtimeDateYMD();
  const newActivity: SchoolActivity = {
    ...activity,
    startDate: effectiveDate,
    date: effectiveDate,
    id: `act-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newActivity, ...existing];
  saveActivities(updated);
  syncActivityToFirestore(newActivity).catch(console.error);
  return updated;
}

export function updateActivity(id: string, updates: Partial<SchoolActivity>): SchoolActivity[] {
  const existing = getStoredActivities();
  const idx = existing.findIndex((a) => a.id === id);
  if (idx === -1) return existing;

  const effectiveDate = updates.startDate || updates.date || existing[idx].startDate;
  const updatedItem: SchoolActivity = { 
    ...existing[idx], 
    ...updates,
    startDate: effectiveDate,
    date: effectiveDate,
  };
  existing[idx] = updatedItem;
  saveActivities(existing);
  syncActivityToFirestore(updatedItem).catch(console.error);
  return existing;
}

export function deleteActivity(id: string): SchoolActivity[] {
  const existing = getStoredActivities();
  const filtered = existing.filter((a) => a.id !== id);
  saveActivities(filtered);
  deleteActivityFromFirestore(id).catch(console.error);
  return filtered;
}

export interface ActivityNotificationStatus {
  isActiveNotification: boolean; // True if between 5 days before Day H up to Day H (0 <= daysDiff <= 5)
  shouldNotify: boolean;         // Alias
  daysDiff: number;              // 0 = Hari H, 1 = H-1, 2 = H-2, ..., 5 = H-5
  daysUntil: number;             // Alias
  statusLabel: string;
  badgeText: string;             // Short badge e.g. "HARI H", "H-1", "H-2", etc.
  isHariH: boolean;
  isToday: boolean;
  isUpcomingAlert: boolean;
  isPast: boolean;
  urgency: 'critical' | 'warning' | 'normal' | 'past' | 'future';
}

/**
 * Calculates countdown / alert status for an activity
 * Condition: Alert triggers from 5 days before the event (H-5) up to Day H (Hari H)
 */
export function getActivityNotificationStatus(
  activity: SchoolActivity,
  todayStr?: string
): ActivityNotificationStatus {
  const parseLocal = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dStr);
  };

  const today = todayStr ? parseLocal(todayStr) : new Date();
  today.setHours(0, 0, 0, 0);

  const rawDate = activity.startDate || activity.date || '';
  const eventStart = parseLocal(rawDate);
  eventStart.setHours(0, 0, 0, 0);

  const diffMs = eventStart.getTime() - today.getTime();
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return {
      isActiveNotification: true,
      shouldNotify: true,
      daysDiff: 0,
      daysUntil: 0,
      statusLabel: 'HARI H (Pelaksanaan Hari Ini)',
      badgeText: 'HARI H',
      isHariH: true,
      isToday: true,
      isUpcomingAlert: false,
      isPast: false,
      urgency: 'critical',
    };
  }

  if (daysDiff > 0 && daysDiff <= 5) {
    const badgeText = `H-${daysDiff}`;
    const statusLabel = daysDiff === 1 ? 'H-1 (Besok)' : `H-${daysDiff} (${daysDiff} Hari Lagi)`;
    return {
      isActiveNotification: true,
      shouldNotify: true,
      daysDiff,
      daysUntil: daysDiff,
      statusLabel,
      badgeText,
      isHariH: false,
      isToday: false,
      isUpcomingAlert: true,
      isPast: false,
      urgency: daysDiff <= 2 ? 'critical' : 'warning',
    };
  }

  if (daysDiff < 0) {
    return {
      isActiveNotification: false,
      shouldNotify: false,
      daysDiff,
      daysUntil: daysDiff,
      statusLabel: 'Selesai',
      badgeText: 'Selesai',
      isHariH: false,
      isToday: false,
      isUpcomingAlert: false,
      isPast: true,
      urgency: 'past',
    };
  }

  return {
    isActiveNotification: false,
    shouldNotify: false,
    daysDiff,
    daysUntil: daysDiff,
    statusLabel: `${daysDiff} Hari Lagi`,
    badgeText: `${daysDiff} Hari`,
    isHariH: false,
    isToday: false,
    isUpcomingAlert: false,
    isPast: false,
    urgency: 'future',
  };
}

/**
 * Filter all activities currently within the active notification window (H-5 to Hari H)
 */
export function getActiveNotificationActivities(
  activities?: SchoolActivity[], 
  todayStr?: string
): Array<{
  activity: SchoolActivity;
  status: ActivityNotificationStatus;
}> {
  const list = activities && activities.length > 0 ? activities : getStoredActivities();
  return list
    .map((activity) => ({
      activity,
      status: getActivityNotificationStatus(activity, todayStr),
    }))
    .filter((item) => item.status.isActiveNotification)
    .sort((a, b) => a.status.daysDiff - b.status.daysDiff);
}
