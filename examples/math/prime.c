// 数学测试：素数判断
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int is_prime(int n) {
    if (n <= 1) return 0;
    if (n <= 3) return 1;
    if (n % 2 == 0 || n % 3 == 0) return 0;

    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) {
            return 0;
        }
    }
    return 1;
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: prime <number>\n");
        return 1;
    }

    int n = atoi(argv[1]);

    if (n < 0) {
        fprintf(stderr, "Error: Number must be non-negative\n");
        return 2;
    }

    if (is_prime(n)) {
        printf("YES\n");
        return 0;
    } else {
        printf("NO\n");
        return 1;
    }
}
