import { NavLink } from 'react-router-dom';
import { useActingUser } from '../context/ActingUserContext';
import { Avatar } from './Avatar';

/** Links to all demo profiles (FR-6.2): a sidebar on desktop, a story-style row on mobile. */
export function UserList() {
  const { users, actingUser } = useActingUser();
  return (
    <nav className="user-list" aria-label="Demo users">
      <h2 className="section-label user-list-title">Demo users</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <NavLink to={`/users/${u.username}`} className="user-list-link">
              <Avatar user={u} size="md" ring />
              <span className="user-list-names">
                <span className="display-name">{u.displayName}</span>
                <span className="muted">
                  @{u.username}
                  {u.id === actingUser.id && <span className="you-badge"> · you</span>}
                </span>
              </span>
              <span className="story-name" aria-hidden="true">
                {u.username}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
