---
title: Docker - Namespce
# date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [middlerwares, docker]
tags: [docker]     # TAG names should always be lowercase
# toc: false
---

# Docker - Namespace
- namespace是linux内核提供的用于隔离内核资源的方法
- 因为docker中的container(容器)本质就是一个进程
  - 所以不同容器间就需要对内核资源进行隔离

## namespace类型
![namespace](/assets/img/docker/namespace.png)

### 查看进程所属的namespace

```text
# ll /proc/$$/ns
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 cgroup -> cgroup:[4026531835]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 ipc -> ipc:[4026532244]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 mnt -> mnt:[4026532255]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 net -> net:[4026531840]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 pid -> pid:[4026532257]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 pid_for_children -> pid:[4026532257]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 time -> time:[4026531834]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 time_for_children -> time:[4026531834]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 user -> user:[4026531837]
lrwxrwxrwx    1 root     root             0 Apr 27 12:51 uts -> uts:[4026532256]
```

### go操作namespace

```go
// 仅在linux下
cmd.SysProcAttr = &syscall.SysProcAttr{
    // 隔离选项, 对应不同namespace type
    Cloneflags:syscall.CLONE_NEWUTS|syscall.CLONE_NEWPID|syscall.CLONE_NEWNS|syscall.CLONE_NEWIPC|syscall.CLONE_NEWNET|syscall.CLONE_NEWUSER,
    // SysProcIDMap holds Container ID to Host ID mappings used for User Namespaces in Linux. 
    UidMappings: []syscall.SysProcIDMap{
        {
            ContainerID: 0,
            HostID:      os.Getuid(),
            Size:        1,
        },
    },
    GidMappings: []syscall.SysProcIDMap{
        {
            ContainerID: 0,
            HostID:      os.Getgid(),
            Size:        1,
        },
    },
}
```

## 挂载proc
- 当隔离了Mount时, 此时/proc虚拟文件系统还是宿主机的
  - 需要重新挂载/proc到容器的namespace下
- 未挂载proc时, 使用ps -ef查看仍能看到宿主机进程
  - 这是因为ps是通过查看/proc实现的
  - proc目录(Process Information Pseudo-filesystem): 进程信息伪文件系统
  - /proc目录并不包含实际的文件, 而是提供了一个动态的视图, 用于显示系统和进程相关的信息, 甚至可以通过更改其中某些文件来改变内核的运行状态
- `shell命令`
  - mount -t proc proc /proc
- `go代码`
  - syscall.Mount("proc","/proc","proc",0,"")

## 掩饰根目录
- 通过chroot或者pivot_root指令, 使容器的根目录切换到定义好的文件夹下
  - 这个文件夹下通过UFS挂载image和container layer中的文件, 使其看起来就像linux根目录
  - 通过这种方式伪造一个根目录文件系统后, 容器就无法跳出这个根目录了
    - 因此也只能使用这个文件系统中提供的命令了, 宿主机的指令如何没有复制进容器中就无法使用
    - 所有看到每个docker容器中很多指令无法直接使用
- 使得每个容器看起来是完整操作系统的根目录
- `go代码`
  - syscall.Chroot(rootFolderPath)
  - syscall.Chdir("/")
  - 这部分代码要在mount proc前, 因为chdir后, 就无法跳出容器文件系统了, 也自然访问不到/proc了

## 完整流程

```go
// 仅展示这部分的核心代码
// docker run container_name shell_cmd
func Run(){
    // 创建namespace, 然后调用子进程执行环境变量设置
    // 如果直接设置环境变量, 此时设置的其实不是容器环境下的, 而是宿主机的
    cmd := exec.Command("/proc/self/exe", "init", strings.Join(args, " "))
    cmd.SysProcAttr = &syscall.SysProcAttr{
        Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID | syscall.CLONE_NEWNS | syscall.CLONE_NEWIPC | syscall.CLONE_NEWNET | syscall.CLONE_NEWUSER,
        UidMappings: []syscall.SysProcIDMap{
            {
                ContainerID: 0,
                HostID:      os.Getuid(),
                Size:        1,
            },
        },
        GidMappings: []syscall.SysProcIDMap{
            {
                ContainerID: 0,
                HostID:      os.Getgid(),
                Size:        1,
            },
        },
    }
    cmd.Start()
    // -d 选项, 后台运行
    if !is_detach {
        cmd.Wait()
    }
}

func Init() {
    syscall.Chroot(rootFolderPath)
    syscall.Chdir("/")
    syscall.Mount("proc","/proc","proc",0,"")
    // 找到shell cmd的绝对路径, 然后执行
    path,err := exec.LookPath(cmdArr[1])
    // 核心, 使用syscall.Exec使得指定的cmdArr是PID为1的进程
    // 如果使用Run中的cmd.Start就会出现PID为1的进程实际上就是这个init进程, 而不是用户指定的cmd进程
    syscall.Exec(path, cmdArr[1:], os.Environ())
}
```

### syscall.Exec
- syscall.Exec最终调用了Kernel的int execve(const char *filename, char *const argv[], char *const envp[])系统函数
  - 它的作用是执行当前filename对应的程序
  - 覆盖当前进程的镜像、数据和堆栈等信息, 包括PID, 这些都会被将要运行的进程覆盖掉
- 调用这个方法, 将用户指定的进程运行起来, 把最初的init进程给替换掉
  - 这样当进入到容器内部的时候, 就会发现容器内的第一个程序就是我们指定的进程