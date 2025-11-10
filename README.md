# 任务管理系统 - Cloudflare Worker + Supabase

一个安全、美观的任务管理系统，部署在 Cloudflare Worker 上，使用 Supabase 作为数据库。

## 功能特性

- ✅ 用户注册和登录（账密认证）
- ✅ 任务管理（增删改查）
- ✅ 任务完成状态切换
- ✅ 美观的现代化 UI 设计
- ✅ 响应式布局，支持移动端
- ✅ 安全防护（XSS、SQL 注入、CSRF 等）

## 技术栈

- **运行时**: Cloudflare Workers
- **数据库**: Supabase (PostgreSQL)
- **语言**: TypeScript
- **前端**: HTML + CSS + JavaScript (原生，无框架)

## 前置要求

1. Node.js 18+ 和 npm
2. Cloudflare 账号
3. Supabase 账号和项目

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase 数据库

在 Supabase 项目中执行以下 SQL 创建表结构：

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务表
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_created_at ON todos(created_at);

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许用户访问自己的数据）
-- 注意：由于我们使用自定义认证，RLS 策略可能需要调整
-- 或者暂时禁用 RLS，由应用层控制权限
```

### 3. 获取 Supabase 连接信息

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击 Settings → API
4. 复制以下信息：
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_ANON_KEY)

### 4. 部署到 Cloudflare

#### 方式一：通过 Cloudflare Dashboard 连接 GitHub（推荐，最简单）⭐

**无需命令行，无需手动登录，环境变量在 Dashboard 中直接配置！**

详细步骤请查看：[DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md)

**快速步骤**：
1. 在 Cloudflare Dashboard → Workers & Pages → Create application → Workers
2. 选择 **Connect to Git** → 连接 GitHub 仓库
3. 配置：
   - **构建命令**：`npm install`
   - **部署命令**：`npx wrangler deploy`
   - **版本命令**：（留空）
4. 在 **Environment variables** 中添加：
   - `SUPABASE_URL` = 你的 Supabase URL
   - `SUPABASE_ANON_KEY` = 你的 Supabase anon key
5. 点击 **Deploy**

之后每次推送代码到 GitHub 都会自动部署！

#### 方式二：使用 Wrangler CLI（需要命令行）

```bash
# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler login

# 设置环境变量
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY

# 部署
npm run deploy
```

#### 方式三：通过 GitHub Actions 自动部署

1. 在 GitHub 仓库设置中添加 Secrets：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. 推送代码到 main 分支，GitHub Actions 会自动部署

### 5. 本地开发

```bash
npm install
npm run dev
```

访问 `http://localhost:8787` 查看应用。

**注意**：本地开发需要先设置环境变量，可以在 `wrangler.toml` 中临时配置（仅用于开发）：

```toml
[vars]
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key-here"
```

⚠️ **注意**: 不要将包含真实密钥的 `wrangler.toml` 提交到 Git！

## 安全特性

### 已实现的安全措施

1. **密码安全**
   - 使用 SHA-256 哈希存储密码（生产环境建议使用 bcrypt，但 Worker 环境限制）
   - 密码最小长度验证

2. **输入验证**
   - 用户名格式验证（只允许字母、数字、下划线）
   - 输入长度限制
   - SQL 注入防护（使用 Supabase 参数化查询）

3. **XSS 防护**
   - 前端输出转义
   - 输入内容清理和长度限制

4. **权限控制**
   - 用户只能访问和操作自己的数据
   - API 路由需要认证

5. **CORS 配置**
   - 适当的 CORS 头设置

### 安全建议

1. **生产环境改进**:
   - 使用 JWT 进行会话管理
   - 实现更完善的会话验证（使用 Cloudflare KV 存储会话）
   - 添加速率限制
   - 使用 HTTPS（Cloudflare Worker 默认提供）

2. **密码安全**:
   - 考虑使用更强的哈希算法（如 Argon2）
   - 添加密码强度要求

3. **其他**:
   - 定期更新依赖
   - 监控异常访问
   - 实施日志记录

## 项目结构

```
.
├── src/
│   ├── index.ts      # Worker 主入口，处理路由和 API
│   ├── auth.ts       # 认证逻辑（注册、登录）
│   └── db.ts         # 数据库连接配置
├── package.json      # 项目依赖
├── wrangler.toml     # Cloudflare Worker 配置
├── tsconfig.json     # TypeScript 配置
└── README.md         # 项目文档
```

## API 接口

### 认证接口

- `POST /api/register` - 用户注册
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- `POST /api/login` - 用户登录
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

### 任务接口（需要认证）

- `GET /api/todos` - 获取任务列表
- `POST /api/todos` - 创建任务
  ```json
  {
    "title": "string",
    "description": "string (可选)"
  }
  ```
- `PUT /api/todos` - 更新任务
  ```json
  {
    "id": "uuid",
    "title": "string (可选)",
    "description": "string (可选)",
    "completed": "boolean (可选)"
  }
  ```
- `DELETE /api/todos?id={id}` - 删除任务

## 故障排除

### 常见问题

1. **环境变量未设置**
   - 确保已通过 `wrangler secret put` 设置环境变量
   - 或在 `wrangler.toml` 中配置（仅开发环境）

2. **数据库连接失败**
   - 检查 Supabase URL 和 Key 是否正确
   - 确认 Supabase 项目状态正常
   - 检查网络连接

3. **部署失败**
   - 确认已登录 Cloudflare: `npx wrangler login`
   - 检查账户是否有 Workers 权限

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

