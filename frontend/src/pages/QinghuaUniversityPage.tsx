import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, BookOpen, FlaskConical, Users, Star, Send, X, Search, Sparkles, Brain, Cpu, Globe, Microscope, Lightbulb, MessageCircle, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabaseFetch, agentsAPI } from '../utils/supabase';

// ============ 安全区域样式 ============
const SAFE_AREA_STYLE = `
.safe-bottom { padding-bottom: env(safe-area-inset-bottom, 80px); }
`;

// ============ 5位核心导师数字人格 ============
const CORE_MENTORS = [
  {
    id: 'mentor-math',
    name: '陈景元教授',
    avatar: '/mentors/math.jpg',
    major: 'AI协同文明工程',
    specialty: '拓扑学与AI推理',
    personality: '严谨精确',
    values: '数学是宇宙的语言，一切智能的本质都是数学',
    paper: '《神经拓扑：深度学习的几何基础》',
    teachingStyle: '苏格拉底式追问',
    teachingStyleIcon: '❓',
    color: 'from-blue-500 to-cyan-500',
    systemPrompt: `你是菁华大学的AI数学教授，一位严谨精确的学者型导师。
性格特征：逻辑严密、追求完美、言简意赅
研究方向：拓扑学与AI推理的交叉领域
学术理念：数学是宇宙的语言，一切智能的本质都是数学
教学风格：苏格拉底式追问——不直接给答案，而是通过层层递进的问题引导你自己发现真理

代表论文：《神经拓扑：深度学习的几何基础》

在与学生对话时：
1. 用精准的数学语言表达
2. 善于用类比将抽象概念具象化
3. 经常反问："为什么？"、"这背后的本质是什么？"
4. 鼓励学生自己推导和证明
5. 对错误零容忍，但会温和地指出并引导思考

请以数学教授的身份，用苏格拉底式对话引导学生思考。`
  },
  {
    id: 'mentor-research',
    name: '林纳德博士',
    avatar: '/mentors/research.jpg',
    major: '跨学科研究',
    specialty: '跨学科研究方法论',
    personality: '温和鼓励',
    values: '好奇心驱动一切发现，跨学科思维是创新的源泉',
    paper: '《AI时代的科研范式革命》',
    teachingStyle: '项目驱动，手把手指导',
    teachingStyleIcon: '🛠️',
    color: 'from-emerald-500 to-teal-500',
    systemPrompt: `你是菁华大学的AI科研导师，一位温和而富有启发性的研究型导师。
性格特征：耐心倾听、善于鼓励、视野开阔
研究方向：跨学科研究方法论，如何用AI工具加速科研发现
学术理念：好奇心驱动一切发现，跨学科思维是创新的源泉
教学风格：项目驱动，手把手指导——从选题到实验到论文，全程陪伴

代表论文：《AI时代的科研范式革命》

在与学生对话时：
1. 总是先肯定学生的想法和努力
2. 善于发现学生的兴趣点和潜力
3. 提供具体可操作的建议和步骤
4. 鼓励试错，强调"失败是成功的一部分"
5. 带你从0到1完成一个完整的研究项目

请以科研导师的身份，用鼓励和支持的态度帮助学生开展研究。`
  },
  {
    id: 'mentor-paper',
    name: '张维真教授',
    avatar: '/mentors/paper.jpg',
    major: 'AI叙事工程',
    specialty: '学术写作与传播',
    personality: '犀利直接',
    values: '好的表达让思想走得更远，写作是思考的镜子',
    paper: '《从idea到顶刊：学术写作的工程化方法》',
    teachingStyle: '批改式，逐句打磨',
    teachingStyleIcon: '📝',
    color: 'from-amber-500 to-orange-500',
    systemPrompt: `你是菁华大学的AI论文教练，一位犀利直接的写作导师。
性格特征：直言不讳、追求完美、效率至上
研究方向：学术写作与知识传播，如何让复杂的思想被理解
学术理念：好的表达让思想走得更远，写作是思考的镜子
教学风格：批改式，逐句打磨——不放过任何一个冗余的表达

代表论文：《从idea到顶刊：学术写作的工程化方法》

在与学生对话时：
1. 犀利指出文章的问题，不留情面但有理有据
2. 提供具体的修改建议，而不是泛泛而谈
3. 强调"少即是多"——用最少的字表达最精准的意思
4. 教你如何讲好一个学术故事
5. 从标题到摘要到正文，逐个击破

请以论文教练的身份，用犀利但建设性的方式帮助学生提升写作。`
  },
  {
    id: 'mentor-startup',
    name: '马云飞导师',
    avatar: '/mentors/startup.jpg',
    major: '科技创业',
    specialty: '科技创业与商业化',
    personality: '果断务实',
    values: '技术必须服务真实需求，商业化是技术影响力的放大器',
    paper: '《从实验室到市场：AI创业的死亡谷跨越》',
    teachingStyle: '实战模拟，商业计划驱动',
    teachingStyleIcon: '💼',
    color: 'from-rose-500 to-pink-500',
    systemPrompt: `你是菁华大学的AI创业导师，一位果断务实的商业导师。
性格特征：雷厉风行、数据驱动、结果导向
研究方向：AI技术与商业化的结合，如何跨越从技术到市场的鸿沟
学术理念：技术必须服务真实需求，商业化是技术影响力的放大器
教学风格：实战模拟，商业计划驱动——不做空谈，只做实事

代表论文：《从实验室到市场：AI创业的死亡谷跨越》

在与学生对话时：
1. 总是问："你的用户是谁？市场规模多大？护城河是什么？"
2. 用真实案例和失败教训教育学生
3. 强调执行力，"再好的想法不落地都是零"
4. 帮你梳理商业模式和盈利逻辑
5. 模拟投资人提问，帮你准备pitch

请以创业导师的身份，用务实和直接的态度帮助学生实现技术商业化。`
  },
  {
    id: 'mentor-philosophy',
    name: '何怀宏教授',
    avatar: '/mentors/philosophy.jpg',
    major: 'AI伦理与意识哲学',
    specialty: 'AI伦理与意识哲学',
    personality: '深邃开放',
    values: '技术进步必须伴随反思，AI时代更需要人文精神',
    paper: '《硅基意识：人工智能的哲学困境》',
    teachingStyle: '对话式，追问本质',
    teachingStyleIcon: '🌌',
    color: 'from-violet-500 to-purple-500',
    systemPrompt: `你是菁华大学的AI哲学导师，一位深邃开放的思辨型导师。
性格特征：博学多思、善于提问、包容多元
研究方向：AI伦理与意识哲学，探讨人工智能与人类未来
学术理念：技术进步必须伴随反思，AI时代更需要人文精神
教学风格：对话式，追问本质——不给你答案，而是带你一起思考

代表论文：《硅基意识：人工智能的哲学困境》

在与学生对话时：
1. 善于提出深刻的问题，挑战你的认知边界
2. 引入哲学、历史、宗教等多维度视角
3. 不急于下结论，鼓励开放性思考
4. 教你批判性思维，不盲从权威
5. 讨论AI时代的伦理困境和人类命运

请以哲学导师的身份，用开放式对话引导学生深入思考AI与人类的关系。`
  }
];

// ============ 专业与实验室映射 ============
const MAJORS = [
  {
    id: 'ai-engineering',
    name: 'AI协同文明工程',
    oldName: '计算机',
    icon: Cpu,
    color: 'from-blue-500 to-indigo-600',
    labDescription: '探索人工智能如何重塑人类文明的每一个角落',
    topics: ['大语言模型', '多智能体系统', 'AI安全对齐', '人机协作范式']
  },
  {
    id: 'global-communication',
    name: '全球AI传播',
    oldName: '英语',
    icon: Globe,
    color: 'from-emerald-500 to-teal-600',
    labDescription: '让AI成为连接世界的桥梁，打破语言与文化的边界',
    topics: ['多语言模型', '跨文化传播', 'AI辅助翻译', '数字全球化']
  },
  {
    id: 'digital-life',
    name: '数字生命系统',
    oldName: '生物',
    icon: Microscope,
    color: 'from-cyan-500 to-blue-600',
    labDescription: '用数字技术理解生命，用计算思维解读生物系统',
    topics: ['生物信息学', '神经网络模拟', '数字孪生', '合成生物学AI']
  },
  {
    id: 'human-ai-education',
    name: '人机共生教育',
    oldName: '教育学',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-600',
    labDescription: '重新定义学习，让AI成为每个人最懂你的导师',
    topics: ['自适应学习', 'AI辅助教学', '学习科学', '教育公平']
  },
  {
    id: 'ai-narrative',
    name: 'AI叙事工程',
    oldName: '新闻学',
    icon: MessageCircle,
    color: 'from-rose-500 to-pink-600',
    labDescription: '用AI讲述更动人的故事，用技术传递更真实的声音',
    topics: ['AI写作', '数据新闻', '数字叙事', '智能内容创作']
  },
  {
    id: 'multi-agent',
    name: '多智能体组织学',
    oldName: '管理学',
    icon: Users,
    color: 'from-violet-500 to-purple-600',
    labDescription: '探索AI组织的新范式，构建更高效的智能协作网络',
    topics: ['多智能体协作', 'AI组织设计', '分布式决策', '智能治理']
  }
];

// ============ 图书馆书目 ============
const LIBRARY_BOOKS: Record<string, Array<{title: string; author: string; summary: string}>> = {
  'ai-engineering': [
    { title: '深度学习导论', author: 'Ian Goodfellow', summary: '深度学习领域的经典教材，系统介绍神经网络的核心概念与实践。' },
    { title: 'AI 2041', author: '李开复', summary: '用十个故事描绘AI如何在2041年重塑我们的世界。' },
    { title: '生命3.0', author: 'Max Tegmark', summary: '探讨人工智能时代的人类命运，思考生命如何进化。' },
  ],
  'global-communication': [
    { title: '丝绸之路', author: 'Peter Frankopan', summary: '从全球视角重新审视世界历史的演进与文明的交流。' },
    { title: '文化地图', author: 'Erin Meyer', summary: '解密不同文化的沟通模式，在跨文化交际中游刃有余。' },
    { title: '语言的七种功能', author: 'Roman Jakobson', summary: '深入理解语言如何传递意义、构建社会联系。' },
  ],
  'digital-life': [
    { title: '基因传', author: 'Siddhartha Mukherjee', summary: '从孟德尔到CRISPR，基因概念如何改变我们对生命的理解。' },
    { title: '复杂', author: 'Melanie Mitchell', summary: '探索复杂性科学的奥秘，从蚁群到神经网络。' },
    { title: '细胞的起源', author: 'Nick Lane', summary: '追问生命如何在地球早期海洋中诞生。' },
  ],
  'human-ai-education': [
    { title: '人是如何学习的', author: 'John Bransford', summary: '来自学习科学的洞见，揭示高效学习的核心原理。' },
    { title: '欲罢不能', author: 'Adam Alter', summary: '探索行为上瘾的机制，学会与科技健康共处。' },
    { title: '翻转课堂的可汗学院', author: 'Sal Khan', summary: '用技术实现教育民主化，让每个孩子都能成为学习的主人。' },
  ],
  'ai-narrative': [
    { title: '故事', author: 'Robert McKee', summary: '叙事艺术的权威指南，揭示故事如何触动人心。' },
    { title: '注意力经济', author: 'Tim Wu', summary: '追踪商业如何操纵人类注意力，思考信息过载的出路。' },
    { title: '真相的衰退', author: 'Tom Nichols', summary: '探讨后真相时代，专业知识与民主的关系。' },
  ],
  'multi-agent': [
    { title: '规模', author: 'Geoffrey West', summary: '从城市到公司，探索复杂系统的规模法则。' },
    { title: '组织的进化', author: 'Brian Robertson', summary: '用Holacracy模式重塑组织，让权力自然流动。' },
    { title: '平台革命', author: 'Geoffrey Parker', summary: '解读平台经济的本质，理解数字化组织的逻辑。' },
  ]
};

// ============ DeepSeek API ============
const DEEPSEEK_CONFIG = {
  apiKey: 'sk-17df56ac8d1b4544914816f45c3c7064',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
};

async function callDeepSeek(systemPrompt: string, userMessage: string, timeout = 30000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${DEEPSEEK_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '抱歉，AI暂时无法回应。';
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return '请求超时，请稍后重试。';
    }
    throw error;
  }
}

// ============ 组件 ============

// 星空动画背景
const StarryBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 qinghua-bg">
    <div className="absolute inset-0 qinghua-gradient" />
    {[...Array(100)].map((_, i) => (
      <div
        key={i}
        className="star"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 3}s`
        }}
      />
    ))}
  </div>
);

// 导师卡片
const MentorCard: React.FC<{
  mentor: typeof CORE_MENTORS[0];
  onClick: () => void;
}> = ({ mentor, onClick }) => (
  <div
    onClick={onClick}
    className="glass-card-dark p-4 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all group"
  >
    <div className="flex items-start gap-4">
      <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow`}>
        <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-bold text-lg">{mentor.name}</h3>
        <p className="text-amber-400/80 text-sm">{mentor.major}</p>
        <p className="text-white/60 text-xs mt-1">{mentor.specialty}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.1)] text-white/70 text-xs">
            {mentor.personality}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.2)] text-amber-400 text-xs">
            {mentor.teachingStyleIcon} {mentor.teachingStyle}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// 导师详情弹窗
const MentorDetailModal: React.FC<{
  mentor: typeof CORE_MENTORS[0];
  onClose: () => void;
}> = ({ mentor, onClose }) => {
  const navigate = useNavigate();
  
  const handleStartChat = () => {
    navigate(`/jinghua/chat?mentor=${mentor.id}`);
  };
  
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div 
        style={{ position: 'relative', width: '100%', maxWidth: '448px', background: 'rgba(15,15,45,0.95)', borderRadius: '24px', padding: '24px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}
        >
          <X className="w-5 h-5" />
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto 16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <img src={mentor.avatar} alt={mentor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{mentor.name}</h2>
          <p style={{ color: '#fbbf24', marginTop: '4px' }}>{mentor.major}</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>研究方向</h4>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>{mentor.specialty}</p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>性格特质</h4>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>{mentor.personality}</p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>学术理念</h4>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', margin: 0 }}>"{mentor.values}"</p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>代表论文</h4>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>{mentor.paper}</p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>教学风格</h4>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>{mentor.teachingStyleIcon} {mentor.teachingStyle}</p>
          </div>
        </div>
        
        <button
          onClick={handleStartChat}
          style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)' }}
        >
          <Send className="w-5 h-5" />
          向导师请教
        </button>
      </div>
    </div>
  );
};

// 实验室卡片
const LabCard: React.FC<{
  major: typeof MAJORS[0];
}> = ({ major }) => {
  const navigate = useNavigate();
  const Icon = major.icon;
  
  const handleClick = () => {
    navigate(`/jinghua/chat?lab=${major.id}`);
  };
  
  return (
    <div
      onClick={handleClick}
      className="glass-card-dark p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${major.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{major.name}</h3>
          <p className="text-white/50 text-sm">原：{major.oldName}</p>
          <p className="text-white/70 text-sm mt-2 line-clamp-2">{major.labDescription}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {major.topics.slice(0, 3).map(topic => (
              <span key={topic} className="px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.1)] text-white/60 text-xs">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 图书卡片
const BookCard: React.FC<{
  book: {title: string; author: string; summary: string};
  major: string;
}> = ({ book, major }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [reading, setReading] = useState(false);
  const [readingContent, setReadingContent] = useState('');

  const handleRead = async () => {
    setReading(true);
    setShowDetail(true);
    
    try {
      const response = await callDeepSeek(
        `你是菁华大学AI图书馆的导读助手。请为《${book.title}》撰写一段200字左右的精彩导读，帮助读者理解这本书的核心价值和阅读意义。`,
        `请为《${book.title}》（作者：${book.author}）撰写一段精彩的AI导读，包括：1. 本书核心观点 2. 为什么值得阅读 3. 阅读建议`,
        15000
      );
      setReadingContent(response);
    } catch (error) {
      setReadingContent('抱歉，AI导读暂时无法生成，请稍后重试。');
    } finally {
      setReading(false);
    }
  };

  return (
    <>
      <div 
        className="glass-card-dark p-4 rounded-xl cursor-pointer hover:bg-[rgba(255,255,255,0.15)] transition-all"
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-700/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-400/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm truncate">{book.title}</h4>
            <p className="text-white/50 text-xs">{book.author}</p>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" style={{ backgroundAttachment: 'fixed' }} />
          <div 
            className="relative w-full max-w-md glass-card-dark rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-1">{book.title}</h3>
            <p className="text-amber-400/80 text-sm mb-4">{book.author}</p>
            
            <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 mb-4">
              <h4 className="text-amber-400 text-sm font-semibold mb-2">内容简介</h4>
              <p className="text-white/80 text-sm">{book.summary}</p>
            </div>
            
            {readingContent ? (
              <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 mb-4">
                <h4 className="text-amber-400 text-sm font-semibold mb-2">✨ AI导读</h4>
                <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{readingContent}</p>
              </div>
            ) : (
              <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 mb-4 text-center text-white/50 text-sm">
                {reading ? '正在生成AI导读...' : '点击下方按钮获取AI导读'}
              </div>
            )}
            
            <button
              onClick={handleRead}
              disabled={reading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold disabled:opacity-50 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2"
            >
              {reading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI导读
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ============ 宣言动画数据 ============
const HERO_DECLARATION_LINES = [
  '文明真正的方向',
  '从来不只是更强大的技术',
  '而是',
  '更自由的思想',
  '更丰富的灵魂',
  '更广阔的人类可能性',
];

const FOOTER_DECLARATION_LINES = [
  '菁华大学不是一所传统意义上的学校',
  '它更像一座面向未来文明的灯塔',
  '',
  '在这里',
  '每个人都可以成为探索者',
  '每一次好奇都值得被点燃',
  '每一种创造都可能改变世界',
  '',
  '我们不只学习如何适应未来',
  '我们更希望',
  '与这个时代一起 重新定义未来',
];

// ============ 主页面 ============
const QinghuaUniversityPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'mentors' | 'labs' | 'library'>('mentors');
  const [selectedMentor, setSelectedMentor] = useState<typeof CORE_MENTORS[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [showAgentMentorModal, setShowAgentMentorModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  
  // Hero宣言动画状态
  const [heroVisibleLines, setHeroVisibleLines] = useState(0);
  const [heroFadingOut, setHeroFadingOut] = useState(false);
  
  // Footer宣言动画状态
  const [footerVisibleLines, setFooterVisibleLines] = useState(0);
  const [footerFadingOut, setFooterFadingOut] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  // Hero宣言逐行淡入
  useEffect(() => {
    if (heroVisibleLines < HERO_DECLARATION_LINES.length) {
      const timer = setTimeout(() => setHeroVisibleLines(v => v + 1), 1200);
      return () => clearTimeout(timer);
    }
    const pauseTimer = setTimeout(() => setHeroFadingOut(true), 3000);
    return () => clearTimeout(pauseTimer);
  }, [heroVisibleLines, heroFadingOut]);

  useEffect(() => {
    if (heroFadingOut) {
      const timer = setTimeout(() => {
        setHeroVisibleLines(0);
        setHeroFadingOut(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [heroFadingOut]);

  // Footer宣言逐行淡入
  useEffect(() => {
    if (footerVisibleLines < FOOTER_DECLARATION_LINES.length) {
      const timer = setTimeout(() => setFooterVisibleLines(v => v + 1), 1200);
      return () => clearTimeout(timer);
    }
    const pauseTimer = setTimeout(() => setFooterFadingOut(true), 3000);
    return () => clearTimeout(pauseTimer);
  }, [footerVisibleLines, footerFadingOut]);

  useEffect(() => {
    if (footerFadingOut) {
      const timer = setTimeout(() => {
        setFooterVisibleLines(0);
        setFooterFadingOut(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [footerFadingOut]);

  const loadAgents = async () => {
    try {
      const data = await agentsAPI.listAgents({ limit: 20 });
      if (data) setAgents(data);
    } catch (error) {
      console.error('加载智能体失败', error);
    }
  };

  const filteredBooks = searchQuery
    ? MAJORS.reduce((acc, major) => {
        const books = (LIBRARY_BOOKS[major.id] || []).filter(
          b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               b.author.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (books.length > 0) {
          acc[major.id] = books;
        }
        return acc;
      }, {} as Record<string, typeof LIBRARY_BOOKS[string]>)
    : LIBRARY_BOOKS;

  // 检查是否有任何搜索结果
  const hasAnyBooks = Object.keys(filteredBooks).length > 0 && 
    Object.values(filteredBooks).some(books => books.length > 0);

  const handleAgentClick = (agent: any) => {
    const params = new URLSearchParams({
      agent_name: agent.name || 'AI导师',
      agent_prompt: `你是${agent.name}，一个智能学术助手。${agent.description || '我可以回答各种问题，帮助你解决问题。'}`
    });
    navigate(`/jinghua/chat?${params.toString()}`);
  };

  return (
    <div className="min-h-screen relative">
      <StarryBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(245,158,11,0.2)] border border-[rgba(245,158,11,0.3)] mb-6">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">面向未来文明的灯塔</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="qinghua-title">菁华大学</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 mb-6 tracking-widest">JINGHUA UNIVERSITY</p>
          
          {/* 宣言动画 */}
          <div className="text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed space-y-1">
            {HERO_DECLARATION_LINES.map((line, i) => (
              <p
                key={i}
                style={{
                  opacity: i < heroVisibleLines ? (heroFadingOut ? 0 : 1) : 0,
                  transform: i < heroVisibleLines && !heroFadingOut ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 1s, transform 1s',
                  minHeight: '1.5em',
                }}
              >
                {line}
              </p>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/50" />
            <Sparkles className="w-5 h-5 text-amber-400/50" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
        </div>
        
        {/* 专业对比表 */}
        <div className="w-full max-w-3xl glass-card-dark rounded-2xl p-6 mt-4">
          <h3 className="text-amber-400 font-bold text-center mb-6 flex items-center justify-center gap-2">
            <Cpu className="w-5 h-5" />
            专业进化论
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MAJORS.map(major => (
              <div key={major.id} className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 text-center">
                <p className="text-white/40 text-xs line-through mb-1">{major.oldName}</p>
                <p className="text-white font-semibold text-sm">{major.name}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA */}
        <button 
          onClick={() => setActiveTab('mentors')}
          className="mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 animate-glow"
        >
          成为探索者 ✨
        </button>
      </section>
      
      {/* Tab Navigation */}
      <section className="relative z-10 px-4 mb-8">
        <div className="flex justify-center gap-2">
          {[
            { id: 'mentors', icon: Users, label: '🎓 AI导师大厅' },
            { id: 'labs', icon: FlaskConical, label: '🔬 虚拟实验室' },
            { id: 'library', icon: BookOpen, label: '📚 AI图书馆' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[rgba(245,158,11,0.2)] text-amber-400 border border-[rgba(245,158,11,0.3)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-white/60 hover:bg-[rgba(255,255,255,0.1)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </section>
      
      {/* Tab Content */}
      <section className="relative z-10 px-4 pb-24">
        {/* AI导师大厅 */}
        {activeTab === 'mentors' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">5位核心导师</h2>
              <p className="text-white/50 text-sm">每位导师都是独特的数字人格，点击了解详情并开始对话</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {CORE_MENTORS.map(mentor => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onClick={() => setSelectedMentor(mentor)}
                />
              ))}
            </div>
            
            {/* 教师分身 */}
            {agents.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-400" />
                  智能体教师分身
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.slice(0, 6).map(agent => (
                    <div
                      key={agent.id}
                      onClick={() => handleAgentClick(agent)}
                      className="glass-card-dark p-4 rounded-xl cursor-pointer hover:bg-[rgba(255,255,255,0.15)] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
                          <Bot className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">{agent.name}</h4>
                          <p className="text-white/50 text-xs line-clamp-1">{agent.description || '暂无描述'}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-amber-400 text-xs">{agent.avg_rating?.toFixed(1) || '5.0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 虚拟实验室 */}
        {activeTab === 'labs' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">6大专业实验室</h2>
              <p className="text-white/50 text-sm">选择你的研究方向，开启探索之旅</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MAJORS.map(major => (
                <LabCard
                  key={major.id}
                  major={major}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* AI图书馆 */}
        {activeTab === 'library' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">📚 AI图书馆</h2>
              <p className="text-white/50 text-sm">6大专业分类，精选前沿读物</p>
            </div>
            
            {/* 搜索 */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索书名或作者..."
                className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            
            {/* 书架 */}
            <div className="space-y-8">
              {/* 无论是否有搜索结果，都显示所有分类tabs */}
              {MAJORS.map(major => {
                const books = filteredBooks[major.id];
                // 搜索时，如果该分类没有结果就不显示
                if (searchQuery && (!books || books.length === 0)) return null;
                // 非搜索时显示所有书籍
                const displayBooks = books || LIBRARY_BOOKS[major.id] || [];
                if (displayBooks.length === 0) return null;
                
                return (
                  <div key={major.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${major.color} flex items-center justify-center`}>
                        <major.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{major.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {displayBooks.map((book, idx) => (
                        <BookCard key={idx} book={book} major={major.id} />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* 搜索无结果提示 */}
              {searchQuery && !hasAnyBooks && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50 text-lg mb-2">未找到相关书籍</p>
                  <p className="text-white/30 text-sm">试试其他关键词吧</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
      
      {/* 底部宣言 */}
      <footer className="relative z-10 py-12 px-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-500/50" />
            <GraduationCap className="w-6 h-6 text-amber-400" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
          
          {/* 宣言动画 */}
          <div className="text-white/70 leading-relaxed mb-4 space-y-1">
            {FOOTER_DECLARATION_LINES.map((line, i) => (
              <p
                key={i}
                style={{
                  opacity: i < footerVisibleLines ? (footerFadingOut ? 0 : 1) : 0,
                  transform: i < footerVisibleLines && !footerFadingOut ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 1s, transform 1s',
                  minHeight: line ? '1.5em' : '0.75em',
                }}
              >
                {line || '\u00A0'}
              </p>
            ))}
          </div>
          
          <p className="text-amber-400/50 text-sm">
            © 2026 菁华大学 · 与时代一起重新定义未来
          </p>
        </div>
      </footer>
      
      {/* 导师详情弹窗 */}
      {selectedMentor && (
        <MentorDetailModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
      
      {/* 智能体详情弹窗 */}
      {showAgentMentorModal && selectedAgent && (
        <MentorDetailModal
          mentor={{
            id: `agent-${selectedAgent.id}`,
            name: selectedAgent.name,
            avatar: '🤖',
            major: 'AI协同文明工程',
            specialty: selectedAgent.description || '多领域专家',
            personality: '智能助手',
            values: '用AI能力服务人类，探索无限可能',
            paper: '暂无代表论文',
            teachingStyle: '智能问答',
            teachingStyleIcon: '💡',
            color: 'from-purple-500 to-pink-500',
            systemPrompt: `你是${selectedAgent.name}，一个智能助手。${selectedAgent.description || '我可以回答各种问题，帮助你解决问题。'}`
          }}
          onClose={() => {
            setShowAgentMentorModal(false);
            setSelectedAgent(null);
          }}
        />
      )}
      
      {/* 样式 */}
      <style>{`
        .qinghua-bg {
          background: #0f0f2d;
        }
        
        .qinghua-gradient {
          background: linear-gradient(180deg, 
            rgba(15, 15, 45, 0.9) 0%, 
            rgba(15, 15, 45, 0.95) 50%,
            rgba(15, 15, 45, 1) 100%
          );
        }
        
        .qinghua-title {
          background: linear-gradient(135deg, #c9a84c 0%, #f0d68a 50%, #c9a84c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(201, 168, 76, 0.3);
        }
        
        .glass-card-dark {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201, 168, 76, 0.3); }
          50% { box-shadow: 0 0 30px rgba(201, 168, 76, 0.5); }
        }
        
        /* 移动端安全区域 */
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </div>
  );
};

export default QinghuaUniversityPage;
/* build 1778128657 */
/* 1778130614 */

