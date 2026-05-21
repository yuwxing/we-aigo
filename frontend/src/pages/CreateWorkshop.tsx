import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Wand2, User, Smile, Move, MapPin, Palette, ChevronRight, Zap, BookOpen, Rocket, CheckCircle, Loader2 } from 'lucide-react';
import { Card } from '../components/ui';
import { tasksAPI } from '../utils/supabase';
import { DutyAgentCard } from '../components/DutyAgentWidget';
import { getDutyAgentByStation } from '../utils/dutyAgents';

// 10个预设场景
const presetScenes = [
  { name: '古风少女', emoji: '👘', desc: '桃花林中执伞回眸', params: { character: '18岁古风少女，淡青色汉服', emotion: '温柔含蓄微微笑', pose: '执伞回眸', scene: '桃花林春日白天', style: '古风工笔' } },
  { name: '武侠大侠', emoji: '⚔️', desc: '云海山巅负手而立', params: { character: '25岁侠客，黑衣束发长剑', emotion: '冷峻坚毅', pose: '负手而立悬崖边', scene: '云海山巅黄昏', style: '写意水墨' } },
  { name: '校园二次元', emoji: '🎒', desc: '樱花树下比耶', params: { character: '16岁女高中生，校服双马尾', emotion: '开心灿烂', pose: '双手比耶', scene: '樱花树下白天', style: '日系二次元' } },
  { name: '海边治愈', emoji: '🌊', desc: '黄昏赤脚踩浪花', params: { character: '20岁少女，白色连衣裙', emotion: '宁静安详', pose: '赤脚踩浪花', scene: '黄昏海边落日', style: '治愈系水彩' } },
  { name: '赛博朋克', emoji: '🌃', desc: '霓虹雨夜机械战士', params: { character: '28岁机械改造女战士', emotion: '冷酷霸气', pose: '单手插兜', scene: '霓虹都市雨夜', style: '赛博朋克' } },
  { name: '亲子温馨', emoji: '👨‍👧', desc: '阳光下的拥抱', params: { character: '妈妈抱3岁小孩', emotion: '慈爱幸福', pose: '拥抱贴脸', scene: '阳光客厅午后', style: '温馨写实' } },
  { name: '职场精英', emoji: '💼', desc: '城市天际线前', params: { character: '30岁商务男士，西装', emotion: '自信从容', pose: '倚靠办公桌', scene: '高层落地窗城市天际线', style: '商务写实' } },
  { name: '奇幻精灵', emoji: '🧚', desc: '花丛中蹲坐的精灵', params: { character: '精灵少女，尖耳透明翅膀', emotion: '好奇灵动', pose: '蹲坐花丛中', scene: '魔法森林萤火虫之夜', style: '奇幻油画' } },
  { name: '古风CP', emoji: '💑', desc: '月下执手相看', params: { character: '古风男女一对，他白衣她红衣', emotion: '深情对望', pose: '执手相看', scene: '月下庭院荷花池', style: '古风唯美' } },
  { name: '萌宠拟人', emoji: '🐱', desc: '窗台上的猫耳少年', params: { character: '橘猫拟人少年，猫耳猫尾', emotion: '慵懒傲娇', pose: '趴在窗台晒太阳', scene: '日式和室午后', style: '可爱Q版' } },
];

// 表单初始状态
const emptyForm = { character: '', emotion: '', pose: '', scene: '', style: '' };

export const CreateWorkshop: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<{ positive: string; negative: string } | null>(null);

  const handlePresetClick = (preset: typeof presetScenes[0]) => {
    setForm(preset.params);
    setMode('custom');
    // 自动生成提示词
    setTimeout(() => {
      generateLocalPromptForForm(preset.params);
    }, 100);
  };

  const generateLocalPromptForForm = (f: typeof form) => {
    const lighting = inferLighting(f.scene);
    const composition = inferComposition(f.style);
    const positive = `masterpiece, best quality, ultra-detailed, ${f.style} style, ${f.character}, ${f.emotion} expression, ${f.pose}, ${f.scene}, ${lighting}, ${composition}, highly detailed face, detailed eyes, beautiful lighting, cinematic composition, 8k resolution`;
    const baseNegative = 'worst quality, low quality, bad anatomy, bad hands, missing fingers, extra fingers, cropped, poorly drawn face, mutated, ugly, deformed, blurry, bad proportions, extra limbs, cloned face, disfigured, watermark, text, signature';
    const styleFilter = f.style.includes('古风') || f.style.includes('写实') ? 'anime, cartoon, 3d render' : f.style.includes('二次元') || f.style.includes('Q版') ? 'photorealistic, photograph' : '';
    const negative = styleFilter ? `${baseNegative}, ${styleFilter}` : baseNegative;
    setResult({ positive, negative });
  };

  const handleSubmit = async () => {
    if (!form.character || !form.emotion || !form.pose || !form.scene || !form.style) {
      return;
    }
    setSubmitting(true);
    try {
      // 调用本地API创建任务
      const description = `AI创作需求：\n1.主角人物：${form.character}\n2.表情心情：${form.emotion}\n3.动作姿态：${form.pose}\n4.所在场景：${form.scene}\n5.风格氛围：${form.style}\n\n系统已自动拆解为7维度参数，6位专业智能体将并行细化人物/动作/场景/构图/风格，最终输出正向提示词+负面规避词。`;
      
      const response = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, description }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // 如果API返回的positive有效，使用API结果；否则fallback到本地生成
        if (data.positive && data.positive.length > 50 && !data.positive.includes('AI创作需求')) {
          setResult({
            positive: data.positive,
            negative: data.negative || '',
          });
        } else {
          generateLocalPrompt();
        }
      } else {
        // API调用失败时，生成本地提示词
        generateLocalPrompt();
      }
    } catch (err) {
      // 网络错误时使用本地生成
      generateLocalPrompt();
    } finally {
      setSubmitting(false);
    }
  };

  // 本地提示词生成
  const generateLocalPrompt = () => {
    const lighting = inferLighting(form.scene);
    const composition = inferComposition(form.style);
    
    const positive = `masterpiece, best quality, ultra-detailed, ${form.style} style, ${form.character}, ${form.emotion} expression, ${form.pose}, ${form.scene}, ${lighting}, ${composition}, highly detailed face, detailed eyes, beautiful lighting, cinematic composition, 8k resolution`;
    
    const baseNegative = 'worst quality, low quality, bad anatomy, bad hands, missing fingers, extra fingers, cropped, poorly drawn face, mutated, ugly, deformed, blurry, bad proportions, extra limbs, cloned face, disfigured, watermark, text, signature';
    const styleFilter = form.style.includes('古风') || form.style.includes('写实') 
      ? 'anime, cartoon, 3d render'
      : form.style.includes('二次元') || form.style.includes('Q版')
      ? 'photorealistic, photograph'
      : '';
    const negative = styleFilter ? `${baseNegative}, ${styleFilter}` : baseNegative;
    
    setResult({ positive, negative });
  };

  const inferLighting = (scene: string) => {
    if (scene.includes('黄昏') || scene.includes('日落')) return 'warm sunset backlight, golden glow';
    if (scene.includes('夜晚') || scene.includes('夜')) return 'cold moonlight, dark atmosphere lighting';
    if (scene.includes('雨')) return 'cold rain fog, neon reflections';
    if (scene.includes('清晨') || scene.includes('早晨')) return 'soft morning light, misty rays';
    return 'natural soft light, bright and clear';
  };

  const inferComposition = (style: string) => {
    if (style.includes('Q版') || style.includes('可爱')) return 'front bust, centered composition, rounded lines';
    if (style.includes('古风')) return 'vertical full body, white space composition, flowing motion';
    if (style.includes('赛博')) return 'low angle shot, depth of field blur, neon light spots foreground';
    return 'vertical composition, half body/full body, shallow depth, character centered';
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 启动AI绘画 - 直接跳转到豆包对话
  const handleLaunchAgent = () => {
    if (!result) return;
    
    setLaunching(true);
    try {
      // 构建完整的提示词用于AI绘画
      const fullPrompt = `请根据以下提示词进行AI绘画创作：

【创作需求】
主角人物: ${form.character}
表情心情: ${form.emotion}
动作姿态: ${form.pose}
所在场景: ${form.scene}
风格氛围: ${form.style}

【正向提示词】
${result.positive}

【负面提示词】
${result.negative}

请直接生成对应的AI绘画作品。`;

      // 直接跳转到豆包绘画对话
      const cozeUrl = `https://coze.cn/x97wj9x8mw/chat?conversation=${encodeURIComponent(form.character + ' ' + form.style)}&text=${encodeURIComponent(fullPrompt)}`;
      window.open(cozeUrl, '_blank');
    } catch (err) {
      console.error('启动失败:', err);
      alert('启动失败，请重试');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">AI创作工坊</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">一键生成AI绘画提示词</h1>
        <p className="text-slate-500">不用学写提示词，填5项大白话，6位专业智能体帮你搞定</p>
      </div>

      {/* 值班智能体入口 - 文心 */}
      {(() => {
        const dutyAgent = getDutyAgentByStation('create');
        if (!dutyAgent) return null;
        return (
          <div className="max-w-xl mx-auto">
            <DutyAgentCard 
              agent={dutyAgent} 
              onChat={() => window.location.href = '/pet-chat/axobotl'} 
            />
          </div>
        );
      })()}

      {/* 教学图片生成器入口卡片 */}
      <Link 
        to="/word-cards"
        className="block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">教学图片生成器</h3>
                <p className="text-white/80 text-sm">面向教师和教学内容创作者</p>
              </div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              输入学科知识点，AI自动生成教学配图提示词<br/>
              适用于：化学实验图、地理示意图、数学证明图、生物结构图...
            </p>
          </div>
          <div className="ml-4">
            <div className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium backdrop-blur-sm transition-colors flex items-center gap-2">
              <span>立即生成</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>

      {/* Mode Switch */}
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => setMode('preset')} 
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            mode === 'preset' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          🎯 场景预设
        </button>
        <button 
          onClick={() => setMode('custom')} 
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            mode === 'custom' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ✏️ 自由创作
        </button>
      </div>

      {/* Preset Mode */}
      {mode === 'preset' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {presetScenes.map((preset) => (
            <button 
              key={preset.name} 
              onClick={() => handlePresetClick(preset)}
              className="p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-purple-300 hover:shadow-md transition-all text-center group"
            >
              <div className="text-3xl mb-2">{preset.emoji}</div>
              <div className="font-medium text-slate-800 group-hover:text-purple-600">{preset.name}</div>
              <div className="text-xs text-slate-400 mt-1">{preset.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Custom Form */}
      {mode === 'custom' && (
        <Card className="!p-6 space-y-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Wand2 className="w-5 h-5 text-purple-500" />
            AI创作需求单
          </div>
          <p className="text-sm text-slate-500">请用大白话简单填写5项即可，不用懂专业词</p>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <User className="w-4 h-4 text-blue-500" /> 1. 主角人物
              </label>
              <input 
                type="text" 
                value={form.character} 
                onChange={e => setForm(f => ({...f, character: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="性别/年龄/身份/几个人，如：18岁古风少女穿淡青色汉服" 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Smile className="w-4 h-4 text-pink-500" /> 2. 表情心情
              </label>
              <input 
                type="text" 
                value={form.emotion} 
                onChange={e => setForm(f => ({...f, emotion: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="害羞/高冷/开心/委屈/霸气等" 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Move className="w-4 h-4 text-green-500" /> 3. 动作姿态
              </label>
              <input 
                type="text" 
                value={form.pose} 
                onChange={e => setForm(f => ({...f, pose: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="坐着/站着/奔跑/回头/抱臂等" 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <MapPin className="w-4 h-4 text-orange-500" /> 4. 所在场景
              </label>
              <input 
                type="text" 
                value={form.scene} 
                onChange={e => setForm(f => ({...f, scene: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="桃花林/海边/卧室/街头/山顶等 + 白天/黄昏/夜晚" 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Palette className="w-4 h-4 text-purple-500" /> 5. 风格氛围
              </label>
              <input 
                type="text" 
                value={form.style} 
                onChange={e => setForm(f => ({...f, style: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="古风/二次元/写实/治愈/赛博朋克/可爱Q版" 
              />
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={submitting || !form.character || !form.emotion || !form.pose || !form.scene || !form.style}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            {submitting ? '6位智能体协作中...' : '一键生成提示词'}
          </button>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="!p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-slate-800">生成结果</span>
          </div>
          
          {/* 正向提示词 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600">✅ 正向提示词</span>
              <button 
                onClick={() => handleCopy(result.positive)}
                className="text-xs px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
              >
                📋 复制
              </button>
            </div>
            <div className="bg-green-50 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap text-slate-700 border border-green-100">
              {result.positive}
            </div>
          </div>
          
          {/* 负面提示词 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-600">❌ 负面提示词</span>
              <button 
                onClick={() => handleCopy(result.negative)}
                className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                📋 复制
              </button>
            </div>
            <div className="bg-red-50 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap text-slate-700 border border-red-100">
              {result.negative}
            </div>
          </div>
          
          {/* 启动智能体执行按钮 */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleLaunchAgent}
              disabled={launching}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {launching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在启动 AI 执行...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  🚀 启动智能体执行（生成图片）
                </>
              )}
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              点击后会自动创建任务，DeepSeek AI 将为您生成配套的AI绘画作品
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CreateWorkshop;
