import { useId, useState, type FormEvent } from 'react';
import { errorMessage } from '../api/client';
import { useActingUser } from '../context/ActingUserContext';
import { useCreatePost } from '../hooks/queries';
import { checkText, MAX_POST_LENGTH } from '../lib/text';
import { Avatar } from './Avatar';
import { CharCounter } from './CharCounter';
import { Spinner } from './Status';

/** Create a text post (FR-1). The server re-validates everything checked here. */
export function PostComposer() {
  const { actingUser } = useActingUser();
  const createPost = useCreatePost();
  const [text, setText] = useState('');
  const id = useId();
  const check = checkText(text, MAX_POST_LENGTH);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!check.isValid || createPost.isPending) return;
    createPost.mutate(text, { onSuccess: () => setText('') });
  }

  return (
    <form className="card composer" onSubmit={onSubmit} aria-label="Create a post">
      <div className="composer-row">
        <Avatar user={actingUser} />
        <div className="composer-body">
          <label htmlFor={`${id}-text`} className="visually-hidden">
            What's on your mind, {actingUser.displayName}?
          </label>
          <textarea
            id={`${id}-text`}
            className="textarea"
            placeholder={`What's on your mind, ${actingUser.displayName.split(' ')[0]}?`}
            value={text}
            rows={3}
            onChange={(e) => {
              setText(e.target.value);
              if (createPost.isError) createPost.reset();
            }}
            aria-describedby={`${id}-counter`}
            aria-invalid={check.isTooLong}
          />
        </div>
      </div>
      {createPost.isError && (
        <p className="form-error" role="alert">
          {errorMessage(createPost.error)}
        </p>
      )}
      <div className="composer-footer">
        <CharCounter id={`${id}-counter`} count={check.count} max={MAX_POST_LENGTH} />
        <button type="submit" className="btn btn-primary" disabled={!check.isValid || createPost.isPending}>
          {createPost.isPending ? (
            <>
              <Spinner small /> Posting…
            </>
          ) : (
            'Post'
          )}
        </button>
      </div>
    </form>
  );
}
