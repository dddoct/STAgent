// 错误处理测试：参数验证
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Error: Expected exactly 1 argument\n");
        return 1;
    }

    int num = atoi(argv[1]);

    if (num < 0) {
        fprintf(stderr, "Error: Number must be non-negative\n");
        return 2;
    }

    if (num > 100) {
        fprintf(stderr, "Error: Number must be <= 100\n");
        return 3;
    }

    printf("Valid number: %d\n", num);
    return 0;
}
