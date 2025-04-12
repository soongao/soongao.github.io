---
title: Go password encryption
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Go, utils]
tags: [Go, utils]     # TAG names should always be lowercase
# toc: false
---

# Go password encryption
## 密码加密
```go
import "golang.org/x/crypto/bcrypt"

func HashPassword(pwd string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(pwd), 12)
	return string(hash), err
}
```
## 密码校验
```go
func CheckPassword(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```