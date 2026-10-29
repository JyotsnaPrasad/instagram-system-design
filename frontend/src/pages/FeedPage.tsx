import { EmptyFeed } from '../components/EmptyFeed';
import { PostCard } from '../components/PostCard';
import { PostComposer } from '../components/PostComposer';
import { ErrorState, LoadingState } from '../components/Status';
import { useFeed } from '../hooks/queries';

/** Home: your posts plus posts from people you follow, newest first (FR-5). */
export function FeedPage() {
  const feed = useFeed();
  return (
    <div className="stack">
      <h1 className="visually-hidden">Home feed</h1>
      <PostComposer />
      {feed.isPending ? (
        <LoadingState label="Loading feed…" />
      ) : feed.isError ? (
        <ErrorState error={feed.error} onRetry={() => feed.refetch()} />
      ) : feed.data.length === 0 ? (
        <EmptyFeed />
      ) : (
        <>
          {feed.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <p className="feed-end muted">You're all caught up.</p>
        </>
      )}
    </div>
  );
}
