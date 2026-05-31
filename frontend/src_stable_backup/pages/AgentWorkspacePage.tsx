import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Bot, Clock, ArrowLeft, CheckCircle, AlertCircle, Loader2, 
  Play, Brain, FileText, Sparkles, Zap, ChevronRight, 
  Star, Award, Activity, Terminal, Video, Image as ImageIcon,
  ExternalLink, RefreshCw, Copy, Check, Share2, Rocket, 
  Send, Cpu, Sparkle
} from 'lucide-react';
import { Card, StatusBadge, LoadingSpinner, EmptyState } from '../components/ui';
import { tasksAPI, agentsAPI } from '../utils/supabase';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  task_type?: string;
  matched_agent_id: number | null;
  budget: number;
  created_at: string;
  completed_at?: string;
  rating?: number;
}

interface Agent {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  capabilities?: any[];
  completed_tasks: number;
  avg_rating: number;
  token_balance: number;
  total_tasks: number;
}

interface Delivery {
  id: number;
  task_id: number;
  agent_id: number;
  content: string;
  result_url?: string;
  submitted_at?: string;
}

interface LogEntry {
  time: string;
  icon: string;
  message: string;
  type: 'info' | 'success' | 'progress' | 'error' | 'ai';
}

// DeepSeek API 配置（前端直连）
const DEEPSEEK_API_KEY = '';
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';

// 推断任务类型
function inferTaskType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('翻译') || text.includes('英文') || text.includes('英语')) return '翻译润色';
  if (text.includes('学习') || text.includes('辅导') || text.includes('教学') || text.includes('考试') || text.includes('课程')) return '学习辅导';
  if (text.includes('分析') || text.includes('数据') || text.includes('报告') || text.includes('统计')) return '数据分析';
  if (text.includes('创作') || text.includes('写作') || text.includes('文章') || text.includes('文案') || text.includes('诗')) return '内容创作';
  return '搜索整理';
}

// 获取系统提示词
function getSystemPrompt(taskType: string): string {
  const prompts: Record<string, string> = {
    '搜索整理': '你是一个专业的信息搜索和整理助手。请严格按以下格式输出：\n1. 使用 ## 作为主标题，### 作为子标题\n2. 关键信息用加粗 **文字** 标注\n3. 列表用 - 或数字序号\n4. 重点结论用 📌 ✅ 💡 等emoji前缀标注\n5. 段落之间留空行\n6. 禁止输出大段无格式的纯文本\n\n请用中文回复，格式精美，层次分明。',
    '内容创作': '你是一个专业的内容创作助手。请严格按以下格式输出：\n1. 使用 ## 作为主标题，### 作为子标题\n2. 关键信息用加粗 **文字** 标注\n3. 列表用 - 或数字序号\n4. 引用金句用 > 引用格式\n5. 段落之间留空行\n6. 禁止输出大段无格式的纯文本\n\n请用中文创作，内容完整，排版精美。',
    '数据分析': '你是一个专业的数据分析助手。请严格按以下格式输出：\n1. 使用 ## 作为主标题，### 作为子标题\n2. 数据要点用 📊 前缀\n3. 关键结论用 ✅ 前缀\n4. 建议用 💡 前缀\n5. 风险提示用 ⚠️ 前缀\n6. 列表用数字序号\n7. 禁止输出大段无格式的纯文本\n\n请用中文回复，数据清晰，逻辑分明。',
    '翻译润色': '你是一个专业的翻译和文字润色助手。请严格按以下格式输出：\n1. 原文和译文/润色结果用 ## 标题区分\n2. 关键改动用加粗标注\n3. 术语对照用列表格式\n4. 段落之间留空行\n5. 禁止输出大段无格式的纯文本\n\n请用中文回复，格式清晰。',
    '学习辅导': '你是一个耐心的学习辅导老师。请严格按以下格式输出：\n1. 使用 ## 作为知识点标题\n2. 核心概念用 📌 前缀\n3. 举例说明用 💡 前缀\n4. 练习建议用 ✅ 前缀\n5. 列表用 - 或数字序号\n6. 段落之间留空行\n7. 禁止输出大段无格式的纯文本\n\n请用中文回复，讲解清晰，排版美观。',
    '求职全托管': '你是一个专业的求职助手。请严格按以下格式输出：\n1. 使用 ## 作为板块标题（如推荐岗位、简历建议等）\n2. 岗位信息用卡片式列表\n3. 关键要求用加粗标注\n4. 截止日期用 ⏰ 前缀\n5. 投递链接用 🔗 前缀\n6. 禁止输出大段无格式的纯文本\n\n请用中文回复，信息精准，排版精美。',
    '自动执行': '你是一个高效的AI执行助手。请严格按以下格式输出：\n1. 使用 ## 作为任务结果标题\n2. 执行步骤用数字序号\n3. 关键结果用 ✅ 前缀\n4. 数据/链接用 🔗 前缀\n5. 注意事项用 ⚠️ 前缀\n6. 列表用 - 或数字序号\n7. 禁止输出大段无格式的纯文本\n\n请用中文回复，结果清晰，一目了然。',
  };
  return prompts[taskType] || prompts['搜索整理'];
}

// 工作步骤配置
const WORK_STEPS = [
  { id: 'matched', label: '待执行', icon: '🤖', animation: 'pulse' },
  { id: 'executing', label: 'AI执行中', icon: '⚡', animation: 'spin' },
  { id: 'analyzing', label: '分析整理', icon: '🧠', animation: 'bounce' },
  { id: 'completed', label: '已完成', icon: '✅', animation: 'none' },
];

// 根据任务状态获取当前步骤索引
const getCurrentStep = (status: string, isExecuting: boolean): number => {
  if (isExecuting) return 1;
  switch (status) {
    case 'matched': return 0;
    case 'in_progress': return 1;
    case 'submitted': return 2;
    case 'completed': return 3;
    case 'approved': return 3;
    default: return 0;
  }
};

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

// 生成真实执行日志
const generateExecutionLogs = (logs: LogEntry[], message: string, type: LogEntry['type'] = 'info'): LogEntry[] => {
  return [...logs, {
    time: formatTime(new Date()),
    icon: type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'ai' ? '🤖' : '⏳',
    message,
    type
  }];
};

// 渲染Markdown（简化版）
const renderMarkdown = (content: string): JSX.Element => {
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-sm max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold text-slate-800 mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold text-slate-800 mt-4 mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold text-slate-800 mt-4 mb-2">{line.slice(2)}</h1>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4 text-slate-700">{line.slice(2)}</li>;
        }
        if (line.includes('[') && line.includes('](')) {
          const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            return (
              <p key={i} className="text-slate-700 my-1">
                {line.split(/\[([^\]]+)\]\(([^)]+)\]/).map((part, idx) => {
                  if (idx % 3 === 0) return <span key={idx}>{part}</span>;
                  if (idx % 3 === 1) return <span key={idx} className="text-blue-600">{part}</span>;
                  return <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">{part}</a>;
                })}
              </p>
            );
          }
        }
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }
        return <p key={i} className="text-slate-700 my-1">{line}</p>;
      })}
    </div>
  );
};

// B站视频ID提取
const extractBiliBiliId = (url: string): string | null => {
  const patterns = [
    /bilibili\.com\/video\/(BV[\w]+)/i,
    /bilibili\.com\/video\/av(\d+)/i,
    /b23\.tv\/([\w]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const AgentWorkspacePage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDelivery, setExpandedDelivery] = useState<number | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 自动执行标记
  const autoExecutedRef = useRef(false);
  
  // 获取数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const numTaskId = parseInt(taskId || '0');
      if (!numTaskId) {
        throw new Error('无效的任务ID，请检查链接是否正确');
      }
      
      let taskData = null;
      let deliveriesData: any[] = [];
      
      try {
        taskData = await tasksAPI.getTask(numTaskId);
      } catch (err) {
        console.error('获取任务详情失败:', err);
        throw new Error('无法连接到服务器，请检查网络连接后重试');
      }
      
      if (!taskData) {
        throw new Error('任务不存在或已被删除');
      }
      
      setTask(taskData);
      
      // 获取 deliveries
      try {
        deliveriesData = (await tasksAPI.getDeliveries(numTaskId)) || [];
      } catch (err) {
        console.warn('获取交付记录失败:', err);
        deliveriesData = [];
      }
      setDeliveries(deliveriesData);
      
      // 获取 agent
      if (taskData?.matched_agent_id) {
        try {
          const agentData = await agentsAPI.getAgent(taskData.matched_agent_id);
          setAgent(agentData || null);
        } catch (err) {
          console.warn('获取智能体信息失败:', err);
          setAgent(null);
        }
      }
      
      setError(null);
      
      // 自动执行：任务状态为 matched 时，直接触发执行
      if (taskData.status === 'matched' && !autoExecutedRef.current) {
        autoExecutedRef.current = true;
        console.log('[Workspace] 自动执行任务:', taskData.id);
        // 延迟1秒后自动执行
        setTimeout(() => {
          executeTaskWithData(taskData);
        }, 1000);
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError(err instanceof Error ? err.message : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [taskId]);
  
  // 执行任务（直接传入taskData，不依赖闭包）
  const executeTaskWithData = async (taskData: Task) => {
    if (isExecuting) return;
    
    try {
      setIsExecuting(true);
      
      // 初始化日志
      setLogs([{
        time: formatTime(new Date()),
        icon: '🚀',
        message: '任务已接收，正在启动 AI 执行...',
        type: 'info'
      }]);
      
      // 更新任务状态为 in_progress
      await tasksAPI.updateTask(taskData.id, { status: 'in_progress' });
      setTask(prev => prev ? { ...prev, status: 'in_progress' } : null);
      
      // 添加进度日志
      setTimeout(() => {
        setLogs(prev => generateExecutionLogs(prev, '正在连接 DeepSeek AI...', 'progress'));
      }, 1000);
      
      setTimeout(() => {
        setLogs(prev => generateExecutionLogs(prev, 'AI 已接收任务请求', 'info'));
      }, 2000);
      
      setTimeout(() => {
        setLogs(prev => generateExecutionLogs(prev, '正在分析任务需求...', 'progress'));
        setExecutionProgress('analyzing');
      }, 3000);
      
      setTimeout(() => {
        setLogs(prev => generateExecutionLogs(prev, 'DeepSeek AI 正在生成结果...', 'ai'));
      }, 4000);
      
      // 调用 DeepSeek API 直接执行
      console.log('[Workspace] 开始调用 DeepSeek API...');
      
      // 推断任务类型并获取系统提示词
      const taskType = inferTaskType(taskData.title, taskData.description || '');
      const systemPrompt = getSystemPrompt(taskType);
      
      setLogs(prev => generateExecutionLogs(prev, `任务类型: ${taskType}`, 'info'));
      
      // 带超时和重试的 fetch
      const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs: number = 60000) => {
        return Promise.race([
          fetch(url, options),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('请求超时，请检查网络连接')), timeoutMs)
          )
        ]);
      };

      let response: Response | null = null;
      let lastError: Error | null = null;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            setLogs(prev => generateExecutionLogs(prev, `第${attempt}次重试中...`, 'progress'));
          }
          response = await fetchWithTimeout(`${DEEPSEEK_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `任务标题: ${taskData.title}\n\n任务描述: ${taskData.description || '无'}` }
              ],
              max_tokens: 4000,
              temperature: 0.7
            })
          }, 60000);
          break; // 成功则跳出重试循环
        } catch (fetchErr) {
          lastError = fetchErr instanceof Error ? fetchErr : new Error('网络请求失败');
          if (attempt < maxRetries) {
            setLogs(prev => generateExecutionLogs(prev, `网络异常，3秒后重试...`, 'progress'));
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
      
      if (!response) {
        throw new Error(lastError?.message || '网络请求失败，请检查网络后重试');
      }
      
      console.log('[Workspace] DeepSeek API 响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'DeepSeek AI 执行失败');
      }
      
      const result = await response.json();
      const aiResult = result.choices[0].message.content;
      console.log('[Workspace] 执行成功，结果长度:', aiResult.length);
      
      // 将结果写入 deliveries 表
      setLogs(prev => generateExecutionLogs(prev, '正在保存交付物...', 'progress'));
      const agentId = taskData.matched_agent_id || 1;
      await tasksAPI.submitDelivery(taskData.id, agentId, aiResult);
      
      // 更新任务状态为 completed
      await tasksAPI.updateTask(taskData.id, { status: 'completed' });
      setTask(prev => prev ? { ...prev, status: 'completed' } : null);
      
      // 添加成功日志
      setLogs(prev => generateExecutionLogs(prev, '✅ 任务执行完成！', 'success'));
      
      // 等待一下确保数据库已更新
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 刷新数据
      await fetchData();
      
      setLogs(prev => generateExecutionLogs(prev, '🎉 交付物已生成！', 'success'));
      
    } catch (err) {
      console.error('[Workspace] 执行错误:', err);
      setLogs(prev => generateExecutionLogs(
        prev, 
        `❌ 执行失败: ${err instanceof Error ? err.message : '未知错误'}`, 
        'error'
      ));
      
      // 如果任务状态已经是 completed，不做处理
      if (taskData?.status !== 'completed') {
        // 尝试恢复到 matched 状态
        try {
          await tasksAPI.updateTask(taskData.id, { status: 'matched' });
          setTask(prev => prev ? { ...prev, status: 'matched' } : null);
        } catch (e) {
          console.error('恢复状态失败:', e);
        }
      }
    } finally {
      setIsExecuting(false);
      setExecutionProgress('');
    }
  };
  
  // 兼容手动执行的入口
  const executeTask = async () => {
    if (!task) return;
    await executeTaskWithData(task);
  };
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // 初始化日志（自动执行已在fetchData中处理）
  useEffect(() => {
    if (task && logs.length === 0 && !isExecuting && !autoExecutedRef.current) {
      if (task.status === 'in_progress') {
        setLogs([{
          time: formatTime(new Date()),
          icon: '⚡',
          message: '任务正在执行中...',
          type: 'progress'
        }]);
      } else if (task.status === 'submitted') {
        setLogs([{
          time: formatTime(new Date()),
          icon: '📤',
          message: '任务已提交交付，等待验收',
          type: 'info'
        }]);
      } else if (task.status === 'completed' || task.status === 'approved') {
        setLogs([{
          time: formatTime(new Date()),
          icon: '✅',
          message: '任务已完成',
          type: 'success'
        }]);
      }
    }
  }, [task, isExecuting]);
  
  // 滚动日志到底部
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // 轮询更新状态
  useEffect(() => {
    if (task && ['matched', 'in_progress', 'submitted'].includes(task.status) && !isExecuting) {
      pollIntervalRef.current = setInterval(() => {
        fetchData();
      }, 5000);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [task?.status, isExecuting, fetchData]);
  
  // 复制内容
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <EmptyState
          icon={<AlertCircle className="w-16 h-16" />}
          title="加载失败"
          description={error || '无法加载任务信息'}
          action={
            <button 
              onClick={() => navigate('/tasks')}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 font-medium"
            >
              返回任务列表
            </button>
          }
        />
      </div>
    );
  }
  
  const currentStep = getCurrentStep(task.status, isExecuting);
  const isCompleted = ['completed', 'approved'].includes(task.status);
  
  // 计算工作时长
  const getWorkingDuration = (): string => {
    if (!task.completed_at && !task.created_at) return '--';
    const start = new Date(task.created_at);
    const end = task.completed_at ? new Date(task.completed_at) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (diff < 60) return `${diff}秒`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分${diff % 60}秒`;
    return `${Math.floor(diff / 3600)}小时${Math.floor((diff % 3600) / 60)}分`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-xl hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          
          <div className="flex items-center gap-3">
            <StatusBadge status={isExecuting ? 'in_progress' : task.status} />
            {isExecuting && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium animate-pulse">
                AI执行中 ⚡
              </span>
            )}
            {task.status === 'approved' && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium">
                已验收 ⭐
              </span>
            )}
          </div>
        </div>
        
        {/* 页面标题 */}
        <div className="text-center py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            <Sparkles className="inline-block w-8 h-8 mr-2 text-yellow-400 animate-pulse" />
            智能体工作台
          </h1>
          <p className="text-white/60">{task.title}</p>
        </div>
        
        {/* 智能体信息卡 */}
        {agent && (
          <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-4">
              {/* 头像 */}
              <div className="relative">
                {agent.avatar_url ? (
                  <img 
                    src={agent.avatar_url} 
                    alt={agent.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/50"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center ring-2 ring-indigo-400/50">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                )}
                {/* 在线状态 */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <div className={`w-2 h-2 bg-white rounded-full ${isExecuting ? 'animate-pulse' : ''}`} />
                </div>
              </div>
              
              {/* 信息 */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                <p className="text-white/60 text-sm">{agent.description || 'DeepSeek AI 智能助手'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{agent.avg_rating.toFixed(1)}</span>
                    <span className="text-white/40 text-sm">({agent.completed_tasks}评价)</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/60">
                    <Activity className="w-4 h-4" />
                    <span>已完成 {agent.completed_tasks} 任务</span>
                  </div>
                </div>
              </div>
              
              {/* 工作时长 */}
              <div className="text-right">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">工作时长</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {getWorkingDuration()}
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* 自动执行提示 - 任务匹配后自动启动 */}
        {task.status === 'matched' && !isExecuting && (
          <Card className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border border-emerald-500/30">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">任务已匹配，即将自动执行</h3>
              <p className="text-white/60">DeepSeek AI 正在自动启动，无需手动操作</p>
            </div>
          </Card>
        )}
        
        {/* 执行中状态 */}
        {isExecuting && (
          <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 backdrop-blur-sm border border-yellow-500/30">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Cpu className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {executionProgress === 'analyzing' ? 'AI 正在分析任务...' : 'DeepSeek AI 正在执行任务...'}
              </h3>
              <p className="text-white/60 mb-4">请稍候，AI 正在生成结果</p>
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>执行中，请勿关闭页面</span>
              </div>
            </div>
          </Card>
        )}
        
        {/* 进度展示 */}
        <Card className="bg-slate-900/80 backdrop-blur-sm border border-white/10">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              工作进度
            </h2>
            
            {/* 步骤进度条 */}
            <div className="relative">
              {/* 连接线 */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
              
              {/* 步骤点 */}
              <div className="relative flex justify-between">
                {WORK_STEPS.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompletedStep = idx < currentStep;
                  const isPending = idx > currentStep;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      {/* 圆圈 */}
                      <div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                          isCompletedStep 
                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                            : isActive 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/50 animate-pulse' 
                              : 'bg-slate-700/50'
                        }`}
                      >
                        {isCompletedStep ? (
                          <CheckCircle className="w-8 h-8 text-white" />
                        ) : isActive ? (
                          <span className={step.animation === 'spin' ? 'animate-spin' : step.animation === 'bounce' ? 'animate-bounce' : ''}>
                            {step.icon}
                          </span>
                        ) : (
                          <span className="opacity-40">{step.icon}</span>
                        )}
                      </div>
                      
                      {/* 标签 */}
                      <div className={`mt-3 font-medium text-center ${
                        isCompletedStep 
                          ? 'text-emerald-400' 
                          : isActive 
                            ? 'text-white font-semibold' 
                            : 'text-slate-500'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 当前状态提示 */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : isExecuting ? (
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-indigo-400" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">
                    {isExecuting && 'AI 正在执行任务，请稍候...'}
                    {!isExecuting && task.status === 'matched' && '任务已匹配，AI 即将自动执行...'}
                    {!isExecuting && task.status === 'in_progress' && '任务处理中...'}
                    {!isExecuting && task.status === 'submitted' && '交付已提交，等待验收（可重新执行）'}
                    {!isExecuting && task.status === 'completed' && '任务完成，等待验收'}
                    {!isExecuting && task.status === 'approved' && '任务已验收通过！'}
                  </p>
                  <p className="text-white/50 text-sm">
                    {isCompleted ? '交付物已准备就绪' : isExecuting ? '实时执行中' : 'AI 将自动开始执行'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* 工作日志 */}
        <Card className="bg-slate-900/80 backdrop-blur-sm border border-white/10">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              工作日志
            </h2>
            {!isCompleted && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                {isExecuting ? '执行中' : '实时更新'}
              </div>
            )}
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-2 bg-black/30 font-mono text-sm">
            {logs.map((log, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ${
                  log.type === 'success' ? 'bg-emerald-500/10' :
                  log.type === 'progress' ? 'bg-indigo-500/10' :
                  log.type === 'error' ? 'bg-red-500/10' :
                  log.type === 'ai' ? 'bg-purple-500/10' :
                  'hover:bg-white/5'
                }`}
              >
                <span className="text-slate-500 shrink-0">{log.time}</span>
                <span className="text-lg shrink-0">{log.icon}</span>
                <span className={`${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'progress' ? 'text-indigo-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'ai' ? 'text-purple-400' :
                  'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            {!isCompleted && (
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="animate-pulse">▋</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </Card>
        
        {/* 交付物展示 */}
        {deliveries && deliveries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              交付物
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-normal">
                {deliveries.length} 项
              </span>
            </h2>
            
            {deliveries.map((delivery, idx) => {
              const isExpanded = expandedDelivery === delivery.id;
              const isBiliBili = delivery.result_url && extractBiliBiliId(delivery.result_url);
              const isImage = delivery.result_url?.match(/\.(jpg|jpeg|png|gif|webp)/i);
              
              return (
                <Card 
                  key={delivery.id}
                  className="bg-white/95 backdrop-blur-sm border border-slate-200 overflow-hidden"
                >
                  {/* 交付物头部 */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedDelivery(isExpanded ? null : delivery.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                          {isBiliBili ? (
                            <Video className="w-5 h-5 text-indigo-600" />
                          ) : isImage ? (
                            <ImageIcon className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Sparkle className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            AI 生成结果 #{idx + 1}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {delivery.submitted_at ? new Date(delivery.submitted_at).toLocaleString('zh-CN') : '刚刚'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  {/* 展开内容 */}
                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      {/* 视频展示 */}
                      {isBiliBili && (
                        <div className="p-4 bg-slate-900">
                          <div className="relative aspect-video rounded-lg overflow-hidden">
                            <iframe
                              src={`//player.bilibili.com/player.html?bvid=${isBiliBili}&autoplay=0`}
                              className="absolute inset-0 w-full h-full"
                              allowFullScreen
                              scrolling="no"
                              frameBorder="0"
                            />
                          </div>
                          {delivery.result_url && (
                            <a 
                              href={delivery.result_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              在B站打开
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* 图片展示 */}
                      {isImage && delivery.result_url && (
                        <div className="p-4">
                          <img 
                            src={delivery.result_url}
                            alt="交付图片"
                            className="max-w-full rounded-lg"
                          />
                        </div>
                      )}
                      
                      {/* 文本内容 */}
                      {delivery.content && (
                        <div className="p-4 border-t border-slate-100">
                          {renderMarkdown(delivery.content)}
                        </div>
                      )}
                      
                      {/* 操作按钮 */}
                      <div className="px-4 pb-4 flex gap-2">
                        {delivery.content && (
                          <button
                            onClick={() => copyToClipboard(delivery.content, `content-${delivery.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                          >
                            {copiedId === `content-${delivery.id}` ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                复制内容
                              </>
                            )}
                          </button>
                        )}
                        {delivery.result_url && !isBiliBili && !isImage && (
                          <a
                            href={delivery.result_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            打开链接
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        
        {/* 无交付物提示 */}
        {isCompleted && (!deliveries || deliveries.length === 0) && (
          <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 text-center py-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">暂无交付物内容</p>
          </Card>
        )}
        
        {/* 操作按钮 */}
        {task.status === 'completed' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to={`/tasks/${task.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-medium transition-all shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle className="w-5 h-5" />
              前往验收
            </Link>
            <button
              onClick={fetchData}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 font-medium transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              刷新状态
            </button>
          </div>
        )}
        
        {task.status === 'submitted' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={() => {
                autoExecutedRef.current = false;
                executeTaskWithData(task);
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-medium transition-all shadow-lg shadow-orange-500/25"
            >
              <RefreshCw className="w-5 h-5" />
              重新执行任务
            </button>
            <Link
              to={`/tasks/${task.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-medium transition-all shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle className="w-5 h-5" />
              前往验收
            </Link>
          </div>
        )}
        
        {task.status === 'approved' && (
          <div className="flex justify-center pt-4">
            <Link
              to={`/tasks/${task.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 font-medium transition-all shadow-lg shadow-indigo-500/25"
            >
              <Award className="w-5 h-5" />
              查看任务详情
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentWorkspacePage;
