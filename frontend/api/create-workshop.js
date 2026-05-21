// AI创作工坊 - 一键生成提示词
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29pZWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxNzUwODgxNjQyLCJpYXQiOjE3NDgxMDM2NDJ9.KqP_XGbXFMGbzZsBq-0T1vVBLbMlGKZF8L7oWDjD0Wg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method Not Allowed' });

  try {
    const { form, description } = req.body;
    if (!form || !description) {
      return res.status(422).json({ detail: '缺少创作参数' });
    }

    // 7维度自动拆解
    const decomposed = {
      主体设定: form.character,
      神态情绪: form.emotion,
      肢体动作: form.pose,
      环境场景: form.scene,
      光影色调: inferLighting(form.scene),
      画风质感: form.style,
      镜头构图: inferComposition(form.style),
    };

    // 直接生成提示词
    const positivePrompt = generatePositivePrompt(form, decomposed);
    const negativePrompt = generateNegativePrompt(form.style);

    // 创建任务记录到Supabase
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          title: `AI创作：${form.character.slice(0, 20)}·${form.style}`,
          description: description,
          budget: 500,
          status: 'open',
          publisher_id: 3,
          requirements: [
            { category: '设计', min_level: 7 },
            { category: '写作', min_level: 6 },
          ],
          deadline: '2026-12-31T23:59:59',
        }),
      });
    } catch (dbErr) {
      console.log('数据库记录失败，继续返回结果');
    }

    return res.status(200).json({
      prompt: `✅ 正向提示词：\n${positivePrompt}\n\n❌ 负面提示词：\n${negativePrompt}`,
      positive: positivePrompt,
      negative: negativePrompt,
      decomposed: decomposed,
    });
  } catch (err) {
    console.error('Create workshop error:', err);
    return res.status(500).json({ detail: '创作失败' });
  }
}

function inferLighting(scene) {
  if (scene.includes('黄昏') || scene.includes('日落')) return 'warm sunset backlight, golden glow, rim lighting';
  if (scene.includes('夜晚') || scene.includes('夜')) return 'cold moonlight, dark atmosphere, volumetric lighting';
  if (scene.includes('雨')) return 'cold rain fog, neon reflections, wet surface reflections';
  if (scene.includes('清晨') || scene.includes('早晨')) return 'soft morning light, misty rays, golden hour';
  if (scene.includes('阳光') || scene.includes('白天')) return 'natural daylight, soft shadows, bright and clear';
  return 'natural soft light, even lighting, clean highlights';
}

function inferComposition(style) {
  if (style.includes('Q版') || style.includes('可爱')) return 'front bust shot, centered composition, rounded lines, close-up framing';
  if (style.includes('古风')) return 'vertical full body, Chinese painting composition, white space, flowing cloth';
  if (style.includes('赛博')) return 'low angle shot, depth of field blur, neon bokeh foreground, dynamic angle';
  if (style.includes('二次元')) return 'anime style composition, upper body or full body, slight angle, soft lighting';
  return 'portrait composition, half body or full body, shallow depth of field, character centered';
}

function generatePositivePrompt(form, decomposed) {
  const parts = [
    'masterpiece',
    'best quality',
    'ultra-detailed',
    '8k resolution',
    'highly detailed',
    `${form.style} style`,
    form.character,
    `${form.emotion} expression`,
    form.pose,
    form.scene,
    'beautiful detailed eyes',
    'detailed face',
    'perfect anatomy',
    decomposed.光影色调,
    decomposed.镜头构图,
    'cinematic lighting',
    'professional photography',
    'studio quality',
  ];
  
  return parts.join(', ');
}

function generateNegativePrompt(style) {
  const base = [
    'worst quality',
    'low quality',
    'normal quality',
    'jpeg artifacts',
    'blurry',
    'bad anatomy',
    'bad hands',
    'missing fingers',
    'extra fingers',
    'fused fingers',
    'too many fingers',
    'cropped',
    'out of frame',
    'poorly drawn face',
    'mutation',
    'mutated',
    'ugly',
    'disfigured',
    'deformed',
    'bad proportions',
    'extra limbs',
    'cloned face',
    'disembodied limb',
    'gross proportions',
    'malformed limbs',
    'missing arms',
    'missing legs',
    'extra arms',
    'extra legs',
    'fused limbs',
    'malformed hands',
    'bad fingers',
    'deformed hands',
    'extra digits',
    'watermark',
    'text',
    'signature',
    'username',
    'artifact',
    'error',
    'noise',
    'worst feet',
    'extra ears',
  ];
  
  const styleFilters = [];
  if (style.includes('古风') || style.includes('写实') || style.includes('工笔')) {
    styleFilters.push('anime style', 'cartoon style', '3d render', 'western cartoon');
  }
  if (style.includes('二次元') || style.includes('Q版') || style.includes('可爱') || style.includes('日系')) {
    styleFilters.push('photorealistic', 'photograph', 'realistic photo', '3d realistic');
  }
  if (style.includes('赛博')) {
    styleFilters.push('medieval fantasy', 'traditional art');
  }
  
  const allNegative = [...base, ...styleFilters];
  return allNegative.join(', ');
}
