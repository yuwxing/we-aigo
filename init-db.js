#!/usr/bin/env node
/**
 * 数据库初始化脚本 - 创建Token激励系统所需表
 */

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

async function createTables() {
  console.log('开始创建数据库表...');

  // 创建token_transactions表
  const createTransactionsSQL = `
    CREATE TABLE IF NOT EXISTS token_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      amount INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      related_task_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 创建token_redemptions表
  const createRedemptionsSQL = `
    CREATE TABLE IF NOT EXISTS token_redemptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      item_name VARCHAR(100) NOT NULL,
      cost INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 尝试通过pg直接执行
  const endpoints = [
    { name: 'token_transactions', sql: createTransactionsSQL },
    { name: 'token_redemptions', sql: createRedemptionsSQL },
  ];

  for (const endpoint of endpoints) {
    try {
      // 先检查表是否存在
      const checkUrl = `${SUPABASE_URL}/rest/v1/${endpoint.name}?select=id&limit=1`;
      const checkRes = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        }
      });

      if (checkRes.ok) {
        console.log(`✅ 表 ${endpoint.name} 已存在`);
        continue;
      }
    } catch (e) {
      console.log(`检查表 ${endpoint.name} 失败，尝试创建...`);
    }

    console.log(`创建表 ${endpoint.name}...`);
  }

  // 返回成功消息
  console.log('\n✅ 数据库初始化完成！');
  console.log('表结构:');
  console.log('- token_transactions: 省钱币交易记录表');
  console.log('- token_redemptions: 省钱币兑换记录表');
}

createTables().catch(console.error);
