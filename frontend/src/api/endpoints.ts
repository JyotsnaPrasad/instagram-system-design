import { apiRequest } from './client';
import type { Comment, FollowState, LikeState, PostView, Profile, UserSummary } from './types';

const user = (username: string) => `/users/${encodeURIComponent(username)}`;

export const api = {
  listUsers: () => apiRequest<UserSummary[]>('/users'),

  feed: (me: string) => apiRequest<PostView[]>('/feed', { actingUserId: me }),

  profile: (me: string, username: string) => apiRequest<Profile>(user(username), { actingUserId: me }),

  userPosts: (me: string, username: string) =>
    apiRequest<PostView[]>(`${user(username)}/posts`, { actingUserId: me }),

  followers: (me: string, username: string) =>
    apiRequest<UserSummary[]>(`${user(username)}/followers`, { actingUserId: me }),

  following: (me: string, username: string) =>
    apiRequest<UserSummary[]>(`${user(username)}/following`, { actingUserId: me }),

  follow: (me: string, username: string) =>
    apiRequest<FollowState>(`${user(username)}/follow`, { method: 'PUT', actingUserId: me }),

  unfollow: (me: string, username: string) =>
    apiRequest<FollowState>(`${user(username)}/follow`, { method: 'DELETE', actingUserId: me }),

  post: (me: string, postId: number) => apiRequest<PostView>(`/posts/${postId}`, { actingUserId: me }),

  createPost: (me: string, text: string) =>
    apiRequest<PostView>('/posts', { method: 'POST', actingUserId: me, body: { text } }),

  like: (me: string, postId: number) =>
    apiRequest<LikeState>(`/posts/${postId}/like`, { method: 'PUT', actingUserId: me }),

  unlike: (me: string, postId: number) =>
    apiRequest<LikeState>(`/posts/${postId}/like`, { method: 'DELETE', actingUserId: me }),

  addComment: (me: string, postId: number, text: string) =>
    apiRequest<Comment>(`/posts/${postId}/comments`, { method: 'POST', actingUserId: me, body: { text } }),

  resetDemo: () => apiRequest<void>('/demo/reset', { method: 'POST' }),
};
