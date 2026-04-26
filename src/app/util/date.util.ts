export function startOfDay(d: Date = new Date()): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(d: Date = new Date()): Date {
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(s: string): Date {
  const [datePart, timePart] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}

export function startOfWeek(d: Date = new Date()): Date {
  const result = startOfDay(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

export function endOfWeek(d: Date = new Date()): Date {
  const start = startOfWeek(d);
  const sunday = new Date(start);
  sunday.setDate(sunday.getDate() + 6);
  return endOfDay(sunday);
}
