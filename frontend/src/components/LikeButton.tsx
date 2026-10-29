import { errorMessage } from '../api/client';
import { useToggleLike } from '../hooks/queries';
import { HeartIcon } from './Icons';

/**
 * Like toggle. aria-pressed exposes the state (NFR-7). Disabled while a request is in
 * flight, so rapid clicks can never double-like (E10).
 */
export function LikeButton({ postId, liked }: { postId: number; liked: boolean }) {
  const toggle = useToggleLike(postId);
  return (
    <>
      <button
        type="button"
        className={`icon-btn like-btn${liked ? ' is-liked' : ''}`}
        aria-label="Like"
        aria-pressed={liked}
        aria-busy={toggle.isPending}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(liked)}
      >
        <HeartIcon filled={liked} />
      </button>
      {toggle.isError && (
        <span className="inline-error" role="alert">
          {errorMessage(toggle.error)}
        </span>
      )}
    </>
  );
}
