---
title: Boost Asio Async Server Logic System
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, asio]
tags: [C++, webserver]     # TAG names should always be lowercase
# toc: false
---

# Logic System

## 目的
- 当Server接收到数据后, 不在Server线程中处理数据, 而是将数据投递到Logic System的逻辑队列中, 让Logic System处理

## CSession
### LogicNode
```cpp
// Server将RecvNode包装成LogicNode, 投递到LogicSystem的逻辑队列中, 等待LogicSystem处理
class LogicNode {
	friend class LogicSystem;
public:
	LogicNode(std::shared_ptr<CSession> session, std::shared_ptr<RecvNode> recvnode)
		:m_session(session), m_recvnode(recvnode) {

	}
private:
	std::shared_ptr<CSession> m_session;
	std::shared_ptr<RecvNode> m_recvnode;
};
```

### Send改为投递数据到Logic Queue中
```cpp
//Send(m_recv_msg_node->m_buffer, m_recv_msg_node->m_total_len, m_recv_msg_node->getMsgId());
LogicSystem::GetInstance()->PostMsgToQue(std::make_shared<LogicNode>(self_ptr, m_recv_msg_node));
```

## Logic System
### Singleton
```cpp
#include <memory>
#include <mutex>
#include <iostream>

// 单例模板
template <typename T>
class Singleton {
protected:
    Singleton() = default;
    Singleton(const Singleton<T>&) = delete;
    Singleton& operator=(const Singleton<T>& st) = delete;
    static std::shared_ptr<T> m_instance;
public:
    static std::shared_ptr<T> GetInstance() {
        static std::once_flag s_flag;
        std::call_once(s_flag, [&]() {
            m_instance = std::shared_ptr<T>(new T);
            });
        return m_instance;
    }
    void PrintAddress() {
        std::cout << m_instance.get() << "\n";
    }
    ~Singleton() {
        std::cout << "this is singleton destruct\n";
    }
};

template <typename T>
std::shared_ptr<T> Singleton<T>::m_instance = nullptr;
```

### LogicSystem head
```cpp
// void FuncName(std::shared_ptr<CSession>, short msg_id, string msg_data) {};
typedef std::function<void(std::shared_ptr<CSession>, short msg_id, std::string msg_data) > FunCallBack;

class LogicSystem : public Singleton<LogicSystem>
{
	friend class Singleton<LogicSystem>;
public:
	~LogicSystem();
	// for Server post it`s msg
	void PostMsgToQue(std::shared_ptr<LogicNode> msg);

private:
	LogicSystem();
	// 从m_msg_que取出消息, 执行对应的注册在m_fun_callback中的回调函数
	void DealMsg();
	// map[id] = FunCallBack;
	void RegisterCallBack();

	// 具体的一个回调函数, 仅做演示, 可以有很多不同的回调, 对应不同的消息类型
	void EchoCallBack(std::shared_ptr<CSession> session, short msg_id, std::string msg_data);

	// LogicSystem的工作线程
	std::thread m_worker_thread;
	// Logic Queue
    std::queue<std::shared_ptr<LogicNode> > m_msg_que;
    // 锁
	std::mutex m_mutex;
	std::condition_variable m_consume;
	// 是否终止
    bool m_b_stop;
    // 注册map
	std::map<short, FunCallBack> m_fun_callback;
};
```

### LogicSystem achieve
#### 构造和析构
```cpp
LogicSystem::LogicSystem()
	:m_b_stop(false) {
	// 注册回调事件
	RegisterCallBack();
	// 开辟线程执行DealMsg
	m_worker_thread = std::thread(&LogicSystem::DealMsg, this);
}

LogicSystem::~LogicSystem() {
	m_b_stop = true;
	m_consume.notify_one();
	m_worker_thread.join();
}
```

#### PostMsgToQue
```cpp
void LogicSystem::PostMsgToQue(std::shared_ptr <LogicNode> msg) {
	std::unique_lock<std::mutex> unique_lk(m_mutex);
	// 投递
	m_msg_que.push(msg);
	//由0变为1则发送通知信号
	if (m_msg_que.size() == 1) {
		unique_lk.unlock();
		m_consume.notify_one();
	}
}
```

#### 注册和处理消息
```cpp
void LogicSystem::DealMsg() {
	while (true) {
		std::unique_lock<std::mutex> unique_lk(m_mutex);
		// 当前为空, 并且正常运行, 没有终止
		while (m_msg_que.empty() && !m_b_stop) {
			m_consume.wait(unique_lk);
		}
		// 终止
		if (m_b_stop) {
			// 将队列全部取出
			while (!m_msg_que.empty()) {
				auto msg_node = m_msg_que.front();
				std::cout << "recv_msg id  is " << msg_node->m_recvnode->getMsgId() << "\n";
				auto call_back_iter = m_fun_callback.find(msg_node->m_recvnode->getMsgId());
				// 没有找到注册的事件, 取出, continue
				if (call_back_iter == m_fun_callback.end()) {
					m_msg_que.pop();
					continue;
				}
				else {
					// call_back_iter->second就是注册的那个函数对象, 调用这个函数
					call_back_iter->second(msg_node->m_session, msg_node->m_recvnode->getMsgId(),
						std::string(msg_node->m_recvnode->m_buffer, msg_node->m_recvnode->m_cur_len));
					m_msg_que.pop();
				}
			}
			break;
		}
		// 队列有消息, 取出消息, 执行回调
		else {
			auto msg_node = m_msg_que.front();
			std::cout << "recv_msg id  is " << msg_node->m_recvnode->getMsgId() << "\n";
			auto call_back_iter = m_fun_callback.find(msg_node->m_recvnode->getMsgId());
			// 没有找到注册的事件, 取出, continue
			if (call_back_iter == m_fun_callback.end()) {
				m_msg_que.pop();
				continue;
			}
			else {
				// call_back_iter->second就是注册的那个函数对象, 调用这个函数
				call_back_iter->second(msg_node->m_session, msg_node->m_recvnode->getMsgId(),
					std::string(msg_node->m_recvnode->m_buffer, msg_node->m_recvnode->m_cur_len));
				m_msg_que.pop();
			}
		}
	}
}

void LogicSystem::RegisterCallBack() {
	m_fun_callback[MSG_HELLO_WORD] = std::bind(
		&LogicSystem::EchoCallBack, this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3);
}

void LogicSystem::EchoCallBack(std::shared_ptr<CSession> session, short msg_id, std::string msg_data) {
	session->Send(msg_data, msg_id);
}
```