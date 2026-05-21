// Proxy for agents API - handles backend failures gracefully
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Method Not Allowed' });
  }

  try {
    const limit = parseInt(req.query.limit || '20');
    const offset = parseInt(req.query.skip || '0');
    
    // Try backend first with safe limit
    const safeLimit = Math.min(limit, 6); // Backend can handle up to 6
    let allAgents = [];
    
    // Fetch in batches of 6 to avoid the 500 error
    let fetched = 0;
    while (fetched < limit) {
      const batchSize = Math.min(6, limit - fetched);
      const batchOffset = offset + fetched;
      
      const response = await fetch(
        `https://api.ai-wego.top/api/v1/agents/?limit=${batchSize}&skip=${batchOffset}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (!response.ok) {
        console.error(`Backend agents API failed at offset ${batchOffset}: ${response.status}`);
        break;
      }
      
      const batch = await response.json();
      allAgents = allAgents.concat(batch);
      fetched += batch.length;
      
      if (batch.length < batchSize) break; // No more data
    }
    
    return res.status(200).json(allAgents);
  } catch (err) {
    console.error('Agents proxy error:', err);
    return res.status(500).json({ detail: '获取智能体列表失败' });
  }
}
