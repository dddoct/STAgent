// 字符串测试：回文检测
#include <stdio.h>
#include <string.h>
#include <ctype.h>

int is_palindrome(char *str) {
    int len = strlen(str);
    for (int i = 0; i < len / 2; i++) {
        if (tolower(str[i]) != tolower(str[len - 1 - i])) {
            return 0;
        }
    }
    return 1;
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: palindrome <string>\n");
        return 1;
    }

    if (is_palindrome(argv[1])) {
        printf("YES\n");
        return 0;
    } else {
        printf("NO\n");
        return 1;
    }
}
