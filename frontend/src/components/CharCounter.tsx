/** "123 / 500"; turns red past the limit. Announced by screen readers only once over the limit. */
export function CharCounter({ id, count, max, showFrom = 0 }: { id: string; count: number; max: number; showFrom?: number }) {
  if (count < showFrom) return null;
  const over = count > max;
  return (
    <span id={id} className={over ? 'counter counter-over' : 'counter'} aria-live={over ? 'polite' : 'off'}>
      {over ? `${count - max} over the ${max}-character limit` : `${count} / ${max}`}
    </span>
  );
}
