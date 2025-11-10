import { createSupabaseClient } from './db';

// 使用 Web Crypto API 进行密码哈希（bcrypt 在 Worker 中不可用）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 验证密码
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 生成安全的会话令牌
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 用户注册
export async function registerUser(
  env: any,
  username: string,
  password: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  // 输入验证
  if (!username || username.length < 3 || username.length > 50) {
    return { success: false, message: '用户名长度必须在 3-50 个字符之间' };
  }

  if (!password || password.length < 6) {
    return { success: false, message: '密码长度至少为 6 个字符' };
  }

  // 防止 SQL 注入：验证用户名只包含允许的字符
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, message: '用户名只能包含字母、数字和下划线' };
  }

  try {
    const supabase = createSupabaseClient(env);

    // 检查用户名是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return { success: false, message: '用户名已存在' };
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 插入新用户
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username: username,
        password_hash: passwordHash,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('注册错误:', insertError);
      return { success: false, message: '注册失败，请稍后重试' };
    }

    return { success: true, message: '注册成功', userId: newUser.id };
  } catch (error) {
    console.error('注册异常:', error);
    return { success: false, message: '服务器错误，请稍后重试' };
  }
}

// 用户登录
export async function loginUser(
  env: any,
  username: string,
  password: string
): Promise<{ success: boolean; message: string; sessionToken?: string; userId?: string }> {
  // 输入验证
  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' };
  }

  try {
    const supabase = createSupabaseClient(env);

    // 查询用户
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (queryError || !user) {
      // 即使用户不存在，也返回相同的错误信息，防止用户枚举攻击
      return { success: false, message: '用户名或密码错误' };
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, message: '用户名或密码错误' };
    }

    // 生成会话令牌
    const sessionToken = generateSessionToken();

    // 将会话令牌存储到 KV（如果配置了）或使用 JWT
    // 这里简化处理，实际生产环境应该使用更安全的会话管理
    return {
      success: true,
      message: '登录成功',
      sessionToken: sessionToken,
      userId: user.id,
    };
  } catch (error) {
    console.error('登录异常:', error);
    return { success: false, message: '服务器错误，请稍后重试' };
  }
}

// 验证会话令牌（简化版，实际应该从 KV 或数据库验证）
export async function verifySession(
  env: any,
  sessionToken: string
): Promise<{ valid: boolean; userId?: string }> {
  // 这里应该从 KV 存储或数据库验证会话
  // 为了简化，这里返回 false，实际实现需要存储会话信息
  return { valid: false };
}

