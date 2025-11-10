# Cloudflare Dashboard GitHub 部署指南

通过 Cloudflare Dashboard 连接 GitHub 仓库进行自动部署，无需手动登录和命令行操作。

## 前置要求

1. ✅ GitHub 账号和仓库
2. ✅ Cloudflare 账号
3. ✅ Supabase 项目（已创建数据库表）

## 部署步骤

### 1. 准备 Supabase 信息

在 Supabase Dashboard 中获取：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 进入你的项目 → **Settings** → **API**
3. 复制以下信息（稍后需要）：
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

### 2. 在 Cloudflare Dashboard 中连接 GitHub

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Workers**（不是 Pages）
5. 点击 **Connect to Git**
6. 选择 **GitHub**，授权 Cloudflare 访问你的 GitHub 账号
7. 选择你的仓库和分支（通常是 `main` 或 `master`）

### 3. 配置构建和部署设置

在部署配置页面，填写以下信息：

#### 构建命令（Build command）
```
npm install
```

#### 部署命令（Deploy command）
```
npx wrangler deploy
```

或者使用：
```
npm run deploy
```

#### 版本命令（Version command）
```
（留空，不需要）
```

或者填写：
```
git rev-parse HEAD
```

### 4. 配置环境变量

在同一个配置页面，找到 **Environment variables** 或 **Variables** 部分，添加：

| 变量名 | 值 | 说明 | 必需 |
|--------|-----|------|------|
| `SUPABASE_URL` | 你的 Supabase Project URL | 例如：`https://xxxxx.supabase.co` | ✅ |
| `SUPABASE_ANON_KEY` | 你的 Supabase anon key | 从 Supabase Dashboard 复制的长字符串 | ✅ |
| `DEFAULT_USERNAME` | 默认用户名 | 例如：`admin`（可选，默认值：`admin`） | ❌ |
| `DEFAULT_PASSWORD` | 默认密码 | 例如：`admin123`（可选，默认值：`admin123`） | ❌ |

**重要**：
- 变量名必须完全匹配：`SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
- 值不要加引号
- 这些变量会在部署时自动注入到 Worker 环境中

### 5. 保存并部署

1. 点击 **Save and Deploy** 或 **Deploy**
2. 等待构建完成（通常需要 1-2 分钟）
3. 部署成功后，你会看到 Worker URL，例如：
   ```
   https://cf-worker-todo-app.your-subdomain.workers.dev
   ```

### 6. 验证部署

1. 访问 Worker URL
2. 尝试注册新用户
3. 登录并创建任务
4. 测试功能是否正常

## 自动部署

配置完成后，每次你向 GitHub 仓库推送代码时，Cloudflare 会自动：

1. 检测到代码变更
2. 运行构建命令
3. 运行部署命令
4. 自动部署新版本

你可以在 Cloudflare Dashboard 的 **Deployments** 标签页查看部署历史。

## 环境变量管理

### 查看环境变量

1. 在 Worker 页面，进入 **Settings** → **Variables**
2. 可以看到所有配置的环境变量

### 修改环境变量

1. 在 **Settings** → **Variables** 中
2. 点击变量旁边的编辑按钮
3. 修改值后保存
4. 需要重新部署才能生效（或等待下次自动部署）

### 添加新环境变量

1. 在 **Settings** → **Variables** 中
2. 点击 **Add variable**
3. 填写变量名和值
4. 保存

## 故障排除

### 问题：构建失败

**错误信息**：`npm install` 失败或找不到模块

**解决方法**：
1. 检查 `package.json` 是否正确
2. 确认所有依赖都已列出
3. 查看构建日志了解详细错误

### 问题：部署失败

**错误信息**：`wrangler deploy` 失败

**解决方法**：
1. 检查 `wrangler.toml` 配置是否正确
2. 确认 Worker 名称没有冲突
3. 查看部署日志

### 问题：环境变量未生效

**错误信息**：`SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量必须设置`

**解决方法**：
1. 确认在 Dashboard 中正确配置了环境变量
2. 检查变量名拼写是否正确（区分大小写）
3. 重新部署 Worker

### 问题：数据库连接失败

**错误信息**：`获取任务失败` 或数据库相关错误

**解决方法**：
1. 检查 Supabase URL 和 Key 是否正确
2. 确认 Supabase 项目状态正常
3. 检查数据库表是否已创建（执行 `supabase-init.sql`）
4. 查看 Supabase Dashboard 的 Logs

## 优势

使用 Dashboard GitHub 集成部署的优势：

✅ **无需命令行**：所有操作在网页完成  
✅ **自动部署**：代码推送后自动部署  
✅ **环境变量管理**：在 Dashboard 中直接配置  
✅ **部署历史**：可以查看和回滚历史版本  
✅ **无需登录**：通过 Dashboard 授权，无需 `wrangler login`  

## 注意事项

1. **首次部署**：需要授权 GitHub 访问权限
2. **环境变量**：敏感信息（如 API Key）存储在 Cloudflare，不会泄露
3. **构建时间**：首次构建可能需要较长时间下载依赖
4. **部署限制**：免费版 Workers 有每日部署次数限制

## 下一步

- 配置自定义域名
- 设置环境（生产/开发）
- 配置 Webhook 通知
- 查看 Worker 日志和指标

