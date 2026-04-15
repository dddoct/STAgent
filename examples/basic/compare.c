// 基础测试：比较两个数
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: compare <num1> <num2>\n");
        return 1;
    }

    int a = atoi(argv[1]);
    int b = atoi(argv[2]);

    if (a > b) {
        printf("GREATER\n");
    } else if (a < b) {
        printf("LESS\n");
    } else {
        printf("EQUAL\n");
    }

    return 0;
}
