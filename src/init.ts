// 初始化默认用户功能
import { createSupabaseClient } from './db';

// 哈希密码（与 auth.ts 中的一致）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 创建默认用户
export async function createDefaultUser(
  env: any
): Promise<{ success: boolean; message: string; username?: string }> {
  // 从环境变量读取默认用户名和密码（如果未设置则使用默认值）
  const username = env.DEFAULT_USERNAME || 'admin';
  const password = env.DEFAULT_PASSWORD || 'admin123';
  try {
    const supabase = createSupabaseClient(env);

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (existingUser) {
    return {
      success: true,
      message: `用户 "${username}" 已存在`,
      username: username,
    };
    }

    // 创建新用户
    const passwordHash = await hashPassword(password);
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username: username,
        password_hash: passwordHash,
      })
      .select('id, username')
      .single();

    if (insertError) {
      console.error('创建默认用户错误:', insertError);
      return {
        success: false,
        message: `创建用户失败: ${insertError.message}`,
      };
    }

    return {
      success: true,
      message: '默认用户创建成功',
      username: username,
    };
  } catch (error) {
    console.error('创建默认用户异常:', error);
    return {
      success: false,
      message: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

// 测试数据库连接（简单测试）
export async function testDatabaseConnection(env: any): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = createSupabaseClient(env);
    // 简单查询测试连接
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      return {
        success: false,
        message: `连接失败: ${error.message}`,
      };
    }

    return {
      success: true,
      message: '数据库连接正常',
    };
  } catch (error) {
    return {
      success: false,
      message: `连接异常: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

