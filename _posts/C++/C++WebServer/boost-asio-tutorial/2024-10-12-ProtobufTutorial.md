---
title: Protobuf tutorial
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# Protobuf tutorial
## protobuf3 安装教程
- https://blog.csdn.net/huhuhu_449/article/details/103044663
- https://llfc.club/articlepage?id=2Pp1SSXN9MDHMFG9WtkayoC3BeC
- 安装的protobuf为x64的, 则在配置vs时, vs也要将平台选为x64

## 功能
- Protobuf是一种轻便高效的序列化数据结构的协议, Google开发
- 它可以用于将结构化数据序列化到二进制格式, 并广泛用于数据存储, 通信协议. 配置文件等领域

## 为什么要序列化
- 如果要传递类等抽象数据, 而tcp是面向字节流的, 此时需要将类结构序列化为字符串来传输

## 定义.proto文件
- 要使用protobuf的序列化功能, 需要生成pb文件, pb文件包含了我们要序列化的类信息
- 先创建一个.proto文件, 该文件用来定义我们要发送的类信息
```proto
syntax = "proto3"; // 使用proto3协议
// message是定义类的关键字
message Book
{
    // 1,2,3 是序列号时的顺序, 而不是变量的值
    string name = 1; 
    int32 pages = 2;
    float price = 3;
}
```

## 基于.proto文件生成C++类
- protoc --cpp_out=`source dir` `file name.proto`
- 生成.pb.cc和.pb.h文件
- 上述例子经过生成后就会形成一个C++类, 类名为Book, 变量跟定义的相同, 同时生成了相应的get/set函数, 通过引入.pb.h头文件使用Book类

## 序列化和反序列化
```cpp
#include <iostream>
#include "msg.pb.h"
int main()
{
    // 创建Book类变量
    Book book;
    // set
    book.set_name("CPP programing");
    book.set_pages(100);
    book.set_price(200);
    // 用于接收序列化后的string
    std::string bookstr;
    // SerializeToString
    book.SerializeToString(&bookstr);
    std::cout << "serialize str is " << bookstr << std::endl;
    // 用于接收反序列化的Class
    Book book2;
    // ParseFromString
    book2.ParseFromString(bookstr);
    std::cout << "book2 name is " << book2.name() << " price is " << book2.price() << " pages is " << book2.pages() << std::endl;
    std::cin.get();
}
```