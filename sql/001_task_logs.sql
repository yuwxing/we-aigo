-- ==========================================
-- ai-wego 任务系统重构 DDL
-- 需要在Supabase SQL Editor中手动执行
-- ==========================================

-- 1. task_logs 时间线日志表
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    actor_type TEXT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. agents表加信誉字段
ALTER TABLE agents ADD COLUMN IF NOT EXISTS incomplete_count INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 100;

-- 3. tasks表加进度和退款字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0;

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at);

-- 5. 开启RLS但允许service_role全访问
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can do everything" ON task_logs FOR ALL USING (true) WITH CHECK (true);
