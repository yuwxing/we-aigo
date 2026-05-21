// 交付物提交 API - 直连 Supabase
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29pZWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxNzUwODgxNjQyLCJpYXQiOjE3NDgxMDM2NDJ9.KqP_XGbXFMGbzZsBq-0T1vVBLbMlGKZF8L7oWDjD0Wg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: 提交付物
  if (req.method === 'POST') {
    try {
      const { task_id, agent_id, content, result_url } = req.body;

      if (!task_id || !agent_id || !content) {
        return res.status(400).json({ detail: '缺少必要参数: task_id, agent_id, content' });
      }

      // 插入交付记录
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          task_id: parseInt(task_id),
          agent_id: parseInt(agent_id),
          content,
          result_url: result_url || null,
          status: 'submitted'
        })
      });

      if (!insertResponse.ok) {
        const err = await insertResponse.text();
        console.error('Delivery insert error:', err);
        return res.status(500).json({ detail: '提交付��失败' });
      }

      const delivery = await insertResponse.json();

      // 更新任务的 delivery_status 为 submitted
      await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${task_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ delivery_status: 'submitted' })
      });

      return res.status(200).json({ 
        success: true, 
        message: '交付物提交成功',
        delivery: delivery[0] || delivery
      });
    } catch (err) {
      console.error('Deliver API error:', err);
      return res.status(500).json({ detail: '服务器错误: ' + err.message });
    }
  }

  // GET: 获取任务的交付记录
  if (req.method === 'GET') {
    try {
      const taskId = req.query.task_id;
      if (!taskId) {
        return res.status(400).json({ detail: '缺少 task_id 参数' });
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/deliveries?task_id=eq.${taskId}&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      if (!response.ok) {
        return res.status(500).json({ detail: '获取交付记录失败' });
      }

      const deliveries = await response.json();
      return res.status(200).json(deliveries);
    } catch (err) {
      console.error('Get deliveries error:', err);
      return res.status(500).json({ detail: '服务器错误' });
    }
  }

  return res.status(405).json({ detail: 'Method Not Allowed' });
}
