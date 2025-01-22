---
title: C++ Pointer and Reference
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, basic]
tags: [C++]     # TAG names should always be lowercase
# toc: false
---

# C++ Pointer and Reference

### 什么是指针
##### 指针只是一个普通的数据类型, 它的值就是一个地址, 就是一个存放一组16进制数的变量, 只不过这组16进制数被赋予了地址的含义

```cpp
/*
ptr中存放一个16进制数, 这个16进制数与&num一致, 也就是说ptr中存放的就是num的地址
在Memory中查看ptr, 等于查看这个16进制数(也相当于&num), 对应到存放num所存放的值(8)的内存块
*/
int num = 8;
int* ptr = &num;
/*
比如ptr = 0x00EAFE9C = &num
    内存中为0x00EAFE9C -> 08 00 00 00
如果直接在内存中查看num呢?
    结果等于查看内存地址0x00000008
*/
```

##### 二级指针
##### 指针本身也在内存中存放, 也有一个内存地址
```cpp
/*
通过&ptr可以拿到ptr所在的内存地址
*/
int num = 8;
int* ptr = &num;
int** ptr2 = &ptr;
/*
比如这里&ptr = 0x0063FB30 = ptr2,
    内存中为0x0063FB30 -> 3c fb 63 00
这个0x0063fb3c就是ptr存的那个16进制数
0x0063fb3c = ptr = &num
    内存中为0x0063FB3C -> 08 00 00 00
*/
```
##### 当然还可以再向上嵌套指针

### 数组指针、字符指针
##### 都是一块连续的内存地址, 都是通过起始位置指针来遍历
```cpp
// 这里加const只是表示字符串字面值, 代表不能修改
const char* arr = "abcde";
```
```cpp
/*
数组arr其实就是一个起始位置指针
*/
int arr[5] = { 5,6,7,8,9 };
int* ptr = arr; // int* ptr = &arr[0];
for (int i = 0; i < 5; i++) {
    std::cout << ptr + i << " -> " << *(ptr + i) << std::endl;
    /* cout result
    00AFFDBC -> 05 00 00 00
    00AFFDC0 -> 06 00 00 00
    00AFFDC4 -> 07 00 00 00
    00AFFDC8 -> 08 00 00 00
    00AFFDCC -> 09 00 00 00
    */
}
/*
ptr = arr = 0x00AFFDBC
*/
```

### *和&的使用
##### *的含义
1. 指针
   - void*
2. 解引用
    - *(ptr+1) 表示取出(ptr+1)所指向的内存的数据
##### &的含义
1. 取地址
   - int* ptr = &num;
2. 引用
   - 用在函数参数传递中, 通过引用传值等价于将真正的变量传入了函数中, 不使用引用传值等价于将变量的值传入函数中
        ```cpp
        void add(int x) {
            x += 1;
        }

        int a = 1;
        add(a); // 调用后, a依然为1
        ```
        ```cpp
        void add(int &x){
            x += 1;
        }

        int a = 1;
        add(a); // 调用后, a等于2
        ```