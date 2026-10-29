import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  error?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible modal: focus moves to Cancel on open, Tab stays inside, Escape and the
 * backdrop cancel, and focus returns to whatever opened it.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, busyLabel, busy = false, error, onConfirm, onCancel }: Props) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  if (!open) return null;

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        onKeyDown={onKeyDown}
      >
        <h2 id={`${id}-title`} className="dialog-title">
          {title}
        </h2>
        <div id={`${id}-body`} className="dialog-body">
          {children}
        </div>
        {error}
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel ?? confirmLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
