type TimestampLike = { toDate?: () => Date } | Date | string | number | null | undefined;

export function reportLocation(report: { latitude?: number | null; longitude?: number | null; locationName?: string | null }) {
  if (report.latitude != null && report.longitude != null) {
    return `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`;
  }
  return report.locationName?.trim() || 'Location not provided';
}

export function reportDate(value: TimestampLike) {
  const date = value && typeof value === 'object' && 'toDate' in value
    ? value.toDate?.()
    : value instanceof Date
      ? value
      : value
        ? new Date(value as string | number)
        : null;
  if (!date || Number.isNaN(date.getTime())) return 'Date pending';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
