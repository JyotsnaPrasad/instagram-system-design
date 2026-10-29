import { useEffect, useState } from 'react';
import { errorMessage } from '../api/client';
import { useResetDemo } from '../hooks/queries';
import { ConfirmDialog } from './ConfirmDialog';

/** Visible "Reset Demo Data" control with a confirmation step (REQUIREMENTS.md section 10). */
export function ResetDemoButton() {
  const reset = useResetDemo();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 3000);
    return () => window.clearTimeout(timer);
  }, [done]);

  function close() {
    setOpen(false);
    reset.reset();
  }

  return (
    <>
      <button type="button" className="btn btn-outline-danger" onClick={() => setOpen(true)}>
        Reset Demo Data
      </button>
      <span className="toast" role="status">
        {done ? 'Demo data restored.' : ''}
      </span>
      <ConfirmDialog
        open={open}
        title="Reset demo data?"
        confirmLabel="Reset"
        busyLabel="Resetting…"
        busy={reset.isPending}
        error={
          reset.isError ? (
            <p className="form-error" role="alert">
              {errorMessage(reset.error)}
            </p>
          ) : null
        }
        onCancel={close}
        onConfirm={() =>
          reset.mutate(undefined, {
            onSuccess: () => {
              setOpen(false);
              setDone(true);
            },
          })
        }
      >
        <p>All posts, likes, comments and follows will go back to the original demo data. Anything you added will be deleted.</p>
      </ConfirmDialog>
    </>
  );
}
