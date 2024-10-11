---
title: Boost Asio Network Endian
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, websocket]     # TAG names should always be lowercase
# toc: false
---

# Network Endian

## host endian
### 判断主机是大端序还是小端序
```cpp
bool isBigEndian() {
    int num = 1;
    if (*(char*)&num == 1) {
        // 当前系统为小端序
        return false;
    } else {
        // 当前系统为大端序
        return true;
    }
}
```

## host to network
### network 字节序是大端序
```cpp
uint32_t network_long_value = boost::asio::detail::socket_ops::host_to_network_long(host_long_value);
uint16_t network_short_value = boost::asio::detail::socket_ops::host_to_network_short(host_short_value);
```

## network to host
```cpp
data_short = boost::asio::detail::socket_ops::network_to_host_short(data);
data_long = boost::asio::detail::socket_ops::network_to_host_long(data);
```