import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subWeeks,
  differenceInDays,
  parseISO,
  subDays,
} from 'date-fns';
import { th } from 'date-fns/locale';

/* ============================================
   getGreeting — Thai greeting by time of day
   ============================================ */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) return 'สวัสดีตอนเช้า ☀️';
  if (hour >= 12 && hour <= 16) return 'สวัสดีตอนบ่าย 🌤️';
  if (hour >= 17 && hour <= 20) return 'สวัสดีตอนเย็น 🌅';
  return 'สวัสดีตอนดึก 🌙';
}

/* ============================================
   formatDate — date-fns format with Thai locale
   ============================================ */
export function formatDate(date, formatStr = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  let result = format(d, formatStr, { locale: th });
  if (formatStr.includes('yyyy')) {
    const gregYear = format(d, 'yyyy');
    const thaiYear = String(Number(gregYear) + 543);
    result = result.replace(gregYear, thaiYear);
  } else if (formatStr.includes('yy')) {
    const gregYearShort = format(d, 'yy');
    const gregYearFull = format(d, 'yyyy');
    const thaiYearFull = String(Number(gregYearFull) + 543);
    const thaiYearShort = thaiYearFull.slice(-2);
    result = result.replace(gregYearShort, thaiYearShort);
  }
  return result;
}

/* ============================================
   formatDateRelative — วันนี้ / พรุ่งนี้ / เมื่อวาน
   ============================================ */
export function formatDateRelative(date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'วันนี้';
  if (isTomorrow(d)) return 'พรุ่งนี้';
  if (isYesterday(d)) return 'เมื่อวาน';
  return formatDate(d, 'dd MMM yyyy');
}

/* ============================================
   getDateString — returns 'yyyy-MM-dd'
   ============================================ */
export function getDateString(date = new Date()) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/* ============================================
   calculateStreak — consecutive days from today
   ============================================ */
export function calculateStreak(logs, habitId, frequency = 'daily') {
  if (!logs || logs.length === 0) return 0;

  // Filter logs for the specific habit and sort descending
  const habitLogs = logs
    .filter((log) => log.habitId === habitId)
    .map((log) => log.date)
    .sort((a, b) => b.localeCompare(a));

  if (habitLogs.length === 0) return 0;

  const uniqueDates = [...new Set(habitLogs)];

  let streak = 0;
  let checkDate = new Date();

  if (frequency === 'weekly') {
    // Helper to get all date strings for a given week range (Mon-Sun)
    const getWeekDays = (date) => {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end }).map((day) => format(day, 'yyyy-MM-dd'));
    };

    // Check if the current week contains any logs. If not, start checking from last week.
    const currentWeek = getWeekDays(checkDate);
    const hasCurrentWeek = currentWeek.some((d) => uniqueDates.includes(d));
    if (!hasCurrentWeek) {
      checkDate = subWeeks(checkDate, 1);
    }

    for (let i = 0; i < 52; i++) {
      const targetWeekDate = subWeeks(checkDate, i);
      const weekDays = getWeekDays(targetWeekDate);
      const hasLog = weekDays.some((d) => uniqueDates.includes(d));
      if (hasLog) {
        streak++;
      } else {
        break;
      }
    }
  } else {
    // Daily habit streak
    const todayStr = format(checkDate, 'yyyy-MM-dd');
    if (!uniqueDates.includes(todayStr)) {
      checkDate = subDays(checkDate, 1);
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(checkDate, i), 'yyyy-MM-dd');
      if (uniqueDates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
  }

  return streak;
}

/* ============================================
   getHeatmapData — { date, count, level }[]
   ============================================ */
export function getHeatmapData(logs, weeks = 12) {
  const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
  const startDate = startOfWeek(subWeeks(endDate, weeks - 1), { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Build a set of logged dates for O(1) lookup
  const loggedDates = new Set(
    (logs || []).map((log) => log.date)
  );

  return allDays.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const count = loggedDates.has(dateStr) ? 1 : 0;
    return {
      date: dateStr,
      count,
      level: count > 0 ? 1 : 0,
    };
  });
}

/* ============================================
   getPriorityLabel — Thai labels
   ============================================ */
export function getPriorityLabel(priority) {
  const labels = {
    high: 'สูง',
    medium: 'กลาง',
    low: 'ต่ำ',
  };
  return labels[priority] ?? priority;
}

/* ============================================
   getPriorityColor — CSS variable colors
   ============================================ */
export function getPriorityColor(priority) {
  const colors = {
    high: 'var(--rose)',
    medium: 'var(--amber)',
    low: 'var(--sky)',
  };
  return colors[priority] ?? 'var(--text-muted)';
}

/* ============================================
   generateId — simple unique ID
   ============================================ */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
