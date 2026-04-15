// 数学测试：加法计算器
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: add <num1> <num2>\n");
        return 1;
    }

    double a = atof(argv[1]);
    double b = atof(argv[2]);
    double result = a + b;

    printf("%.2f\n", result);
    return 0;
}
