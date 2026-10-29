package com.example.insta;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.insta.common.ApiException;
import com.example.insta.common.TextRules;
import org.junit.jupiter.api.Test;

class TextRulesTest {

    private static String validPost(String raw) {
        return TextRules.requireValid(raw, TextRules.MAX_POST_LENGTH, "Post");
    }

    @Test
    void trimsLeadingAndTrailingWhitespaceButKeepsInnerLineBreaks() {
        assertThat(validPost("  \n hello\n\nworld  \t")).isEqualTo("hello\n\nworld");
    }

    @Test
    void rejectsNullEmptyAndWhitespaceOnly() {
        for (String raw : new String[] {null, "", "   ", "\n\t \n"}) {
            assertThatThrownBy(() -> validPost(raw))
                    .isInstanceOf(ApiException.class)
                    .hasMessage("Post cannot be empty.");
        }
    }

    @Test
    void acceptsExactlyTheLimitAndRejectsOneMore() {
        assertThat(validPost("a".repeat(500))).hasSize(500);
        assertThatThrownBy(() -> validPost("a".repeat(501)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("at most 500");
    }

    @Test
    void measuresLengthAfterTrimming() {
        assertThat(validPost("  " + "a".repeat(500) + "  ")).hasSize(500);
    }

    @Test
    void countsEmojiAsOneCharacter() {
        String emoji = "😀"; // 😀: one code point, two UTF-16 units
        assertThat(validPost(emoji.repeat(500))).isNotEmpty();
        assertThatThrownBy(() -> validPost(emoji.repeat(501))).isInstanceOf(ApiException.class);
    }

    @Test
    void commentLimitIs300() {
        assertThat(TextRules.requireValid("c".repeat(300), TextRules.MAX_COMMENT_LENGTH, "Comment")).hasSize(300);
        assertThatThrownBy(() -> TextRules.requireValid("c".repeat(301), TextRules.MAX_COMMENT_LENGTH, "Comment"))
                .hasMessageContaining("Comment must be at most 300");
    }
}
