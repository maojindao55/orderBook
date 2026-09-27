## 下载安装包

| 平台 | 文件 | 说明 |
|------|------|------|
| macOS Apple Silicon | `OrderBook_macOS-Apple-Silicon-{{version}}.dmg` | M 系列芯片 Mac (M1/M2/M3/M4) |
| macOS Intel | `OrderBook_macOS-Intel-{{version}}.dmg` | Intel 芯片 Mac |
| Windows | `OrderBook_Windows_x64-{{version}}.exe` | Windows 10/11 64 位安装包 |

### macOS 安装与打开提示

由于开源应用未配置苹果付费开发者证书签名与公证，macOS Gatekeeper 安全机制在通过浏览器（Chrome/Safari等）下载后会标记隔离属性，首次打开时可能会提示：
> **“商单管家”已损坏，无法打开。你应该将它移到废纸篓。**

解决方式非常简单，请选择以下任一方式解除隔离：

#### 方式一：终端单行命令（推荐，最快捷）
将应用拖入「应用程序」后，打开 Mac「终端」（Terminal），执行以下命令：

```bash
xattr -cr /Applications/商单管家.app
```

#### 方式二：系统设置「仍要打开」
1. 打开 Mac「系统设置」 -> 「隐私与安全性」。
2. 向下滑动到「安全性」部分，会看到提示：“商单管家”已被阻止使用。
3. 点击右侧的 **「仍要打开」**，输入开机密码即可。

---

### Windows 安装提示

如果 Windows Defender SmartScreen 弹出“已保护你的电脑”提示：
1. 点击弹窗中的 **「更多信息」**。
2. 点击右下角出现的 **「仍要运行」** 按钮即可正常安装使用。
