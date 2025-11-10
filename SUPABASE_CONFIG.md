# Supabase 认证配置说明

## 需要的认证信息

系统需要以下两个 Supabase 认证信息：

### 1. SUPABASE_URL

**格式**：`https://[project-ref].supabase.co`

**获取方式**：
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 在 **Project URL** 部分找到 URL

**示例**：
```
https://abcdefghijklmnop.supabase.co
```

### 2. SUPABASE_ANON_KEY

**格式**：JWT 格式的长字符串

**获取方式**：
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 在 **Project API keys** 部分找到 **anon public** key

**示例**：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 配置方式

### 方式一：使用环境变量（推荐，安全）

#### 在 Cloudflare Worker 中设置：

```bash
# 使用 Wrangler CLI
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

#### 在 Cloudflare Dashboard 中设置：

1. 进入 **Workers & Pages** → 选择你的 Worker
2. 进入 **Settings** → **Variables**
3. 添加环境变量：
   - 变量名：`SUPABASE_URL`，值：你的 Supabase URL
   - 变量名：`SUPABASE_ANON_KEY`，值：你的 anon key

### 方式二：在代码中配置（仅用于开发测试，不安全）

⚠️ **警告**：这种方式会将密钥写入代码，不建议用于生产环境！

编辑 `wrangler.toml`：

```toml
[vars]
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key-here"
```

## 安全说明

### 为什么使用 anon key？

- **anon key** 是公开的，可以在客户端使用
- 它受到 **Row Level Security (RLS)** 策略保护
- 即使泄露，攻击者也无法绕过 RLS 策略访问其他用户的数据

### 安全建议

1. ✅ **使用环境变量**存储密钥，不要提交到 Git
2. ✅ **启用 RLS**（Row Level Security）保护数据
3. ✅ **定期轮换**密钥（在 Supabase Dashboard 中）
4. ❌ **不要**使用 **service_role key**（拥有完全权限，非常危险）
5. ❌ **不要**将密钥硬编码在代码中

## 验证配置

配置完成后，可以通过以下方式验证：

1. **本地测试**：
   ```bash
   npm run dev
   ```
   访问 `http://localhost:8787`，尝试注册和登录

2. **查看日志**：
   - 如果配置错误，会在浏览器控制台或 Worker 日志中看到错误信息
   - 检查 Supabase Dashboard 的 **Logs** 查看数据库请求

3. **测试 API**：
   ```bash
   curl -X POST https://your-worker.workers.dev/api/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test123"}'
   ```

## 常见问题

### Q: 可以使用 service_role key 吗？

**A**: 不推荐。service_role key 拥有完全权限，可以绕过所有安全策略。只有在服务器端需要完全控制时才使用，并且要非常小心。

### Q: anon key 泄露了怎么办？

**A**: 
1. 在 Supabase Dashboard 中重新生成新的 anon key
2. 更新所有使用该 key 的环境变量
3. 旧的 key 会立即失效

### Q: 需要配置其他 Supabase 功能吗？

**A**: 对于这个任务管理系统，只需要：
- Project URL
- anon key
- 创建好的数据库表（users 和 todos）

不需要配置：
- Supabase Auth（我们使用自定义认证）
- Storage
- Realtime
- Edge Functions

## 相关链接

- [Supabase 文档](https://supabase.com/docs)
- [Supabase API 密钥说明](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

