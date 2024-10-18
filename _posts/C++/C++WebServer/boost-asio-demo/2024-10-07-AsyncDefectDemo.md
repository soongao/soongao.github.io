---
title: Boost Asio Async Defect Demo
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# Async Echo Service with Defect
## Defect
1. 因为该服务器的发送和接收以应答的方式交互，而并不能做到应用层想随意发送的目的，也就是未做到完全的收发分离(全双工逻辑)。
2. 该服务器未处理粘包，序列化，以及逻辑和收发线程解耦等问题。
3. 该服务器存在二次析构的风险。

## Session
### session header file
```cpp
#include <boost/asio.hpp>
#include <iostream>

class Session
{
public:
	Session(boost::asio::io_context& ioc)
        : m_socket(ioc) {}
    boost::asio::ip::tcp::socket& Socket() {
        return m_socket;
    }
    void Start();

private:
    void handle_read(const boost::system::error_code& error, size_t bytes_transfered);
    void handle_write(const boost::system::error_code& error);
    
    boost::asio::ip::tcp::socket m_socket;
    enum { MAX_LEN = 1024 };
    char m_data[MAX_LEN];
};
```

### session start and recall function
```cpp
// echo version service
void Session::Start() {
	memset(m_data, 0, MAX_LEN);
	m_socket.async_read_some(
		boost::asio::buffer(m_data, MAX_LEN),
		std::bind(&Session::handle_read, this, std::placeholders::_1, std::placeholders::_2));
}

void Session::handle_read(const boost::system::error_code& error, size_t bytes_transfered) {
	if (error) {
		std::cout << "handle read error\n";
		delete this;
	}
	else {
		std::cout << m_data << "\n";
		// after reading, recall write function; give reply to client
		boost::asio::async_write(
			m_socket, boost::asio::buffer(m_data, bytes_transfered),
			std::bind(&Session::handle_write, this, std::placeholders::_1));
	}
}

void Session::handle_write(const boost::system::error_code& error) {
	if (error) {
		std::cout << "handle write error\n";
		delete this;
	}
	else {
		// one round is over; call read; wait another client message
		memset(m_data, 0, MAX_LEN);
		m_socket.async_read_some(
			boost::asio::buffer(m_data, MAX_LEN),
			std::bind(&Session::handle_read, this, std::placeholders::_1, std::placeholders::_2));
	}
}
```

## Async Echo Service
### service header file
```cpp
class Service
{
public:
    Service(boost::asio::io_context& ioc, unsigned short port);
private:
    void start_accept();
    void handle_accept(Session* new_session, const boost::system::error_code& error);
    boost::asio::io_context& m_ioc;
    boost::asio::ip::tcp::acceptor m_acceptor;
};
```

### service aync accept
```cpp
Service::Service(boost::asio::io_context& ioc, unsigned short port)
	: m_ioc(ioc), m_acceptor(ioc, boost::asio::ip::tcp::endpoint(boost::asio::ip::tcp::v4(), port)) {
	start_accept();
}

void Service::start_accept() {
	Session* new_session = new Session(m_ioc);
	m_acceptor.async_accept(
		new_session->Socket(),
		std::bind(&Service::handle_accept, this, new_session, std::placeholders::_1));
}s

void Service::handle_accept(Session * new_session, const boost::system::error_code & error) {
	if (error) {
		std::cout << "service handle accept error\n";
		delete new_session;
	}
	else {
		new_session->Start();
	}

	start_accept();
}
```

### start service
```cpp
int main() {
	try {
		std::cout << "service run\n";
		boost::asio::io_context ioc;
		Service service(ioc, 10086);
		ioc.run();
	}
	catch (std::exception& e) {
		std::cerr << "Exception: " << e.what() << "\n";
	}

	return 0;
}
```