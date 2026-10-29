import { Link } from 'react-router-dom';
import type { Comment } from '../api/types';
import { RelativeTime } from './RelativeTime';

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return null;
  return (
    <ul className="comment-list" aria-label="Comments">
      {comments.map((c) => (
        <li key={c.id} className="comment">
          <Link to={`/users/${c.author.username}`} className="username">
            {c.author.username}
          </Link>{' '}
          <span className="user-text">{c.text}</span>
          <span className="comment-time muted">
            {' · '}
            <RelativeTime iso={c.createdAt} />
          </span>
        </li>
      ))}
    </ul>
  );
}
