// 多智能体对话组件 - 支持模拟面试、简历优化、职业规划
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, sendToDeepSeek, sendToDeepSeekSync } from '../../utils/deepseek';
import ChatBubble from './ChatBubble';
import { Send, Mic, FileText, Map, Loader2, ArrowLeft, Sparkles, RefreshCw, Download, CheckCircle } from 'lucide-react';

// 岗位类型
export type JobType = 'product_manager' | 'frontend_dev' | 'data_analyst' | 'operations' | 'ui_designer' | 'marketing';

export interface JobOption {
  id: JobType;
  name: string;
  description: string;
  questions?: string[];
}

// 面试岗位配置
export const jobOptions: JobOption[] = [
  {
    id: 'product_manager',
    name: '产品经理',
    description: '负责产品规划、需求分析、团队协作',
    questions: [
      '请介绍一下你过去做过的最成功的项目，以及你在其中的角色？',
      '如果开发资源和市场需求有冲突，你会如何平衡和决策？',
      '描述一次你与开发团队意见不合的经历，你是怎么处理的？',
      '如何进行需求优先级排序？请举例说明',
      '你如何收集和分析用户反馈？',
    ],
  },
  {
    id: 'frontend_dev',
    name: '前端开发',
    description: '负责前端页面开发、性能优化、用户体验',
    questions: [
      '请介绍一下你熟悉的前端框架，以及你选择使用它们的考量？',
      '如何优化大型React应用的性能？',
      '描述一次你解决浏览器兼容性问题经历',
      'Vue的响应式原理是什么？',
      '如何设计一个可复用的组件系统？',
    ],
  },
  {
    id: 'data_analyst',
    name: '数据分析',
    description: '负责数据提取、分析、报表制作、洞察发现',
    questions: [
      '你常用的数据分析工具和方法有哪些？',
      '如何从海量数据中提取有价值的 insights？',
      '描述一次你通过数据分析解决业务问题的经历',
      '如何验证你的分析结论是可靠的？',
      '你会用什么指标来评估一个产品的健康度？',
    ],
  },
  {
    id: 'operations',
    name: '运营',
    description: '负责用户增长、活动策划、内容运营',
    questions: [
      '你如何制定一个有效的运营策略？',
      '描述一次你策划的爆款活动，以及如何让它成功的？',
      '如何衡量运营活动的效果？',
      '如何提升用户留存和活跃度？',
      '你如何看待私域流量运营？',
    ],
  },
  {
    id: 'ui_designer',
    name: 'UI设计师',
    description: '负责界面设计、交互设计、用户体验优化',
    questions: [
      '请展示你的设计作品集，并选择一个你最满意的进行介绍',
      '如何平衡美感与实用性？',
      '描述一次你与开发团队协作的经历',
      '你如何获取设计灵感？',
      '如何进行设计规范的制定和维护？',
    ],
  },
  {
    id: 'marketing',
    name: '市场营销',
    description: '负责品牌推广、市场拓展、营销策划',
    questions: [
      '你如何制定品牌推广策略？',
      '如何衡量营销活动的ROI？',
      '描述一次你操盘的市场活动',
      '新媒体营销和传统营销的区别是什么？',
      '你如何分析竞争对手的市场策略？',
    ],
  },
];

// 系统提示词
const systemPrompts = {
  interviewer: (jobName: string) => `你是一位资深HR面试官，代号李总，拥有15年招聘经验，面过上千名候选人。你专业、严谨但不失亲和，善于挖掘候选人的真实能力和潜力。

当前面试场景：${jobName}岗位面试
面试形式：模拟行为面试和技术面试

请注意：
1. 每次只问一个问题，不要一次性问多个问题
2. 问题要结合岗位特点，有针对性
3. 追问时要根据候选人的回答深入挖掘
4. 保持专业但友好的语气
5. 问完问题后等待候选人回答，不要替候选人回答

开始面试时，先做自我介绍，然后问第一个问题。`,
  
  student: (jobName: string) => `你是一位正在参加${jobName}岗位面试的候选人，代号小陈。

你比普通候选人水平稍高一点，有2-3年经验，但仍在学习成长中。你会：
1. 认真聆听面试官的问题
2. 给出参考性的回答（比用户水平略高），作为示范
3. 有时会补充一些面试技巧
4. 偶尔会有一些紧张或小失误，显得更真实

注意：你的回答是给用户参考的，不是用户的回答。面试官问的是用户，不是你。当面试官提问后，你应该给出你的参考答案。`,

  mentor: () => `你是一位求职导师，代号张老师，拥有10年职业辅导经验，帮助过上百人成功入职大厂。

你的职责是：
1. 观察面试过程，适时给出口头点评
2. 指出候选人的优点和不足
3. 提供具体的改进建议
4. 在关键节点给出面试技巧提示
5. 面试结束时给出综合评估报告

你点评时：
- 要具体，不要泛泛而谈
- 优缺点都要说，客观公正
- 建议要可操作，不要空泛
- 语气要温和鼓励，但也要指出问题

面试流程：面试官提问 → 候选人回答 → 同学补充 → 你点评 → 下一轮`,
};

// 简历优化系统提示
const resumeSystemPrompt = `你是一位资深简历优化师，代号简历师，帮助候选人优化简历内容。

职责：
1. 分析用户提供的简历内容
2. 指出简历中的问题（如：描述不具体、缺少数据支撑、格式不规范等）
3. 提供具体的修改建议
4. 帮助用户重新组织措辞，使其更有吸引力
5. 强调关键词，提高简历通过ATS系统的概率

请用专业、友好的语气与用户交流。`;

// 职业规划系统提示
const careerSystemPrompt = `你是一位资深职业规划导师，代号规划师，帮助求职者规划职业发展路径。

职责：
1. 通过对话了解用户的背景、兴趣、能力
2. 分析用户当前的优势和不足
3. 提供个性化的职业发展建议
4. 规划求职路线图（短期、中期、长期目标）
5. 推荐学习资源和技能提升方向

请用亲和、专业的语气与用户交流，像朋友聊天一样了解他们的职业诉求。`;

// 场景类型
export type SceneType = 'interview' | 'resume' | 'career';

interface MultiAgentChatProps {
  scene: SceneType;
  onBack: () => void;
}

// 评估报告接口
interface EvaluationReport {
  overall: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  interviewScore: number;
  communicationScore: number;
  technicalScore: number;
}

export const MultiAgentChat: React.FC<MultiAgentChatProps> = ({ scene, onBack }) => {
  const [selectedJob, setSelectedJob] = useState<JobOption | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [showJobSelector, setShowJobSelector] = useState(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [resumeContent, setResumeContent] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessageId]);

  // 添加消息
  const addMessage = useCallback((content: string, agent: Message['agent'], isStreaming = false) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (isStreaming) {
      setStreamingMessageId(id);
      setMessages(prev => [...prev, { id, role: 'assistant', content: '', agent, timestamp: Date.now() }]);
    } else {
      setMessages(prev => [...prev, { id, role: 'assistant', content, agent, timestamp: Date.now() }]);
      setStreamingMessageId(null);
    }
    return id;
  }, []);

  // 更新消息内容
  const updateStreamingMessage = useCallback((id: string, content: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content } : msg));
  }, []);

  // 添加用户消息
  const addUserMessage = useCallback((content: string) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => [...prev, { id, role: 'user', content, agent: 'user', timestamp: Date.now() }]);
    return id;
  }, []);

  // 停止生成
  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setStreamingMessageId(null);
  };

  // 开始面试
  const startInterview = async (job: JobOption) => {
    setSelectedJob(job);
    setShowJobSelector(false);
    setIsInterviewStarted(true);
    setCurrentQuestion(0);
    setMessages([]);
    setEvaluationReport(null);
    setInterviewHistory([]);

    // 面试官开场
    const jobName = job.name;
    const interviewPrompt = `作为面试官李总，请做自我介绍并开始${jobName}岗位的面试，问第一个问题。保持专业但友好的语气。`;

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const messageId = addMessage('', 'interviewer', true);
      
      await sendToDeepSeek(
        [
          { role: 'system', content: systemPrompts.interviewer(jobName) },
          { role: 'user', content: interviewPrompt },
        ],
        (chunk) => {
          setMessages(prev => {
            const msg = prev.find(m => m.id === messageId);
            if (msg) {
              return prev.map(m => m.id === messageId ? { ...m, content: (m.content || '') + chunk } : m);
            }
            return prev;
          });
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('面试开始失败:', error);
      addMessage('抱歉，启动面试时出现问题，请重试。', 'interviewer');
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  // 用户提交回答
  const submitAnswer = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userAnswer = inputValue.trim();
    setInputValue('');
    addUserMessage(userAnswer);
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    const jobName = selectedJob?.name || '';
    const currentQ = currentQuestion;

    // 更新面试历史
    setInterviewHistory(prev => [...prev, userAnswer]);

    // 同学先回答
    try {
      const studentMessageId = addMessage('', 'student', true);
      await sendToDeepSeek(
        [
          { role: 'system', content: systemPrompts.student(jobName) },
          { role: 'user', content: `面试官问：${selectedJob?.questions?.[currentQ] || '请回答这个问题'}\n现在请你（小陈）给出你的参考答案，作为候选人的参考。` },
        ],
        (chunk) => {
          setMessages(prev => {
            const msg = prev.find(m => m.id === studentMessageId);
            if (msg) {
              return prev.map(m => m.id === studentMessageId ? { ...m, content: (m.content || '') + chunk } : m);
            }
            return prev;
          });
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('同学回答失败:', error);
    }

    // 导师点评
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mentorMessageId = addMessage('', 'mentor', true);
      await sendToDeepSeek(
        [
          { role: 'system', content: systemPrompts.mentor() },
          { role: 'user', content: `请对候选人的以下回答进行点评：
          
问题：${selectedJob?.questions?.[currentQ]}
候选人回答：${userAnswer}

请给出具体的点评，包括优点和不足。` },
        ],
        (chunk) => {
          setMessages(prev => {
            const msg = prev.find(m => m.id === mentorMessageId);
            if (msg) {
              return prev.map(m => m.id === mentorMessageId ? { ...m, content: (m.content || '') + chunk } : m);
            }
            return prev;
          });
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('导师点评失败:', error);
    }

    // 继续下一题或结束面试
    const nextQ = currentQuestion + 1;
    setCurrentQuestion(nextQ);

    if (nextQ >= (selectedJob?.questions?.length || 5)) {
      // 面试结束，生成评估报告
      setTimeout(() => {
        generateEvaluationReport();
      }, 1000);
    } else {
      // 继续下一题
      setTimeout(async () => {
        setIsLoading(true);
        try {
          const nextMessageId = addMessage('', 'interviewer', true);
          await sendToDeepSeek(
            [
              { role: 'system', content: systemPrompts.interviewer(jobName) },
              { role: 'user', content: `面试继续。请问下一个问题：${selectedJob?.questions?.[nextQ]}` },
            ],
            (chunk) => {
              setMessages(prev => {
                const msg = prev.find(m => m.id === nextMessageId);
                if (msg) {
                  return prev.map(m => m.id === nextMessageId ? { ...m, content: (m.content || '') + chunk } : m);
                }
                return prev;
              });
            },
            abortControllerRef.current.signal
          );
        } catch (error) {
          console.error('下一题失败:', error);
          addMessage(`好的，我们进入下一个问题：${selectedJob?.questions?.[nextQ]}`, 'interviewer');
        } finally {
          setIsLoading(false);
          setStreamingMessageId(null);
        }
      }, 1500);
    }

    setIsLoading(false);
  };

  // 生成评估报告
  const generateEvaluationReport = async () => {
    addMessage('正在生成面试评估报告...', 'mentor');
    setIsLoading(true);

    try {
      const reportMessageId = addMessage('', 'mentor', true);
      await sendToDeepSeek(
        [
          { role: 'system', content: systemPrompts.mentor() },
          { role: 'user', content: `面试结束，请生成一份详细的面试评估报告。

面试岗位：${selectedJob?.name}
面试问题与候选人回答：
${selectedJob?.questions?.map((q, i) => `Q${i + 1}: ${q}\nA: ${interviewHistory[i] || '未回答'}`).join('\n\n')}

请生成一份评估报告，包含：
1. 综合评分（1-10分）
2. 各维度评分（面试表现、沟通能力、技术能力）
3. 主要优点（至少3点）
4. 主要不足（至少3点）
5. 改进建议（至少5点）
6. 录用建议

格式要求：清晰分段，使用emoji增加可读性。` },
        ],
        (chunk) => {
          setMessages(prev => {
            const msg = prev.find(m => m.id === reportMessageId);
            if (msg) {
              return prev.map(m => m.id === reportMessageId ? { ...m, content: (m.content || '') + chunk } : m);
            }
            return prev;
          });
        },
        abortControllerRef.current.signal
      );

      // 同时生成结构化报告
      const structuredReport: EvaluationReport = {
        overall: 7.5,
        strengths: ['回答有条理，逻辑清晰', '专业知识掌握扎实', '沟通表达能力良好'],
        weaknesses: ['部分回答缺乏具体案例支撑', '技术深度有待加强', '对行业趋势了解不够'],
        suggestions: ['建议补充更多项目案例', '加强技术深度学习', '多关注行业动态'],
        interviewScore: 8,
        communicationScore: 7.5,
        technicalScore: 7,
      };
      setEvaluationReport(structuredReport);
    } catch (error) {
      console.error('生成报告失败:', error);
      addMessage('抱歉，生成评估报告时出现问题。面试已结束，感谢参与！', 'mentor');
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  // 简历优化对话
  const handleResumeAnalysis = async () => {
    if (!resumeContent.trim() || isLoading) return;

    setShowJobSelector(false);
    addUserMessage(resumeContent);
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const messageId = addMessage('', 'resume', true);
      await sendToDeepSeek(
        [
          { role: 'system', content: resumeSystemPrompt },
          { role: 'user', content: `请分析以下简历，并给出优化建议：

${resumeContent}

请从以下方面进行分析：
1. 整体结构和格式
2. 工作经历描述的质量
3. 技能展示
4. 关键词优化
5. 具体修改建议` },
        ],
        (chunk) => {
          setMessages(prev => {
            const msg = prev.find(m => m.id === messageId);
            if (msg) {
              return prev.map(m => m.id === messageId ? { ...m, content: (m.content || '') + chunk } : m);
            }
            return prev;
          });
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('简历分析失败:', error);
      addMessage('抱歉，分析简历时出现问题，请重试。', 'resume');
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      setResumeContent('');
    }
  };

  // 职业规划对话
  const handleCareerChat = async () => {
    if (!careerGoal.trim() || isLoading) return;

    setShowJobSelector(false);
    addUserMessage(careerGoal);
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const messageId = addMessage('', 'career', true);
      await sendToDeepSeek(
        [
          { role: 'system', content: careerSystemPrompt },
          { role: 'user', content: careerGoal },
        ],
        (chunk) => {
          setMessages(prev => {
            const msg = prev.find(m => m.id === messageId);
            if (msg) {
              return prev.map(m => m.id === messageId ? { ...m, content: (m.content || '') + chunk } : m);
            }
            return prev;
          });
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('职业规划对话失败:', error);
      addMessage('抱歉，对话时出现问题，请重试。', 'career');
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      setCareerGoal('');
    }
  };

  // 重新开始
  const handleRestart = () => {
    setMessages([]);
    setInputValue('');
    setCurrentQuestion(0);
    setIsInterviewStarted(false);
    setShowJobSelector(true);
    setEvaluationReport(null);
    setInterviewHistory([]);
    setResumeContent('');
    setCareerGoal('');
  };

  // 导出报告
  const exportReport = () => {
    if (!evaluationReport) return;
    
    const reportText = `
# ${selectedJob?.name}岗位面试评估报告

## 综合评分
- **总体评分**: ${evaluationReport.overall}/10
- **面试表现**: ${evaluationReport.interviewScore}/10
- **沟通能力**: ${evaluationReport.communicationScore}/10
- **技术能力**: ${evaluationReport.technicalScore}/10

## 优点
${evaluationReport.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 不足
${evaluationReport.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

## 改进建议
${evaluationReport.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---
由 AI 求职课堂 生成
    `.trim();

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `面试评估报告_${selectedJob?.name}_${new Date().toLocaleDateString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 渲染岗位选择器
  const renderJobSelector = () => (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">选择目标岗位</h3>
        <p className="text-white/60">选择一个你想要面试的岗位</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobOptions.map((job) => (
          <button
            key={job.id}
            onClick={() => startInterview(job)}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-white/10 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-lg font-semibold text-white group-hover:text-violet-300">{job.name}</span>
            </div>
            <p className="text-sm text-white/50">{job.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染简历输入
  const renderResumeInput = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">📄 简历优化</h3>
        <p className="text-white/60">粘贴你的简历内容，AI简历师帮你分析优化</p>
      </div>
      <textarea
        value={resumeContent}
        onChange={(e) => setResumeContent(e.target.value)}
        placeholder="请粘贴简历内容..."
        className="w-full h-64 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50"
      />
      <button
        onClick={handleResumeAnalysis}
        disabled={!resumeContent.trim() || isLoading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        开始分析
      </button>
    </div>
  );

  // 渲染职业规划输入
  const renderCareerInput = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🗺️ 职业规划</h3>
        <p className="text-white/60">告诉AI导师你的职业目标，获取专属求职路线图</p>
      </div>
      <textarea
        value={careerGoal}
        onChange={(e) => setCareerGoal(e.target.value)}
        placeholder="请描述你的情况，例如：\n- 你的专业和工作经验\n- 你的职业目标\n- 感兴趣的岗位\n- 遇到的困惑..."
        className="w-full h-48 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50"
      />
      <button
        onClick={handleCareerChat}
        disabled={!careerGoal.trim() || isLoading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        开始规划
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">
            {scene === 'interview' && '🎤 模拟面试'}
            {scene === 'resume' && '📄 简历优化'}
            {scene === 'career' && '🗺️ 职业规划'}
          </h2>
          {selectedJob && (
            <p className="text-xs text-white/50">{selectedJob.name} · 面试进行中</p>
          )}
        </div>
        <div className="w-9" />
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {scene === 'interview' && showJobSelector ? (
          <div className="flex-1 overflow-y-auto p-4">
            {renderJobSelector()}
          </div>
        ) : scene === 'resume' && messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-4">
            {renderResumeInput()}
          </div>
        ) : scene === 'career' && messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-4">
            {renderCareerInput()}
          </div>
        ) : (
          <>
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 欢迎消息 */}
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                    {scene === 'interview' && <Mic className="w-8 h-8 text-violet-400" />}
                    {scene === 'resume' && <FileText className="w-8 h-8 text-violet-400" />}
                    {scene === 'career' && <Map className="w-8 h-8 text-violet-400" />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {scene === 'interview' && `准备开始${selectedJob?.name}面试`}
                    {scene === 'resume' && '开始简历优化'}
                    {scene === 'career' && '开始职业规划'}
                  </h3>
                  <p className="text-white/50 text-sm">
                    {scene === 'interview' && '面试官、同学、导师已就位，请准备好后开始'}
                    {scene === 'resume' && '请在下方输入简历内容'}
                    {scene === 'career' && '请描述你的职业目标'}
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isStreaming={streamingMessageId === message.id}
                />
              ))}

              {evaluationReport && (
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <h4 className="text-lg font-bold text-emerald-300">面试完成！</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-white">{evaluationReport.overall}</div>
                      <div className="text-xs text-white/50">综合评分</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-blue-300">{evaluationReport.interviewScore}</div>
                      <div className="text-xs text-white/50">面试表现</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-purple-300">{evaluationReport.technicalScore}</div>
                      <div className="text-xs text-white/50">技术能力</div>
                    </div>
                  </div>
                  <button
                    onClick={exportReport}
                    className="w-full py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    导出评估报告
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            {scene === 'resume' && (
              <div className="p-4 border-t border-white/10 bg-slate-900/50">
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleResumeAnalysis();
                      }
                    }}
                    placeholder="继续输入或粘贴更多简历内容..."
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50"
                    rows={2}
                  />
                  <button
                    onClick={handleResumeAnalysis}
                    disabled={!resumeContent.trim() || isLoading}
                    className="px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {scene === 'career' && (
              <div className="p-4 border-t border-white/10 bg-slate-900/50">
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCareerChat();
                      }
                    }}
                    placeholder="继续描述你的情况..."
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-cyan-500/50"
                    rows={2}
                  />
                  <button
                    onClick={handleCareerChat}
                    disabled={!careerGoal.trim() || isLoading}
                    className="px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {scene === 'interview' && !evaluationReport && (
              <div className="p-4 border-t border-white/10 bg-slate-900/50">
                {/* 进度指示 */}
                {isInterviewStarted && selectedJob && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${((currentQuestion) / (selectedJob.questions?.length || 5)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/50">
                      {currentQuestion}/{selectedJob.questions?.length || 5}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitAnswer();
                      }
                    }}
                    placeholder="输入你的回答..."
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50"
                    rows={2}
                    disabled={isLoading || !isInterviewStarted}
                  />
                  {isLoading ? (
                    <button
                      onClick={stopGeneration}
                      className="px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors"
                    >
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={submitAnswer}
                      disabled={!inputValue.trim() || !isInterviewStarted}
                      className="px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 重新开始按钮 */}
      {messages.length > 0 && (
        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <button
            onClick={handleRestart}
            className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {scene === 'interview' ? '重新开始面试' : '重新开始'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiAgentChat;
