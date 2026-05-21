-- 巡检系统数据库表
-- 在 Supabase Dashboard -> SQL Editor 中执行

-- 1. 创建 inspections 表（记录巡检结果）
CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    checks JSONB NOT NULL DEFAULT '[]',
    total_checks INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE inspections IS '平台巡检结果记录表';
COMMENT ON COLUMN inspections.checks IS '巡检项列表，格式: [{name, status, detail}]';
COMMENT ON COLUMN inspections.total_checks IS '总检查项数量';
COMMENT ON COLUMN inspections.passed IS '通过数量';
COMMENT ON COLUMN inspections.failed IS '失败数量';

-- 2. 创建索引（按时间倒序查询）
CREATE INDEX IF NOT EXISTS idx_inspections_run_at ON inspections(run_at DESC);

-- 3. 开启RLS（行级安全策略）
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- 4. 允许匿名读取（管理员页面需要）
CREATE POLICY "Allow anonymous read" ON inspections
    FOR SELECT USING (true);

-- 5. 允许service_role写入（Worker需要）
CREATE POLICY "Allow service role insert" ON inspections
    FOR INSERT WITH CHECK (true);
