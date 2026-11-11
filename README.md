# 项目名称：契约 (Dawn Duo)

## 🚨 核心开发规范 (AI 代码生成要求)
为了保证后续迭代的效率与阅读体验，**所有 AI 生成的代码必须严格遵守以下要求**：
1. **禁止高亮**：必须使用 ```text 代码框包裹，**绝对禁止使用 javascript 或其他高亮标记**，方便用户直接复制。
2. **全文输出**：任何文件的修改，必须提供该文件的完整全文，绝对禁止使用 `...` 或省略号代替原有代码。
3. **极致精简**：代码需高度压缩，能在一行写完的逻辑绝不换行（前提是不破坏可读性），合并冗余变量，去除无用注释。
4. **逻辑清晰**：按照功能模块高度划分，UI 显示需严格根据当前 `identity`（身份）自动过滤无关设置项。
5. **UI 规范**：说明性文字不要过长，尽量使用 `<span class="help-icon" data-tip="...">i</span>` 包裹悬浮提示，保持按钮和主要操作直观。
6. **大白话总结**：每次修改后，必须在末尾提供一段**大白话总结**，简单说明修改了哪里，让小白也能秒懂。

## 📁 文件存储与架构说明
本项目分为**两个仓库**：
1. **前端代码仓**（当前仓库）：包含所有的 HTML/CSS/JS 文件以及 `index.html`。
2. **数据与后台脚本仓**（`luo029/dawn_duo_data`）：存放打卡记录 JSON 及后台推送脚本。
**注意**：为了方便本地一次性编辑和 AI 读取，`send-push.js` 和 `push.yml` 虽然最终运行在 `dawn_duo_data` 仓库，但也同步存放在本地的项目根目录下。在提交时，需将这两个文件上传到云端仓库。云端数据交互逻辑由前端通过 GitHub API 直接读写。

## 序言（文言文版）
盖闻山海虽远，不隔同心。是作“契约”一役，结连理于云端。主从相契，作息同规；朝暮相守，互为牵挂。借彼星汉之网，传此相思之音；凭此无相之手，警其寤寐之期。虽隔半洲，宛若比邻。此库之设，实乃双心相照之信物，异地结伴之良方也。

## 项目简介
这是一个专为异地情侣/伴侣打造的 **PWA 双人作息打卡与提醒应用**。支持“日常”与“主仆”双模式切换。用户可通过 GitHub API 直接进行数据的云端同步（免服务器），并利用 Web Push 与 GitHub Actions 实现定时后台推送。

## 核心架构与工作流
### 1. 数据同步机制
- **前端直连**：用户输入 GitHub PAT 验证，随后前端直接调用 GitHub API 读写私有库 `dawn_duo_data`。
- **双文件分离**：`master_records.json` 和 `doggy_records.json` 分离记录，前端根据身份推送/拉取各自数据；`config.json` 存放双端共享配置。
- **差异对比**：前端设有比对弹窗，在拉取或上传前比对本地与云端数据。

### 2. 通知与推送机制
- **页面内通知**：基于 `Notification API`，利用 `sw.js` 和前端轮询判断是否到达打卡时间。
- **后台云端推送 (Web Push)**：前端获取 Push Subscription 并发送至 Cloudflare Worker 写入 `subscriptions.json`。GitHub Actions 每天定时触发 `send-push.js` 发送通知，遇到 404/410 自动清理失效订阅。
- **防误触机制**：`send-push.js` 在发送前会读取双文件记录，若已打卡则直接跳过，避免打扰。
- **设备与编码**：订阅时会记录设备类型与授权时间，身份标识改为传纯英文 (`master` / `doggy` / `both`) 避免 Cloudflare 乱码，通知内的中文称呼由 `send-push.js` 动态读取。
- **测试面板**：前端测试中心新增“云端触发”按钮，直接调用 GitHub API 触发 Actions 手动执行。
  - *前提配置*：Token 必须为 **Fine-grained** 且授予该仓库 **`Actions` (Read and write)** 权限；分支需为 `main`。
  - *备注*：Fine-grained Token 不存在独立的 `workflow` 字段，触发工作流由 `Actions` 权限覆盖。若使用 Classic Token，则需勾选 `workflow` 和 `repo` scope。

### 3. Cloudflare Workers
- **`dawn-duo`**：主站接口代理。
- **`push-subscribe`**：接收前端请求，校验 `WEBHOOK_SECRET`，读写订阅信息。

### 4. GitHub Actions (`dawn_duo_data` 仓库)
- **`push.yml`**：每天 UTC 22:00 触发。
- **`send-push.js`**：读取 VAPID 密钥与文案，遍历订阅并发送推送。