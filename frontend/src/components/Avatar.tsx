import type { UserSummary } from '../api/types';

const PALETTE = ['#e1306c', '#833ab4', '#f77737', '#405de6', '#0f9d76', '#c13584'];

function colorFor(username: string): string {
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0]!;
}

/** Initial-letter avatar (no image uploads in this MVP). Decorative: the name is always shown next to it. */
export function Avatar({ user, size = 'md', ring = false }: { user: UserSummary; size?: 'sm' | 'md' | 'lg'; ring?: boolean }) {
  return (
    <span className={`avatar avatar-${size}${ring ? ' avatar-ring' : ''}`} aria-hidden="true">
      <span className="avatar-inner" style={{ backgroundColor: colorFor(user.username) }}>
        {user.displayName.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}
