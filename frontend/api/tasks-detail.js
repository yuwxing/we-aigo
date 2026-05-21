// Task detail + actions - proxy to backend with Supabase fallback
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29pZWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxNzUwODgxNjQyLCJpYXQiOjE3NDgxMDM2NDJ9.KqP_XGbXFMGbzZsBq-0T1vVBLbMlGKZF8L7oWDjD0Wg';

async function querySupabase(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

async function updateSupabase(table, filter, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse URL: /api/tasks-detail/{id} or /api/tasks-detail/{id}/match etc.
    const pathParts = req.url.split('/').filter(Boolean);
    let taskId = null;
    let action = null;
    
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'tasks-detail' && pathParts[i+1]) {
        taskId = parseInt(pathParts[i+1]);
        action = pathParts[i+2] || null; // 'match', 'execute', 'complete', 'approve'
        break;
      }
    }
    
    if (!taskId) {
      return res.status(422).json({ detail: '缺少任务ID' });
    }

    // GET - fetch task details
    if (req.method === 'GET') {
      const tasks = await querySupabase('tasks', `id=eq.${taskId}&select=*`);
      if (tasks.length === 0) {
        return res.status(404).json({ detail: '任务不存在' });
      }
      const task = tasks[0];
      // Get matched agent info
      let matchedAgent = null;
      if (task.matched_agent_id) {
        const agents = await querySupabase('agents', `id=eq.${task.matched_agent_id}&select=id,name,capabilities,avg_rating,token_balance`);
        matchedAgent = agents[0] || null;
      }
      return res.status(200).json({ ...task, matched_agent: matchedAgent });
    }

    // PUT/POST - handle actions
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body || {};

      if (action === 'match') {
        const agent_id = body.agent_id;
        if (!agent_id) return res.status(422).json({ detail: '缺少agent_id' });
        
        const updated = await updateSupabase('tasks', `id=eq.${taskId}`, {
          matched_agent_id: parseInt(agent_id),
          status: 'matched',
          matched_at: new Date().toISOString(),
        });
        
        if (updated.length === 0) return res.status(404).json({ detail: '任务不存在' });
        return res.status(200).json(updated[0]);
      }

      if (action === 'execute') {
        const updated = await updateSupabase('tasks', `id=eq.${taskId}`, {
          status: 'in_progress',
        });
        if (updated.length === 0) return res.status(404).json({ detail: '任务不存在' });
        return res.status(200).json(updated[0]);
      }

      if (action === 'complete') {
        const updated = await updateSupabase('tasks', `id=eq.${taskId}`, {
          status: 'completed',
          result: body.result || '任务已完成',
          completed_at: new Date().toISOString(),
        });
        if (updated.length === 0) return res.status(404).json({ detail: '任务不存在' });
        return res.status(200).json(updated[0]);
      }

      if (action === 'approve') {
        const rating = body.rating || 5;
        const budget = parseFloat(updated?.[0]?.budget || 0);
        const updated = await updateSupabase('tasks', `id=eq.${taskId}`, {
          status: 'approved',
          rating: rating,
          feedback: body.feedback || '',
        });
        if (updated.length === 0) return res.status(404).json({ detail: '任务不存在' });
        
        // Credit agent tokens
        if (updated[0].matched_agent_id && updated[0].budget) {
          try {
            await updateSupabase('agents', `id=eq.${updated[0].matched_agent_id}`, {
              token_balance: parseFloat(updated[0].budget),
            });
          } catch (e) {
            console.error('Token credit failed:', e);
          }
        }
        
        return res.status(200).json(updated[0]);
      }

      return res.status(400).json({ detail: `未知操作: ${action}` });
    }

    return res.status(405).json({ detail: 'Method Not Allowed' });
  } catch (err) {
    console.error('Task detail error:', err);
    return res.status(500).json({ detail: '操作失败', error: err.message });
  }
}
