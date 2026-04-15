// 数学测试：除法计算器（包含错误处理）
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: divide <dividend> <divisor>\n");
        return 1;
    }

    double a = atof(argv[1]);
    double b = atof(argv[2]);

    if (b == 0) {
        fprintf(stderr, "Error: Division by zero\n");
        return 2;
    }

    double result = a / b;
    printf("%.2f\n", result);
    return 0;
}
