import { Link } from 'react-router-dom';
import { useActingUser } from '../context/ActingUserContext';

/** FR-5.5: shown when you follow nobody with posts and have none of your own. */
export function EmptyFeed() {
  const { users, actingUser } = useActingUser();
  const others = users.filter((u) => u.id !== actingUser.id);
  return (
    <div className="card empty-state">
      <h2 className="empty-title">No posts yet</h2>
      <p className="muted">Follow someone or write your first post.</p>
      <ul className="inline-links">
        {others.map((u) => (
          <li key={u.id}>
            <Link to={`/users/${u.username}`}>View {u.displayName}'s profile</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
