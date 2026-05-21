// Proxy for tasks API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const limit = parseInt(req.query.limit || '20');
      const offset = parseInt(req.query.skip || '0');
      
      const response = await fetch(
        `https://api.ai-wego.top/api/v1/tasks/?limit=${limit}&skip=${offset}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (!response.ok) {
        return res.status(200).json([]);
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      console.error('Tasks proxy error:', err);
      return res.status(500).json({ detail: '获取任务列表失败' });
    }
  }

  if (req.method === 'POST') {
    try {
      const response = await fetch('https://api.ai-wego.top/api/v1/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      console.error('Task create error:', err);
      return res.status(500).json({ detail: '创建任务失败' });
    }
  }

  return res.status(405).json({ detail: 'Method Not Allowed' });
}
