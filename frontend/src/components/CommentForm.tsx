import { useId, useState, type FormEvent } from 'react';
import { errorMessage } from '../api/client';
import { useAddComment } from '../hooks/queries';
import { checkText, MAX_COMMENT_LENGTH } from '../lib/text';
import { CharCounter } from './CharCounter';

export function CommentForm({ postId }: { postId: number }) {
  const addComment = useAddComment(postId);
  const [text, setText] = useState('');
  const id = useId();
  const check = checkText(text, MAX_COMMENT_LENGTH);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!check.isValid || addComment.isPending) return;
    addComment.mutate(text, { onSuccess: () => setText('') });
  }

  return (
    <form className="comment-form" onSubmit={onSubmit}>
      <div className="comment-form-row">
        <label htmlFor={`${id}-comment`} className="visually-hidden">
          Add a comment
        </label>
        <input
          id={`${id}-comment`}
          className="comment-input"
          placeholder="Add a comment…"
          value={text}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            if (addComment.isError) addComment.reset();
          }}
          aria-describedby={`${id}-counter`}
          aria-invalid={check.isTooLong}
        />
        <button
          type="submit"
          className="link-btn"
          aria-label="Post comment"
          disabled={!check.isValid || addComment.isPending}
        >
          {addComment.isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
      <CharCounter id={`${id}-counter`} count={check.count} max={MAX_COMMENT_LENGTH} showFrom={250} />
      {addComment.isError && (
        <p className="form-error" role="alert">
          {errorMessage(addComment.error)}
        </p>
      )}
    </form>
  );
}
