---
title: Linux Interview
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [Linux, usage]
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

## 如果忘记了mysql5.7数据库的ROOT用户的密码, 如何找回?(滴滴)
> - 修改/etc/my.cnf
>   - 添加skip-grant-tables
> - 重启mysqld服务, systemctl restart mysqld
> - 此时可以无密码登录root, mysql -u root -p
> - 在mysql数据库中, 有一张user表, 其中有字段authentication_string, 这个字段就保存了密码
>   - update user set authentication_string=password('new passwd') where user=root;
> - 然后刷新, flush privileges;
> - 删除/etc/my.cnf下添加的skip-grant-tables

## 统计ip访问情况, 要求分析nginx访问日志(access.log), 找出访问页面数量在前2位的ip(美团)
- access.log文件内容格式为 `ip  file.html`
> - head -2 取前两条
> - **cat access.log \| awk -F " " '{print $1}' \| sort \| uniq -c \| sort -nr \| head -2**

## 使用tcpdump监听本机将来自ip 192.168.200.1, tcp端口为22的数据, 保存输出到tcpdump.log, 用做将来数据分析(美团)
- tcpdump 用于抓包
  - tcpdump -i ens33 host 192.168.200.1 and port 22
> - tcpdump -i ens33 host 192.168.200.1 and port 22 >> tcpdump.log

## 常用的Nginx模块有哪些, 分别用来做什么(头条)
- 有无在linux下使用过Nginx
> - rewrite模块: 实现重写功能
> - access模块: 来源控制
> - ssl模块: 安全加密
> - ngx_http_gzip_module: 网络传输压缩模块
> - ngx_http_proxy_module模块: 实现代理
> - ngx_http_upstream_module模块: 实现定义后端服务器列表
> - ngx_cache_purge: 实现缓存清除功能


## 如果你是系统管理员, 在进行Linux系统权限划分时, 应考虑哪些因素?(腾讯)
- 阐述Linux权限的主要对象
  - user, group, other
  - 文件和目录的rwx具体对应操作
- 一些实际情境下的原则
  - 注意权限分离: 如Linux系统权限与数据库权限不要在同一个部门
  - 最小权限原则
  - 减少使用root用户: 尽量用普通用户+sudo
  - 重要系统文件使用chattr锁定, 需要操作时再打开

## 目录和文件权限对应具体操作
- 目录: r: (ls); w: (rm, touch等); x: (cd)
- 文件: r: (cat等); w: (vim等); x: 可执行文件
#### 用户tom对目录/home/test有执行和读写权限, /home/test/hello.java是只读文件, 问tom对hello.java文件能读吗? 能修改吗? 能删除吗?
- 对目录有执行权限, 对文件只有读权限
  - 能读, 不能修改
- 对目录有写权限 
  - 能删除

#### 用户tom对目录/home/test只有读写权限, /home/test/hello.java是只读文件, 问tom对hello.java文件能读吗? 能修改吗? 能删除吗?
- 对目录只有执行权限, 无法进入目录
  - 不能读, 不能修改, 不能删除

#### 用户tom对目录/home/test只有执行权限, /home/test/hello.java是只读文件, 问tom对hello.java文件能读吗? 能修改吗? 能删除吗?
- 对目录有执行权限, 对文件只有读权限
  - 能读, 不能修改, 不能删除

#### 用户tom对目录/home/test只有执行和写权限, /home/test/hello.java是只读文件, 问tom对hello.java文件能读吗? 能修改吗? 能删除吗?
- 对目录有执行权限, 对文件只有读权限
  - 能读, 不能修改
- 对目录有写权限
  - 能删除