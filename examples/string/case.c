// 字符串测试：大小写转换
#include <stdio.h>
#include <ctype.h>
#include <string.h>

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: case <upper|lower> <string>\n");
        return 1;
    }

    char *mode = argv[1];
    char *str = argv[2];

    if (strcmp(mode, "upper") == 0) {
        for (int i = 0; str[i]; i++) {
            printf("%c", toupper(str[i]));
        }
    } else if (strcmp(mode, "lower") == 0) {
        for (int i = 0; str[i]; i++) {
            printf("%c", tolower(str[i]));
        }
    } else {
        fprintf(stderr, "Error: Invalid mode. Use 'upper' or 'lower'\n");
        return 1;
    }

    printf("\n");
    return 0;
}
