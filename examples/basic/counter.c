// 基础测试：计数器
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: counter <start> <end>\n");
        return 1;
    }

    int start = atoi(argv[1]);
    int end = atoi(argv[2]);

    if (start > end) {
        fprintf(stderr, "Error: Start must be <= end\n");
        return 2;
    }

    for (int i = start; i <= end; i++) {
        printf("%d\n", i);
    }

    return 0;
}
