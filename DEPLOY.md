# 部署指南

## Supabase 数据库配置

### 1. 获取 Supabase 连接信息

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择或创建项目
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → 这是 `SUPABASE_URL`
   - **anon public** key → 这是 `SUPABASE_ANON_KEY`

### 2. 创建数据库表

在 Supabase Dashboard 中：

1. 进入 **SQL Editor**
2. 复制 `supabase-init.sql` 文件中的内容
3. 粘贴并执行 SQL 脚本
4. 确认表创建成功（应该看到 `users` 和 `todos` 两个表）

## Cloudflare Worker 部署

### 方式一：使用 Wrangler CLI（推荐）

#### 步骤 1: 安装依赖

```bash
npm install
```

#### 步骤 2: 登录 Cloudflare

```bash
npx wrangler login
```

#### 步骤 3: 设置环境变量（安全方式）

```bash
# 设置 Supabase URL
npx wrangler secret put SUPABASE_URL
# 粘贴你的 Supabase Project URL，例如: https://xxxxx.supabase.co

# 设置 Supabase Anon Key
npx wrangler secret put SUPABASE_ANON_KEY
# 粘贴你的 Supabase anon key
```

#### 步骤 4: 本地测试

```bash
npm run dev
```

访问 `http://localhost:8787` 测试应用。

#### 步骤 5: 部署

```bash
npm run deploy
```

部署成功后，你会得到一个 Worker URL，例如：`https://cf-worker-todo-app.your-subdomain.workers.dev`

### 方式二：通过 GitHub Actions 自动部署

#### 步骤 1: 准备 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. `CLOUDFLARE_API_TOKEN`
   - 获取方式：Cloudflare Dashboard → My Profile → API Tokens → Create Token
   - 权限：Account - Workers Scripts:Edit, Zone - Zone:Read

2. `CLOUDFLARE_ACCOUNT_ID`
   - 获取方式：Cloudflare Dashboard → 右侧边栏可以看到 Account ID

3. `SUPABASE_URL`
   - 你的 Supabase Project URL

4. `SUPABASE_ANON_KEY`
   - 你的 Supabase anon key

#### 步骤 2: 推送代码

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

GitHub Actions 会自动部署。

### 方式三：通过 Cloudflare Dashboard 上传

#### 步骤 1: 构建项目

```bash
npm install
npm run deploy -- --dry-run
```

#### 步骤 2: 在 Cloudflare Dashboard 中

1. 进入 **Workers & Pages**
2. 点击 **Create application** → **Worker**
3. 填写 Worker 名称
4. 选择 **Upload a file** 或直接粘贴代码
5. 在 **Settings** → **Variables** 中添加环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## 环境变量说明

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 设置环境变量的方式

1. **Wrangler Secret（推荐）**：使用 `wrangler secret put` 命令
2. **wrangler.toml**：在 `[vars]` 部分添加（仅用于开发，不安全）
3. **Cloudflare Dashboard**：在 Worker 设置中添加

## 验证部署

部署成功后：

1. 访问 Worker URL
2. 尝试注册新用户
3. 登录并创建任务
4. 测试任务的增删改查功能

## 故障排除

### 问题：环境变量未设置

**错误信息**：`SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量必须设置`

**解决方法**：
- 使用 `wrangler secret put` 设置环境变量
- 或在 Cloudflare Dashboard 中添加环境变量

### 问题：数据库连接失败

**错误信息**：`获取任务失败` 或类似的数据库错误

**解决方法**：
1. 检查 Supabase URL 和 Key 是否正确
2. 确认 Supabase 项目状态正常
3. 检查数据库表是否已创建
4. 查看 Supabase Dashboard 的 Logs 查看详细错误

### 问题：部署失败

**错误信息**：`Authentication error` 或 `Permission denied`

**解决方法**：
1. 确认已登录：`npx wrangler login`
2. 检查 Cloudflare API Token 权限
3. 确认账户有 Workers 权限

### 问题：模块找不到

**错误信息**：`找不到模块"@supabase/supabase-js"`

**解决方法**：
```bash
npm install
```

## 安全建议

1. **永远不要**将 `SUPABASE_ANON_KEY` 提交到 Git 仓库
2. 使用 `wrangler secret` 或 GitHub Secrets 存储敏感信息
3. 定期更新依赖：`npm update`
4. 监控 Worker 日志以发现异常访问

## 下一步

- 自定义 UI 样式
- 添加更多功能（任务分类、标签等）
- 实施更完善的会话管理（JWT）
- 添加速率限制
- 配置自定义域名

