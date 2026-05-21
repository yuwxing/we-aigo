// Match agent to task - direct Supabase update
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method Not Allowed' });
  }

  try {
    // Parse task_id from URL path: /api/tasks/{id}/match
    const urlParts = req.url.split('/');
    let taskId = null;
    for (let i = 0; i < urlParts.length; i++) {
      if (urlParts[i] === 'tasks' && urlParts[i+1] && urlParts[i+2] === 'match') {
        taskId = parseInt(urlParts[i+1]);
        break;
      }
    }
    
    // Also try query param
    if (!taskId) {
      taskId = parseInt(req.query.task_id);
    }

    const { agent_id } = req.body;

    if (!taskId || !agent_id) {
      return res.status(422).json({ detail: '缺少task_id或agent_id' });
    }

    // Try backend first
    try {
      const response = await fetch(`https://api.ai-wego.top/api/v1/tasks/${taskId}/match`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: parseInt(agent_id) }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (e) {
      console.log('Backend match failed, using direct DB update');
    }

    // Fallback: direct Supabase REST API
    const supabaseUrl = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29pZWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxNzUwODgxNjQyLCJpYXQiOjE3NDgxMDM2NDJ9.KqP_XGbXFMGbzZsBq-0T1vVBLbMlGKZF8L7oWDjD0Wg';
    
    // Update task directly
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        matched_agent_id: parseInt(agent_id),
        status: 'matched',
        matched_at: new Date().toISOString(),
      }),
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}));
      return res.status(updateRes.status).json({ detail: '匹配失败', error: errData });
    }

    const updatedTasks = await updateRes.json();
    if (updatedTasks.length === 0) {
      return res.status(404).json({ detail: '任务不存在' });
    }

    return res.status(200).json(updatedTasks[0]);
  } catch (err) {
    console.error('Match error:', err);
    return res.status(500).json({ detail: '匹配失败，请重试' });
  }
}
