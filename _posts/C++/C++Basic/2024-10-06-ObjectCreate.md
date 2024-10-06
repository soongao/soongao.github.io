---
title: C++ Object Create
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, basic]
tags: [C++]     # TAG names should always be lowercase
# toc: false
---

# Object Create

#### 内存分配方式
- stack 栈分配
  - 栈分配会在作用域结束后释放内存
  - 作用域包括函数结束, 也包括{}结束
    - 将作用域理解成, 创建了一个局部变量, 当局部变量不能用的时候就离开作用域了
```cpp
ClassType ClassName; // 默认构造函数
ClassType ClassName("initalize or not");
ClassType ClassName = ClassType("initalize or not");
```
- heap 堆分配
  - 堆分配会在堆上分配一个连续的内存空间, 然后返回内存起始地址
  - 堆分配会更耗时, 并且不会自动释放内存, 需要手动delete
```cpp
ClassType* ClassName = new ClassType("initalize or not");
// do something
delete ClassName;

// 数组形式
ClassType* ClassName = new ClassType()[num];
// do something
delete[] ClassName;
```
#### new运算符
  - new is an operator
  - new的操作等价于malloc然后调用构造函数
  ```cpp
  ClassType* ClassName = new ClassType;
  // new 等价于下面malloc分配内存空间, 同时执行了构造函数
  // malloc是不会执行构造函数的
  ClassType* ClassName = (ClassType*)malloc(sizeof(ClassType));
  ```
