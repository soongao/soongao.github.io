---
title: Go SQL Preprocess
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Go, std]
tags: [mysql]     # TAG names should always be lowercase
# toc: false
---

# SQL Preprocess
## Why
1. 优化MySQL服务器重复执行SQL的方法, 可以提升服务器性能, 提前让服务器编译, 一次编译多次执行, 节省后续编译的成本
2. 避免SQL注入问题

## Query
```go
// 预处理查询
func prepareQuery(id int) {
	sqlStr := "select id, name, age from stu where id > ?"
	stmt, err := db.Prepare(sqlStr)

	if err != nil {
		fmt.Printf("prepare failed, err:%v\n", err)
		return
	}
	
	defer stmt.Close()

	rows, err := stmt.Query(id)

	if err != nil {
		fmt.Printf("query failed, err:%v\n", err)
		return
	}

	defer rows.Close()
	
	// 循环读取结果集中的数据
	for rows.Next() {
		var u Student
		err := rows.Scan(&u.ID, &u.name, &u.age)
		if err != nil {
			fmt.Printf("scan failed, err:%v\n", err)
			return
		}
		fmt.Printf("id:%d name:%s age:%d\n", u.ID, u.name, u.age)
	}
}
```

## Insert
```go
// 预处理插入
func prepareInsert(s Student) {
	sqlStr := "insert into stu(name, age) values (?,?)"
	stmt, err := db.Prepare(sqlStr)

	if err != nil {
		fmt.Printf("prepare failed, err:%v\n", err)
		return
	}

	defer stmt.Close()

	_, err = stmt.Exec(s.name, s.age)
	// _, err = stmt.Exec(s1.name, s1.age)
	// _, err = stmt.Exec(s2.name, s2.age)
	if err != nil {
		fmt.Printf("insert failed, err:%v\n", err)
		return
	}
}
```