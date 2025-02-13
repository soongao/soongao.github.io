---
title: Go Middlewares Auth
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Go, dev]
tags: [Go, dev]     # TAG names should always be lowercase
# toc: false
---

# Go Middlewares Auth
## Handle Func
```go
func AuthMiddleWare() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token := ctx.GetHeader("Authorization")
		if token == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization Header"})
			ctx.Abort()
			return
		}
        // 解析token
		username, err := utils.ParseJWT(token)

		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			ctx.Abort()
			return
		}

		ctx.Set("username", username)
		ctx.Next()
	}
}
```