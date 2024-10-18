---
title: Jsoncpp tutorial
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# Jsoncpp Tutorial
## jsoncpp 安装教程
- https://llfc.club/articlepage?id=2Q5XIMAjJ76n2snyNEHstog2W9b

## 功能
- 序列化, 不是二进制压缩, 但可读性更好
- protobuf常用于服务器与服务器通信, json常用于客户端与服务器通信

## demo
```cpp
#include <iostream>
#include <json/json.h>
#include <json/value.h>
#include <json/reader.h>

int main()
{
    Json::Value root;
    root["id"] = 1001;
    root["data"] = "hello world";
    // 序列化
    std::string request = root.toStyledString();
    std::cout << "request is " << request << std::endl;

    Json::Value root2;
    Json::Reader reader;
    // 使用reader反序列化
    reader.parse(request, root2);
    std::cout << "msg id is " << root2["id"] << " msg is " << root2["data"] << std::endl;
}
```