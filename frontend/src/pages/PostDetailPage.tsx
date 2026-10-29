import { useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { PostCard } from '../components/PostCard';
import { ErrorState, LoadingState, NotFoundState } from '../components/Status';
import { usePost } from '../hooks/queries';

/** One post with every comment (FR-3.4). */
export function PostDetailPage() {
  const { id = '' } = useParams();
  const postId = /^\d+$/.test(id) ? Number(id) : NaN;
  if (Number.isNaN(postId)) return <NotFoundState what="post" />;
  return <PostDetail postId={postId} />;
}

function PostDetail({ postId }: { postId: number }) {
  const post = usePost(postId);
  if (post.isPending) return <LoadingState label="Loading post…" />;
  if (post.isError) {
    if (post.error instanceof ApiError && post.error.isNotFound) return <NotFoundState what="post" />;
    return <ErrorState error={post.error} onRetry={() => post.refetch()} />;
  }
  return (
    <div className="stack">
      <h1 className="visually-hidden">Post by {post.data.author.displayName}</h1>
      <PostCard post={post.data} detail />
    </div>
  );
}
