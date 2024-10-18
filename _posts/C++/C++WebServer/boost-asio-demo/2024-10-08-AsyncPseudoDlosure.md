---
title: Boost Asio Async Demo perfect by Pseudo Closure
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# Async Service perfect by Pseudo Closure

## thoughts
1. defect版本可能出现二次析构问题, 通过伪闭包避免潜在威胁
2. 通过智能指针shared_ptr实现

## Session header file
```cpp
#include <boost/asio.hpp>
#include <iostream>
#include <map>
#include <boost/uuid/uuid_io.hpp>
#include <boost/uuid/uuid_generators.hpp>

class Service;
class Session : public std::enable_shared_from_this<Session>
{
public:
	Session(boost::asio::io_context& ioc, Service* serv)
        : m_socket(ioc), m_service(serv) {
        boost::uuids::uuid id = boost::uuids::random_generator()();
        
        m_uuid = boost::uuids::to_string(id);
    }

    boost::asio::ip::tcp::socket& Socket() {
        return m_socket;
    }

    std::string getUUID() {
        return m_uuid;
    }

    void Start();

private:
    //void handle_read(const boost::system::error_code& error, size_t bytes_transfered);
    //void handle_write(const boost::system::error_code& error);

    void handle_read(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<Session> self_session);
    void handle_write(const boost::system::error_code& error, std::shared_ptr<Session> self_session);
    
    boost::asio::ip::tcp::socket m_socket;
    enum { MAX_LEN = 1024 };
    char m_data[MAX_LEN];

    std::string m_uuid;
    Service* m_service;
};
```

## Service header file
```cpp
class Service
{
public:
    Service(boost::asio::io_context& ioc, unsigned short port);

    void clearSession(std::string id) {
        m_sessions_map.erase(id);
    }
private:
    void start_accept();
    //void handle_accept(Session* new_session, const boost::system::error_code& error);
    void handle_accept(std::shared_ptr<Session> new_session, const boost::system::error_code& error);
    boost::asio::io_context& m_ioc;
    boost::asio::ip::tcp::acceptor m_acceptor;
    std::map<std::string, std::shared_ptr<Session>> m_sessions_map;
};
```

## Session update
```cpp
void Session::Start() {
	memset(m_data, 0, MAX_LEN);
	// though shared from this; let two same memory ptr have the same shared count
	// using bind; the shared ptr count will plus 1
	m_socket.async_read_some(
		boost::asio::buffer(m_data, MAX_LEN),
		std::bind(&Session::handle_read, this, std::placeholders::_1, std::placeholders::_2, shared_from_this()));
}

void Session::handle_read(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<Session> self_session) {
	if (error) {
		std::cout << "handle read error\n";
		m_service->clearSession(m_uuid);
	}
	else {
		std::cout << m_data << "\n";
		// after reading, recall write function; give reply to client
		boost::asio::async_write(
			m_socket, boost::asio::buffer(m_data, bytes_transfered),
			std::bind(&Session::handle_write, this, std::placeholders::_1, self_session));
	}

}
void Session::handle_write(const boost::system::error_code& error, std::shared_ptr<Session> self_session) {
	if (error) {
		std::cout << "handle write error\n";
		m_service->clearSession(m_uuid);
	}
	else {
		// one round is over; call read; wait another client message
		memset(m_data, 0, MAX_LEN);
		m_socket.async_read_some(
			boost::asio::buffer(m_data, MAX_LEN),
			std::bind(&Session::handle_read, this, std::placeholders::_1, std::placeholders::_2, self_session));
	}
}
```

## Service update
```cpp
void Service::start_accept() {
	std::shared_ptr<Session> new_session = std::make_shared<Session>(m_ioc, this);
	//Session* new_session = new Session(m_ioc);
	m_acceptor.async_accept(
		new_session->Socket(),
		std::bind(&Service::handle_accept, this, new_session, std::placeholders::_1));
}


void Service::handle_accept(std::shared_ptr<Session> new_session, const boost::system::error_code& error) {
	if (error) {
		std::cout << "service handle accept error\n";
		/*delete new_session;*/
	}
	else {
		new_session->Start();
		// put shared ptr into map; extend the lifecycle
		// the ptr will be delete util it gets erase
		m_sessions_map.insert(std::make_pair(new_session->getUUID(), new_session));
	}
		
	start_accept();
}
```
