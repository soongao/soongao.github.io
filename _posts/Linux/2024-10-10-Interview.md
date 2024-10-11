---
title: Linux Interview
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Linux, interview]
tags: [Linux]     # TAG names should always be lowercase
# toc: false
---

# Linux 面试题

## 分析日志t.log(访问量), 将各个ip地址截取, 并统计出现次数, 并按从大到小排序(腾讯)
- t.log文件内容为 `http://ip/file.html`
> - cut -d `split flag` -f `num query` 切割字符串
>   - cut 不能切割空格符
> - sort (从小到大排序) 
>   - -nr (从大到小排序)
> - uniq -c 去重 + 统计次数
> - **cat t.log \| cut -d '/' -f 3 \| sort \| uniq -c \| sort -nr**

## 统计连接到服务器的各个ip情况, 并按连接数从大到小排序(腾讯)
- 可能有很多ip连接到服务器上, 一个ip可能有不止一个连接
> - netstat -an 查看网络连接
> - awk -F `split flag` '{print $`num query`}'
>   - 分割字符串, 然后将query部分打印出来
> - **netstat -an \| grep ESTABLISHED \| awk -F " " '{print $5}' \| cut -d ':' -f 1 \| sort \| uniq -c \| sort -nr**
