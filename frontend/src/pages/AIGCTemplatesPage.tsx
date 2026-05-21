// AIGC提示词模板页面 - 飞书风格卡片式布局
import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Sparkles, Palette, Wand2, User } from 'lucide-react';
import toast from 'react-hot-toast';

// 模板分类
type Category = 'midjourney' | 'img2img' | 'gpt';

// 模板数据结构
interface Template {
  id: string;
  title: string;
  prompt: string;
  category: Category;
  gradient: string;
  steps?: string[];
}

// 预置模板数据
const templates: Template[] = [
  // Midjourney模板
  {
    id: 'mj-1',
    title: '3D立体四季壁纸',
    prompt: 'summer, green, blue, Multi-dimensional paper kirigami craft, paper illustration, seasonal landscape, crane, mountains, plants, highly detailed, 8k',
    category: 'midjourney',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    steps: [
      '1. 将Prompt复制到Midjourney',
      '2. 选择合适的宽高比（如16:9）',
      '3. 添加 --ar 16:9 --v 5 参数',
      '4. 等待生成4张候选图',
      '5. 选择满意的图进行放大'
    ]
  },
  {
    id: 'mj-2',
    title: '3D圣诞老人',
    prompt: 'A Santa Claus in the snow, at night, with gifts, distant views, bright and colorful lights, 3D render, cute style',
    category: 'midjourney',
    gradient: 'from-red-400 via-rose-400 to-pink-400',
    steps: [
      '1. 将Prompt复制到Midjourney',
      '2. 使用 --ar 1:1 或 --ar 3:4',
      '3. 添加 --s 750 --q 2 参数提升质量',
      '4. U按钮放大满意的作品',
      '5. 可用Vary功能微调变体'
    ]
  },
  {
    id: 'mj-3',
    title: '人像摄影',
    prompt: 'Portrait photography, warm orange lighting, close-up, atmospheric, cinematic, bokeh background, film grain',
    category: 'midjourney',
    gradient: 'from-amber-400 via-orange-400 to-red-400',
    steps: [
      '1. 将Prompt复制到Midjourney',
      '2. 选择 --ar 3:4 竖版构图',
      '3. 添加 --style raw 减少AI痕迹',
      '4. 使用 --iw 1.2 提升图片权重',
      '5. 如需特定肤色可添加描述'
    ]
  },
  {
    id: 'mj-4',
    title: '水彩花卉',
    prompt: 'Watercolor flowers, soft pastel colors, botanical illustration, delicate petals, white background, artistic',
    category: 'midjourney',
    gradient: 'from-pink-300 via-fuchsia-300 to-purple-300',
    steps: [
      '1. 将Prompt复制到Midjourney',
      '2. 添加 --style expressiv 参数',
      '3. 使用 --q 1 控制细节',
      '4. 白底适合打印和设计',
      '5. 可添加具体花卉名称'
    ]
  },
  {
    id: 'mj-5',
    title: '赛博朋克城市',
    prompt: 'Cyberpunk city, neon lights, rain, reflections, futuristic architecture, purple and blue tones, 8k detailed',
    category: 'midjourney',
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    steps: [
      '1. 将Prompt复制到Midjourney',
      '2. 选择宽屏比例 --ar 16:9',
      '3. 添加 --s 1000 提升风格化',
      '4. 可添加具体城市元素',
      '5. 使用 --q 2 提升画质'
    ]
  },
  // 图生图模板
  {
    id: 'img-1',
    title: '照片转动漫',
    prompt: 'Convert this photo to anime style, Studio Ghibli, soft colors, detailed background',
    category: 'img2img',
    gradient: 'from-sky-400 via-blue-400 to-indigo-400',
    steps: [
      '1. 准备一张清晰的照片',
      '2. 在Midjourney使用 /describe 上传图片',
      '3. 获取参考Prompt',
      '4. 切换到V5或V6版本',
      '5. 添加 --iw 1.5 提升相似度'
    ]
  },
  {
    id: 'img-2',
    title: '素描转彩绘',
    prompt: 'Transform this sketch into a colorful oil painting, impressionist style, vibrant',
    category: 'img2img',
    gradient: 'from-yellow-400 via-orange-400 to-amber-400',
    steps: [
      '1. 上传素描或线稿图片',
      '2. 使用 /blend 或 /imagine',
      '3. 在Prompt开头添加图片URL',
      '4. 添加 --iw 0.8 控制风格强度',
      '5. 调整参数直到满意'
    ]
  },
  {
    id: 'img-3',
    title: '真人转3D',
    prompt: 'Convert this portrait to 3D Pixar style, cute, round features, soft lighting',
    category: 'img2img',
    gradient: 'from-fuchsia-400 via-pink-400 to-rose-400',
    steps: [
      '1. 上传人物照片（正面最佳）',
      '2. 使用 --cref 或 /describe 获取风格',
      '3. 添加角色描述如"3D Pixar style"',
      '4. 使用 --cw 50-100 调整相似度',
      '5. 可多次生成选择最佳'
    ]
  },
  // GPT角色
  {
    id: 'gpt-1',
    title: '技术面试官',
    prompt: '你是一位经验丰富的技术面试官，具有10年以上的大厂面试经验。请对候选人进行结构化面试，包括：1. 自我介绍环节 2. 技术基础知识考察 3. 项目经验深挖 4. 算法与系统设计 5. 候选人提问环节。请保持专业、友善的态度，根据候选人的回答灵活调整问题难度。',
    category: 'gpt',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    steps: [
      '1. 将Prompt复制到ChatGPT/Claude',
      '2. 开始前说明自己的技术背景',
      '3. 如实回答每个问题',
      '4. 面试结束后询问改进建议',
      '5. 记录面试表现持续练习'
    ]
  },
  {
    id: 'gpt-2',
    title: '写作教练',
    prompt: '你是一位资深写作教练，擅长各类文章写作。你会帮助用户：1. 分析文章结构和逻辑 2. 优化语言表达和用词 3. 提供具体的修改建议 4. 示范优秀写作案例 5. 布置写作练习。请用专业、耐心的态度指导每次写作提升。',
    category: 'gpt',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    steps: [
      '1. 将Prompt复制到ChatGPT/Claude',
      '2. 提供你想要润色的文章',
      '3. 询问具体的改进建议',
      '4. 根据建议修改后再提交',
      '5. 学习不同文体的写作技巧'
    ]
  },
  {
    id: 'gpt-3',
    title: '英语外教',
    prompt: 'You are a patient and experienced English teacher who helps students practice conversation. You will: 1. Start with warm-up questions on various topics 2. Correct grammar and pronunciation gently 3. Suggest better expressions naturally 4. Explain cultural context when needed 5. Provide encouragement and positive feedback. Please speak slowly and clearly.',
    category: 'gpt',
    gradient: 'from-rose-400 via-pink-400 to-fuchsia-400',
    steps: [
      '1. 将Prompt复制到ChatGPT/Claude',
      '2. 选择一个感兴趣的话题',
      '3. 用英语自由对话',
      '4. 让老师纠正你的错误',
      '5. 记录新学的表达方式'
    ]
  }
];

// 分类配置
const categories: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'midjourney', label: '🎨 Midjourney', icon: <Palette className="w-4 h-4" /> },
  { key: 'img2img', label: '🖼️ 图生图', icon: <Wand2 className="w-4 h-4" /> },
  { key: 'gpt', label: '🎭 GPT角色', icon: <User className="w-4 h-4" /> }
];

export const AIGCTemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>('midjourney');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = templates.filter(t => t.category === activeTab);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('已复制到剪贴板！');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI创作灵感库</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            AIGC <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">提示词模板</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            精选优质Prompt模板，点击复制即可使用。让AI创作更高效！
          </p>
        </div>

        {/* Tab切换 */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="inline-flex bg-white/5 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`
                  px-4 md:px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  flex items-center gap-2
                  ${activeTab === cat.key 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.label.replace(/^[^\s]+\s/, '')}</span>
                <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 模板卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="group cursor-pointer bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              {/* 预览图区域 */}
              <div className={`h-32 bg-gradient-to-br ${template.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/30 text-6xl font-bold opacity-20">
                    {template.title.charAt(0)}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* 内容区域 */}
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                  {template.title}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                  {template.prompt.length > 80 ? template.prompt.slice(0, 80) + '...' : template.prompt}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-400">该分类下暂无模板</p>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedTemplate && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div 
            className="bg-slate-900 rounded-3xl border border-white/10 max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className={`h-36 bg-gradient-to-br ${selectedTemplate.gradient} relative`}>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white mb-1">{selectedTemplate.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-white/80 text-xs">
                    {categories.find(c => c.key === selectedTemplate.category)?.label.split(' ')[1]}
                  </span>
                </div>
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-5 max-h-[calc(85vh-14rem)] overflow-y-auto">
              {/* Prompt区域 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-300">Prompt提示词</h3>
                  <button
                    onClick={() => handleCopy(selectedTemplate.prompt, selectedTemplate.id)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${copiedId === selectedTemplate.id 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                      }
                    `}
                  >
                    {copiedId === selectedTemplate.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedTemplate.prompt}
                  </p>
                </div>
              </div>

              {/* 操作步骤 */}
              {selectedTemplate.steps && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">使用步骤</h3>
                  <div className="space-y-2">
                    {selectedTemplate.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-medium mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-gray-400 text-sm leading-relaxed pt-0.5">
                          {step.replace(/^\d+\.\s*/, '')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 底部按钮 */}
              <div className="pt-4 border-t border-white/10">
                <a
                  href="https://www.coze.cn/store/market/bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-400 transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Sparkles className="w-5 h-5" />
                  用这个模板创作
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGCTemplatesPage;
