export const MAX_POST_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 300;

/** Length after trimming, in Unicode code points, matching the server (an emoji counts as 1). */
export function charCount(text: string): number {
  return [...text.trim()].length;
}

export type TextCheck = { count: number; isEmpty: boolean; isTooLong: boolean; isValid: boolean };

export function checkText(text: string, max: number): TextCheck {
  const count = charCount(text);
  const isEmpty = count === 0;
  const isTooLong = count > max;
  return { count, isEmpty, isTooLong, isValid: !isEmpty && !isTooLong };
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}
