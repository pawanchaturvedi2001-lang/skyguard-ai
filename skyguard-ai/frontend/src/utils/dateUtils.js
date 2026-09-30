/**
 * SkyGuard AI - Indian Standard Time (IST / Asia/Kolkata) Utility
 * 
 * Provides timezone-aware date and time formatting strictly to Asia/Kolkata (UTC+05:30).
 * Avoids double-conversion by inspecting timezone indicators.
 */

const TIMEZONE = 'Asia/Kolkata';

/**
 * Normalizes input date/timestamp string into a valid Date object.
 * Dataset timestamps like '2026-01-01 19:45:00' are treated as UTC.
 */
function parseToDate(input) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    let str = input.trim();
    // If format is "YYYY-MM-DD HH:mm:ss UTC"
    if (str.endsWith(' UTC')) {
      str = str.replace(' UTC', 'Z').replace(' ', 'T');
    }
    // If format is "YYYY-MM-DD HH:mm:ss" without timezone indicator, treat as UTC
    else if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    // If format is "YYYY-MM-DDTHH:mm:ss" without offset
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
      str = str + 'Z';
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Formats any timestamp into an Indian Standard Time (IST) formatted string.
 * @param {string|number|Date} input 
 * @param {'full'|'short'|'time'|'time_short'|'chart'|'date'} formatType 
 * @returns {string} Formatted IST string e.g. "30 Sep 2026, 05:15 PM IST"
 */
export function formatToIST(input, formatType = 'full') {
  const date = parseToDate(input);
  if (!date) return typeof input === 'string' && input ? input : '--';

  try {
    switch (formatType) {
      case 'full': {
        // Example: 30 Sep 2026, 05:15 PM IST
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return `${formatter.format(date)} IST`;
      }

      case 'short': {
        // Example: 30 Sep, 05:15 PM IST
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return `${formatter.format(date)} IST`;
      }

      case 'time': {
        // Example: 05:15:30 PM IST
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        return `${formatter.format(date)} IST`;
      }

      case 'time_short': {
        // Example: 05:15 PM IST
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return `${formatter.format(date)} IST`;
      }

      case 'chart': {
        // Example: 30 Sep 17:15 IST (24h format for charts)
        const dayMonth = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: 'short',
        }).format(date);
        const time24 = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date);
        return `${dayMonth} ${time24} IST`;
      }

      case 'date': {
        // Example: 30 Sep 2026
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        return formatter.format(date);
      }

      default:
        return `${date.toLocaleString('en-IN', { timeZone: TIMEZONE })} IST`;
    }
  } catch (err) {
    console.warn('Date formatting error:', err);
    return String(input);
  }
}

/**
 * Returns current real-time clock string in IST.
 * e.g. "30 Sep 2026, 05:15:30 PM IST"
 */
export function getCurrentISTClock() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return `${formatter.format(now)} IST`;
}

export default {
  formatToIST,
  getCurrentISTClock,
};
