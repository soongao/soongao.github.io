---
title: How to use jsoncpp in Server
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# How to use jsoncpp in Server
- 基础使用见JsoncppTutorial.md

## Server
```cpp
Json::Reader reader;
Json::Value root;
reader.parse(std::string(m_recv_msg_node->m_data,m_recv_msg_node->m_total_len), root);
std::cout << "recevie msg id  is " << root["id"].asInt() << " msg data is "
<< root["data"].asString() << "\n";
```

## Client
```cpp
Json::Value root;
root["id"] = 1001;
root["data"] = "hello world";
// 序列化
std::string request = root.toStyledString();
size_t request_length = request.length();
char send_data[MAX_LENGTH] = { 0 };
//转为网络字节序
int request_host_length = boost::asio::detail::socket_ops::host_to_network_short(request_length);
memcpy(send_data, &request_host_length, 2);
memcpy(send_data + 2, request.c_str(), request_length);
boost::asio::write(sock, boost::asio::buffer(send_data, request_length + 2));
```