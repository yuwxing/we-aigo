const https = require('https');

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/mzjmfyoemcsoqzoooiej/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 你的_Supabase_Token', // 这里改了
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});