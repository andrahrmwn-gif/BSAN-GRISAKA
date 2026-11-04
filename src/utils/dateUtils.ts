import { useState, useEffect } from 'react';

/**
 * Utility functions for realtime local date and time handling (WIB / Local Device Time).
 * Solves the UTC offset issue where `toISOString()` lags behind local midnight by 7+ hours,
 * and ensures automatic rollover to the next day immediately after 24:00 (00:00 midnight).
 */

/**
 * Returns YYYY-MM-DD string in local time (not UTC).
 * Flips immediately at 24:00:00 (00:00:00 local time) to the next day.
 */
export const getRealtimeDateYMD = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns HH:mm string in local time.
 */
export const getRealtimeTimeHM = (date: Date = new Date()): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Adds or subtracts days from a YYYY-MM-DD string safely in local time.
 */
export const addDaysToDateStr = (dateStr: string, offsetDays: number): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return getRealtimeDateYMD();
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + offsetDays);
    return getRealtimeDateYMD(d);
  } catch {
    return getRealtimeDateYMD();
  }
};

/**
 * Formats a YYYY-MM-DD string into Indonesian date format
 * (e.g., "Kamis, 5 November 2026").
 */
export const formatIndoFullDate = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

/**
 * React hook that provides the real-time "today" date string (YYYY-MM-DD).
 * It listens continuously with a 1-second interval. As soon as local time
 * passes 24:00 (midnight 00:00:00), `todayStr` updates immediately to the new date.
 *
 * If `selectedDate` is currently synced with today, `onMidnightPassed` will be called
 * or `selectedDate` can be automatically rolled over to the next day, while allowing
 * users to manually select and inspect historical past dates without interruption.
 */
export const useRealtimeDateTracker = (initialSelectedDate?: string) => {
  const [todayStr, setTodayStr] = useState<string>(() => getRealtimeDateYMD());
  const [selectedDate, setSelectedDate] = useState<string>(() => initialSelectedDate || getRealtimeDateYMD());
  const [isViewingToday, setIsViewingToday] = useState<boolean>(() => {
    return !initialSelectedDate || initialSelectedDate === getRealtimeDateYMD();
  });

  useEffect(() => {
    const checkMidnight = () => {
      const currentRealtimeToday = getRealtimeDateYMD();
      setTodayStr((prevToday) => {
        if (prevToday !== currentRealtimeToday) {
          // Midnight has passed!
          // If the user was viewing today, automatically roll over selectedDate to the new day
          setSelectedDate((prevSelected) => {
            if (prevSelected === prevToday) {
              return currentRealtimeToday;
            }
            // User was deliberately inspecting a past date; keep it open
            return prevSelected;
          });

          // Broadcast global event for any external listeners
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('bsan_midnight_rollover', {
                detail: { newDate: currentRealtimeToday, prevDate: prevToday },
              })
            );
          }
          return currentRealtimeToday;
        }
        return prevToday;
      });
    };

    // Check every second to catch the exact moment of midnight transition
    const interval = setInterval(checkMidnight, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setIsViewingToday(date === todayStr);
  };

  const handleGoToday = () => {
    const current = getRealtimeDateYMD();
    setSelectedDate(current);
    setIsViewingToday(true);
  };

  const handleGoYesterday = () => {
    const yesterday = addDaysToDateStr(todayStr, -1);
    setSelectedDate(yesterday);
    setIsViewingToday(false);
  };

  const handlePrevDay = () => {
    setSelectedDate((curr) => {
      const prev = addDaysToDateStr(curr, -1);
      setIsViewingToday(prev === todayStr);
      return prev;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((curr) => {
      const next = addDaysToDateStr(curr, 1);
      setIsViewingToday(next === todayStr);
      return next;
    });
  };

  return {
    todayStr,
    selectedDate,
    setSelectedDate: handleSelectDate,
    isToday: selectedDate === todayStr,
    handleGoToday,
    handleGoYesterday,
    handlePrevDay,
    handleNextDay,
  };
};
