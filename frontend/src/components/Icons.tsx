type IconProps = { filled?: boolean };

export function HeartIcon({ filled = false }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        d="M12 21s-6.7-4.35-9.2-8.1C1 10.2 1.9 6.6 4.9 5.4c2.2-.9 4.6-.1 5.9 1.8L12 8.6l1.2-1.4c1.3-1.9 3.7-2.7 5.9-1.8 3 1.2 3.9 4.8 2.1 7.5C18.7 16.65 12 21 12 21z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
