import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const SUPABASE_URL = 'https://rfwxdskegndvoqwtawkl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3hkc2tlZ25kdm9xd3Rhd2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE1MzgxNCwiZXhwIjoyMDU5NzI5ODE0fQ.wV2pDlMVe4CgQJH0j5L3sS3m1dPx0X7YVZL5Bq4qH9k';

export default function AdminCompensatePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const userId = parseInt(searchParams.get('user_id') || '18');
  const amount = parseInt(searchParams.get('amount') || '11000');
  const key = searchParams.get('key');
  const desc = searchParams.get('desc') || '平台问题综合赔付';

  useEffect(() => {
    if (key === 'huaxianzi2026' && status === 'idle') {
      executeCompensate();
    }
  }, []);

  if (key !== 'huaxianzi2026') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div><div>鉴权失败</div></div>
      </div>
    );
  }

  async function executeCompensate() {
    setStatus('loading');
    try {
      const headers = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
      const userResp = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=token_balance`, { headers });
      if (!userResp.ok) throw new Error(`读取余额失败: ${userResp.status} ${await userResp.text()}`);
      const users = await userResp.json();
      const currentBalance = Array.isArray(users) && users.length > 0 ? (users[0].token_balance || 0) : 0;
      const newBalance = currentBalance + amount;

      const updateResp = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ token_balance: newBalance })
      });
      if (!updateResp.ok) throw new Error(`更新余额失败: ${updateResp.status} ${await updateResp.text()}`);

      await fetch(`${SUPABASE_URL}/rest/v1/token_transactions`, {
        method: 'POST', headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ user_id: userId, amount, type: 'compensation', description: desc, related_task_id: null, created_at: new Date().toISOString() })
      });

      setResult({ userId, previousBalance: currentBalance, added: amount, newBalance });
      setStatus('success');
    } catch (e: any) {
      setResult({ error: e.message });
      setStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: 24, color: 'white', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>🔧 管理员赔付</h1>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>用户ID: <strong>{userId}</strong></div>
        <div style={{ marginBottom: 8 }}>赔付金额: <strong style={{ color: '#22c55e' }}>+{amount} 省钱币</strong></div>
        <div>原因: {desc}</div>
      </div>
      {status === 'loading' && <div style={{ textAlign: 'center', padding: 20 }}><div style={{ fontSize: 24 }}>⏳</div><div style={{ marginTop: 8 }}>正在执行...</div></div>}
      {status === 'success' && result && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 20, marginBottom: 12 }}>✅ 赔付成功！</div>
          <div>原余额: {result.previousBalance}</div>
          <div>增加: +{result.added}</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#22c55e', marginTop: 8 }}>新余额: {result.newBalance}</div>
        </div>
      )}
      {status === 'error' && result && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 20, marginBottom: 12 }}>❌ 赔付失败</div><div style={{ wordBreak: 'break-all' }}>{result.error}</div>
          <button onClick={executeCompensate} style={{ marginTop: 12, padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>重试</button>
        </div>
      )}
    </div>
  );
}
