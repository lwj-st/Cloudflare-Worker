# 测试指南

## 环境变量配置

在 Cloudflare Dashboard 中配置以下环境变量：

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 可选的环境变量（用于默认用户）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEFAULT_USERNAME` | 默认用户名 | `admin` |
| `DEFAULT_PASSWORD` | 默认密码 | `admin123` |

**注意**：如果不设置 `DEFAULT_USERNAME` 和 `DEFAULT_PASSWORD`，将使用默认值。

## 快速测试步骤

### 1. 确保数据库表已创建

在 Supabase Dashboard → SQL Editor 中执行 `supabase-init.sql`

### 2. 配置环境变量

在 Cloudflare Dashboard → Workers & Pages → 你的 Worker → Settings → Variables 中添加：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DEFAULT_USERNAME`（可选）
- `DEFAULT_PASSWORD`（可选）

### 3. 部署 Worker

使用 Cloudflare Dashboard 或命令行部署。

### 4. 测试数据库连接

访问（将 `your-worker` 替换为你的 Worker 名称）：
```
https://your-worker.workers.dev/api/test
```

**预期响应**：
```json
{
  "success": true,
  "message": "数据库连接正常"
}
```

### 5. 创建默认用户

```bash
curl -X POST https://your-worker.workers.dev/api/init \
  -H "Content-Type: application/json"
```

这会使用环境变量中配置的 `DEFAULT_USERNAME` 和 `DEFAULT_PASSWORD` 创建默认用户。

**预期响应**：
```json
{
  "success": true,
  "message": "默认用户创建成功",
  "username": "admin"
}
```

**预期响应**：
```json
{
  "success": true,
  "message": "默认用户创建成功",
  "username": "admin",
  "password": "admin123"
}
```

### 6. 使用默认用户登录

使用环境变量中配置的用户名和密码登录：

```bash
curl -X POST https://your-worker.workers.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"你的DEFAULT_USERNAME","password":"你的DEFAULT_PASSWORD"}'
```

**预期响应**：
```json
{
  "success": true,
  "message": "登录成功",
  "sessionToken": "...",
  "userId": "..."
}
```

## 在浏览器中测试

1. 访问 Worker URL
2. 使用环境变量中配置的默认用户名和密码登录

## 常见问题排查

### ❌ 问题：测试连接失败 - "数据库表不存在"

**解决**：
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行 `supabase-init.sql` 中的所有 SQL 语句
4. 确认表已创建（应该看到 `users` 和 `todos` 两个表）

### ❌ 问题：注册失败 - "权限被拒绝" 或 "RLS 策略阻止"

**原因**：Row Level Security (RLS) 策略配置不正确。

**解决**：在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 确保策略存在
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on todos" ON todos;
CREATE POLICY "Allow all operations on todos" ON todos
  FOR ALL USING (true) WITH CHECK (true);
```

或者暂时禁用 RLS（仅用于测试）：

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
```

### ❌ 问题：环境变量未设置

**检查**：
1. 在 Cloudflare Dashboard → Workers & Pages → 你的 Worker → Settings → Variables
2. 确认 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 已正确配置
3. 重新部署 Worker

### ❌ 问题：创建默认用户失败

**可能原因**：
1. 用户已存在（这是正常的，会返回成功消息）
2. 数据库表未创建
3. RLS 策略阻止

**检查**：
1. 先测试连接：`/api/test`
2. 查看 Worker 日志了解详细错误

## 测试 API 端点总结

| 端点 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/test` | GET | 测试数据库连接 | ❌ |
| `/api/init` | POST | 创建默认用户 | ❌ |
| `/api/register` | POST | 注册新用户 | ❌ |
| `/api/login` | POST | 用户登录 | ❌ |
| `/api/todos` | GET | 获取任务列表 | ✅ |
| `/api/todos` | POST | 创建任务 | ✅ |
| `/api/todos` | PUT | 更新任务 | ✅ |
| `/api/todos` | DELETE | 删除任务 | ✅ |

## 下一步

测试成功后：
1. ✅ 可以正常注册和登录
2. ✅ 可以创建和管理任务
3. ✅ 系统运行正常

如果还有问题，请查看 Worker 日志或 Supabase Dashboard 的 Logs。

