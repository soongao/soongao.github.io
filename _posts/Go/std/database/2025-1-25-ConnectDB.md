---
title: Go SQL Connect DB
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Go, std]
tags: [mysql]     # TAG names should always be lowercase
# toc: false
---

# Go Connect DB
## import mysql driver
```go
import (
	"database/sql"
	_ "github.com/go-sql-driver/mysql"
)
```

## init db
```go
// 定义一个全局对象db
var db *sql.DB

// 定义一个初始化数据库的函数
func initDB() (err error) {
	// DSN:Data Source Name
	dsn := "root:root@tcp(127.0.0.1:3306)/students?charset=utf8mb4&parseTime=True"
	// 不会校验账号密码是否正确
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	// 尝试与数据库建立连接, 校验dsn是否正确
	err = db.Ping()
	if err != nil {
		return err
	}
	return nil
}
```