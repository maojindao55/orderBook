# 商单管家 (OrderBook)

> 专为达人、KOL、博主与商务媒介量身打造的本地化商单全生命周期管理桌面应用。

[![Release](https://github.com/maojindao55/orderBook/actions/workflows/release.yml/badge.svg)](https://github.com/maojindao55/orderBook/actions/workflows/release.yml)
[![GitHub Release](https://img.shields.io/github/v/release/maojindao55/orderBook)](https://github.com/maojindao55/orderBook/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 核心特性

- 📊 **全周期状态管理**：意向沟通、样品寄送、脚本排期、内容发布、财务结款、历史归档全流程清晰掌控。
- 💰 **财务自动核算**：报价、合作金额、返点比例、预估到手净收益实时自动计算。
- 🏷️ **智能品牌与品类清洗**：支持品牌智能识别、品类归类与多重标签。
- 📅 **排期与日历跟踪**：优化日期交互体验，清晰掌握近期发布节点。
- 🔍 **多维智能筛选**：支持状态、品牌、月份范围等多重组合筛选与即时搜索。
- 💾 **100% 本地数据存储**：基于 SQLite 本地数据库，数据完全保存在个人电脑本地，无需担心隐私泄漏。
- 🖥️ **跨平台支持**：原生支持 macOS（Apple Silicon M系列及 Intel 架构）与 Windows (10/11)。

---

## 📥 下载与安装

前往 [GitHub Releases 页面](https://github.com/maojindao55/orderBook/releases/latest) 下载最新安装包。

| 平台 | 安装包名称 | 说明 |
|------|-----------|------|
| macOS (Apple Silicon) | `OrderBook_macOS-Apple-Silicon-v*.dmg` | 适用于 M1/M2/M3/M4 芯片 Mac |
| macOS (Intel) | `OrderBook_macOS-Intel-v*.dmg` | 适用于 Intel 处理器 Mac |
| Windows | `OrderBook_Windows_x64-v*.exe` | 适用于 Windows 10/11 64位系统 |

### ⚠️ macOS 安装后提示「已损坏，无法打开」解决办法

由于本项目为开源发布，暂未购买 Apple 开发者账号认证（$99/年），macOS Gatekeeper 安全机制在通过浏览器下载后会增加隔离属性（quarantine）。

遇到提示时，请按以下任一方式处理：

#### 方式一：终端单行命令（推荐，最快捷）
将应用拖入「应用程序」目录后，打开「终端」（Terminal），复制并粘贴运行以下命令：

```bash
xattr -cr /Applications/商单管家.app
```

#### 方式二：系统设置「仍要打开」
1. 打开 Mac「系统设置」 -> 「隐私与安全性」。
2. 向下滑动到「安全性」区域，会看到提示：“商单管家”已被阻止使用。
3. 点击右侧的 **「仍要打开」**，输入开机密码即可。

---

### ⚠️ Windows 安装提示 SmartScreen 解决办法

如果 Windows Defender SmartScreen 弹出“已保护你的电脑”的蓝色弹窗：
1. 点击弹窗中的 **「更多信息」**。
2. 点击右下角出现的 **「仍要运行」** 按钮即可正常安装使用。

---

## 🛠️ 本地开发

### 环境要求
- Node.js >= 20.0.0
- npm >= 10.0.0

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/maojindao55/orderBook.git
cd orderBook

# 安装依赖
npm install

# 启动本地开发模式（支持热重载）
npm run dev
```

### 构建打包

```bash
# 构建前端并打包桌面安装包
npm run build
npx electron-builder
```

### 🚀 自动化版本发布（与 FreeBuddy 对齐）

项目内置了自动化版本发布脚本，一键完成版本号自增、更新 CHANGELOG.md、提交 git commit、打 Tag 并推送触发 GitHub Actions：

```bash
# 自动递增补丁版本并发布 (v1.0.0 -> v1.0.1)
npm run release
# 或使用快捷命令
npm run r

# 发布 minor 次版本 (v1.0.0 -> v1.1.0)
npm run release:minor

# 发布 major 主版本 (v1.0.0 -> v2.0.0)
npm run release:major

# 演练模式（仅预览改动，不实际提交）
npm run release -- --dry-run
```

---

## 📄 开源许可

本项目基于 [MIT License](LICENSE) 开源。
