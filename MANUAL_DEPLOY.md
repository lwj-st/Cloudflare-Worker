# 手动部署指南

## 方式一：通过 Cloudflare Dashboard 连接 GitHub（推荐，最简单）⭐

**无需命令行，无需手动登录，环境变量在 Dashboard 中直接配置！**

详细步骤请查看：[DASHBOARD_DEPLOY.md](./DASHBOARD_DEPLOY.md)

---

## 方式二：使用 Wrangler CLI（需要命令行）

### 前置要求

1. 安装 Node.js 18+
2. 拥有 Cloudflare 账号

### 步骤

#### 1. 安装依赖

```bash
npm install
```

#### 2. 登录 Cloudflare

```bash
npx wrangler login
```

这会打开浏览器，让你授权 Wrangler 访问你的 Cloudflare 账号。

#### 3. 设置环境变量

```bash
# 设置 Supabase URL
npx wrangler secret put SUPABASE_URL
# 然后粘贴你的 Supabase URL，例如: https://xxxxx.supabase.co

# 设置 Supabase Anon Key
npx wrangler secret put SUPABASE_ANON_KEY
# 然后粘贴你的 Supabase anon key
```

#### 4. 部署

```bash
npm run deploy
```

或者直接：

```bash
npx wrangler deploy
```

#### 5. 验证部署

部署成功后，你会看到类似这样的输出：

```
✨  Compiled Worker successfully
✨  Successfully published your Worker to the following routes:
  - cf-worker-todo-app.your-subdomain.workers.dev
```

访问这个 URL 即可使用你的应用。

---

## 方式二：通过 Cloudflare Dashboard 上传

### 步骤

#### 1. 准备部署文件

首先需要构建项目。由于 Cloudflare Workers 使用 TypeScript，我们需要确保代码可以运行。

实际上，Cloudflare Dashboard 支持直接上传源代码，但更推荐使用 Wrangler CLI。

如果你想手动上传：

#### 2. 在 Cloudflare Dashboard 中

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create application** → **Worker**
4. 填写：
   - **Worker name**: `cf-worker-todo-app`（或你喜欢的名字）
   - **HTTP handler**: 选择 **Create Worker**
5. 点击 **Deploy**

#### 3. 上传代码

在 Worker 编辑器中，你需要：

1. 将所有 `src/` 目录下的文件内容合并或分别上传
2. 或者使用 **Upload file** 功能上传整个项目

**注意**：这种方式比较复杂，因为需要处理依赖和构建。

#### 4. 设置环境变量

1. 在 Worker 页面，进入 **Settings** → **Variables**
2. 添加环境变量：
   - **Variable name**: `SUPABASE_URL`
   - **Value**: 你的 Supabase URL
3. 再添加：
   - **Variable name**: `SUPABASE_ANON_KEY`
   - **Value**: 你的 Supabase anon key

#### 5. 保存并部署

点击 **Save and Deploy**

---

## 方式三：使用 Cloudflare Pages（不推荐用于 Workers）

如果你看到的是 Cloudflare Pages 的构建日志，那说明可能配置错了。

**Cloudflare Pages** 和 **Cloudflare Workers** 是不同的服务：

- **Workers**: 用于运行服务器端代码（API、边缘计算）
- **Pages**: 用于部署静态网站和 JAMstack 应用

这个项目是 **Workers** 项目，应该使用 **方式一（Wrangler CLI）** 部署。

如果你确实想使用 Pages，需要：
1. 构建静态文件（但这个项目是动态的 Worker）
2. 配置构建命令和输出目录

**不推荐**，因为 Workers 更适合这个项目。

---

## 常见问题

### Q: 部署时提示 "Authentication error"

**A**: 需要先登录：
```bash
npx wrangler login
```

### Q: 部署时提示环境变量未设置

**A**: 需要设置环境变量：
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

### Q: 如何更新已部署的 Worker？

**A**: 直接再次运行 `npm run deploy`，会自动更新。

### Q: 如何查看 Worker 日志？

**A**: 
1. 在 Cloudflare Dashboard → Workers & Pages → 选择你的 Worker
2. 进入 **Logs** 标签页
3. 或者使用命令行：`npx wrangler tail`

### Q: 如何删除 Worker？

**A**: 
```bash
npx wrangler delete cf-worker-todo-app
```

或在 Dashboard 中删除。

---

## 推荐流程

对于手动部署，**强烈推荐使用方式一（Wrangler CLI）**：

1. ✅ 最简单
2. ✅ 支持环境变量管理
3. ✅ 可以本地测试
4. ✅ 支持版本管理
5. ✅ 可以查看实时日志

只需三个命令：
```bash
npm install
npx wrangler login
npm run deploy
```

（记得先设置环境变量）

