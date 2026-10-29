import { Link } from 'react-router-dom';
import { errorMessage } from '../api/client';

export function Spinner({ small = false }: { small?: boolean }) {
  return <span className={small ? 'spinner spinner-sm' : 'spinner'} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading…', fullPage = false }: { label?: string; fullPage?: boolean }) {
  return (
    <div className={fullPage ? 'status status-full' : 'status'} role="status">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  fullPage = false,
}: {
  error: unknown;
  onRetry?: () => void;
  fullPage?: boolean;
}) {
  return (
    <div className={fullPage ? 'status status-full status-error' : 'status status-error'} role="alert">
      <p>{errorMessage(error)}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function NotFoundState({ what = 'page' }: { what?: string }) {
  return (
    <div className="card empty-state">
      <h1 className="empty-title">Sorry, this {what} isn't available.</h1>
      <p className="muted">It may not exist, or the demo data was reset.</p>
      <Link className="btn btn-primary" to="/">
        Back to feed
      </Link>
    </div>
  );
}
