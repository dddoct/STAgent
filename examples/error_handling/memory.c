// 错误处理测试：内存分配失败模拟
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: memory <size_in_mb>\n");
        return 1;
    }

    long size_mb = atol(argv[1]);

    if (size_mb <= 0) {
        fprintf(stderr, "Error: Size must be positive\n");
        return 2;
    }

    if (size_mb > 1000) {
        fprintf(stderr, "Error: Size too large (max 1000 MB)\n");
        return 3;
    }

    size_t bytes = size_mb * 1024 * 1024;
    char *buffer = (char *)malloc(bytes);

    if (buffer == NULL) {
        fprintf(stderr, "Error: Memory allocation failed\n");
        return 4;
    }

    memset(buffer, 0, bytes);
    printf("Successfully allocated %ld MB\n", size_mb);

    free(buffer);
    return 0;
}
