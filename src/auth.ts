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
      
      // 检查是否是表不存在
      if (insertError.code === 'PGRST116' || insertError.message.includes('relation') || insertError.message.includes('does not exist')) {
        return { success: false, message: '数据库表不存在，请先执行 supabase-init.sql 创建表' };
      }
      
      // 检查是否是权限问题
      if (insertError.code === 'PGRST301' || insertError.message.includes('permission') || insertError.message.includes('policy')) {
        return { success: false, message: '数据库权限错误，请检查 RLS 策略配置' };
      }
      
      // 检查是否是唯一约束冲突
      if (insertError.code === '23505' || insertError.message.includes('unique')) {
        return { success: false, message: '用户名已存在' };
      }
      
      return { success: false, message: `注册失败: ${insertError.message}` };
    }

    return { success: true, message: '注册成功', userId: newUser.id };
  } catch (error) {
    console.error('注册异常:', error);
    
    // 检查是否是环境变量问题
    if (error instanceof Error && error.message.includes('环境变量必须设置')) {
      return { success: false, message: '服务器配置错误：数据库连接信息未设置' };
    }
    
    // 检查是否是数据库连接问题
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      return { success: false, message: '无法连接到数据库，请检查网络连接' };
    }
    
    return { 
      success: false, 
      message: '服务器错误，请稍后重试'
    };
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

    if (queryError) {
      console.error('查询用户错误:', queryError);
      
      // 检查是否是表不存在
      if (queryError.code === 'PGRST116' || queryError.message.includes('relation') || queryError.message.includes('does not exist')) {
        return { success: false, message: '数据库表不存在，请先执行 supabase-init.sql 创建表' };
      }
      
      // 检查是否是权限问题
      if (queryError.code === 'PGRST301' || queryError.message.includes('permission') || queryError.message.includes('policy')) {
        return { success: false, message: '数据库权限错误，请检查 RLS 策略配置' };
      }
      
      // 其他数据库错误
      return { success: false, message: `数据库错误: ${queryError.message}` };
    }
    
    if (!user) {
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
    
    // 检查是否是环境变量问题
    if (error instanceof Error && error.message.includes('环境变量必须设置')) {
      return { success: false, message: '服务器配置错误：数据库连接信息未设置' };
    }
    
    // 检查是否是数据库连接问题
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      return { success: false, message: '无法连接到数据库，请检查网络连接' };
    }
    
    // 其他错误返回通用消息
    return { 
      success: false, 
      message: '服务器错误，请稍后重试'
    };
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

