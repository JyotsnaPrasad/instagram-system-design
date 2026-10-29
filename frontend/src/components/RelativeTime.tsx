import { exactTime, relativeTime } from '../lib/time';

/** Relative time with the exact local time on hover (FR-5.3). */
export function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={exactTime(iso)}>
      {relativeTime(iso)}
    </time>
  );
}
