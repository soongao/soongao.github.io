---
title: Zookeeper
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [middlerwares, zookeeper]
tags: [zookeeper]     # TAG names should always be lowercase
# toc: false
---

# Zookeeper
- 使用zab共识算法
- 树形znode
- 写操作线性有序
- FIFO client order

## ZAB
- 使用ZAB算法而不是raft
- 但同样选举leader, 保持状态机, 先写log, 半数以上节点写log完成后才commit log

## high perfermance
- zookeeper具有很高的读性能
  - read any peer
- 通过FIFO client order保证了不会出现back in time现象

### FIFO client order
1. client写操作成功后, 一定不会读到这条操作之前的值(最起码能读到自己的写操作)
2. 不会读到之前的值
   - put操作会返回zxid(相当于是这条commited log的index)
   - zookeeper客户端连接后会维持一个session, 通过这个session在get时携带zxid

## 写操作线性有序
- 所有写操作都必须通过master节点
- set(path, value, version)
  - 通过version实现无锁式编程
  - x0,v(ersion) = get(path); set(path, x1, v)
    - only if set version == v, 才能执行写操作

## znode type
- 持久节点
- 临时节点
- 顺序节点 SEQUENTIAL

## Watch
- 可以watch监控节点或节点内容的变化情况