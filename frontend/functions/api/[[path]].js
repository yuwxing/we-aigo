const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sb(path, opts) {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  if (opts?.method === 'PATCH' || opts?.method === 'POST') headers['Prefer'] = 'return=representation';
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...opts, headers });
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(request.url);
  const path = url.pathname;
  let body = {};

  if (request.method === 'POST') {
    try { body = await request.json(); } catch(e) {}
  }

  try {
    // GET /api/pet
    if (path === '/api/pet' && request.method === 'GET') {
      const userId = url.searchParams.get('user_id');
      if (!userId) return new Response(JSON.stringify({ error: '缺少user_id' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      
      const resp = await sb(`/user_pets?user_id=eq.${userId}&select=*`);
      const pets = await resp.json();
      
      if (!pets || pets.length === 0) {
        return new Response(JSON.stringify({ success: true, hasPet: false, pet: null }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      
      const pet = pets[0];
      const now = new Date();
      const getCooldown = (lastTime, hours) => {
        if (!lastTime) return { onCooldown: false, remaining: 0 };
        const diff = now.getTime() - new Date(lastTime).getTime();
        const remaining = Math.max(0, hours * 3600000 - diff);
        return { onCooldown: remaining > 0, remaining: Math.ceil(remaining / 1000) };
      };
      
      return new Response(JSON.stringify({
        success: true, hasPet: true,
        pet: {
          id: pet.id, pet_type: pet.pet_type, pet_name: pet.pet_name,
          level: pet.level, exp: pet.exp, mood: pet.mood, hunger: pet.hunger,
          cooldowns: {
            vocab: getCooldown(pet.last_vocab, 2),
            sentence: getCooldown(pet.last_sentence, 3),
            quiz: getCooldown(pet.last_quiz, 4),
            checkIn: getCooldown(pet.last_check_in, 24),
          },
          history: []
        }
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // POST /api/pet/init
    if (path === '/api/pet/init' && request.method === 'POST') {
      const { user_id, pet_id, pet_name } = body;
      if (!user_id) return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      
      const checkResp = await sb(`/user_pets?user_id=eq.${user_id}&select=*`);
      const existing = await checkResp.json();
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ success: true, message: '宠物已存在' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      
      const createResp = await sb('/user_pets', {
        method: 'POST',
        body: JSON.stringify({ user_id, pet_type: pet_id || 'junie', pet_name: pet_name || '宠物', level: 1, exp: 0, mood: 80, hunger: 80 })
      });
      const created = await createResp.json();
      return new Response(JSON.stringify({ success: true, message: '宠物初始化成功', pet: created }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // POST /api/pet/adopt  
    if (path === '/api/pet/adopt' && request.method === 'POST') {
      const { user_id, pet_id, pet_name } = body;
      if (!user_id) return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      
      const checkResp = await sb(`/user_pets?user_id=eq.${user_id}&select=*`);
      const existing = await checkResp.json();
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ success: true, message: '已领养' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      
      const createResp = await sb('/user_pets', {
        method: 'POST',
        body: JSON.stringify({ user_id, pet_type: pet_id || 'junie', pet_name: pet_name || '宠物', level: 1, exp: 0, mood: 80, hunger: 80 })
      });
      const created = await createResp.json();
      return new Response(JSON.stringify({ success: true, message: '领养成功', pet: created }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // POST /api/pet/interact
    if (path === '/api/pet/interact' && request.method === 'POST') {
      const { user_id, action } = body;
      if (!user_id || !action) return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      
      const configs = {
        vocab: { tokens: 15, exp: 5, mood: 10, hunger: 10, cooldown: 2, field: 'last_vocab', desc: '背单词' },
        sentence: { tokens: 25, exp: 8, mood: 15, hunger: 10, cooldown: 3, field: 'last_sentence', desc: '造句' },
        quiz: { tokens: 35, exp: 10, mood: 20, hunger: 15, cooldown: 4, field: 'last_quiz', desc: '挑战' },
        checkin: { tokens: 50, exp: 10, mood: 10, hunger: 10, cooldown: 24, field: 'last_check_in', desc: '签到' },
      };
      const config = configs[action];
      if (!config) return new Response(JSON.stringify({ error: '无效操作' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      
      const petResp = await sb(`/user_pets?user_id=eq.${user_id}&select=*`);
      const pets = await petResp.json();
      if (!pets || pets.length === 0) {
        return new Response(JSON.stringify({ success: false, error: '你还没有领养宠物' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      
      const pet = pets[0];
      const now = new Date();
      const lastTime = pet[config.field];
      if (lastTime) {
        const diff = now.getTime() - new Date(lastTime).getTime();
        const cooldownMs = config.cooldown * 3600000;
        if (diff < cooldownMs) {
          return new Response(JSON.stringify({ success: false, error: '冷却中', message: `请等待 ${Math.ceil((cooldownMs - diff) / 60000)} 分钟` }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
        }
      }
      
      const newMood = Math.min(100, Math.max(0, pet.mood + config.mood));
      const newHunger = Math.min(100, Math.max(0, pet.hunger + config.hunger));
      const newExp = pet.exp + config.exp;
      let newLevel = pet.level, leveledUp = false, bonusTokens = 0;
      if (newExp >= pet.level * 20) { newLevel = pet.level + 1; leveledUp = true; bonusTokens = 100; }
      
      await sb(`/user_pets?user_id=eq.${user_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ mood: newMood, hunger: newHunger, exp: newExp, level: newLevel, [config.field]: now.toISOString() })
      });
      
      const totalTokens = config.tokens + bonusTokens;
      // Add token transaction
      const balResp = await sb(`/users?id=eq.${user_id}&select=token_balance`);
      const users = await balResp.json();
      if (users && users.length > 0) {
        const newBalance = users[0].token_balance + totalTokens;
        await sb(`/users?id=eq.${user_id}`, { method: 'PATCH', body: JSON.stringify({ token_balance: newBalance }) });
      }
      await sb('/token_transactions', { method: 'POST', body: JSON.stringify({ user_id, type: `pet_${action}`, amount: totalTokens, description: `宠物${config.desc}奖励` }) });
      
      return new Response(JSON.stringify({ success: true, earned: totalTokens, leveledUp, newLevel: newLevel, newMood, newHunger, newExp }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // POST /api/sentence/check - call DeepSeek
    if (path === '/api/sentence/check' && request.method === 'POST') {
      const { word, sentence } = body;
      if (!word || !sentence) return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      
      const aiResp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-17df56ac8d1b4544914816f45c3c7064' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: '你是英语老师。评判学生用指定单词造的句子是否正确。返回JSON: {"success":true/false,"message":"评价"}' }, { role: 'user', content: `单词: ${word}\n句子: ${sentence}` }],
          temperature: 0.3
        })
      });
      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || '{"success":false,"message":"评判失败"}';
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), { headers: { ...CORS, 'Content-Type': 'application/json' } });
      } catch {
        return new Response(JSON.stringify({ success: sentence.toLowerCase().includes(word.toLowerCase()), message: content }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
    }

    // Fallback: proxy to Worker
    const workerUrl = `https://we-aigo-worker.we-aigo-api.workers.dev${path}${url.search}`;
    const headers = new Headers(request.headers);
    headers.delete('host');
    const init = { method: request.method, headers };
    if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer();
    const resp = await fetch(workerUrl, init);
    const data = await resp.text();
    return new Response(data, { status: resp.status, headers: { ...CORS, 'Content-Type': resp.headers.get('Content-Type') || 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || '服务器错误' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}
