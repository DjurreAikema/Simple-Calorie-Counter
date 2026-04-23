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
