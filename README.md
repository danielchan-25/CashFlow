# 💸 CashFlow

CashFlow 是一个本地运行的个人记账应用。前端使用 React + Vite，后端使用 Express + 内置 `node:sqlite`，所有数据存储在本地 `cashflow.sqlite` 文件中。

## ✨ 功能概览

- 📝 **记账**：记录收入和支出，支持多级分类、日期、备注。
- 🏷️ **分类管理**：支持多级分类（大类 → 中类 → 小类），可重新导入内置分类数据。
- 📊 **概览**：查看本月收入/支出汇总、分类统计饼图，按类型/分类/关键字筛选交易记录。
- 📥📤 **数据导入/导出**：CSV 导入导出，用于迁移、备份或批量录入。

## 🧱 技术架构

```text
npm run dev
  ├── node server/index.js  (Express + node:sqlite, :3001)
  └── vite                  (React 前端, :5173)
       └── /api → proxy → localhost:3001
```

数据文件 `cashflow.sqlite` 生成在项目根目录，可直接复制迁移。

## 🚀 快速开始

```powershell
npm install
npm run dev
```

打开 http://localhost:5173 即可使用。

首次使用无需密码；设置密码后，下次访问需输入密码。

## 📁 项目结构

- `src/` — React 前端源码
- `server/index.js` — Express API 服务（分类、交易、统计、数据导入导出、认证端点）
- `server/db.js` — SQLite 数据库初始化、内置分类种子数据、密码哈希管理
- `cashflow.sqlite` — SQLite 数据库文件（运行后自动生成）

## 📥 CSV 导入

进入 **数据** 页面，选择 CSV 文件，映射字段后导入。

推荐字段：

```csv
date,type,amount,category_parent,category_name,note
2026-07-01,expense,25.80,美食,堂食,午餐
2026-07-01,income,5000,工资收入,,7月工资
```

字段说明：

- `date` — 日期，格式 `YYYY-MM-DD`
- `type` — `expense` 或 `income`（也支持中文"支出"/"收入"）
- `amount` — 金额（正数；支出可用负数或靠 type 区分）
- `category_parent` — 大类名称（如"美食"），留空则仅按中类匹配
- `category_name` — 中类名称（如"堂食"）
- `note` — 备注，可选

## 📤 CSV 导出

进入 **数据** 页面，点击"导出 CSV"，导出全部交易记录。

导出格式：`日期,类型,金额,分类,备注`

## 🗄️ 数据迁移

复制 `cashflow.sqlite` 到新环境项目根目录即可。

## 🔒 安全说明

- 数据只存储在本地 SQLite 文件中，不经过任何外部服务器。
- 密码使用 SHA-256 哈希后存储在数据库中。
- 所有 API 调用在本地完成，无网络请求。
