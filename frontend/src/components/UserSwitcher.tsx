import { useId } from 'react';
import { useActingUser } from '../context/ActingUserContext';

/** Picks which demo user to act as (FR-0). A native select works well on touch screens. */
export function UserSwitcher() {
  const { actingUser, users, setActingUserId } = useActingUser();
  const id = useId();
  return (
    <div className="switcher">
      <label htmlFor={id} className="switcher-label">
        Acting as
      </label>
      <select id={id} className="select" value={actingUser.id} onChange={(e) => setActingUserId(e.target.value)}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName} (@{u.username})
          </option>
        ))}
      </select>
    </div>
  );
}
