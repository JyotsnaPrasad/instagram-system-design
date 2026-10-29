import { Link } from 'react-router-dom';
import type { PostView } from '../api/types';
import { pluralize } from '../lib/text';
import { Avatar } from './Avatar';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { CommentIcon } from './Icons';
import { LikeButton } from './LikeButton';
import { RelativeTime } from './RelativeTime';

/** One post with its likes and comments (FR-5.3). `detail` hides the "view all" link. */
export function PostCard({ post, detail = false }: { post: PostView; detail?: boolean }) {
  const hiddenComments = post.commentCount - post.comments.length;
  const headingId = `post-${post.id}-author`;
  return (
    <article className="card post" aria-labelledby={headingId}>
      <header className="post-header">
        <Link to={`/users/${post.author.username}`} className="post-author" id={headingId}>
          <Avatar user={post.author} ring />
          <span className="post-author-names">
            <span className="display-name">{post.author.displayName}</span>
            <span className="muted">@{post.author.username}</span>
          </span>
        </Link>
        <Link to={`/posts/${post.id}`} className="post-time muted" aria-label={`Open post ${post.id}`}>
          <RelativeTime iso={post.createdAt} />
        </Link>
      </header>

      <p className="post-text user-text">{post.text}</p>

      <div className="post-actions">
        <LikeButton postId={post.id} liked={post.likedByMe} />
        <Link to={`/posts/${post.id}`} className="icon-btn" aria-label={`Comments (${post.commentCount})`}>
          <CommentIcon />
        </Link>
      </div>
      <p className="post-likes">{pluralize(post.likeCount, 'like')}</p>

      {!detail && hiddenComments > 0 && (
        <Link to={`/posts/${post.id}`} className="view-all muted">
          View all {post.commentCount} comments
        </Link>
      )}
      {detail && <h2 className="section-label">{pluralize(post.commentCount, 'comment')}</h2>}
      <CommentList comments={post.comments} />
      <CommentForm postId={post.id} />
    </article>
  );
}
