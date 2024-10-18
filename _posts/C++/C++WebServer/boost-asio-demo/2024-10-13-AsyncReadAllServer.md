---
title: Boost Asio Async Server using asio async read
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# Async Server using asio async read
## CSession Start()
```cpp
void CSession::Start() {
    m_recv_head_node->Clear();
    boost::asio::async_read(
        m_socket, boost::asio::buffer(m_recv_head_node->m_buffer, HEAD_LENGTH), 
        std::bind(&CSession::HandleReadHead, this, std::placeholders::_1, std::placeholders::_2, shared_from_this()));
}
```

## CSession HandleReadHead()
```cpp
void CSession::HandleReadHead(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<CSession> self_session) {
    if (!error) {
        if (bytes_transfered < HEAD_LENGTH) {
            std::cout << "read head lenth error\n";
            m_server->ClearSession(m_uuid);
            return;
        }
        //头部接收完，解析头部
        short data_len = 0;
        memcpy(&data_len, m_recv_head_node->m_buffer, HEAD_LENGTH);
        std::cout << "data_len is " << data_len << "\n";
        //此处省略字节序转换
        // ...
        //头部长度非法
        if (data_len > MAX_LENGTH) {
            std::cout << "invalid data length is " << data_len << "\n";
            m_server->ClearSession(m_uuid);
            return;
        }
        m_recv_msg_node = std::make_shared<MsgNode>(data_len);
        boost::asio::async_read(
            m_socket, boost::asio::buffer(m_recv_msg_node->m_buffer, m_recv_msg_node->m_total_len),
            std::bind(&CSession::HandleReadMsg, this, std::placeholders::_1, std::placeholders::_2, self_session));
    }
    else {
        std::cout << "handle read failed, error is " << error.what() << "\n";
        m_server->ClearSession(m_uuid);
    }
}
```

## CSession HandleReadMsg()
```cpp
void CSession::HandleReadMsg(const boost::system::error_code & error, size_t bytes_transfered, std::shared_ptr<CSession> self_session) {
    if (!error) {
        m_recv_msg_node->m_buffer[m_recv_msg_node->m_total_len] = '\0';
        std::cout << "receive data is " << m_recv_msg_node->m_buffer << "\n";
        Send(m_recv_msg_node->m_buffer, m_recv_msg_node->m_total_len);
        //再次接收头部数据
        m_recv_head_node->Clear();
        boost::asio::async_read(
            m_socket, boost::asio::buffer(m_recv_head_node->m_buffer, HEAD_LENGTH),
            std::bind(&CSession::HandleReadHead, this, std::placeholders::_1, std::placeholders::_2, self_session));
    }
    else {
        std::cout << "handle read msg failed,  error is " << error.what() << "\n";
        m_server->ClearSession(m_uuid);
    }
}
```