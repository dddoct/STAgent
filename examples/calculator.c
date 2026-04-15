#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 简单计算器程序
// 支持加法、减法、乘法、除法运算
// 输入格式: a op b (用空格分隔，例如: 10 + 5)
// 输入 -1 -1 -1 退出程序

int main() {
    double a, b, result;
    char op;

    printf("简单计算器\n");
    printf("输入格式: a op b (例如: 10 + 5)\n");
    printf("输入 -1 -1 -1 退出\n\n");

    while (1) {
        if (scanf("%lf %c %lf", &a, &op, &b) != 3) {
            printf("输入格式错误\n");
            // 清除输入缓冲区
            while (getchar() != '\n');
            continue;
        }

        // 退出条件
        if (a == -1 && op == '-' && b == -1) {
            printf("退出计算器\n");
            break;
        }

        switch (op) {
            case '+':
                result = a + b;
                break;
            case '-':
                result = a - b;
                break;
            case '*':
            case 'x':
            case 'X':
                result = a * b;
                break;
            case '/':
                if (b == 0) {
                    printf("错误: 除数不能为零\n");
                    continue;
                }
                result = a / b;
                break;
            default:
                printf("错误: 不支持的操作符 '%c'\n", op);
                continue;
        }

        printf("%.2f %c %.2f = %.2f\n", a, op, b, result);
    }

    return 0;
}
