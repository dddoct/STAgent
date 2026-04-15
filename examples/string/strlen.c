// 字符串测试：字符串长度统计
#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: strlen <string>\n");
        return 1;
    }

    char *str = argv[1];
    int len = strlen(str);
    int letters = 0, digits = 0, spaces = 0, others = 0;

    for (int i = 0; i < len; i++) {
        if (isalpha(str[i])) letters++;
        else if (isdigit(str[i])) digits++;
        else if (isspace(str[i])) spaces++;
        else others++;
    }

    printf("Total: %d\n", len);
    printf("Letters: %d\n", letters);
    printf("Digits: %d\n", digits);
    printf("Spaces: %d\n", spaces);
    printf("Others: %d\n", others);
    return 0;
}
