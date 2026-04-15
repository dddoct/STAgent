// 数学测试：最大公约数
#include <stdio.h>
#include <stdlib.h>

int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: gcd <num1> <num2>\n");
        return 1;
    }

    int a = atoi(argv[1]);
    int b = atoi(argv[2]);

    if (a <= 0 || b <= 0) {
        fprintf(stderr, "Error: Both numbers must be positive\n");
        return 2;
    }

    printf("%d\n", gcd(a, b));
    return 0;
}
