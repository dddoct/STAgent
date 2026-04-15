// 数学测试：阶乘计算
#include <stdio.h>
#include <stdlib.h>

long long factorial(int n) {
    if (n <= 1) return 1;
    long long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: factorial <number>\n");
        return 1;
    }

    int n = atoi(argv[1]);

    if (n < 0) {
        fprintf(stderr, "Error: Number must be non-negative\n");
        return 2;
    }

    if (n > 20) {
        fprintf(stderr, "Error: Number too large (max 20)\n");
        return 3;
    }

    printf("%lld\n", factorial(n));
    return 0;
}
