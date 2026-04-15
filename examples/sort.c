#include <stdio.h>
#include <stdlib.h>

// 简单排序程序
// 从标准输入读取整数序列，每行一个，EOF结束
// 输出排序后的整数序列

int compare(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

int main() {
    int capacity = 100;
    int *numbers = malloc(capacity * sizeof(int));
    int count = 0;
    int num;

    // 读取数字
    while (scanf("%d", &num) == 1) {
        if (count >= capacity) {
            capacity *= 2;
            numbers = realloc(numbers, capacity * sizeof(int));
        }
        numbers[count++] = num;
    }

    if (count == 0) {
        printf("没有输入数字\n");
        free(numbers);
        return 0;
    }

    // 排序
    qsort(numbers, count, sizeof(int), compare);

    // 输出
    printf("排序结果:\n");
    for (int i = 0; i < count; i++) {
        printf("%d\n", numbers[i]);
    }

    free(numbers);
    return 0;
}
