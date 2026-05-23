-- we-aigo 省省钱币激励系统 - 数据库初始化SQL
-- 请在Supabase后台 (https://supabase.com/dashboard) 的SQL Editor中执行

-- 1. 创建省钱币交易记录表
CREATE TABLE IF NOT EXISTS token_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  related_task_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建省钱币兑换记录表
CREATE TABLE IF NOT EXISTS token_redemptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  item_name VARCHAR(100) NOT NULL,
  cost INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 为token_transactions表添加RLS策略（可选）
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- 允许service_role访问（如果需要）
-- CREATE POLICY "Service role can do anything" ON token_transactions
--   FOR ALL USING (auth.role() = 'service_role');

-- 4. 为token_redemptions表添加RLS策略（可选）
ALTER TABLE token_redemptions ENABLE ROW LEVEL SECURITY;

-- 验证表是否创建成功
SELECT 'token_transactions' as table_name, COUNT(*) as columns 
FROM information_schema.columns 
WHERE table_name = 'token_transactions';
