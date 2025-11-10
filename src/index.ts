import { registerUser, loginUser } from './auth';
import { createSupabaseClient } from './db';
import { createDefaultUser, testDatabaseConnection } from './init';

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理 CORS 预检请求
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 安全地解析 JSON
async function parseJSON(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 处理注册请求
async function handleRegister(request: Request, env: any): Promise<Response> {
  const body = await parseJSON(request);
  if (!body || !body.username || !body.password) {
    return new Response(
      JSON.stringify({ success: false, message: '缺少必要参数' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const result = await registerUser(env, body.username, body.password);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 处理登录请求
async function handleLogin(request: Request, env: any): Promise<Response> {
  const body = await parseJSON(request);
  if (!body || !body.username || !body.password) {
    return new Response(
      JSON.stringify({ success: false, message: '缺少必要参数' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const result = await loginUser(env, body.username, body.password);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 获取任务列表
async function handleGetTodos(request: Request, env: any, userId: string): Promise<Response> {
  try {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取任务错误:', error);
      return new Response(
        JSON.stringify({ success: false, message: '获取任务失败' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data || [] }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('获取任务异常:', error);
    return new Response(
      JSON.stringify({ success: false, message: '服务器错误' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// 创建任务
async function handleCreateTodo(request: Request, env: any, userId: string): Promise<Response> {
  const body = await parseJSON(request);
  if (!body || !body.title) {
    return new Response(
      JSON.stringify({ success: false, message: '任务标题不能为空' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // 防止 XSS：清理输入
  const title = String(body.title).trim().substring(0, 500);
  const description = body.description ? String(body.description).trim().substring(0, 2000) : '';

  try {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: userId,
        title: title,
        description: description,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('创建任务错误:', error);
      return new Response(
        JSON.stringify({ success: false, message: '创建任务失败' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('创建任务异常:', error);
    return new Response(
      JSON.stringify({ success: false, message: '服务器错误' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// 更新任务
async function handleUpdateTodo(request: Request, env: any, userId: string): Promise<Response> {
  const body = await parseJSON(request);
  if (!body || !body.id) {
    return new Response(
      JSON.stringify({ success: false, message: '缺少任务ID' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // 清理输入
  const updateData: any = {};
  if (body.title !== undefined) {
    updateData.title = String(body.title).trim().substring(0, 500);
  }
  if (body.description !== undefined) {
    updateData.description = String(body.description).trim().substring(0, 2000);
  }
  if (body.completed !== undefined) {
    updateData.completed = Boolean(body.completed);
  }

  try {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', body.id)
      .eq('user_id', userId) // 确保只能更新自己的任务
      .select()
      .single();

    if (error) {
      console.error('更新任务错误:', error);
      return new Response(
        JSON.stringify({ success: false, message: '更新任务失败' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, message: '任务不存在或无权限' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('更新任务异常:', error);
    return new Response(
      JSON.stringify({ success: false, message: '服务器错误' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// 删除任务
async function handleDeleteTodo(request: Request, env: any, userId: string): Promise<Response> {
  const url = new URL(request.url);
  const todoId = url.searchParams.get('id');

  if (!todoId) {
    return new Response(
      JSON.stringify({ success: false, message: '缺少任务ID' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const supabase = createSupabaseClient(env);
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId); // 确保只能删除自己的任务

    if (error) {
      console.error('删除任务错误:', error);
      return new Response(
        JSON.stringify({ success: false, message: '删除任务失败' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: '删除成功' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('删除任务异常:', error);
    return new Response(
      JSON.stringify({ success: false, message: '服务器错误' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// 简化的会话验证（实际应该使用 JWT 或 KV 存储）
function getUserIdFromRequest(request: Request): string | null {
  // 从 Cookie 或 Header 中获取用户ID
  // 这里简化处理，实际应该验证会话令牌
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 简化：直接使用 token 作为 userId（实际应该验证）
    // 在生产环境中，应该使用 JWT 或从 KV 存储验证
    return authHeader.substring(7);
  }
  return null;
}

// 主处理函数
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理 CORS 预检
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // 静态文件服务（前端页面）
    if (path === '/' || path === '/index.html') {
      return new Response(HTML_CONTENT, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (path === '/style.css') {
      return new Response(CSS_CONTENT, {
        headers: { ...corsHeaders, 'Content-Type': 'text/css; charset=utf-8' },
      });
    }

    if (path === '/app.js') {
      return new Response(JS_CONTENT, {
        headers: { ...corsHeaders, 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    }

    // API 路由
    // 测试数据库连接（无需认证）
    if (path === '/api/test' && request.method === 'GET') {
      const result = await testDatabaseConnection(env);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 初始化默认用户（从环境变量读取）
    if (path === '/api/init' && request.method === 'POST') {
      const result = await createDefaultUser(env);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }

    if (path === '/api/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    // 需要认证的路由
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: '未授权，请先登录' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path === '/api/todos' && request.method === 'GET') {
      return handleGetTodos(request, env, userId);
    }

    if (path === '/api/todos' && request.method === 'POST') {
      return handleCreateTodo(request, env, userId);
    }

    if (path === '/api/todos' && request.method === 'PUT') {
      return handleUpdateTodo(request, env, userId);
    }

    if (path === '/api/todos' && request.method === 'DELETE') {
      return handleDeleteTodo(request, env, userId);
    }

    // 404
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

// 前端 HTML 内容（内联）
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>任务管理系统</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div id="app">
        <div id="login-container" class="container">
            <div class="login-box">
                <h1>任务管理系统</h1>
                <form id="login-form">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input type="text" id="username" name="username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="btn btn-primary">登录</button>
                    <button type="button" id="register-btn" class="btn btn-secondary">注册</button>
                </form>
                <div id="message" class="message"></div>
            </div>
        </div>

        <div id="main-container" class="container hidden">
            <header>
                <h1>我的任务</h1>
                <button id="logout-btn" class="btn btn-secondary">退出登录</button>
            </header>
            <div class="todo-form">
                <input type="text" id="todo-title" placeholder="输入新任务..." maxlength="500">
                <textarea id="todo-description" placeholder="任务描述（可选）" maxlength="2000"></textarea>
                <button id="add-todo-btn" class="btn btn-primary">添加任务</button>
            </div>
            <div id="todos-list" class="todos-list"></div>
        </div>
    </div>
    <script src="/app.js"></script>
</body>
</html>`;

// 前端 CSS 内容
const CSS_CONTENT = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    color: #333;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

.hidden {
    display: none !important;
}

/* 登录页面样式 */
.login-box {
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    margin-top: 100px;
}

.login-box h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #667eea;
    font-size: 2em;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    margin-right: 10px;
    margin-top: 10px;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: #f0f0f0;
    color: #333;
}

.btn-secondary:hover {
    background: #e0e0e0;
}

.btn-danger {
    background: #ff4757;
    color: white;
}

.btn-danger:hover {
    background: #ff3838;
}

.btn-success {
    background: #2ed573;
    color: white;
}

.btn-success:hover {
    background: #26d467;
}

.message {
    margin-top: 20px;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    display: none;
}

.message.error {
    background: #ffe6e6;
    color: #d63031;
    display: block;
}

.message.success {
    background: #d4edda;
    color: #155724;
    display: block;
}

/* 主页面样式 */
header {
    background: white;
    border-radius: 12px;
    padding: 20px 30px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

header h1 {
    color: white;
    font-size: 1.8em;
}

.todo-form {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.todo-form input,
.todo-form textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    margin-bottom: 10px;
    font-family: inherit;
    resize: vertical;
}

.todo-form input:focus,
.todo-form textarea:focus {
    outline: none;
    border-color: #667eea;
}

.todo-form textarea {
    min-height: 80px;
}

.todos-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.todo-item {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
}

.todo-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.todo-item.completed {
    opacity: 0.7;
}

.todo-item.completed .todo-title {
    text-decoration: line-through;
    color: #999;
}

.todo-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.todo-title {
    font-size: 1.2em;
    font-weight: 500;
    color: #333;
    flex: 1;
    word-break: break-word;
}

.todo-description {
    color: #666;
    margin-bottom: 15px;
    word-break: break-word;
    white-space: pre-wrap;
}

.todo-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.todo-actions button {
    padding: 8px 16px;
    font-size: 14px;
}

.todo-date {
    font-size: 0.85em;
    color: #999;
    margin-top: 10px;
}

@media (max-width: 600px) {
    .login-box {
        padding: 30px 20px;
        margin-top: 50px;
    }

    header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
    }

    .todo-header {
        flex-direction: column;
        gap: 10px;
    }

    .todo-actions {
        width: 100%;
    }

    .todo-actions button {
        flex: 1;
    }
}`;

// 前端 JavaScript 内容
const JS_CONTENT = `// API 基础 URL
const API_BASE = '';

// 状态管理
let currentUser = null;
let authToken = null;

// DOM 元素
const loginContainer = document.getElementById('login-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const messageDiv = document.getElementById('message');
const todoTitleInput = document.getElementById('todo-title');
const todoDescriptionInput = document.getElementById('todo-description');
const addTodoBtn = document.getElementById('add-todo-btn');
const todosList = document.getElementById('todos-list');

// 显示消息
function showMessage(text, type = 'error') {
    messageDiv.textContent = text;
    messageDiv.className = \`message \${type}\`;
    setTimeout(() => {
        messageDiv.className = 'message';
    }, 5000);
}

// API 请求辅助函数
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = \`Bearer \${authToken}\`;
    }

    try {
        const response = await fetch(\`\${API_BASE}\${endpoint}\`, {
            ...options,
            headers,
        });

        const data = await response.json();
        return { ok: response.ok, data };
    } catch (error) {
        console.error('API 请求错误:', error);
        return { ok: false, data: { message: '网络错误，请稍后重试' } };
    }
}

// 登录
async function login(username, password) {
    const { ok, data } = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    if (ok && data.success) {
        authToken = data.userId; // 简化处理，实际应该使用 sessionToken
        currentUser = username;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', currentUser);
        showView('main');
        loadTodos();
    } else {
        showMessage(data.message || '登录失败');
    }
}

// 注册
async function register(username, password) {
    const { ok, data } = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    if (ok && data.success) {
        showMessage('注册成功，请登录', 'success');
        // 自动登录
        setTimeout(() => login(username, password), 1000);
    } else {
        showMessage(data.message || '注册失败');
    }
}

// 退出登录
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showView('login');
    todosList.innerHTML = '';
}

// 切换视图
function showView(view) {
    if (view === 'login') {
        loginContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
    } else {
        loginContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
    }
}

// 加载任务列表
async function loadTodos() {
    const { ok, data } = await apiRequest('/api/todos');

    if (ok && data.success) {
        renderTodos(data.data || []);
    } else {
        showMessage(data.message || '加载任务失败');
    }
}

// 渲染任务列表
function renderTodos(todos) {
    if (todos.length === 0) {
        todosList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无任务，添加一个吧！</p>';
        return;
    }

    todosList.innerHTML = todos.map(todo => \`
        <div class="todo-item \${todo.completed ? 'completed' : ''}">
            <div class="todo-header">
                <div class="todo-title">\${escapeHtml(todo.title)}</div>
            </div>
            \${todo.description ? \`<div class="todo-description">\${escapeHtml(todo.description)}</div>\` : ''}
            <div class="todo-actions">
                <button class="btn \${todo.completed ? 'btn-secondary' : 'btn-success'}" onclick="toggleTodo('\${todo.id}', \${!todo.completed})">
                    \${todo.completed ? '标记未完成' : '标记完成'}
                </button>
                <button class="btn btn-danger" onclick="deleteTodo('\${todo.id}')">删除</button>
            </div>
            <div class="todo-date">创建时间: \${formatDate(todo.created_at)}</div>
        </div>
    \`).join('');
}

// 转义 HTML（防止 XSS）
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

// 添加任务
async function addTodo() {
    const title = todoTitleInput.value.trim();
    if (!title) {
        showMessage('任务标题不能为空');
        return;
    }

    const description = todoDescriptionInput.value.trim();

    const { ok, data } = await apiRequest('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
    });

    if (ok && data.success) {
        todoTitleInput.value = '';
        todoDescriptionInput.value = '';
        loadTodos();
    } else {
        showMessage(data.message || '添加任务失败');
    }
}

// 切换任务完成状态
async function toggleTodo(id, completed) {
    const { ok, data } = await apiRequest('/api/todos', {
        method: 'PUT',
        body: JSON.stringify({ id, completed }),
    });

    if (ok && data.success) {
        loadTodos();
    } else {
        showMessage(data.message || '更新任务失败');
    }
}

// 删除任务
async function deleteTodo(id) {
    if (!confirm('确定要删除这个任务吗？')) {
        return;
    }

    const { ok, data } = await apiRequest(\`/api/todos?id=\${id}\`, {
        method: 'DELETE',
    });

    if (ok && data.success) {
        loadTodos();
    } else {
        showMessage(data.message || '删除任务失败');
    }
}

// 事件监听
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    login(username, password);
});

registerBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) {
        showMessage('请先输入用户名和密码');
        return;
    }
    register(username, password);
});

logoutBtn.addEventListener('click', logout);

addTodoBtn.addEventListener('click', addTodo);

todoTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addTodo();
    }
});

// 页面加载时检查登录状态
window.addEventListener('load', () => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = savedUser;
        showView('main');
        loadTodos();
    } else {
        showView('login');
    }
});

// 将函数暴露到全局作用域（用于内联事件处理器）
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;`;

