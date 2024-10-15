---
title: Boost Asio Async Server using complete tlv format
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---


# Async Server using complete tlv format
## complete tlv format
- <**(msg head)***<msg id, body length>*, **(msg body)**>

## MsgNode
### MsgNode
```cpp
// for msg head
class MsgNode
{
public:
	MsgNode(short total_len)
		: m_cur_len(0), m_total_len(total_len) {
		m_buffer = new char[m_total_len + 1];
		m_buffer[m_total_len] = '\0';
	}
	~MsgNode() {
		delete[] m_buffer;
	}
	void Clear() {
		::memset(m_buffer, 0, m_total_len);
		m_cur_len = 0;
	}

	char* m_buffer;
	short m_total_len;
	short m_cur_len;
};
```

### SendNode
```cpp
// for tlv msg
class SendNode : public MsgNode {
public:
	SendNode(const char* msg, short msg_len, short msgid)
		: MsgNode(msg_len + HEAD_LENGTH), m_msgid(msgid) {
		short msg_id_host = msgid;
		/*short msg_id_host = boost::asio::detail::socket_ops::host_to_network_short(msg_id);*/
		memcpy(m_buffer, &msg_id_host, HEAD_IDLENGTH);
		//转为网络字节序
		short msg_len_host = msg_len;
		//short max_len_host = boost::asio::detail::socket_ops::host_to_network_short(msg_len);
		memcpy(m_buffer + HEAD_IDLENGTH, &msg_len_host, HEAD_DATALENGTH);
		memcpy(m_buffer + HEAD_LENGTH, msg, msg_len);
	}
	short getMsgId() {
		return m_msgid;
	}
private:
	short m_msgid;
};
```
### RecvNode
```cpp
// for msg boby
class RecvNode : public MsgNode {
public:
	RecvNode(short total_len, short msgid)
		: MsgNode(total_len), m_msgid(msgid) {
	}
	short getMsgId() {
		return m_msgid;
	}
private:
	short m_msgid;
};
```

## CSession
### head
```cpp
class CSession : public std::enable_shared_from_this<CSession>
{
public:
	CSession(boost::asio::io_context& ioc, CServer* server)
		: m_socket(ioc), m_server(server) {
		boost::uuids::uuid id = boost::uuids::random_generator()();
		m_recv_head_node = std::make_shared<MsgNode>(HEAD_LENGTH);
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
	void HandleReadHead(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<CSession> self_ptr);
	void HandleReadMsg(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<CSession> self_ptr);
	void HandleWrite(const boost::system::error_code& error, std::shared_ptr<CSession> self_ptr);

	void Send(char* msg, short msg_length, short msgid);
	void Send(std::string msg, short msgid);

	boost::asio::ip::tcp::socket m_socket;

	char m_buffer[MAX_LENGTH];

	std::string m_uuid;
	CServer* m_server;

	std::mutex m_send_lock;
    // send node
	std::queue<std::shared_ptr<SendNode> > m_send_queue;
	// body part
	std::shared_ptr<RecvNode> m_recv_msg_node;
	// head part
	std::shared_ptr<MsgNode> m_recv_head_node;
};
```

### achieve
#### async read
```cpp
// 挂起读事件
void CSession::Start() {
    m_recv_head_node->Clear();
    boost::asio::async_read(
        m_socket, boost::asio::buffer(m_recv_head_node->m_buffer, HEAD_LENGTH),
        std::bind(&CSession::HandleReadHead, this, std::placeholders::_1, std::placeholders::_2, shared_from_this()));
}
// 处理读到的消息头
void CSession::HandleReadHead(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<CSession> self_ptr) {
    if (!error) {
        if (bytes_transfered < HEAD_LENGTH) {
            std::cout << "read head lenth error\n";
            m_server->ClearSession(m_uuid);
            return;
        }
        // 头部接收完，解析头部
        // 解析msgid
        short msgid = 0;
        memcpy(&msgid, m_recv_head_node->m_buffer, HEAD_IDLENGTH);
        // 解析数据体length
        short data_len = 0;
        memcpy(&data_len, m_recv_head_node->m_buffer + HEAD_IDLENGTH, HEAD_DATALENGTH);
        
        std::cout << "msgid is " << msgid << " data_len is " << data_len << "\n";
        
        //头部长度非法
        if (data_len > MAX_LENGTH) {
            std::cout << "invalid data length is " << data_len << "\n";
            m_server->ClearSession(m_uuid);
            return;
        }

        m_recv_msg_node = std::make_shared<RecvNode>(data_len, msgid);
        boost::asio::async_read(
            m_socket, boost::asio::buffer(m_recv_msg_node->m_buffer, m_recv_msg_node->m_total_len),
            std::bind(&CSession::HandleReadMsg, this, std::placeholders::_1, std::placeholders::_2, self_ptr));
    }
    else {
        std::cout << "handle read failed, error is " << error.what() << "\n";
        m_server->ClearSession(m_uuid);
    }
}
// 处理读到的消息体
void CSession::HandleReadMsg(const boost::system::error_code& error, size_t bytes_transfered, std::shared_ptr<CSession> self_ptr) {
    if (!error) {
        m_recv_msg_node->m_buffer[m_recv_msg_node->m_total_len] = '\0';

        std::cout << "receive data is " << m_recv_msg_node->m_buffer << "\n";
        
        Send(m_recv_msg_node->m_buffer, m_recv_msg_node->m_total_len, m_recv_msg_node->getMsgId());
        //再次接收头部数据
        m_recv_head_node->Clear();
        boost::asio::async_read(
            m_socket, boost::asio::buffer(m_recv_head_node->m_buffer, HEAD_LENGTH),
            std::bind(&CSession::HandleReadHead, this, std::placeholders::_1, std::placeholders::_2, self_ptr));
    }
    else {
        std::cout << "handle read msg failed,  error is " << error.what() << "\n";
        m_server->ClearSession(m_uuid);
    }
}
```
#### aasync write
```cpp
// 将消息放入发送队列, 然后挂起写事件
void CSession::Send(char* msg, short msg_length, short msgid) {
    std::lock_guard<std::mutex> lock(m_send_lock);

    int queue_len = m_send_queue.size();
    if (queue_len > MAX_SENDQUE) {
        std::cout << "session: " << m_uuid << " send que fulled, size is " << MAX_SENDQUE << "\n";
        return;
    }
    // push to queue; equals finish sending
    m_send_queue.push(std::make_shared<SendNode>(msg, msg_length, msgid));

    if (queue_len > 0) return;

    // build tlv format data
    auto& msgnode = m_send_queue.front();
    boost::asio::async_write(
        m_socket, boost::asio::buffer(msgnode->m_buffer, msgnode->m_total_len),
        std::bind(&CSession::HandleWrite, this, std::placeholders::_1, shared_from_this()));
}

void CSession::Send(std::string msg, short msgid) {
    std::lock_guard<std::mutex> lock(m_send_lock);

    int queue_len = m_send_queue.size();
    if (queue_len > MAX_SENDQUE) {
        std::cout << "session: " << m_uuid << " send que fulled, size is " << MAX_SENDQUE << "\n";
        return;
    }
    // push to queue; equals finish sending
    m_send_queue.push(std::make_shared<SendNode>(msg.c_str(), msg.size(), msgid));
    
    if (queue_len > 0) return;
    
    // build tlv format data
    auto& msgnode = m_send_queue.front();
    boost::asio::async_write(
        m_socket, boost::asio::buffer(msgnode->m_buffer, msgnode->m_total_len),
        std::bind(&CSession::HandleWrite, this, std::placeholders::_1, shared_from_this()));
}
// 处理完写事件, 之后继续从发送队列中取待发送的数据
void CSession::HandleWrite(const boost::system::error_code& error, std::shared_ptr<CSession> self_ptr) {
    if (!error) {
        std::lock_guard<std::mutex> lock(m_send_lock);
        std::cout << "send data " << m_send_queue.front()->m_buffer + HEAD_LENGTH << "\n";
        // pop curent msg
        m_send_queue.pop();
        // handle other msg
        if (!m_send_queue.empty()) {
            auto& msgnode = m_send_queue.front();
            boost::asio::async_write(
                m_socket, boost::asio::buffer(msgnode->m_buffer, msgnode->m_total_len),
                std::bind(&CSession::HandleWrite, this, std::placeholders::_1, self_ptr));
        }
    }
    else {
        std::cout << "handle write failed, error is " << error.what();
        m_server->ClearSession(m_uuid);
    }
}
```

## CServer
### head
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
    std::map<std::string, std::shared_ptr<CSession> > m_sessions_map;
};
```

### achieve
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

## Sync Client
### send and receive
```cpp
std::cout << "Enter message: ";
char request[MAX_LENGTH];
std::cin.getline(request, MAX_LENGTH);
size_t request_length = strlen(request);
char send_data[MAX_LENGTH] = { 0 };
short msgid = 1001;
short request_host_length = request_length;

//short request_host_length = boost::asio::detail::socket_ops::host_to_network_short(request_length);
memcpy(send_data, &msgid, HEAD_IDLENGTH);
memcpy(send_data + HEAD_IDLENGTH, &request_host_length, HEAD_DATALENGTH);
memcpy(send_data + HEAD_LENGTH, request, request_length);

boost::asio::write(sock, boost::asio::buffer(send_data, request_length + HEAD_LENGTH));

char reply_head[HEAD_LENGTH];

boost::asio::read(sock, boost::asio::buffer(reply_head, HEAD_LENGTH));

short reply_msgid = 0;
short msglen = 0;

memcpy(&reply_msgid, reply_head, HEAD_IDLENGTH);
memcpy(&msglen, reply_head + HEAD_IDLENGTH, HEAD_DATALENGTH);
//msglen = boost::asio::detail::socket_ops::network_to_host_short(msglen);

char msg[MAX_LENGTH] = { 0 };
size_t  msg_length = boost::asio::read(sock, boost::asio::buffer(msg, msglen));

std::cout << "Reply is: ";
std::cout.write(msg, msglen) << "\n";
std::cout << "Reply len is " << msglen;
std::cout << "\n";
```