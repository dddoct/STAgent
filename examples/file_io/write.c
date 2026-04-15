// 文件IO测试：写入文件
#include <stdio.h>

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: write <filename> <content>\n");
        return 1;
    }

    FILE *file = fopen(argv[1], "w");
    if (file == NULL) {
        fprintf(stderr, "Error: Cannot create file '%s'\n", argv[1]);
        return 2;
    }

    fprintf(file, "%s\n", argv[2]);
    fclose(file);

    printf("Successfully written to %s\n", argv[1]);
    return 0;
}
