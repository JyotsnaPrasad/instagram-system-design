import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { Profile } from '../api/types';
import { Avatar } from '../components/Avatar';
import { FollowButton } from '../components/FollowButton';
import { FollowList } from '../components/FollowList';
import { PostCard } from '../components/PostCard';
import { ErrorState, LoadingState, NotFoundState } from '../components/Status';
import { useActingUser } from '../context/ActingUserContext';
import { useProfile, useUserPosts } from '../hooks/queries';

type Tab = 'posts' | 'followers' | 'following';
const TABS: Tab[] = ['posts', 'followers', 'following'];

/** Profile with counts, follow control and posts / followers / following tabs (FR-4.1, FR-4.9). */
export function ProfilePage() {
  const { username = '' } = useParams();
  // Keyed so the selected tab resets when moving to another profile.
  return <ProfileView key={username} username={username} />;
}

function ProfileView({ username }: { username: string }) {
  const profile = useProfile(username);
  const [tab, setTab] = useState<Tab>('posts');

  if (profile.isPending) return <LoadingState label="Loading profile…" />;
  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.isNotFound) return <NotFoundState what="profile" />;
    return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  }

  return (
    <div className="stack">
      <ProfileHeader profile={profile.data} />
      <div className="tabs" role="tablist" aria-label="Profile sections">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            className="tab"
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const next = TABS[(TABS.indexOf(t) + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!;
              setTab(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
          >
            {t === 'posts' ? 'Posts' : t === 'followers' ? 'Followers' : 'Following'}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="stack">
        {tab === 'posts' ? <ProfilePosts username={username} /> : <FollowList kind={tab} username={username} />}
      </div>
    </div>
  );
}

function ProfileHeader({ profile }: { profile: Profile }) {
  const { actingUser } = useActingUser();
  const isMe = profile.id === actingUser.id;
  return (
    <section className="card profile-header" aria-labelledby="profile-name">
      <Avatar user={profile} size="lg" ring />
      <div className="profile-info">
        <div className="profile-title-row">
          <h1 id="profile-name" className="profile-username">
            {profile.username}
          </h1>
          {isMe ? (
            <span className="you-pill">This is you</span>
          ) : (
            <FollowButton username={profile.username} following={profile.followedByMe} />
          )}
        </div>
        <ul className="profile-stats" aria-label="Profile stats">
          <li>
            <strong>{profile.postCount}</strong> {profile.postCount === 1 ? 'post' : 'posts'}
          </li>
          <li>
            <strong>{profile.followerCount}</strong> {profile.followerCount === 1 ? 'follower' : 'followers'}
          </li>
          <li>
            <strong>{profile.followingCount}</strong> following
          </li>
        </ul>
        <p className="display-name">{profile.displayName}</p>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
      </div>
    </section>
  );
}

function ProfilePosts({ username }: { username: string }) {
  const posts = useUserPosts(username);
  if (posts.isPending) return <LoadingState label="Loading posts…" />;
  if (posts.isError) return <ErrorState error={posts.error} onRetry={() => posts.refetch()} />;
  if (posts.data.length === 0) return <p className="muted list-empty">No posts yet.</p>;
  return (
    <>
      {posts.data.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}
