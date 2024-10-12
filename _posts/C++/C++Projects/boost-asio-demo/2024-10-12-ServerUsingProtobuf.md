---
title: How to use protobuf in Server
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# How to use protobuf in Server
- 基础使用见ProtobufTutorial.md

## proto message define
```proto
syntax = "proto3";
message MsgData
{
   int32  id = 1;
   string data = 2;
}
```

## server
```cpp
MsgData msgdata;
std::string receive_data;
// 将接收到的序列化string反序列化成class object
msgdata.ParseFromString(std::string(m_recv_msg_node->m_data,  m_recv_msg_node->m_total_len));
std::cout << "recevie msg id  is " << msgdata.id() << " msg data is " << msgdata.data() << "\n";

std::string return_str = "server has received msg, msg data is " + msgdata.data();

MsgData msgreturn;
msgreturn.set_id(msgdata.id());
msgreturn.set_data(return_str);
// 将class object序列化成string
msgreturn.SerializeToString(&return_str);
Send(return_str);
```

## client
```cpp
MsgData msgdata;
msgdata.set_id(1001);
msgdata.set_data("hello world");
std::string request;
msgdata.SerializeToString(&request);
```