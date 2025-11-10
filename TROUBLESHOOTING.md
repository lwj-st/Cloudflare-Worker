# 故障排除指南

## 常见错误及解决方案

### ❌ 错误：服务器错误，请稍后重试

这个错误可能有多种原因，请按以下步骤排查：

#### 1. 检查环境变量是否配置

**问题**：`SUPABASE_URL` 或 `SUPABASE_ANON_KEY` 未设置

**解决**：
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages → 你的 Worker → Settings → Variables
3. 确认以下环境变量已正确配置：
   - `SUPABASE_URL` = `https://zjjllyrxjjsqhemezuwn.supabase.co`
   - `SUPABASE_ANON_KEY` = 你的 anon key
4. 重新部署 Worker

#### 2. 检查数据库表是否创建

**问题**：数据库表 `users` 或 `todos` 不存在

**错误信息**：`数据库表不存在，请先执行 supabase-init.sql 创建表`

**解决**：
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行 `supabase-init.sql` 中的所有 SQL 语句
4. 确认表已创建（应该看到 `users` 和 `todos` 两个表）

#### 3. 检查 RLS 策略配置

**问题**：Row Level Security (RLS) 策略阻止了访问

**错误信息**：`数据库权限错误，请检查 RLS 策略配置`

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

#### 4. 检查网络连接

**问题**：无法连接到 Supabase

**错误信息**：`无法连接到数据库，请检查网络连接`

**解决**：
1. 检查 Supabase 项目状态是否正常
2. 检查 Supabase URL 是否正确
3. 查看 Supabase Dashboard 的 Logs 查看详细错误

#### 5. 查看 Worker 日志

**步骤**：
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages → 你的 Worker
3. 点击 **Logs** 标签页
4. 查看实时日志了解详细错误信息

### ❌ 错误：用户名或密码错误

**可能原因**：
1. 用户名或密码输入错误
2. 用户不存在
3. 密码哈希不匹配

**解决**：
1. 确认用户名和密码正确
2. 如果忘记密码，可以重新注册新用户
3. 或使用 `/api/init` 创建默认用户

### ❌ 错误：用户名已存在

**问题**：尝试注册的用户名已被使用

**解决**：使用其他用户名注册

## 测试步骤

### 1. 测试数据库连接

```bash
curl https://your-worker.workers.dev/api/test
```

**预期响应**：
```json
{
  "success": true,
  "message": "数据库连接正常"
}
```

如果失败，检查：
- 环境变量是否配置
- 数据库表是否创建
- RLS 策略是否正确

### 2. 创建默认用户

```bash
curl -X POST https://your-worker.workers.dev/api/init \
  -H "Content-Type: application/json"
```

**预期响应**：
```json
{
  "success": true,
  "message": "默认用户创建成功",
  "username": "admin"
}
```

### 3. 测试登录

```bash
curl -X POST https://your-worker.workers.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 检查清单

在报告问题前，请确认：

- [ ] 环境变量 `SUPABASE_URL` 已配置
- [ ] 环境变量 `SUPABASE_ANON_KEY` 已配置
- [ ] 数据库表 `users` 和 `todos` 已创建
- [ ] RLS 策略已正确配置
- [ ] Worker 已重新部署
- [ ] 已查看 Worker 日志了解详细错误

## 获取帮助

如果问题仍然存在：

1. 查看 Cloudflare Worker 日志
2. 查看 Supabase Dashboard 的 Logs
3. 检查浏览器控制台的网络请求详情
4. 确认所有配置步骤都已正确完成

