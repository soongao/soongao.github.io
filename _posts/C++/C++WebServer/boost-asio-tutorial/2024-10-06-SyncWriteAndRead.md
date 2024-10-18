---
title: Boost Asio Sync Write and Read Api
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# How to use api to sync write(send) and read(receive)

## Write
### write some
```cpp
// use write some though loop
void wirte_to_socket(boost::asio::ip::tcp::socket& sock) {
    std::string buf = "Hello World!";
    std::size_t total_bytes_written = 0;
    //write_some return how many bytes already wirte
    while (total_bytes_written != buf.length()) {
        total_bytes_written += sock.write_some(
            boost::asio::buffer(buf.c_str() + total_bytes_written, buf.length() - total_bytes_written));
    }
}
```
### socket send
```cpp
// use send api
int send_data_by_send() {
    std::string raw_ip_address = "127.0.0.1";
    unsigned short port_num = 3333;
    try {
        boost::asio::ip::tcp::endpoint 
            ep(boost::asio::ip::address::from_string(raw_ip_address), port_num);
        boost::asio::io_service ios;
        
        boost::asio::ip::tcp::socket sock(ios, ep.protocol());
        sock.connect(ep);
        std::string buf = "Hello World!";

        // socket.send() sync send all data; if don`t send whole length it will block
        int send_length = sock.send(boost::asio::buffer(buf.c_str(), buf.length()));
        if (send_length <= 0) {
            std::cout << "send failed\n";
            return 0;
        }
    }catch (boost::system::system_error& e) {
        std::cout << "Error occured! Error code = " << e.code() << ". Message: " << e.what();
        return e.code().value();
    }
    return 0;
}
```

### asio write
```cpp
// use write api
int send_data_by_wirte() {
    std::string raw_ip_address = "127.0.0.1";
    unsigned short port_num = 3333;
    try {
        boost::asio::ip::tcp::endpoint
            ep(boost::asio::ip::address::from_string(raw_ip_address), port_num);
        boost::asio::io_service ios;
        
        boost::asio::ip::tcp::socket sock(ios, ep.protocol());
        sock.connect(ep);
        std::string buf = "Hello World!";
        
        // asio::write(); same as socket.send()
        int send_length = boost::asio::write(sock, boost::asio::buffer(buf.c_str(), buf.length()));
        if (send_length <= 0) {
            std::cout << "send failed\n";
            return 0;
        }
    }catch (boost::system::system_error& e) {
        std::cout << "Error occured! Error code = " << e.code() << ". Message: " << e.what();
        return e.code().value();
    }
    return 0;
}
```

## Read
### read some
```cpp
// use read some though loop
std::string read_from_socket(boost::asio::ip::tcp::socket& sock) {
    const unsigned char MESSAGE_SIZE = 7;
    // buf to receive data from tcp socket
    char buf[MESSAGE_SIZE];

    std::size_t total_bytes_read = 0;
    while (total_bytes_read != MESSAGE_SIZE) {
        total_bytes_read += sock.read_some(
            boost::asio::buffer(buf + total_bytes_read, MESSAGE_SIZE - total_bytes_read));
    }
    return std::string(buf, total_bytes_read);
}
```

### socket receive
```cpp
// use receive api
int read_data_by_receive() {
    std::string raw_ip_address = "127.0.0.1";
    unsigned short port_num = 3333;
    try {
        boost::asio::ip::tcp::endpoint
            ep(boost::asio::ip::address::from_string(raw_ip_address), port_num);
        boost::asio::io_service ios;
        boost::asio::ip::tcp::socket sock(ios, ep.protocol());
        sock.connect(ep);
        
        const unsigned char BUFF_SIZE = 7;
        // buf to receive data from tcp socket
        char buffer_receive[BUFF_SIZE];

        // sync socket.receive(); will block if doesn`t get BUFF_SIZE of data
        int receive_length = sock.receive(boost::asio::buffer(buffer_receive, BUFF_SIZE));
        if (receive_length <= 0) {
            std::cout << "receive failed\n";
        }
    }catch (boost::system::system_error& e) {
        std::cout << "Error occured! Error code = " << e.code() << ". Message: " << e.what();
        return e.code().value();
    }
    return 0;
}
```

### asio read
```cpp
// use read api
int read_data_by_read() {
    std::string raw_ip_address = "127.0.0.1";
    unsigned short port_num = 3333;
    try {
        boost::asio::ip::tcp::endpoint
            ep(boost::asio::ip::address::from_string(raw_ip_address), port_num);
        boost::asio::io_service ios;
        boost::asio::ip::tcp::socket sock(ios, ep.protocol());
        sock.connect(ep);

        const unsigned char BUFF_SIZE = 7;
        char buffer_receive[BUFF_SIZE];
        // asio::read() same as socket.receive()
        int receive_length = boost::asio::read(sock, boost::asio::buffer(buffer_receive, BUFF_SIZE));
        if (receive_length <= 0) {
            std::cout << "receive failed\n";
        }
    }catch (boost::system::system_error& e) {
        std::cout << "Error occured! Error code = " << e.code() << ". Message: " << e.what();
        return e.code().value();
    }
    return 0;
}
```