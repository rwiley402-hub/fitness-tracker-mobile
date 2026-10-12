/** 75 -> "1h 15m", 45 -> "45m" */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** 5.25 -> "5:15 /km" */
export function formatPace(minPerKm: number | null): string {
  if (minPerKm === null || !Number.isFinite(minPerKm) || minPerKm <= 0) return '–';
  let minutes = Math.floor(minPerKm);
  let seconds = Math.round((minPerKm - minutes) * 60);
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
}

export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined) return '–';
  return `${km.toFixed(1)} km`;
}

/** 12450 -> "12,450" (locale-independent so tests are deterministic) */
export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 12 -> "+12%", -5 -> "-5%", null -> "new" */
export function formatChange(percent: number | null): string {
  if (percent === null) return 'new';
  if (percent > 0) return `+${percent}%`;
  return `${percent}%`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
