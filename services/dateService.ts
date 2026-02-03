export const formatLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDayKey = (date: Date, dayStartHour: number): string => {
  const normalizedStartHour = Math.max(0, Math.min(23, Math.floor(dayStartHour)));
  const adjusted = new Date(date);

  if (adjusted.getHours() < normalizedStartHour) {
    adjusted.setDate(adjusted.getDate() - 1);
  }

  return formatLocalDateKey(adjusted);
};

export const getTodayKey = (dayStartHour: number, now: Date = new Date()): string => {
  return getDayKey(now, dayStartHour);
};
