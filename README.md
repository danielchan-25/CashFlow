# 💸 CashFlow

CashFlow 是一个部署在 Cloudflare Pages 上的个人记账应用。前端使用 React + Vite，后端 API 使用 Cloudflare Pages Functions，数据存储在 Cloudflare D1，代码通过 GitHub Actions 自动部署。

## 🌐 在线地址

- 🧪 干净 Demo：`https://cashflow-demo-82c.pages.dev`
- 🔒 个人生产环境：作者个人使用，不作为公开体验入口

建议将 Demo 和个人生产环境部署为两个独立的 Cloudflare Pages 项目，并分别绑定不同的 D1 数据库。Demo 环境可以保持全新空库，或只放少量示例数据；个人生产环境用于真实账本数据。

## ✨ 功能概览

- 📝 记账：记录收入、支出、账户、分类、备注和日期。
- 🏦 账户管理：维护现金、银行卡、信用卡、电子钱包、投资等账户。
- 🏷️ 分类管理：支持多级分类，并可从内置分类数据重新导入。
- 📊 概览统计：查看本月收入、支出、结余和分类统计。
- 📥📤 CSV 导入导出：用于迁移、备份或批量录入交易记录。
- 🔐 简单访问密码：生产环境可通过 Cloudflare 环境变量 `PASSWORD` 开启访问保护。

## 🧱 技术架构

```text
GitHub main 分支
  -> GitHub Actions
  -> npm ci && npm run build
  -> Wrangler 部署 dist
  -> Cloudflare Pages
  -> Pages Worker API
  -> Cloudflare D1
```

📁 关键文件：

- `src/`：React 前端源码。
- `functions/_worker.js`：Cloudflare Pages Functions 入口。
- `functions/api/`：后端 API。
- `migrations/001_init.sql`：D1 表结构初始化。
- `migrations/reset_data.sql`：清空生产业务数据。
- `wrangler.toml`：Cloudflare Pages 和 D1 配置。
- `.github/workflows/deploy.yml`：GitHub Actions 部署流程。

## 🚀 本地启动

先安装依赖：

```powershell
npm install
```

初始化本地 D1 数据库：

```powershell
npm run db:migrate
```

构建一次前端和 Worker：

```powershell
npm run build
```

启动本地 Cloudflare Pages Functions：

```powershell
npm run dev:worker
```

再开一个终端启动 Vite：

```powershell
npm run dev
```

浏览器打开 Vite 输出的地址，通常是：

```text
http://localhost:5173
```

本地没有设置 `PASSWORD` 时，登录页可以留空直接进入。

## ☁️ 连接 Cloudflare

### 1. 登录 Wrangler 🔑

```powershell
npx wrangler login
```

### 2. 创建或确认 D1 数据库 🗄️

如果还没有 D1 数据库，可以创建：

```powershell
npx wrangler d1 create cashflow
```

然后把输出里的 `database_id` 填入 `wrangler.toml`。仓库默认使用占位符，不应提交真实的生产数据库 ID：

```toml
[[d1_databases]]
binding = "cashflow"
database_name = "cashflow"
database_id = "YOUR_D1_DATABASE_ID"
```

注意：代码里使用的 D1 binding 名称是 `cashflow`，不要随意改名，除非同步修改后端代码。

### 3. 初始化生产数据库表结构 🧩

```powershell
npm run db:migrate:remote
```

这个命令只创建缺失的表和索引，不会删除已有数据。

### 4. 设置访问密码 🔐

在 Cloudflare Pages 项目的环境变量中添加：

```text
PASSWORD=你的访问密码
```

设置后重新部署。登录页面输入这个密码即可进入。

## 🚢 部署到 Cloudflare Pages

### 方式一：GitHub 自动部署 🤖

项目已经包含 GitHub Actions 配置。推送到 `main` 分支后会自动部署：

```powershell
git push origin main
```

你需要在 GitHub 仓库设置中添加 Secrets：

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_D1_DATABASE_ID
```

同时确认 `.github/workflows/deploy.yml` 里的：

```yaml
accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
command: pages deploy dist --project-name=cashflow --commit-dirty=true
```

部署时 workflow 会自动把 `CLOUDFLARE_D1_DATABASE_ID` 写入 `wrangler.toml`，因此仓库里不需要保存真实的 D1 database ID。

如果你的 Pages 项目名不是 `cashflow`，需要同步修改 `--project-name`。

### 方式二：GitHub 页面一键部署 ⚡

此仓库支持手动触发部署：

1. 打开 GitHub 仓库。
2. 进入 `Actions`。
3. 选择 `Deploy to Cloudflare Pages`。
4. 点击 `Run workflow`。
5. 选择 `main` 分支并运行。

这会执行和推送 `main` 一样的部署流程。

### 方式三：本机手动部署 🧰

```powershell
npm run build
npx wrangler pages deploy dist --project-name=cashflow
```

## 🧹 清空生产数据库

如果你想把线上系统恢复成全新状态，可以直接清空生产 D1 的业务数据：

```powershell
npm run db:reset:remote
```

这个命令会删除：

- 账户管理：`accounts`
- 分类管理：`categories`
- 概览中的每一笔账单记录：`transactions`
- 三张表的自增 ID 计数

它不会删除表结构。

清空后可以检查数量：

```powershell
npm run db:counts:remote
```

清空成功时，`accounts`、`categories`、`transactions` 应该都是 `0`。

如果表结构也需要确认，可以再执行：

```powershell
npm run db:migrate:remote
```

## 🏷️ 恢复默认分类

清空数据库后，默认分类不会自动恢复，需要在网页里重新导入：

1. 打开正式环境网站。
2. 登录。
3. 进入 `分类管理`。
4. 点击 `重新导入`。
5. 确认导入。

导入后只会恢复分类。账户需要进入 `账户管理` 手动新建，账单记录需要手动录入或通过 CSV 导入。

## 📥 CSV 导入交易记录

进入网页的 `导入` 页面，选择 CSV 文件，然后完成字段映射。

推荐字段：

```csv
date,type,amount,account_name,category_name,note
2026-06-16,expense,25.80,现金,堂食,午餐
2026-06-16,income,5000,银行卡,工资收入,工资
```

字段说明：

- `date`：日期，格式为 `YYYY-MM-DD`。
- `type`：交易类型，只能是 `expense` 或 `income`。
- `amount`：金额，必须大于 0。
- `account_name`：账户名称，需要先在账户管理中创建。
- `category_name`：分类名称，需要先导入或创建。
- `note`：备注，可选。

导入时系统会自动更新账户余额。

## 📤 CSV 导出交易记录

进入网页的 `导出` 页面：

1. 可选择开始日期和结束日期。
2. 日期留空时导出全部数据。
3. 点击 `导出 CSV`。

导出的 CSV 包含：

```text
日期,类型,金额,账户,分类,图标,备注
```

## 🛠️ 常用命令

```powershell
npm run dev              # 启动 Vite 前端
npm run dev:worker       # 启动本地 Pages Functions
npm run build            # 构建生产包
npm run check:encoding   # 检查源码是否有常见乱码
npm run db:migrate       # 初始化本地 D1
npm run db:migrate:remote # 初始化生产 D1
npm run db:reset:remote  # 清空生产业务数据
npm run db:counts:remote # 查看生产数据数量
```

## ✅ 上线前检查

推送正式环境前建议执行：

```powershell
npm run check:encoding
npm run build
npm run db:migrate:remote
```

确认 Cloudflare Pages 已配置：

- D1 数据库绑定：`cashflow`
- 环境变量：`PASSWORD`
- GitHub Secret：`CLOUDFLARE_API_TOKEN`
- GitHub Secret：`CLOUDFLARE_ACCOUNT_ID`
- GitHub Secret：`CLOUDFLARE_D1_DATABASE_ID`
- `wrangler.toml` 中的 `database_id` 已在你的私有部署环境中配置正确

## 🔒 安全提醒

- `npm run db:reset:remote` 会清空生产数据，执行前请确认无需保留现有数据。
- `PASSWORD` 是简单访问保护，适合个人使用，不建议作为多人系统的完整权限体系。
- 生产数据库迁移请优先使用 `npm run db:migrate:remote`，不要手动执行带 `DROP TABLE` 的 SQL。
- 不要把真实的 Cloudflare API Token、Account ID、D1 database ID、访问密码提交到公开仓库。
