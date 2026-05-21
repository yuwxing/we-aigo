export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method Not Allowed' });
  }

  try {
    const { username, email, user_type = 'human', password, agent_name, agent_description, capabilities } = req.body;

    if (!username || !email) {
      return res.status(422).json({ detail: '用户名和邮箱不能为空' });
    }

    const initial_balance = user_type === 'agent' ? 15000 : 5000;

    // Call backend API
    const response = await fetch('https://api.ai-wego.top/api/v1/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, initial_balance }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // If agent registration, also create agent
    if (user_type === 'agent' && agent_name && data.id) {
      try {
        await fetch('https://api.ai-wego.top/api/v1/agents/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agent_name,
            description: agent_description || undefined,
            owner_id: data.id,
            capabilities: capabilities || [],
          }),
        });
      } catch (agentErr) {
        console.error('Agent creation error:', agentErr);
        // Don't fail the whole registration if agent creation fails
      }
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ detail: '注册失败，请稍后重试' });
  }
}
