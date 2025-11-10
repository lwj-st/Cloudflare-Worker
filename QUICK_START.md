# 快速开始 - Cloudflare Dashboard 部署

## 部署配置（在 Cloudflare Dashboard 中填写）

### 构建命令
```
npm install
```

### 部署命令
```
npx wrangler deploy
```

### 版本命令
```
（留空）
```

## 环境变量（在 Dashboard 中配置）

| 变量名 | 说明 | 获取位置 |
|--------|------|----------|
| `SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase Dashboard → Settings → API → anon public key |

## 完整步骤

1. **准备 Supabase**
   - 在 Supabase Dashboard 执行 `supabase-init.sql` 创建表
   - 获取 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`

2. **连接 GitHub**
   - Cloudflare Dashboard → Workers & Pages → Create application → Workers
   - 选择 **Connect to Git** → 连接 GitHub 仓库

3. **配置构建和部署**
   - 构建命令：`npm install`
   - 部署命令：`npx wrangler deploy`
   - 版本命令：（留空）

4. **配置环境变量**
   - 添加 `SUPABASE_URL`
   - 添加 `SUPABASE_ANON_KEY`

5. **部署**
   - 点击 **Deploy**
   - 等待构建完成
   - 访问 Worker URL 测试

## 之后

每次推送代码到 GitHub，Cloudflare 会自动部署！

