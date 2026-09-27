export const startOfToday = (now: Date = new Date()): Date => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfToday = (now: Date = new Date()): Date => {
  const d = startOfToday(now);
  d.setDate(d.getDate() + 1);
  return d;
};

export const startOfTomorrow = (now: Date = new Date()): Date => {
  const d = endOfToday(now);
  return d;
};

export const toGraphQLDate = (d: Date): string =>
  d.toISOString().replace(/\.\d{3}Z$/, 'Z');

export const localInputToGraphQLDate = (value: string): string =>
  toGraphQLDate(new Date(value));

export const todayRangeInput = (now: Date = new Date()) => ({
  startTime: toGraphQLDate(startOfToday(now)),
  endTime: toGraphQLDate(endOfToday(now)),
});

export const isSameLocalDay = (value: string | Date, now: Date = new Date()): boolean => {
  const d = new Date(value);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export const isAfterLocalDay = (value: string | Date, day: Date): boolean => {
  const d = new Date(value);
  return d.getTime() >= day.getTime();
};
