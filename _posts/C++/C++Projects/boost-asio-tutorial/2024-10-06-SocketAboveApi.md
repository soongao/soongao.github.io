---
title: Boost Asio Socket Above Api
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# How to use asio socket api
## include create, connect, bind, listen and so on

### TCP Connection Sketch
![Sketch](/assets/img/boost-asio-files/TCP连接流程.jpg)

### endpoint = `<ip:port>`
```cpp
#include <iostream>
#include "endpoint.h"
#include <boost/asio.hpp>

// create client endpoint; endpoint can be used as a part of socket
int client_end_point() {
	std::string raw_ip_address = "127.24.100.1";
	unsigned short port_num = 8080;

	boost::system::error_code ec;

	boost::asio::ip::address ip_address = boost::asio::ip::address::from_string(raw_ip_address, ec);

	if (ec.value() != 0) {
		std::cout << "Failed to parse the IP address. error code = " << ec.value() << " error message: " << ec.message() << "\n";
		return ec.value();
	}

	boost::asio::ip::tcp::endpoint ep(ip_address, port_num);
	
	return 0;

}

// create server endpoint; basic same as client
int server_end_point() {
	unsigned short port_num = 8080;
	
	// for service all ip should be available
	boost::asio::ip::address ip_address = boost::asio::ip::address_v6::any();

	boost::asio::ip::tcp::endpoint ep(ip_address, port_num);

	return 0;
}
```

### socket = `<context,protocal>`
```cpp
// create tcp socket for communication
int create_tcp_socket() {
	// context collect the message of this connection
	boost::asio::io_context ios;

	boost::asio::ip::tcp protocol = boost::asio::ip::tcp::v4();

	boost::asio::ip::tcp::socket sock(ios);

    boost::system::error_code ec;

    sock.open(protocol, ec);
    if (ec.value() != 0) {
        std::cout << "Failed to open the socket! Error code = " << ec.value() << ". Message: " << ec.message();
        return ec.value();
    }

    return 0;
}

// create acceptor service socket for service accept socket
int create_service_acceptor() {
	boost::asio::io_context ios;

	boost::asio::ip::tcp protocol = boost::asio::ip::tcp::v6();

	boost::asio::ip::tcp::acceptor acceptor(ios);

	boost::system::error_code ec;

	acceptor.open(protocol, ec);
	if (ec.value() != 0) {
		std::cout << "Failed to open the acceptor socket!" << "Error code = " << ec.value() << ". Message: " << ec.message();
		return ec.value();
	}

	return 0;
}
```

### accpetor bind with endpoint
```cpp
// bind acceptor to service specific port; so that port wouldn`t change
int bind_acceptor_socket() {
	unsigned short port_num = 3333;

	// create endpoint; same as function create_endpoint();
	boost::asio::ip::tcp::endpoint ep(boost::asio::ip::address_v4::any(), port_num);

	boost::asio::io_context  ios;

	// create acceptor in new version way; same as function create_acceptor_socket()
	boost::asio::ip::tcp::acceptor acceptor(ios, ep.protocol());
	boost::system::error_code ec;

	acceptor.bind(ep, ec);

	if (ec.value() != 0) {
		std::cout << "Failed to bind the acceptor socket." << "Error code = " << ec.value() << ". Message: " << ec.message();
		return ec.value();
	}

	return 0;
}
```

### socket connect with endpoint
```cpp
// client connect to service
int connect_to_end() {
	std::string raw_ip_address = "127.0.0.1";
	unsigned short port_num = 3333;
	try {
		boost::asio::ip::tcp::endpoint ep(boost::asio::ip::address::from_string(raw_ip_address),port_num);
		boost::asio::io_context ios;

		// new version to create socket; same as function create_client_socket()
		boost::asio::ip::tcp::socket sock(ios, ep.protocol());

		sock.connect(ep);
	}catch (boost::system::system_error& e) {
		std::cout << "Error occured! Error code = " << e.code() << ". Message: " << e.what();
		return e.code().value();
	}

	return 0;
}
```

### acceptor listen and accept activate socket
```cpp
// service acceptor accept a client connection
int accept_new_connection() {
	// buffer size of connection requests queue
	const int BACKLOG_SIZE = 30;

	unsigned short port_num = 3333;

	boost::asio::ip::tcp::endpoint ep(boost::asio::ip::address_v4::any(), port_num);
	boost::asio::io_context ios;
	try {
		boost::asio::ip::tcp::acceptor acceptor(ios, ep.protocol());

		acceptor.bind(ep);

		acceptor.listen(BACKLOG_SIZE);

		// activate client socket
		boost::asio::ip::tcp::socket sock(ios);

		acceptor.accept(sock);
	}catch (boost::system::system_error& e) {
		std::cout << "Error occured! Error code = " << e.code() << ". Message: " << e.what();
		return e.code().value();
	}

	return 0;
}
```