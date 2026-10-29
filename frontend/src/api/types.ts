// Mirrors the backend DTOs (ARCHITECTURE.md section 6).

export type UserSummary = { id: string; username: string; displayName: string };

export type Profile = UserSummary & {
  bio: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
};

/** Counts belong to the followed/unfollowed user. */
export type FollowState = { followedByMe: boolean; followerCount: number; followingCount: number };

export type LikeState = { postId: number; likedByMe: boolean; likeCount: number };

export type Comment = {
  id: number;
  postId: number;
  author: UserSummary;
  text: string;
  createdAt: string;
};

export type PostView = {
  id: number;
  author: UserSummary;
  text: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  /** Feed and profile: up to 2 most recent, oldest first. Post detail: all. */
  comments: Comment[];
};

export type ApiErrorBody = { status: number; code: string; message: string; field?: string };
