# 项目名称：契约 (Dawn Duo)

## 序言（文言文版）
盖闻山海虽远，不隔同心。是作“契约”一役，结连理于云端。主从相契，作息同规；朝暮相守，互为牵挂。借彼星汉之网，传此相思之音；凭此无相之手，警其寤寐之期。虽隔半洲，宛若比邻。此库之设，实乃双心相照之信物，异地结伴之良方也。

---

## 项目简介
这是一个专为异地情侣/伴侣打造的 **PWA 双人作息打卡与提醒应用**。支持“日常”与“主仆”双模式切换。用户可通过 GitHub API 直接进行数据的云端同步（免服务器），并利用 Web Push 与 GitHub Actions 实现定时后台推送。

## 仓库结构 (GitHub 用户: `luo029`)
本项目采用**前后端分离**及**数据代码解耦**的设计，共包含两个仓库：
1. **`dawn_duo` (公开仓库)**：
   - 包含项目所有的核心前端代码 (HTML, CSS, Vanilla JS)。
   - 部署在静态托管平台（如 Cloudflare Pages 或 GitHub Pages）。
2. **`dawn_duo_data` (私有仓库)**：
   - 存放双人的打卡数据、配置信息与推送订阅信息。
   - 包含 GitHub Actions 定时任务脚本。

## 核心架构与工作流

### 1. 数据同步机制
- **前端直连**：用户在前端通过输入 GitHub PAT (Personal Access Token) 进行验证，随后前端直接调用 GitHub API 读写私有库 `dawn_duo_data`。
- **数据文件**：
  - `records.json`：存放每日的打卡记录。
  - `config.json`：存放用户个性化配置（如时区、文案、称呼、模式等）。
  - 前端设有“差异对比”弹窗，在拉取或上传前比对本地与云端数据的差异。

### 2. 通知与推送机制
分为“页面内通知”和“后台云端推送”两种：
- **页面内通知**：基于浏览器 `Notification API`，需要页面处于打开状态，利用 `sw.js` (Service Worker) 和前端轮询判断是否到达打卡时间。
- **后台云端推送 (Web Push)**：
  - **订阅**：前端请求权限获取 Push Subscription，将其发送至 Cloudflare Worker。
  - **Worker 存储**：Worker 接收订阅信息后，调用 GitHub API 写入 `dawn_duo_data` 的 `subscriptions.json` 中。
  - **定时推送**：GitHub Actions 每天定时（或手动）触发，运行 `send-push.js`，读取 `config.json` (获取推送文案) 和 `subscriptions.json` (获取目标设备)，通过 `web-push` 库向用户设备发送通知。遇到 404/410 状态码会自动清理失效的订阅。

### 3. Cloudflare Workers (无服务器函数)
项目使用了两个 Cloudflare Workers：
- **`dawn-duo`** (`https://dawn-duo.luo029.workers.dev/`)：主站接口代理（可选，用于验证或转发等）。
- **`push-subscribe`** (`https://push-subscribe.luo029.workers.dev/`)：
  - 接收前端 POST 请求（新增订阅或取消订阅）。
  - 校验 `WEBHOOK_SECRET`。
  - 读取/写入 `dawn_duo_data` 仓库的 `subscriptions.json`。

### 4. GitHub Actions (`dawn_duo_data` 仓库)
- **`push.yml`**：定时任务配置文件，每天 UTC 22:00 (北京时间次日 06:00) 触发，支持手动触发。
- **`send-push.js`**：Node.js 脚本，使用 `web-push` 库，读取 VAPID 密钥，遍历订阅并发送推送。发送后若存在失效订阅，会自动提交更新 `subscriptions.json`。

## 关键文件树 (dawn_duo_data)
```text
.github/workflows/push.yml  # GitHub Actions 定时任务配置
data/                       # 可能的数据归档目录
config.json                 # 用户配置（包含后台推送的标题与正文文案）
records.json                # 打卡记录数据
send-push.js                # Web Push 发送脚本
subscriptions.json          # 前端注册的 Push 订阅端点列表