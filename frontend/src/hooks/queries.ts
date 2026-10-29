import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { useActingUser } from '../context/ActingUserContext';

// Every key except 'users' includes the acting user, so switching users shows that
// user's view (likedByMe, followedByMe) without clearing any cache by hand.
export const queryKeys = {
  users: ['users'] as const,
  feed: (me: string) => ['feed', me] as const,
  profile: (me: string, username: string) => ['profile', me, username] as const,
  userPosts: (me: string, username: string) => ['userPosts', me, username] as const,
  post: (me: string, postId: number) => ['post', me, postId] as const,
  followers: (me: string, username: string) => ['followers', me, username] as const,
  following: (me: string, username: string) => ['following', me, username] as const,
};

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: api.listUsers, staleTime: Infinity });
}

export function useFeed() {
  const me = useActingUser().actingUser.id;
  return useQuery({ queryKey: queryKeys.feed(me), queryFn: () => api.feed(me) });
}

export function useProfile(username: string) {
  const me = useActingUser().actingUser.id;
  return useQuery({ queryKey: queryKeys.profile(me, username), queryFn: () => api.profile(me, username) });
}

export function useUserPosts(username: string) {
  const me = useActingUser().actingUser.id;
  return useQuery({ queryKey: queryKeys.userPosts(me, username), queryFn: () => api.userPosts(me, username) });
}

export function usePost(postId: number) {
  const me = useActingUser().actingUser.id;
  return useQuery({ queryKey: queryKeys.post(me, postId), queryFn: () => api.post(me, postId) });
}

export function useFollowList(kind: 'followers' | 'following', username: string, enabled: boolean) {
  const me = useActingUser().actingUser.id;
  return useQuery({
    queryKey: queryKeys[kind](me, username),
    queryFn: () => (kind === 'followers' ? api.followers(me, username) : api.following(me, username)),
    enabled,
  });
}

/**
 * After any write, refetch every view that might show it (FR-5.6). At MVP size this is
 * simpler and safer than patching caches. The returned promise keeps the mutation
 * pending until fresh data has arrived, so buttons never flash a stale state.
 */
function useRefreshViews() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'users' });
}

export function useCreatePost() {
  const me = useActingUser().actingUser.id;
  const refresh = useRefreshViews();
  return useMutation({ mutationFn: (text: string) => api.createPost(me, text), onSuccess: refresh });
}

export function useToggleLike(postId: number) {
  const me = useActingUser().actingUser.id;
  const refresh = useRefreshViews();
  return useMutation({
    mutationFn: (currentlyLiked: boolean) => (currentlyLiked ? api.unlike(me, postId) : api.like(me, postId)),
    onSuccess: refresh,
  });
}

export function useAddComment(postId: number) {
  const me = useActingUser().actingUser.id;
  const refresh = useRefreshViews();
  return useMutation({ mutationFn: (text: string) => api.addComment(me, postId, text), onSuccess: refresh });
}

export function useToggleFollow(username: string) {
  const me = useActingUser().actingUser.id;
  const refresh = useRefreshViews();
  return useMutation({
    mutationFn: (currentlyFollowing: boolean) =>
      currentlyFollowing ? api.unfollow(me, username) : api.follow(me, username),
    onSuccess: refresh,
  });
}

export function useResetDemo() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.resetDemo, onSuccess: () => queryClient.invalidateQueries() });
}
