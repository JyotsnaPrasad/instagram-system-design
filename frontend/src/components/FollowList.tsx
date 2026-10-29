import { Link } from 'react-router-dom';
import { useFollowList } from '../hooks/queries';
import { Avatar } from './Avatar';
import { ErrorState, LoadingState } from './Status';

export function FollowList({ kind, username }: { kind: 'followers' | 'following'; username: string }) {
  const query = useFollowList(kind, username, true);
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (query.data.length === 0) {
    return <p className="muted list-empty">{kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>;
  }
  return (
    <ul className="card follow-list">
      {query.data.map((u) => (
        <li key={u.id}>
          <Link to={`/users/${u.username}`} className="user-list-link">
            <Avatar user={u} size="sm" />
            <span className="user-list-names">
              <span className="display-name">{u.displayName}</span>
              <span className="muted">@{u.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
