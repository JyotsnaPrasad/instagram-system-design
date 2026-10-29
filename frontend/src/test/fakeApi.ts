import { vi } from 'vitest';
import type { PostView, Profile, UserSummary } from '../api/types';

export const alice: UserSummary = { id: 'u1', username: 'alice', displayName: 'Alice Anderson' };
export const bob: UserSummary = { id: 'u2', username: 'bob', displayName: 'Bob Brown' };
export const carol: UserSummary = { id: 'u3', username: 'carol', displayName: 'Carol Chen' };
export const users = [alice, bob, carol];

export function makePost(overrides: Partial<PostView> & { id: number; author: UserSummary }): PostView {
  return {
    text: `Post ${overrides.id}`,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    comments: [],
    ...overrides,
  };
}

export function makeProfile(user: UserSummary, overrides: Partial<Profile> = {}): Profile {
  return { ...user, bio: null, postCount: 0, followerCount: 0, followingCount: 0, followedByMe: false, ...overrides };
}

export type RecordedCall = { method: string; path: string; actingUser: string | null; body: unknown };

type Reply = { status?: number; body?: unknown } | Promise<{ status?: number; body?: unknown }>;
type Handler = (call: RecordedCall) => Reply;

/**
 * Replaces fetch with a route table keyed by "METHOD /api/path". Unmatched routes return a
 * backend-style 404. Every call is recorded with its X-Acting-User header.
 */
export function fakeApi(routes: Record<string, Handler | unknown>) {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const path = String(input);
    const headers = new Headers(init?.headers);
    const call: RecordedCall = {
      method,
      path,
      actingUser: headers.get('X-Acting-User'),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const route = routes[`${method} ${path}`];
    const reply: Awaited<Reply> =
      route === undefined
        ? { status: 404, body: { status: 404, code: 'NOT_FOUND', message: 'Resource not found.' } }
        : typeof route === 'function'
          ? await (route as Handler)(call)
          : { body: route };
    const status = reply.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(reply.body ?? null), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock, set: (key: string, value: Handler | unknown) => (routes[key] = value) };
}

/** A route reply with an explicit status. Plain (non-function) route values are always 200 bodies. */
export function reply(status: number, body?: unknown): Handler {
  return () => ({ status, body });
}

/** A promise you resolve by hand, to observe pending states. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
