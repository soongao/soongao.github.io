---
title: C++ Singleton
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [C++, basic]
tags: [C++]     # TAG names should always be lowercase
# toc: false
---

# C++ Singleton

### 单例模式要求全局只有一个对象实例, 无法反复创建对象

### 单例模式只是一个组织一堆static var和static function的类, 可以理解成一个存放这些static的namespace

```cpp
class Singleton{
public:
    Singleton(const Singleton&) = delete;

    static Singleton& Get(){
        // would be only create once
        static Singleton instance;
        return instance;
    }

    void Function() {}

private:
    Singleton() {}

    int var;
};

int main(){
    // can`t do this; because Singleton detele copy constructor
    // Singleton s_copy = Singleton::Get();
    // this would be fine; get the only static instance
    Singleton& s_copy  = Singleton::Get()
    Singleton::Get().Function();
    return 0;
}
```