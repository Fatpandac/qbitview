# qbitview

[English README](./README.md)

![screenshot](https://github.com/Fatpandac/qbitview/blob/main/assets/screenshot.png?raw=true)

qbitview 是一个基于 Tauri、React 和 TypeScript 构建的 qBittorrent 桌面客户端。它提供本地桌面风格的交互，方便你快速查看任务、管理下载、检查种子详情，并通过键盘快速跳转常用功能。

## 主要功能

- 查看并刷新完整任务列表，支持按状态筛选
- 打开任务详情 drawer，查看：
  - 基本信息与传输状态
  - Tracker
  - Peer
  - Web Seed
  - 文件树与文件下载进度
- 支持通过链接、`.torrent` 文件、拖拽方式添加任务
- 支持在右键菜单中下载原始 `.torrent` 文件
- 支持暂停、开始、重新汇报、重新校验、删除任务
- 提供设置页面，可直接修改 qBittorrent 常用配置
- 支持 BitTorrent 相关配置，包括：
  - 默认下载路径
  - 临时文件路径
  - 监听端口
  - 全局下载和上传限速
  - 队列限制
  - 连接数限制
  - 加密模式
  - 做种停止条件，例如分享率和做种时间
- 支持命令面板和模糊搜索，可用于：
  - 搜索下载任务
  - 跳转筛选分类
  - 定位到设置页中的具体配置项
- 支持常用快捷键：
  - `Cmd+,` 打开设置页
  - `Cmd+K` 打开命令面板
  - `Esc` 关闭对话框或任务详情 drawer

## 技术栈

- [Tauri](https://tauri.app/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)

## 开发说明

### 环境要求

- Node.js
- pnpm 或 npm
- Rust 工具链
- 对应平台的 Tauri 开发环境
- 可访问的 qBittorrent Web UI 服务

### 安装依赖

```bash
pnpm install
```

或：

```bash
npm install
```

### 启动开发环境

```bash
pnpm tauri:dev
```

或：

```bash
npm run tauri:dev
```

### 运行测试

```bash
pnpm test
```

或：

```bash
npm test
```

### 构建

```bash
pnpm tauri build
```

或：

```bash
npm run tauri build
```

## 项目结构

```text
src/
  components/       共享 UI 组件与命令面板
  pages/main/       任务列表、drawer、工具栏、状态栏、弹窗
  pages/setting/    qBittorrent 设置页
  sotres/           Zustand 状态存储
src-tauri/
  src/lib.rs        Tauri 命令与 qBittorrent 桥接层
```

## 说明

- qbitview 通过 qBittorrent Web API 与服务端通信。
- 设置页中的配置直接映射到 qBittorrent preferences，修改后会作用于当前连接的服务端。
- 应用围绕桌面端使用场景设计，同时支持鼠标和键盘操作。
