import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { getStoredActivities, getActivityNotificationStatus, SchoolActivity } from '../../services/announcementService';
import { playSchoolChimeSound } from '../../utils/soundNotification';
import { ViewMode } from '../../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewMode) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [activities, setActivities] = useState<SchoolActivity[]>(() => getStoredActivities());
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setActivities(getStoredActivities());
    };

    handleUpdate();
    window.addEventListener('bsan_activities_changed', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('bsan_activities_changed', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter activities that trigger notification (H-5 up to Hari H, plus recent ones)
  const alertActivities = activities
    .map((act) => ({
      activity: act,
      status: getActivityNotificationStatus(act),
    }))
    .filter((item) => item.status.shouldNotify || item.status.daysUntil >= 0);

  const handleTestChime = () => {
    setIsPlayingSound(true);
    playSchoolChimeSound();
    setTimeout(() => setIsPlayingSound(false), 2000);
  };

  return (
    <>
      {/* Backdrop for click outside */}
      <div 
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs" 
        onClick={onClose}
      />

      <div className="fixed top-16 right-4 sm:right-6 md:right-8 z-50 w-[92vw] sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#2563EB] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Pemberitahuan & Notifikasi
              </h3>
              <p className="text-[10px] text-blue-100">
                Peringatan kegiatan H-5 s/d Hari H
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chime Sound Trigger Banner */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-semibold text-indigo-900">
              Bunyi Bel Notifikasi (Chime)
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestChime}
            disabled={isPlayingSound}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Uji coba bunyikan bel sekolah"
          >
            <span>{isPlayingSound ? 'Membunyikan...' : '🔔 Tes Bel'}</span>
          </button>
        </div>

        {/* Notifications Content matching Dashboard Informasi & Pengumuman */}
        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <Bell className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Informasi & Pengumuman Kosong
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Belum ada kegiatan atau pengumuman yang tercatat di dashboard.
              </p>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('dashboard');
                  }}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>+ Tambah Pengumuman di Dashboard</span>
                </button>
              )}
            </div>
          ) : (
            activities.map((activity) => {
              const status = getActivityNotificationStatus(activity);
              return (
                <div
                  key={activity.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    status.isHariH
                      ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-300'
                      : status.isUpcomingAlert
                      ? 'bg-amber-50/90 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-xs block leading-snug">
                        {activity.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {activity.date}
                        </span>
                        {activity.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {activity.time}
                          </span>
                        )}
                        {activity.location && (
                          <span className="text-[11px] text-slate-500">
                            📍 {activity.location}
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>

                    {/* Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 uppercase tracking-tight ${
                        status.isHariH
                          ? 'bg-rose-600 text-white animate-pulse'
                          : status.isUpcomingAlert
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-100 text-[#1E3A8A]'
                      }`}
                    >
                      {status.badgeText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">
            Total {activities.length} Kegiatan Terjadwal
          </span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('dashboard');
              }}
              className="text-[#3B5BDB] hover:text-[#2563EB] inline-flex items-center gap-1 cursor-pointer font-bold"
            >
              <span>Kelola di Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
