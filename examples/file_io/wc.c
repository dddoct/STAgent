// 文件IO测试：统计文件行数
#include <stdio.h>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: wc <filename>\n");
        return 1;
    }

    FILE *file = fopen(argv[1], "r");
    if (file == NULL) {
        fprintf(stderr, "Error: Cannot open file '%s'\n", argv[1]);
        return 2;
    }

    int lines = 0, words = 0, chars = 0;
    int in_word = 0;
    int c;

    while ((c = fgetc(file)) != EOF) {
        chars++;
        if (c == '\n') {
            lines++;
        }
        if (c == ' ' || c == '\n' || c == '\t') {
            in_word = 0;
        } else if (in_word == 0) {
            in_word = 1;
            words++;
        }
    }

    fclose(file);

    printf("Lines: %d\n", lines);
    printf("Words: %d\n", words);
    printf("Chars: %d\n", chars);
    return 0;
}
