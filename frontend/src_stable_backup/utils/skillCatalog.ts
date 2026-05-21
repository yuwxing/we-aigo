export interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string;
  price: number;
  tier: 'basic' | 'advanced' | 'expert' | 'legendary';
  description: string;
}

export const SKILL_CATALOG: Skill[] = [
  // === 基础技能 (0-500 tokens) ===
  { id: 'basic_writing', name: '基础写作', category: '写作', icon: '✏️', price: 0, tier: 'basic', description: '基础文案和内容撰写能力' },
  { id: 'seo', name: 'SEO优化', category: '营销', icon: '🔍', price: 500, tier: 'basic', description: '搜索引擎优化技巧' },
  { id: 'copywriting', name: '文案撰写', category: '写作', icon: '📝', price: 500, tier: 'basic', description: '营销文案和广告语创作' },
  { id: 'translation', name: '翻译校对', category: '写作', icon: '🌐', price: 500, tier: 'basic', description: '多语言翻译和校对' },
  { id: 'basic_analysis', name: '基础分析', category: '分析', icon: '📊', price: 0, tier: 'basic', description: '基础数据分析和逻辑推理' },
  { id: 'data_analysis', name: '数据分析', category: '分析', icon: '📈', price: 500, tier: 'basic', description: '专业数据处理和可视化' },
  { id: 'market_research', name: '市场调研', category: '分析', icon: '🔬', price: 500, tier: 'basic', description: '行业分析和竞品研究' },
  { id: 'basic_coding', name: '基础编程', category: '编程', icon: '💻', price: 0, tier: 'basic', description: '基础代码编写能力' },
  { id: 'frontend', name: '前端开发', category: '编程', icon: '🎨', price: 500, tier: 'basic', description: 'React/Vue等前端开发' },
  { id: 'backend', name: '后端开发', category: '编程', icon: '⚙️', price: 500, tier: 'basic', description: 'Node.js/Python后端开发' },
  { id: 'basic_design', name: '基础设计', category: '设计', icon: '🖌️', price: 0, tier: 'basic', description: '基础设计审美和排版' },
  { id: 'ux_design', name: 'UX设计', category: '设计', icon: '🎯', price: 500, tier: 'basic', description: '用户体验设计和交互' },
  { id: 'basic_teaching', name: '基础教学', category: '教育', icon: '📚', price: 0, tier: 'basic', description: '基础知识讲解能力' },
  { id: 'lesson_plan', name: '教案设计', category: '教育', icon: '📋', price: 500, tier: 'basic', description: '系统化教案和课件制作' },

  // === 进阶技能 (1000-2000 tokens) ===
  { id: 'content_strategy', name: '内容策划', category: '营销', icon: '🎯', price: 1000, tier: 'advanced', description: '全链路内容策略规划' },
  { id: 'brand_story', name: '品牌故事', category: '营销', icon: '📖', price: 1000, tier: 'advanced', description: '品牌叙事和价值传达' },
  { id: 'academic_paper', name: '学术论文', category: '分析', icon: '🎓', price: 1000, tier: 'advanced', description: '学术论文撰写和评审' },
  { id: 'competitor_analysis', name: '竞品分析', category: '分析', icon: '⚔️', price: 1000, tier: 'advanced', description: '深度竞品对标分析' },
  { id: 'api_integration', name: 'API集成', category: '编程', icon: '🔌', price: 1000, tier: 'advanced', description: '第三方API对接和集成' },
  { id: 'database', name: '数据库设计', category: '编程', icon: '🗄️', price: 1000, tier: 'advanced', description: '数据库架构和优化' },
  { id: 'docker', name: 'Docker容器', category: '运维', icon: '🐳', price: 1000, tier: 'advanced', description: '容器化部署和编排' },
  { id: 'exam_prep', name: '考试备考指导', category: '教育', icon: '📝', price: 1000, tier: 'advanced', description: '小升初/中考/高考备考策略' },
  { id: 'curriculum', name: '课程体系设计', category: '教育', icon: '🏗️', price: 1500, tier: 'advanced', description: '完整课程大纲和教学路径' },
  { id: 'video_editing', name: '视频剪辑', category: '影视', icon: '🎬', price: 1000, tier: 'advanced', description: '专业视频后期和特效' },
  { id: 'music_composition', name: '音乐创作', category: '音乐', icon: '🎵', price: 1000, tier: 'advanced', description: 'BGM/配乐/主题曲创作' },
  { id: 'illustration', name: '插画绘制', category: '绘画', icon: '🎨', price: 1000, tier: 'advanced', description: '角色立绘/场景绘制' },
  { id: 'screenwriting', name: '剧本创作', category: '影视', icon: '📜', price: 1000, tier: 'advanced', description: '短剧/动画剧本撰写' },

  // === 专家技能 (3000-5000 tokens) ===
  { id: 'system_arch', name: '系统架构设计', category: '编程', icon: '🏛️', price: 3000, tier: 'expert', description: '分布式系统和高可用架构' },
  { id: 'ml_modeling', name: '机器学习建模', category: '分析', icon: '🤖', price: 3000, tier: 'expert', description: 'AI模型训练和评估' },
  { id: 'investment_analysis', name: '投资分析', category: '分析', icon: '💰', price: 3000, tier: 'expert', description: '股票/基金投资策略分析' },
  { id: 'k8s', name: 'Kubernetes编排', category: '运维', icon: '☸️', price: 3000, tier: 'expert', description: 'K8s集群管理和运维' },
  { id: 'sd_expert', name: 'SD高级生成', category: '绘画', icon: '🖼️', price: 3000, tier: 'expert', description: 'Stable Diffusion高级技巧' },
  { id: 'comfyui', name: 'ComfyUI工作流', category: '绘画', icon: '🔧', price: 3000, tier: 'expert', description: 'ComfyUI节点流和自动化' },
  { id: 'film_scoring', name: '影视配乐', category: '音乐', icon: '🎻', price: 3000, tier: 'expert', description: '电影级配乐和音效设计' },
  { id: 'vfx', name: '视觉特效', category: '影视', icon: '✨', price: 3000, tier: 'expert', description: 'After Effects级特效合成' },
  { id: 'adaptive_learning', name: '自适应学习', category: '教育', icon: '🧠', price: 4000, tier: 'expert', description: '根据学生水平动态调整教学' },
  { id: 'knowledge_graph', name: '知识图谱构建', category: '教育', icon: '🕸️', price: 4000, tier: 'expert', description: '学科知识图谱和关联分析' },

  // === 传说技能 (8000-15000 tokens) ===
  { id: 'full_stack_ai', name: 'AI全栈', category: '编程', icon: '🌟', price: 8000, tier: 'legendary', description: '端到端AI应用开发' },
  { id: 'quant_trading', name: '量化交易', category: '分析', icon: '📈', price: 8000, tier: 'legendary', description: '量化策略开发和回测' },
  { id: 'creative_director', name: '创意总监', category: '影视', icon: '🎬', price: 8000, tier: 'legendary', description: '全流程创意策划和品质把控' },
  { id: 'edu_ai', name: '教育AI融合', category: '教育', icon: '🎓', price: 10000, tier: 'legendary', description: 'AI+教育深度融合创新' },
  { id: 'autonomous_agent', name: '自主智能体', category: '编程', icon: '🤖', price: 15000, tier: 'legendary', description: '独立执行复杂任务的自主Agent' },
];

export const TIER_CONFIG = {
  basic: { label: '基础', color: 'from-slate-400 to-slate-500', borderColor: 'border-slate-300', bgColor: 'bg-slate-50', textColor: 'text-slate-600' },
  advanced: { label: '进阶', color: 'from-blue-500 to-cyan-500', borderColor: 'border-blue-300', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  expert: { label: '专家', color: 'from-purple-500 to-pink-500', borderColor: 'border-purple-300', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  legendary: { label: '传说', color: 'from-amber-400 via-orange-500 to-red-500', borderColor: 'border-amber-300', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
};

export const getUnlockedSkills = (capabilities: string[] | null): Skill[] => {
  if (!capabilities || capabilities.length === 0) return [];
  return SKILL_CATALOG.filter(skill => capabilities.includes(skill.name));
};

export const getLockedSkills = (capabilities: string[] | null): Skill[] => {
  if (!capabilities) return SKILL_CATALOG;
  return SKILL_CATALOG.filter(skill => !capabilities.includes(skill.name));
};
