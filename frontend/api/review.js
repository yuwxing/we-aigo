// 交付物验收 API - 直连 Supabase
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29pZWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxNzUwODgxNjQyLCJpYXQiOjE3NDgxMDM2NDJ9.KqP_XGbXFMGbzZsBq-0T1vVBLbMlGKZF8L7oWDjD0Wg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // PUT: 验收交付物
  if (req.method === 'PUT') {
    try {
      const { task_id, action, rating, comment } = req.body;

      if (!task_id || !action) {
        return res.status(400).json({ detail: '缺少必要参数: task_id, action' });
      }

      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ detail: 'action 必须是 accept 或 reject' });
      }

      // 获取任务的交付记录
      const deliveryRes = await fetch(
        `${SUPABASE_URL}/rest/v1/deliveries?task_id=eq.${task_id}&status=eq.submitted&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const deliveries = await deliveryRes.json();
      const delivery = deliveries[0];

      if (!delivery) {
        return res.status(404).json({ detail: '没有找到待验收的交付记录' });
      }

      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      const newTaskStatus = action === 'accept' ? 'completed' : 'rejected';

      // 更新交付记录
      await fetch(`${SUPABASE_URL}/rest/v1/deliveries?id=eq.${delivery.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          status: newStatus,
          rating: rating || (action === 'accept' ? 5 : null),
          review_comment: comment || null,
          reviewed_at: new Date().toISOString()
        })
      });

      // 获取任务信息和预算
      const taskRes = await fetch(
        `${SUPABASE_URL}/rest/v1/tasks?id=eq.${task_id}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const tasks = await taskRes.json();
      const task = tasks[0];

      if (action === 'accept' && task) {
        // 更新任务状态
        await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${task_id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ 
            status: newTaskStatus, 
            delivery_status: newStatus,
            result: delivery.content,
            rating: rating || 5
          })
        });

        // Token 结算：将 budget 从 creator 扣除，加到 agent 的 token_earnings
        if (task.budget && delivery.agent_id) {
          // 更新 creator 的 token_balance（扣除预算）
          const creatorRes = await fetch(
            `${SUPABASE_URL}/rest/v1/users?id=eq.${task.creator_id}&select=token_balance`,
            {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              }
            }
          );
          const creators = await creatorRes.json();
          if (creators.length > 0) {
            const newBalance = Math.max(0, (creators[0].token_balance || 0) - task.budget);
            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${task.creator_id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify({ token_balance: newBalance })
            });
          }

          // 更新 agent 的 token_earnings
          const agentRes = await fetch(
            `${SUPABASE_URL}/rest/v1/agents?id=eq.${delivery.agent_id}&select=token_earnings,completed_tasks,total_tasks,success_rate,avg_rating`,
            {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              }
            }
          );
          const agents = await agentRes.json();
          if (agents.length > 0) {
            const agent = agents[0];
            const newEarnings = (agent.token_earnings || 0) + task.budget;
            const newCompleted = (agent.completed_tasks || 0) + 1;
            const newTotal = (agent.total_tasks || 0) + 1;
            const currentRate = agent.success_rate || 0;
            const newSuccessRate = Math.round(((currentRate * agent.total_tasks) + (action === 'accept' ? 100 : 0)) / newTotal);
            
            // 更新评分（简单平均）
            const currentRating = agent.avg_rating || 0;
            const newAvgRating = action === 'accept' 
              ? ((currentRating * agent.completed_tasks) + (rating || 5)) / newCompleted 
              : currentRating;

            await fetch(`${SUPABASE_URL}/rest/v1/agents?id=eq.${delivery.agent_id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify({ 
                token_earnings: newEarnings,
                completed_tasks: newCompleted,
                total_tasks: newTotal,
                success_rate: newSuccessRate,
                avg_rating: Math.round(newAvgRating * 10) / 10
              })
            });
          }
        }
      } else {
        // 拒绝：只更新状态
        await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${task_id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ 
            status: newTaskStatus, 
            delivery_status: newStatus
          })
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: action === 'accept' ? '验收通过，Token已结算' : '已拒绝交付物',
        delivery_id: delivery.id,
        new_status: newStatus
      });
    } catch (err) {
      console.error('Review API error:', err);
      return res.status(500).json({ detail: '服务器错误: ' + err.message });
    }
  }

  return res.status(405).json({ detail: 'Method Not Allowed' });
}
