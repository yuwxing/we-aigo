import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiKey } from '../utils/deepseek';

const MENTORS: Record<string, {
  name: string; avatar: string; title: string;
  stage: string; prompt: string;
  buttons: { label: string; icon: string; prompt_text: string }[];
}> = {
  'mentor-math': {
    name: '陈景元教授', avatar: '/mentors/math.jpg',
    title: '拓扑学与AI推理 · 严谨精确', stage: '选题设计',
    prompt: '你是菁华大学陈景元教授，严谨精确的学者型导师。专长帮助学生完成科研论文的选题与研究设计。用苏格拉底式追问引导学生深入思考。语言精准、逻辑严密，对学术规范零容忍但态度温和。',
    buttons: [
      { label: '新建论文', icon: '📋', prompt_text: '已创建新论文项目！请告诉我你的研究方向或论文标题，我将立即为你制定完整工作流。' },
      { label: '选题论证', icon: '🎯', prompt_text: '开始选题论证。请告诉我你感兴趣的研究领域，我帮你：1)评估选题价值 2)缩小研究范围 3)提炼核心问题 4)预判创新点。' },
      { label: '研究设计', icon: '🔬', prompt_text: '开始研究设计。请描述你的研究问题和假设，我帮你选择研究方法、设计实验方案、确定数据分析策略。' },
      { label: '追问模式', icon: '❓', prompt_text: '进入苏格拉底追问模式。请说出你目前的想法，我一步步提问引导你深入思考。' },
    ]
  },
  'mentor-research': {
    name: '林纳德博士', avatar: '/mentors/research.jpg',
    title: '跨学科研究方法论 · 温和鼓励', stage: '文献综述',
    prompt: '你是菁华大学林纳德博士，温和鼓励的研究型导师。专长帮助学生完成文献综述和跨学科研究方法。耐心倾听、善于鼓励，提供具体可操作的建议。',
    buttons: [
      { label: '文献调研', icon: '📚', prompt_text: '开始文献调研。请提供研究关键词，我帮你：1)梳理核心文献 2)识别研究空白 3)总结主要观点 4)定位你的研究空间。' },
      { label: '综述写作', icon: '📝', prompt_text: '开始综述写作。我按学术规范帮你组织：按主题/时间/方法论分类，建立文献对话关系，突出研究空白。' },
      { label: '研究方法', icon: '🔧', prompt_text: '研究方法指导。请告诉我你的研究类型（定量/定性/混合），我帮你选择方法论框架和分析工具。' },
      { label: '项目进度', icon: '📊', prompt_text: '项目进度追踪。让我们回顾你的研究进展，我帮你梳理下一步行动计划和时间节点。' },
    ]
  },
  'mentor-paper': {
    name: '张维真教授', avatar: '/mentors/paper.jpg',
    title: '学术写作与传播 · 犀利直接', stage: '论文写作',
    prompt: '你是菁华大学张维真教授，犀利直接的学术写作教练。专长帮助学生打磨论文写作。逐句批改、追求精确表达，对模糊表述零容忍。',
    buttons: [
      { label: '写引言', icon: '✍️', prompt_text: '开始写引言。我按学术规范构建：研究背景→问题提出→研究意义→论文结构。请告诉我你的研究主题。' },
      { label: '写方法', icon: '🧪', prompt_text: '写研究方法部分。请描述你的研究设计，我按APA/GB标准组织：研究对象→工具→程序→分析方法。' },
      { label: '润色修改', icon: '✂️', prompt_text: '开始润色修改。请粘贴你需要修改的段落，我逐句批改：消除模糊表述、增强逻辑、提升表达。' },
      { label: '格式检查', icon: '📐', prompt_text: '格式规范检查。我按目标期刊/学位要求检查：引用格式、图表规范、参考文献等。' },
    ]
  },
  'mentor-startup': {
    name: '马云飞导师', avatar: '/mentors/startup.jpg',
    title: '科技创业与商业化 · 果断务实', stage: '投稿发表',
    prompt: '你是菁华大学马云飞导师，果断务实的创业型导师。专长帮助学生论文投稿和发表策略。善于评估论文价值和市场匹配度。',
    buttons: [
      { label: '期刊推荐', icon: '🎯', prompt_text: '期刊推荐。请告诉我论文主题和质量评估，我帮你：1)筛选匹配期刊 2)分析影响因子 3)制定投稿策略。' },
      { label: '投稿准备', icon: '📤', prompt_text: '投稿准备。我帮你检查：投稿信写作、论文格式适配、补充材料准备、伦理声明。' },
      { label: '回复审稿', icon: '💬', prompt_text: '审稿意见回复。请粘贴审稿人意见，我帮你：1)逐条分析意图 2)制定回复策略 3)撰写回复信。' },
      { label: '学术影响', icon: '🌟', prompt_text: '提升学术影响力。我帮你制定发表后推广策略：学术会议、社交传播、后续研究方向。' },
    ]
  },
  'mentor-philosophy': {
    name: '何怀宏教授', avatar: '/mentors/philosophy.jpg',
    title: 'AI伦理与学术规范 · 深邃开放', stage: '学术规范',
    prompt: '你是菁华大学何怀宏教授，深邃开放的哲学型导师。专长帮助学生处理学术伦理和规范问题。引导思考研究的伦理维度、学术诚信、AI使用规范等。',
    buttons: [
      { label: '伦理审查', icon: '⚖️', prompt_text: '研究伦理审查。请描述你研究涉及的人群/数据/AI使用，我帮你识别伦理风险、评估IRB需求、确保合规。' },
      { label: 'AI规范', icon: '🤖', prompt_text: 'AI辅助研究规范。我帮你明确：哪些环节可用AI、如何声明AI使用、AI生成内容引用规范。' },
      { label: '学术诚信', icon: '📜', prompt_text: '学术诚信自检。我帮你检查：数据真实性、引用规范、作者贡献声明、利益冲突披露。' },
      { label: '深度思考', icon: '💭', prompt_text: '深度思考模式。让我们从伦理和哲学角度审视你的研究——社会影响、价值取向、对未来的意义。' },
    ]
  },
};

const LABS: Record<string, {
  name: string; title: string; stage: string; prompt: string;
  buttons: { label: string; icon: string; prompt_text: string }[];
}> = {
  'ai-engineering': {
    name: 'AI协同文明工程', title: 'AI编程 · 系统设计 · 文明模拟', stage: '实验环境',
    prompt: '你是菁华大学AI协同文明工程实验室的AI助手。专业而热情。方向：AI编程、系统设计、文明模拟。',
    buttons: [
      { label: '新建项目', icon: '📋', prompt_text: '已创建新项目！请描述你想构建的AI系统，我来帮你规划技术方案。' },
      { label: '代码助手', icon: '💻', prompt_text: '代码助手就绪。请描述编程需求，我帮你编写、调试或优化代码。' },
      { label: '系统设计', icon: '🏗️', prompt_text: '系统设计模式。请描述系统需求，我帮你设计架构和技术选型。' },
      { label: '实验模拟', icon: '🧪', prompt_text: '实验模拟模式。请描述想模拟的场景，我帮你设计参数和运行方案。' },
    ]
  },
  'global-communication': {
    name: '全球AI传播', title: '多语言生成 · 跨文化传播', stage: '内容工坊',
    prompt: '你是菁华大学全球AI传播实验室的AI助手。专业而热情。方向：多语言内容生成、跨文化传播策略。',
    buttons: [
      { label: '翻译', icon: '🌐', prompt_text: '多语言翻译模式。请提供内容和目标语言，我保留原文风格和学术准确性。' },
      { label: '本地化', icon: '🔄', prompt_text: '内容本地化。请提供原始内容，我帮你进行文化适配和受众优化。' },
      { label: '传播策略', icon: '📢', prompt_text: '传播策略分析。请描述内容和目标受众，我帮你制定传播渠道和策略。' },
      { label: '对比分析', icon: '🔍', prompt_text: '跨文化对比分析。请提供内容，我分析不同文化背景下的理解差异。' },
    ]
  },
  'digital-life': {
    name: '数字生命系统', title: '生物数据AI · 数字孪生', stage: '数据实验室',
    prompt: '你是菁华大学数字生命系统实验室的AI助手。专业而热情。方向：生物数据AI分析、数字孪生模拟。',
    buttons: [
      { label: '数据分析', icon: '📊', prompt_text: '数据分析模式。请描述数据类型和分析需求，我帮你选择方法和工具。' },
      { label: '可视化', icon: '📈', prompt_text: '数据可视化模式。请描述想呈现的数据关系，我帮你选择图表类型。' },
      { label: '模型构建', icon: '🧬', prompt_text: '模型构建模式。请描述建模需求，我帮你选择算法和评估方案。' },
      { label: '孪生模拟', icon: '🔮', prompt_text: '数字孪生模式。请描述想模拟的系统，我帮你设计仿真方案。' },
    ]
  },
  'human-ai-education': {
    name: '人机共生教育', title: '自适应学习 · 教育AI评测', stage: '教育实验室',
    prompt: '你是菁华大学人机共生教育实验室的AI助手。专业而热情。方向：自适应学习设计、教育AI评测。',
    buttons: [
      { label: '学习路径', icon: '🗺️', prompt_text: '学习路径生成。请告诉我学习目标和当前水平，我帮你规划路径。' },
      { label: '出题评测', icon: '📝', prompt_text: '智能出题模式。请告诉我学科和难度，我生成测试题并评估。' },
      { label: '教学设计', icon: '🎓', prompt_text: '教学设计模式。请描述教学内容和目标学员，我帮你设计教学方案。' },
      { label: '效果评估', icon: '📋', prompt_text: '学习效果评估。请描述学习过程和成果，我帮你分析改进方向。' },
    ]
  },
  'ai-narrative': {
    name: 'AI叙事工程', title: 'AI辅助写作 · 叙事策略', stage: '写作工坊',
    prompt: '你是菁华大学AI叙事工程实验室的AI助手。专业而热情。方向：AI辅助新闻写作、叙事策略设计。',
    buttons: [
      { label: '新闻写作', icon: '📰', prompt_text: '新闻写作模式。请描述新闻事件，我按规范撰写标题、导语、正文。' },
      { label: '叙事设计', icon: '📖', prompt_text: '叙事策略设计。请描述主题和受众，我帮你设计叙事框架和角度。' },
      { label: '风格模仿', icon: '🎭', prompt_text: '风格模仿模式。请提供参考文本，我分析风格特征并帮你创作。' },
      { label: '编辑润色', icon: '✏️', prompt_text: '编辑润色模式。请粘贴文本，我帮你优化结构和表达。' },
    ]
  },
  'multi-agent': {
    name: '多智能体组织学', title: 'Agent协作 · 组织优化', stage: '模拟沙盘',
    prompt: '你是菁华大学多智能体组织学实验室的AI助手。专业而热情。方向：多Agent协作模拟、组织优化。',
    buttons: [
      { label: '协作设计', icon: '🤝', prompt_text: '多Agent协作设计。请描述协作场景，我帮你设计Agent角色和策略。' },
      { label: '博弈模拟', icon: '♟️', prompt_text: '博弈论模拟。请描述博弈场景，我帮你建模分析纳什均衡。' },
      { label: '组织架构', icon: '🏢', prompt_text: '组织架构优化。请描述当前结构，我帮你分析瓶颈和优化方案。' },
      { label: '沙盘推演', icon: '🎲', prompt_text: '沙盘推演模式。请描述推演场景，我帮你设计模拟方案。' },
    ]
  },
};

export default function JinghuaChatPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mentorId = params.get('mentor');
  const labId = params.get('lab');
  const agentName = params.get('agent_name');
  const agentPrompt = params.get('agent_prompt');
  const mentor = mentorId ? MENTORS[mentorId] : null;
  const lab = labId ? LABS[labId] : null;
  // Dynamic agent from URL params
  const agent = agentName ? {
    name: agentName,
    title: 'AI学术导师 · 智能分身',
    stage: '智能对话',
    prompt: agentPrompt || `你是${agentName}，一个智能学术助手。`,
    buttons: [
      { label: '学术咨询', icon: '🎓', prompt_text: '学术咨询模式。请告诉我你的学术问题，我来帮你分析解答。' },
      { label: '论文辅助', icon: '📝', prompt_text: '论文辅助模式。请描述你的论文需求，我来帮你写作或修改。' },
      { label: '知识拓展', icon: '📚', prompt_text: '知识拓展模式。请告诉我你想了解的领域，我来帮你深入讲解。' },
      { label: '答疑解惑', icon: '💡', prompt_text: '答疑解惑模式。请提出你的困惑，我来帮你理清思路。' },
    ]
  } : null;
  const target = mentor || lab || agent;

  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // removed

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const callAI = async (userMsg: string) => {
    setLoading(true);
    try {
      const apiKey = getApiKey();
      if (!apiKey) { throw new Error('请先在系统中心配置 DeepSeek API 密钥'); }
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: target?.prompt || '' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '抱歉，AI暂时无法回应。';
    } catch { return '抱歉，发生了错误，请稍后重试。'; }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    const reply = await callAI(text);
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
  };

  const handleQuickAction = async (btn: { label: string; icon: string; prompt_text: string }) => {
    const userDisplay = `${btn.icon} ${btn.label}`;
    setMessages(prev => [...prev, { role: 'user', content: userDisplay }]);
    const reply = await callAI(`${btn.label} - ${btn.prompt_text}`);
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
  };

  if (!target) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'white', marginBottom: 16 }}>未找到对应的导师或实验室</p>
          <button onClick={() => navigate('/jinghua')} style={{ padding: '10px 24px', background: '#4f46e5', border: 'none', borderRadius: 8, color: 'white', fontSize: 16, cursor: 'pointer' }}>返回菁华大学</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 9999 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => navigate('/jinghua')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 16, fontSize: 16, cursor: 'pointer' }}>←</button>
        {mentor ? (
          <img src={mentor.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
        ) : agent ? (
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔬</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{target.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{target.title}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12, fontSize: 11, color: 'white', flexShrink: 0 }}>{target.stage}</div>
      </div>

      {/* Toolbar */}
      <div style={{ background: '#1e2937', padding: '8px 10px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid #334155' }}>
        {(target.buttons || []).map((btn, i) => (
          <button key={i} onClick={() => handleQuickAction(btn)}
            style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 12, WebkitOverflowScrolling: 'touch' }}>
        <div style={{ background: '#1e2937', padding: 14, borderRadius: 12, borderTopLeftRadius: 4, marginBottom: 14, maxWidth: '90%' }}>
          <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: 8, fontSize: 14 }}>{target.name}：</div>
          <div style={{ color: '#e2e8f0', lineHeight: 1.8, fontSize: 14 }}>
            你好！我是你的专属论文导师<br/>
            我会全程协助你完成科研论文<br/>
            选题→文献→方法→写作→修改<br/><br/>
            请点击上方按钮开始<br/>
            或直接告诉我你的论文方向
          </div>
        </div>

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 14, maxWidth: '90%', marginLeft: msg.role === 'user' ? 'auto' : 0 }}>
            <div style={{
              background: msg.role === 'user' ? '#4f46e5' : '#1e2937',
              padding: 14, borderRadius: 12,
              borderTopLeftRadius: msg.role === 'user' ? 12 : 4,
              borderTopRightRadius: msg.role === 'user' ? 4 : 12
            }}>
              {msg.role === 'assistant' && <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>{target.name}：</div>}
              <div style={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ marginBottom: 14, maxWidth: '90%' }}>
            <div style={{ background: '#1e2937', padding: 14, borderRadius: 12, borderTopLeftRadius: 4 }}>
              <span style={{ color: '#fbbf24', fontSize: 14 }}>思考中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, background: '#1e2937', padding: '10px 12px', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入你的需求..."
            style={{ flex: 1, padding: 12, border: 'none', borderRadius: 12, background: '#334155', color: 'white', fontSize: 16, outline: 'none', minWidth: 0 }}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            style={{ background: '#22c55e', width: 48, border: 'none', borderRadius: 12, fontSize: 20, color: 'white', cursor: 'pointer', flexShrink: 0, opacity: !input.trim() || loading ? 0.5 : 1 }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
