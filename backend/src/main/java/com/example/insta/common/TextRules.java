package com.example.insta.common;

/** Shared validation for user-written text (posts and comments). */
public final class TextRules {

    public static final int MAX_POST_LENGTH = 500;
    public static final int MAX_COMMENT_LENGTH = 300;

    private TextRules() {
    }

    /**
     * Trims leading/trailing whitespace and checks the length in Unicode code points,
     * so an emoji counts as one character. Internal whitespace and line breaks are kept.
     *
     * @param noun used in messages, e.g. "Post" or "Comment"
     * @return the trimmed text
     */
    public static String requireValid(String raw, int maxLength, String noun) {
        String trimmed = raw == null ? "" : raw.strip();
        if (trimmed.isEmpty()) {
            throw ApiException.validation(noun + " cannot be empty.", "text");
        }
        int length = trimmed.codePointCount(0, trimmed.length());
        if (length > maxLength) {
            throw ApiException.validation(
                    noun + " must be at most " + maxLength + " characters (got " + length + ").", "text");
        }
        return trimmed;
    }
}
