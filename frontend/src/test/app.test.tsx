import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACTING_USER_STORAGE_KEY } from '../context/ActingUserContext';
import { alice, bob, carol, deferred, fakeApi, makePost, makeProfile, reply, users } from './fakeApi';
import { renderApp } from './renderApp';

const p2 = makePost({
  id: 2,
  author: alice,
  text: 'Hello world! First post.',
  likeCount: 1,
  commentCount: 1,
  comments: [{ id: 1, postId: 2, author: bob, text: 'Welcome!', createdAt: new Date().toISOString() }],
});
const p3 = makePost({ id: 3, author: bob, text: 'Sunrise hike this morning.', likeCount: 1, likedByMe: true });

function seedRoutes(extra: Record<string, unknown> = {}) {
  return fakeApi({
    'GET /api/users': users,
    'GET /api/feed': ({ actingUser }: { actingUser: string | null }) => ({
      body: actingUser === 'u1' ? [p3, p2] : actingUser === 'u2' ? [{ ...p3, likedByMe: false }, p2] : [],
    }),
    ...extra,
  });
}

describe('feed and acting user', () => {
  it('shows alice’s feed by default with likes and comments', async () => {
    const api = seedRoutes();
    renderApp('/');

    const posts = await screen.findAllByRole('article');
    expect(posts).toHaveLength(2);
    expect(within(posts[0]!).getByText('Sunrise hike this morning.')).toBeInTheDocument();
    expect(within(posts[0]!).getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(posts[1]!).getByText('1 like')).toBeInTheDocument();
    expect(within(posts[1]!).getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByLabelText('Acting as')).toHaveValue('u1');
    expect(api.calls.find((c) => c.path === '/api/feed')?.actingUser).toBe('u1');
  });

  it('switching user refetches as that user and is remembered (AC-0.2, AC-0.3)', async () => {
    const api = seedRoutes();
    const { user } = renderApp('/');
    await screen.findAllByRole('article');

    await user.selectOptions(screen.getByLabelText('Acting as'), 'u2');

    await waitFor(() => expect(api.calls.some((c) => c.path === '/api/feed' && c.actingUser === 'u2')).toBe(true));
    await waitFor(() =>
      expect(within(screen.getAllByRole('article')[0]!).getByRole('button', { name: 'Like' })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    );
    expect(window.localStorage.getItem(ACTING_USER_STORAGE_KEY)).toBe('u2');
  });

  it('falls back to alice when the stored user is unknown (E23)', async () => {
    window.localStorage.setItem(ACTING_USER_STORAGE_KEY, 'u99');
    const api = seedRoutes();
    renderApp('/');
    await screen.findAllByRole('article');
    expect(screen.getByLabelText('Acting as')).toHaveValue('u1');
    expect(api.calls.filter((c) => c.path === '/api/feed').every((c) => c.actingUser === 'u1')).toBe(true);
    expect(window.localStorage.getItem(ACTING_USER_STORAGE_KEY)).toBe('u1');
  });

  it('shows an empty state with links to the other users (FR-5.5)', async () => {
    window.localStorage.setItem(ACTING_USER_STORAGE_KEY, 'u3');
    seedRoutes();
    renderApp('/');
    expect(await screen.findByText('No posts yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "View Alice Anderson's profile" })).toHaveAttribute('href', '/users/alice');
    expect(screen.getByRole('link', { name: "View Bob Brown's profile" })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Carol Chen's profile/ })).not.toBeInTheDocument();
  });

  it('shows a loading state, then an error with a working retry', async () => {
    const first = deferred<{ status: number; body: unknown }>();
    let attempts = 0;
    seedRoutes({
      'GET /api/feed': () => {
        attempts += 1;
        return attempts === 1 ? first.promise : { body: [p2] };
      },
    });
    const { user } = renderApp('/');

    expect(await screen.findByText('Loading feed…')).toBeInTheDocument();
    first.resolve({ status: 500, body: { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Hello world! First post.')).toBeInTheDocument();
  });

  it('explains when the backend cannot be reached', async () => {
    const fetchFail = () => {
      throw new TypeError('Failed to fetch');
    };
    fakeApi({ 'GET /api/users': fetchFail });
    renderApp('/');
    expect(await screen.findByRole('alert')).toHaveTextContent(/reach the server/);
  });

  it('shows not found for unknown routes, profiles and posts (E27)', async () => {
    seedRoutes();
    const { unmount } = renderApp('/nope');
    expect(await screen.findByText(/this page isn't available/)).toBeInTheDocument();
    unmount();

    renderApp('/users/nobody');
    expect(await screen.findByText(/this profile isn't available/)).toBeInTheDocument();
  });
});

describe('post composer', () => {
  it('validates length, posts, clears and refreshes the feed', async () => {
    const api = seedRoutes({
      'POST /api/posts': reply(201, makePost({ id: 4, author: alice, text: 'My new post' })),
    });
    const { user } = renderApp('/');
    await screen.findAllByRole('article');

    const box = screen.getByLabelText(/What's on your mind/);
    const submit = screen.getByRole('button', { name: 'Post' });
    expect(submit).toBeDisabled();

    await user.type(box, '   ');
    expect(submit).toBeDisabled();

    await user.clear(box);
    await user.type(box, 'My new post');
    expect(screen.getByText('11 / 500')).toBeInTheDocument();
    expect(submit).toBeEnabled();

    const feedCallsBefore = api.calls.filter((c) => c.path === '/api/feed').length;
    await user.click(submit);

    await waitFor(() => expect(box).toHaveValue(''));
    const created = api.calls.find((c) => c.method === 'POST' && c.path === '/api/posts');
    expect(created).toMatchObject({ actingUser: 'u1', body: { text: 'My new post' } });
    expect(api.calls.filter((c) => c.path === '/api/feed').length).toBeGreaterThan(feedCallsBefore);
  });

  it('blocks text over 500 characters', async () => {
    seedRoutes();
    const { user } = renderApp('/');
    await screen.findAllByRole('article');
    const box = screen.getByLabelText(/What's on your mind/);
    await user.click(box);
    await user.paste('a'.repeat(501));
    expect(screen.getByText('1 over the 500-character limit')).toBeInTheDocument();
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();
  });

  it('shows the server’s validation message and keeps the text', async () => {
    seedRoutes({
      'POST /api/posts': reply(400, {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Post must be at most 500 characters.',
        field: 'text',
      }),
    });
    const { user } = renderApp('/');
    await screen.findAllByRole('article');
    const box = screen.getByLabelText(/What's on your mind/);
    await user.type(box, 'hello');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Post must be at most 500 characters.');
    expect(box).toHaveValue('hello');
  });
});

describe('likes and comments', () => {
  it('disables the like button while the request is in flight', async () => {
    const pending = deferred<{ body: unknown }>();
    const api = seedRoutes({ 'PUT /api/posts/2/like': () => pending.promise });
    const { user } = renderApp('/');
    const posts = await screen.findAllByRole('article');
    const like = within(posts[1]!).getByRole('button', { name: 'Like' });
    expect(like).toHaveAttribute('aria-pressed', 'false');

    await user.click(like);
    expect(like).toBeDisabled();
    await user.click(like);
    expect(api.calls.filter((c) => c.method === 'PUT').length).toBe(1);

    pending.resolve({ body: { postId: 2, likedByMe: true, likeCount: 2 } });
    await waitFor(() => expect(like).toBeEnabled());
  });

  it('unlikes a liked post', async () => {
    const api = seedRoutes({ 'DELETE /api/posts/3/like': { postId: 3, likedByMe: false, likeCount: 0 } });
    const { user } = renderApp('/');
    const posts = await screen.findAllByRole('article');
    await user.click(within(posts[0]!).getByRole('button', { name: 'Like' }));
    await waitFor(() => expect(api.calls.some((c) => c.method === 'DELETE' && c.path === '/api/posts/3/like')).toBe(true));
  });

  it('adds a comment and clears the input', async () => {
    const api = seedRoutes({
      'POST /api/posts/3/comments': reply(201, {
        id: 9,
        postId: 3,
        author: alice,
        text: 'Nice!',
        createdAt: new Date().toISOString(),
      }),
    });
    const { user } = renderApp('/');
    const posts = await screen.findAllByRole('article');
    const input = within(posts[0]!).getByLabelText('Add a comment');
    await user.type(input, 'Nice!{Enter}');
    await waitFor(() => expect(input).toHaveValue(''));
    expect(api.calls.find((c) => c.path === '/api/posts/3/comments')?.body).toEqual({ text: 'Nice!' });
  });

  it('links to all comments when the feed shows only some', async () => {
    seedRoutes({ 'GET /api/feed': [{ ...p2, commentCount: 5 }] });
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'View all 5 comments' })).toHaveAttribute('href', '/posts/2');
  });
});

describe('profiles and following', () => {
  it('shows counts and a follow button for other users, and follows on click', async () => {
    let following = false;
    const api = seedRoutes({
      'GET /api/users/carol': () => ({
        body: makeProfile(carol, { postCount: 1, followerCount: following ? 2 : 1, followedByMe: following }),
      }),
      'GET /api/users/carol/posts': [makePost({ id: 1, author: carol, text: 'Just finished a great novel.' })],
      'PUT /api/users/carol/follow': () => {
        following = true;
        return { body: { followedByMe: true, followerCount: 2, followingCount: 0 } };
      },
    });
    const { user } = renderApp('/users/carol');

    expect(await screen.findByRole('heading', { name: 'carol', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText('Just finished a great novel.')).toBeInTheDocument();
    expect(screen.getByText('follower')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Follow' }));
    expect(await screen.findByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
    expect(screen.getByText('followers')).toBeInTheDocument();
    expect(api.calls.find((c) => c.method === 'PUT')?.actingUser).toBe('u1');
  });

  it('hides the follow button on your own profile (FR-4.3)', async () => {
    seedRoutes({
      'GET /api/users/alice': makeProfile(alice, { postCount: 1 }),
      'GET /api/users/alice/posts': [p2],
    });
    renderApp('/users/alice');
    expect(await screen.findByText('This is you')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('lists followers in the followers tab', async () => {
    seedRoutes({
      'GET /api/users/bob': makeProfile(bob, { followerCount: 1 }),
      'GET /api/users/bob/posts': [],
      'GET /api/users/bob/followers': [alice],
    });
    const { user } = renderApp('/users/bob');
    await user.click(await screen.findByRole('tab', { name: 'Followers' }));
    expect(screen.getByRole('tab', { name: 'Followers' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(await within(panel).findByText('Alice Anderson')).toBeInTheDocument();
  });
});

describe('reset demo data', () => {
  it('asks for confirmation; cancel and Escape do nothing', async () => {
    const api = seedRoutes({ 'POST /api/demo/reset': reply(204) });
    const { user } = renderApp('/');
    await screen.findAllByRole('article');
    const open = screen.getByRole('button', { name: 'Reset Demo Data' });

    await user.click(open);
    const dialog = screen.getByRole('dialog', { name: 'Reset demo data?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(open).toHaveFocus();

    await user.click(open);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.calls.some((c) => c.path === '/api/demo/reset')).toBe(false);
  });

  it('resets on confirm, refreshes data and announces success', async () => {
    const api = seedRoutes({ 'POST /api/demo/reset': reply(204) });
    const { user } = renderApp('/');
    await screen.findAllByRole('article');
    const feedCallsBefore = api.calls.filter((c) => c.path === '/api/feed').length;

    await user.click(screen.getByRole('button', { name: 'Reset Demo Data' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset' }));

    expect(await screen.findByText('Demo data restored.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.calls.filter((c) => c.path === '/api/demo/reset')).toHaveLength(1);
    await waitFor(() => expect(api.calls.filter((c) => c.path === '/api/feed').length).toBeGreaterThan(feedCallsBefore));
  });
});
