import { errorMessage } from '../api/client';
import { useToggleFollow } from '../hooks/queries';

/**
 * Follow/Unfollow toggle (FR-4.2). The visible label states what clicking will do, so it
 * doesn't also use aria-pressed. Never rendered on your own profile (FR-4.3).
 */
export function FollowButton({ username, following }: { username: string; following: boolean }) {
  const toggle = useToggleFollow(username);
  return (
    <div className="follow-control">
      <button
        type="button"
        className={following ? 'btn btn-secondary' : 'btn btn-primary'}
        aria-busy={toggle.isPending}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(following)}
      >
        {toggle.isPending ? 'Updating…' : following ? 'Unfollow' : 'Follow'}
      </button>
      {toggle.isError && (
        <p className="form-error" role="alert">
          {errorMessage(toggle.error)}
        </p>
      )}
    </div>
  );
}
