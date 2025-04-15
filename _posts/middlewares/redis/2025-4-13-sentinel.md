---
title: Redis Sentinel
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [middlerwares, redis]
tags: [redis]     # TAG names should always be lowercase
# toc: false
---

# Redis Sentinel
- 主从节点故障切换
  - 主节点挂了, 可以选举一个从节点成为新主节点
- 哨兵模式优势
  - 主从模式下主从切换需要手动配置
  - 哨兵模式下帮助自动进行故障切换
- 一般哨兵也会布置多个节点, 通常是奇数个

## 哨兵模式
- 监控
- 选主
- 通知

### 监控
- 向所有主从节点发送PING命令
- 如果未在规定时间(down-after-milliseconds)时间内响应, 则标记为`主观下线`
- 如果有一个哨兵节点认为主节点主观下线
  - 则向其他哨兵节点询问, 要求其他节点进行投票
  - 其他节点如果也认为主节点主观下线, 则赞成
  - 当超过quorum(配置项)个节点认为主节点主观下线, 则认为主节点目前是`客观下线`

### 选主
- 当发现客观下线后, 需要重新选主
- 哨兵节点要进行leader选举
  - 一般由首先提出主观下线的节点发起投票
    - 获得1. 超过半数 2. 超过quorum 个节点的赞成就成为leader
- 选出leader后, 由leader哨兵进行后续的主从节点切换
  - leader挑选一个合适的从节点, 对其发送slaveof no one
    - 将这个从节点设置为master
  - 向其他的从节点发送slaveof host port
    - 使其他从节点变成新master的从节点
  - 监控旧的master节点
    - 如果旧master节点重新上线, 将其变成新master的slave节点

- `什么是合适的从节点`
  1. 先选优先级最高的
     - 优先级是配置项, 一般内存最大的可能优先级设置的就高
  2. 优先级相同, 选offset最新的
     - 每个从节点当前从主节点复制的repl_offset可能不同
     - 选择当前拥有最新的offset, 也就是数据是最新的节点
  3. 都相同选择ID最小的

### 通知
- 选主后通过发布/订阅机制, 将结果返回给客户端
- 哨兵节点之间也是通过发布/订阅机制进行连接通信的