---
title: Boost Asio Async Write and Read Api
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, websocket]     # TAG names should always be lowercase
# toc: false
---

# How to use api to async write(send) and read(receive)
## By create class session and MsgNode

### MsgNode class header file
```cpp
class  MsgNode {
public:
    // for write
    MsgNode(const char* msg, int total_len) 
        : m_total_len(total_len), m_cur_len(0) {
        m_msg = new char[total_len];
        memcpy(m_msg, msg, total_len);
    }
    // for recieve
    MsgNode(int total_len) 
        : m_total_len(total_len), m_cur_len(0) {
        m_msg = new char[total_len];
    }
    ~MsgNode() {
        delete[] m_msg;
    }

    char* m_msg;
    int m_total_len;
    int m_cur_len;
};
```

### Session class header file
```cpp
class Session {
public:
    Session(std::shared_ptr<boost::asio::ip::tcp::socket> socket);
    void Connect(const boost::asio::ip::tcp::endpoint& ep);

    // error version
    void WriteCallBackErr(const boost::system::error_code& ec, std::size_t bytes_transferred, std::shared_ptr<MsgNode>);
    void WriteToSocketErr(const std::string& buf);
    
    // async write some
    void WriteCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred);
    void WriteToSocket(const std::string& buf);

    // async write all
    void WriteAllCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred);
    void WriteAllToSocket(const std::string& buf);

    // async read some
    void ReadFromSocket();
    void ReadCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred);

    // async read all
    void ReadAllFromSocket(const std::string& buf);
    void ReadAllCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred);

private:
    std::shared_ptr<boost::asio::ip::tcp::socket> m_socket;

    std::shared_ptr<MsgNode> m_send_node;

    std::queue<std::shared_ptr<MsgNode>> m_send_queue;
    bool m_send_pending;

    std::shared_ptr<MsgNode> m_recv_node;
    bool m_recv_pending;
};

Session::Session(std::shared_ptr<boost::asio::ip::tcp::socket> socket)
    : m_socket(socket), m_send_pending(false), m_recv_pending(false) {}

void Session::Connect(const boost::asio::ip::tcp::endpoint& ep) {
    m_socket->connect(ep);
}
```

### error version of write some
```cpp
// error version
void Session::WriteToSocketErr(const std::string& buf) {
    m_send_node = std::make_shared<MsgNode>(buf.c_str(), buf.length());
    
    // real write length may less than total length; so we need to call function callback
    this->m_socket->async_write_some(
        boost::asio::buffer(m_send_node->m_msg, m_send_node->m_total_len),
        std::bind(&Session::WriteCallBackErr, this, std::placeholders::_1, std::placeholders::_2, m_send_node));
}
void Session::WriteCallBackErr(const boost::system::error_code& ec,  std::size_t bytes_transferred, std::shared_ptr<MsgNode> msg_node) {
    // still have data to send
    if (bytes_transferred + msg_node->m_cur_len < msg_node->m_total_len) {
        m_send_node->m_cur_len += bytes_transferred;
        this->m_socket->async_write_some(
            boost::asio::buffer(m_send_node->m_msg + m_send_node->m_cur_len, m_send_node->m_total_len - m_send_node->m_cur_len),
            std::bind(&Session::WriteCallBackErr, this, std::placeholders::_1, std::placeholders::_2, m_send_node));
    }
}
```

### async write some
```cpp
// async wirte some
void Session::WriteToSocket(const std::string& buf) {
    m_send_queue.emplace(new MsgNode(buf.c_str(), buf.length()));
    //pending means in the state of sending data
    if (m_send_pending) {
        return;
    }
    
    this->m_socket->async_write_some(
        boost::asio::buffer(buf), 
        std::bind(&Session::WriteCallBack, this, std::placeholders::_1, std::placeholders::_2));
    
    m_send_pending = true;
}
void Session::WriteCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred) {
    if (ec.value() != 0) {
        std::cout << "Error , code is " << ec.value() << " . Message is " << ec.message();
        return;
    }
    
    auto& send_data = m_send_queue.front();
    send_data->m_cur_len += bytes_transferred;
    // still have data to send
    if (send_data->m_cur_len < send_data->m_total_len) {
        this->m_socket->async_write_some(
            boost::asio::buffer(send_data->m_msg + send_data->m_cur_len, send_data->m_total_len - send_data->m_cur_len),
            std::bind(&Session::WriteCallBack, this, std::placeholders::_1, std::placeholders::_2));
        return;
    }
    // finish sending
    m_send_queue.pop();
    
    if (m_send_queue.empty()) {
        m_send_pending = false;
    }

    // this one is finished; get another msg
    if (!m_send_queue.empty()) {
        auto& send_data = m_send_queue.front();
        this->m_socket->async_write_some(
            boost::asio::buffer(send_data->m_msg + send_data->m_cur_len, send_data->m_total_len - send_data->m_cur_len),
            std::bind(&Session::WriteCallBack, this, std::placeholders::_1, std::placeholders::_2));
    }
}
```

### async write all
```cpp
// async write all
void Session::WriteAllToSocket(const std::string& buf) {
    m_send_queue.emplace(new MsgNode(buf.c_str(), buf.length()));

    if (m_send_pending) {
        return;
    }
    
    // async send api call send some api
    this->m_socket->async_send(
        boost::asio::buffer(buf),
        std::bind(&Session::WriteAllCallBack, this, std::placeholders::_1, std::placeholders::_2));
    
    m_send_pending = true;
}
void Session::WriteAllCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred) {
    if (ec.value() != 0) {
        std::cout << "Error occured! Error code = " << ec.value() << ". Message: " << ec.message();
        return;
    }
    
    m_send_queue.pop();
    
    if (m_send_queue.empty()) {
        m_send_pending = false;
    }
    
    if (!m_send_queue.empty()) {
        auto& send_data = m_send_queue.front();
        this->m_socket->async_send(
            boost::asio::buffer(send_data->m_msg + send_data->m_cur_len, send_data->m_total_len - send_data->m_cur_len),
            std::bind(&Session::WriteAllCallBack, this, std::placeholders::_1, std::placeholders::_2));
    }
}
```

### async read some
```cpp
// async read some
void Session::ReadFromSocket() {
    // pending means in the state of receiving data
    if (m_recv_pending) {
        return;
    }
    
    m_recv_node = std::make_shared<MsgNode>(RECVSIZE);

    m_socket->async_read_some(
        boost::asio::buffer(m_recv_node->m_msg, m_recv_node->m_total_len), 
        std::bind(&Session::ReadCallBack, this, std::placeholders::_1, std::placeholders::_2));

    m_recv_pending = true;
}
void Session::ReadCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred) {
    m_recv_node->m_cur_len += bytes_transferred;

    // still have data to read
    if (m_recv_node->m_cur_len < m_recv_node->m_total_len) {
        m_socket->async_read_some(
            boost::asio::buffer(m_recv_node->m_msg + m_recv_node->m_cur_len, m_recv_node->m_total_len - m_recv_node->m_cur_len), 
            std::bind(&Session::ReadCallBack, this, std::placeholders::_1, std::placeholders::_2));
        return;
    }
    
    m_recv_pending = false;

    m_recv_node = nullptr;
}
```

### async read all
```cpp
// async read all
void Session::ReadAllFromSocket(const std::string& buf) {
    if (m_recv_pending) {
        return;
    }
    
    m_recv_node = std::make_shared<MsgNode>(RECVSIZE);
    m_socket->async_receive(
        boost::asio::buffer(m_recv_node->m_msg, m_recv_node->m_total_len), 
        std::bind(&Session::ReadAllCallBack, this, std::placeholders::_1, std::placeholders::_2));
    
    m_recv_pending = true;
}
void Session::ReadAllCallBack(const boost::system::error_code& ec, std::size_t bytes_transferred) {
    m_recv_node->m_cur_len += bytes_transferred;

    m_recv_pending = false;

    m_recv_node = nullptr;
}
```