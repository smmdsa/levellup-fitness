export const formatLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getZonedParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';

  return {
    year: Number(lookup('year')),
    month: Number(lookup('month')),
    day: Number(lookup('day')),
    hour: Number(lookup('hour')),
  };
};

export const formatZonedDateKey = (date: Date, timeZone: string): string => {
  const parts = getZonedParts(date, timeZone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
};

export const getDayKey = (date: Date, dayStartHour: number, timeZone?: string): string => {
  const normalizedStartHour = Math.max(0, Math.min(23, Math.floor(dayStartHour)));
  const adjusted = new Date(date);

  if (timeZone) {
    const parts = getZonedParts(adjusted, timeZone);
    if (parts.hour < normalizedStartHour) {
      const shifted = new Date(adjusted.getTime() - 24 * 60 * 60 * 1000);
      return formatZonedDateKey(shifted, timeZone);
    }

    return formatZonedDateKey(adjusted, timeZone);
  }

  if (adjusted.getHours() < normalizedStartHour) {
    adjusted.setDate(adjusted.getDate() - 1);
  }

  return formatLocalDateKey(adjusted);
};

export const getTodayKey = (
  dayStartHour: number,
  timeZone?: string,
  now: Date = new Date()
): string => {
  return getDayKey(now, dayStartHour, timeZone);
};
