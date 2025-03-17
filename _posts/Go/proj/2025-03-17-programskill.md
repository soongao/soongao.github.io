---
title: Go Programing Skill
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [go, proj]
tags: [go, proj]     # TAG names should always be lowercase
# toc: false
---

# Go Programing Skills

## 接口型函数
### example
```go
// net/http 标准库
type Handler interface {
	ServeHTTP(ResponseWriter, *Request)
}
type HandlerFunc func(ResponseWriter, *Request)

func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) {
	f(w, r)
}
```

### 使用
- 一个函数类型, 实现了一个接口的方法, 并在该方法中调用自身
- 好处在于既可以将普通函数类型(通过类型转换)作为参数, 可以将结构体作为参数

## import <相对路径>
- 在go.mod文件中添加声明
  - require `<package>` v0.0.0
  - replace `<package>` => ./`<package>`