---
title: Redis Data Structure
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [middlerwares, redis]
tags: [redis]     # TAG names should always be lowercase
# toc: false
---

# Redis Data Structure
- string
- list
- hash
- set
- zset (sorted set)
- bitmap

## string
- sds (simple dynamic string)

### 源码
```c
typedef char *sds;

// flag 表示使用的类型, x可选值为8,16,32,64, 依次节省空间
struct __attribute__ ((__packed__)) sdshdr_x {
    uint_x_t len; /* used */
    uint_x_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
```

## list
- 双向链表
- list经过版本演变, list node不断在更新
  - adlist (val: void*) -> quicklist (val: ziplist) -> quicklist (val: listpack)

### 源码
#### adlist
```c
// adlist
typedef struct listNode {
    struct listNode *prev;
    struct listNode *next;
    void *value;
} listNode;

typedef struct list {
    listNode *head; // 头指针
    listNode *tail; // 尾指针
    unsigned long len;
} list;
```

#### quicklist (val: ziplist)
```c
// quicklist
typedef struct quicklistNode {
    struct quicklistNode *prev;
    struct quicklistNode *next;
    unsigned char *zl;           // 元素类型是ziplist
    unsigned int sz;             /* ziplist size in bytes */
} quicklistNode;
```

#### listpack (val: listpack)
```c
typedef struct quicklistNode {
    struct quicklistNode *prev;
    struct quicklistNode *next;
    unsigned char *entry;  // 元素类型是listpack
    size_t sz;             /* entry size in bytes */
} quicklistNode;
```

## hash/set
- dict (hash table)
- 链地址法解决hash冲突(dictEntry **table)
- rehash采用渐进式扩容, dictRehash一次只搬n个桶 (int dictRehash(dict *d, int n))
- 两张hash table交替使用进行rehash
- rehash触发条件
  - 负载因子>=1, 并且此时没有进行aof重新或rdb快照
    - d->ht[0].used >= d->ht[0].size && dict_can_resize
  - 负载因子>=5, 无论有没有进行aof重新或rdb快照, 都rehash
    - d->ht[0].used/d->ht[0].size > dict_force_resize_ratio (dict_force_resize_ratio = 5)

### 源码
```c
typedef struct dictEntry {
    void *key;
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;                        /* 通过union节省空间 */
    struct dictEntry *next;     /* Next entry in the same hash bucket. */
} dictEntry;

typedef struct dictht {
    dictEntry **table; // dictEntty 二维结构, 第一维表示桶, 第二维表示这个桶下挂的元素
    unsigned long size;
    unsigned long sizemask;
    unsigned long used;
} dictht;

typedef struct dict {
    dictType *type;
    dictht ht[2]; // ht[0], ht[1]交替使用, rehash时旧元素从ht[0]搬到ht[1], 新元素直接放到ht[1], rehash完成后, ht[0], ht[1] = ht[1], ht[0]
} dict;
```

## zset
- 跳表 + hash table
  - 核心操作由跳表完成

### 源码
```c
/* ZSETs use a specialized version of Skiplists */
typedef struct zskiplistNode {
    sds ele;
    double score;
    struct zskiplistNode *backward;
    struct zskiplistLevel {
        struct zskiplistNode *forward;
        unsigned long span;
    } level[];
} zskiplistNode;

typedef struct zskiplist {
    struct zskiplistNode *header, *tail;
    unsigned long length;
    int level;
} zskiplist;

typedef struct zset {
    dict *dict;     // hash table 只是用于以常数复杂度获取元素权重
    zskiplist *zsl; // 跳表
} zset;
```

## ziplist/listpack
- 都是使用一块连续的内存空间来紧凑的保存数据
  - 类似于一个数组+head头信息, 但是数组中的元素不是固定类型长度, 而是根据具体的内容确定空间
- ziplist的节点保存了前一节点的长度用于向前遍历
  - 但是这也导致了连锁更新
- listpack的引入就是为了解决ziplist的连锁更新问题
  - listpack的节点中不保存前一节点长度, 而是只记录了当前节点长度