---
title: Boost Asio Async Full Duplex Server
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, websocket]     # TAG names should always be lowercase
# toc: false
---

# Async Full Duplex Server using Async QUeue
## CSession header file
```cpp
#include <queue>
#include <boost/asio.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <iostream>

class MsgNode;
class CServer;
class CSession : public std::enable_shared_from_this<CSession>
{
public:
	CSession(boost::asio::io_context& ioc, CServer* server)
		: m_socket(ioc), m_service(server) {
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

	void HandleRead(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<CSession> self_session);
	void HandleWrite(const boost::system::error_code& error, std::shared_ptr<CSession> self_session);
	
	void Send(char* msg, int max_length);
	
	boost::asio::ip::tcp::socket m_socket;
	
	enum { MAX_LEN = 1024 };
	char m_data[MAX_LEN];

	std::string m_uuid;
	CServer* m_service;
    // async queue
	std::queue<std::shared_ptr<MsgNode> > m_send_queue;
	std::mutex m_send_lock;
};

// send and receve node
class MsgNode {
	friend class CSession;
public:
	MsgNode(char* data, int len)
	: m_total(len), m_cur(0){
		m_data = new char[len];
		memcpy(m_data, data, len);
	}
	~MsgNode() {
		delete[] m_data;
	}
private:
	char* m_data;
	int m_cur;
	int m_total;
};
```

## CSession achieve
- 划分成了两个线程, 读线程和写线程, 两个线程相互独立, 实现了全双工
```cpp
void CSession::Start() {
	memset(m_data, 0, MAX_LEN);
    
	m_socket.async_read_some(
		boost::asio::buffer(m_data, MAX_LEN),
		std::bind(&CSession::HandleRead, this, std::placeholders::_1, std::placeholders::_2, shared_from_this()));
}

void CSession::Send(char* msg, int max_length) {
    // structure function lock; destructure function unlock
    std::lock_guard<std::mutex> lock(m_send_lock);
    // queue has data or not
    bool pending = false;
    if (m_send_queue.size() > 0) {
        pending = true;
    }
    // push to queue; equals finish sending
    m_send_queue.push(std::make_shared<MsgNode>(msg, max_length));
    if (pending) {
        return;
    }
    boost::asio::async_write(
        m_socket, boost::asio::buffer(msg, max_length),
        std::bind(&CSession::HandleWrite, this, std::placeholders::_1, shared_from_this()));
}

void CSession::HandleRead(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<CSession> self_session) {
    if (error) {
        std::cout << "handle read error\n";
        m_service->ClearSession(m_uuid);
    }
    else {
        std::cout << m_data << "\n";
        
        Send(m_data, bytes_transfered);

        memset(m_data, 0, MAX_LEN);
        // keep listen client
        m_socket.async_read_some(
            boost::asio::buffer(m_data, MAX_LEN),
            std::bind(&CSession::HandleRead, this, std::placeholders::_1, std::placeholders::_2, self_session));
    }
}

void CSession::HandleWrite(const boost::system::error_code& error, std::shared_ptr<CSession> self_session) {
    if (!error) {
        std::lock_guard<std::mutex> lock(m_send_lock);
        // pop curent msg
        m_send_queue.pop();
        // handle other msg
        if (!m_send_queue.empty()) {
            auto& msgnode = m_send_queue.front();
            boost::asio::async_write(
                m_socket, boost::asio::buffer(msgnode->m_data, msgnode->m_total),
                std::bind(&CSession::HandleWrite, this, std::placeholders::_1, self_session));
        }
    }
    else {
        std::cout << "handle write failed, error is " << error.what();
        m_service->ClearSession(m_uuid);
    }
}
```

## CServer header file
- nothing changed
```cpp
class CServer
{
public:
    CServer(boost::asio::io_context& ioc, unsigned short port);

    void ClearSession(std::string id) {
        m_sessions_map.erase(id);
    }
private:
    void StartAccept();
    void HandleAccept(std::shared_ptr<CSession> new_session, const boost::system::error_code& error);
    
    boost::asio::io_context& m_ioc;
    boost::asio::ip::tcp::acceptor m_acceptor;
    std::map<std::string, std::shared_ptr<CSession>> m_sessions_map;
};
```

## CServer achieve
- nothing changed
```cpp
CServer::CServer(boost::asio::io_context& ioc, unsigned short port)
	: m_ioc(ioc), m_acceptor(ioc, boost::asio::ip::tcp::endpoint(boost::asio::ip::tcp::v4(), port)) {
	StartAccept();
}

void CServer::StartAccept() {
	std::shared_ptr<CSession> new_session = std::make_shared<CSession>(m_ioc, this);

	m_acceptor.async_accept(
		new_session->Socket(),
		std::bind(&CServer::HandleAccept, this, new_session, std::placeholders::_1));
}


void CServer::HandleAccept(std::shared_ptr<CSession> new_session, const boost::system::error_code& error) {
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

	StartAccept();
}
```