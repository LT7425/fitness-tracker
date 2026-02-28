// Supabase配置文件
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseKey)

// 数据库表名常量
export const TABLES = {
  ROLES: 'roles',
  DAILY_RECORDS: 'daily_records'
}

// 导出Supabase实例
export default supabase
