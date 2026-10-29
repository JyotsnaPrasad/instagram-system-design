import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserSummary } from '../api/types';
import { ErrorState, LoadingState } from '../components/Status';
import { useUsers } from '../hooks/queries';

export const ACTING_USER_STORAGE_KEY = 'insta.actingUserId';
const DEFAULT_USER_ID = 'u1';

type ActingUserContextValue = {
  actingUser: UserSummary;
  users: UserSummary[];
  setActingUserId: (id: string) => void;
};

const ActingUserContext = createContext<ActingUserContextValue | null>(null);

// Storage can be unavailable (private mode, blocked site data); the app still works without it.
function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(ACTING_USER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string) {
  try {
    window.localStorage.setItem(ACTING_USER_STORAGE_KEY, id);
  } catch {
    // Ignore: the choice just won't survive a reload.
  }
}

/**
 * Stands in for authentication (FR-0). Loads the demo users, then picks the stored acting
 * user, falling back to alice when the stored value is missing or unknown (E23).
 */
export function ActingUserProvider({ children }: { children: ReactNode }) {
  const usersQuery = useUsers();
  const [storedId, setStoredId] = useState<string | null>(readStoredId);

  const users = usersQuery.data;
  const actingUser = users
    ? users.find((u) => u.id === storedId) ?? users.find((u) => u.id === DEFAULT_USER_ID) ?? users[0]
    : undefined;

  useEffect(() => {
    if (actingUser && actingUser.id !== storedId) writeStoredId(actingUser.id);
  }, [actingUser, storedId]);

  const setActingUserId = useCallback((id: string) => {
    setStoredId(id);
    writeStoredId(id);
  }, []);

  const value = useMemo(
    () => (actingUser && users ? { actingUser, users, setActingUserId } : null),
    [actingUser, users, setActingUserId],
  );

  if (usersQuery.isPending) return <LoadingState label="Loading demo users…" fullPage />;
  if (usersQuery.isError) {
    return <ErrorState error={usersQuery.error} onRetry={() => usersQuery.refetch()} fullPage />;
  }
  if (!value) return <ErrorState error={new Error('No demo users found. Try resetting the demo data.')} fullPage />;

  return <ActingUserContext.Provider value={value}>{children}</ActingUserContext.Provider>;
}

export function useActingUser(): ActingUserContextValue {
  const value = useContext(ActingUserContext);
  if (!value) throw new Error('useActingUser must be used inside ActingUserProvider');
  return value;
}
