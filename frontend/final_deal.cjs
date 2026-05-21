const https = require('https');
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

const deal = {title:'【电商】京东国补最高1500',desc:{type:'online',category:'电商优惠券',merchant:'京东',icon:'🏠',discount:'搜索国补333',saveAmount:'最高1500元',validUntil:'2026-06-18',region:'线上',url:'https://www.jd.com'},budget:1500};

const body = JSON.stringify({
  title: deal.title,
  description: JSON.stringify(deal.desc),
  status: 'deal',
  budget: deal.budget,
  publisher_id: 1
});

const options = {
  hostname: 'mzjmfyoemcsoqzoooiej.supabase.co',
  port: 443,
  path: '/rest/v1/tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  console.log('状态码:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('写入完成:', data));
});
req.on('error', e => console.error('错误:', e.message));
req.write(body);
req.end();
