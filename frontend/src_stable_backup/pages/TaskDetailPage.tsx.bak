import React, { useState, useEffect, Component, ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Bot, User, Clock, CheckCircle, Play, AlertCircle, Target, Users, Sparkles, Star, Award, Package, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, StatusBadge, RatingStars, LoadingSpinner } from '../components/ui';
import { tasksAPI, agentsAPI } from '../utils/supabase';
import type { TaskDetails, Agent, TaskStatus } from '../types';

// ErrorBoundary 组件 - 防止RichMarkdown渲染崩溃导致整个页面白屏
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RichMarkdownErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RichMarkdown render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">内容渲染失败</p>
          <p className="text-sm text-red-600 mt-1">可能是不支持的内容格式，请尝试刷新页面</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// 交付状态标签颜色映射
const deliveryStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const deliveryStatusLabels: Record<string, string> = {
  pending: '待交付',
  submitted: '已提交',
  accepted: '已验收',
  rejected: '已拒绝',
};

// 带错误处理的图片组件
const SafeImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [error, setError] = React.useState(false);
  
  if (error) {
    return (
      <div className="my-4 p-4 bg-slate-100 rounded-lg text-center">
        <span className="text-slate-500 text-sm">图片加载失败</span>
        <a href={src} target="_blank" rel="noopener noreferrer" className="block text-blue-500 text-sm mt-1 hover:underline">
          点击查看原图
        </a>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

// 富媒体Markdown渲染组件（升级版 - 支持图片、链接、emoji块，带错误处理和折叠功能）
const RichMarkdown: React.FC<{ content: string; maxPreviewLength?: number }> = ({ content, maxPreviewLength = 0 }) => {
  const [expanded, setExpanded] = useState(maxPreviewLength > 0 && content.length > maxPreviewLength);
  const displayContent = expanded ? content : content.slice(0, maxPreviewLength);
  
  // 渲染文本中的链接和加粗
  const renderTextWithLinks = (text: string, baseKey: number): React.ReactNode => {
    // 图片语法 ![描述](URL)
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIdx = baseKey;

    while ((match = imagePattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(renderBasicText(text.slice(lastIndex, match.index), keyIdx++));
      }
      const [fullMatch, alt, url] = match;
      parts.push(
        <div key={`img-${keyIdx++}`} className="my-4">
          <SafeImage 
            src={url} 
            alt={alt || '图片'} 
            className="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow"
          />
          {alt && alt !== url && (
            <p className="text-sm text-slate-500 mt-1 text-center">{alt}</p>
          )}
        </div>
      );
      lastIndex = match.index + fullMatch.length;
    }
    
    if (lastIndex < text.length) {
      parts.push(renderBasicText(text.slice(lastIndex), keyIdx++));
    }
    
    return parts.length > 0 ? parts : renderBasicText(text, baseKey);
  };

  // 渲染基础文本（加粗、代码、链接）
  const renderBasicText = (text: string, baseKey: number): React.ReactNode => {
    // 链接语法 [文字](URL)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const segments: { type: 'text' | 'link'; content: string; url?: string }[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'link', content: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      segments.push({ type: 'text', content: text.slice(lastIndex) });
    }
    
    const result: React.ReactNode[] = [];
    let keyIdx = baseKey;
    
    segments.forEach((seg) => {
      if (seg.type === 'link') {
        result.push(
          <a 
            key={keyIdx++}
            href={seg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:bg-blue-50 px-1 rounded"
          >
            {seg.content}
          </a>
        );
      } else {
        // 处理加粗和代码
        const boldParts = seg.content.split(/(\*\*[^*]+\*\*)/g);
        boldParts.forEach((bp) => {
          if (bp.startsWith('**') && bp.endsWith('**')) {
            result.push(
              <strong key={keyIdx++} className="font-semibold text-slate-800">
                {bp.slice(2, -2)}
              </strong>
            );
          } else {
            const codeParts = bp.split(/(`[^`]+`)/g);
            codeParts.forEach((cp) => {
              if (cp.startsWith('`') && cp.endsWith('`')) {
                result.push(
                  <code key={keyIdx++} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-sm font-mono">
                    {cp.slice(1, -1)}
                  </code>
                );
              } else {
                result.push(cp);
              }
            });
          }
        });
      }
    });
    
    return result;
  };

  // 渲染Emoji前缀行
  const renderEmojiBlock = (line: string): { emoji: string; content: string; type: string } | null => {
    const emojiPatterns = [
      { emoji: '📺', pattern: /^📺\s*/, type: 'video' },
      { emoji: '📎', pattern: /^📎\s*/, type: 'attachment' },
      { emoji: '🎯', pattern: /^🎯\s*/, type: 'goal' },
      { emoji: '💡', pattern: /^💡\s*/, type: 'idea' },
      { emoji: '📊', pattern: /^📊\s*/, type: 'chart' },
      { emoji: '📝', pattern: /^📝\s*/, type: 'note' },
      { emoji: '🔗', pattern: /^🔗\s*/, type: 'link' },
      { emoji: '⚠️', pattern: /^⚠️\s*/, type: 'warning' },
      { emoji: '✅', pattern: /^✅\s*/, type: 'success' },
      { emoji: '❌', pattern: /^❌\s*/, type: 'error' },
    ];
    
    for (const ep of emojiPatterns) {
      if (ep.pattern.test(line)) {
        return { emoji: ep.emoji, content: line.replace(ep.pattern, ''), type: ep.type };
      }
    }
    return null;
  };

  // 获取Emoji块样式
  const getEmojiBlockStyle = (type: string) => {
    const styles: Record<string, string> = {
      video: 'border-l-4 border-blue-500 bg-blue-50/50',
      attachment: 'border-l-4 border-purple-500 bg-purple-50/50',
      goal: 'border-l-4 border-amber-500 bg-amber-50/50',
      idea: 'border-l-4 border-yellow-500 bg-yellow-50/50',
      chart: 'border-l-4 border-green-500 bg-green-50/50',
      note: 'border-l-4 border-slate-500 bg-slate-50/50',
      link: 'border-l-4 border-cyan-500 bg-cyan-50/50',
      warning: 'border-l-4 border-orange-500 bg-orange-50/50',
      success: 'border-l-4 border-emerald-500 bg-emerald-50/50',
      error: 'border-l-4 border-red-500 bg-red-50/50',
    };
    return styles[type] || 'border-l-4 border-slate-300 bg-slate-50/50';
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 标题
      if (line.startsWith('### ')) {
        elements.push(<h3 key={key++} className="text-lg font-semibold text-slate-700 mt-6 mb-3">{renderTextWithLinks(line.slice(4), key++)}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={key++} className="text-xl font-bold text-slate-800 mt-6 mb-4">{renderTextWithLinks(line.slice(3), key++)}</h2>);
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={key++} className="text-2xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-200">{renderTextWithLinks(line.slice(2), key++)}</h1>);
      }
      // 分割线
      else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={key++} className="my-6 border-slate-200" />);
      }
      // Emoji前缀行
      // Emoji前缀行
      const emojiBlock = renderEmojiBlock(line);
      if (emojiBlock) {
        elements.push(
          <div key={key++} className={`flex items-start gap-3 p-4 my-3 rounded-r-lg ${getEmojiBlockStyle(emojiBlock.type)}`}>
            <span className="text-2xl flex-shrink-0">{emojiBlock.emoji}</span>
            <div className="flex-1 text-slate-700 leading-relaxed">{renderTextWithLinks(emojiBlock.content, key++)}</div>
          </div>
        );
      }
      // 列表项
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(<li key={key++} className="leading-relaxed ml-4 list-disc text-slate-600">{renderTextWithLinks(line.trim().slice(2), key++)}</li>);
      }
      else if (/^\d+\.\s/.test(line.trim())) {
        elements.push(<li key={key++} className="leading-relaxed ml-4 list-decimal text-slate-600">{renderTextWithLinks(line.trim().replace(/^\d+\.\s/, ''), key++)}</li>);
      }
      // 引用
      else if (line.startsWith('> ')) {
        elements.push(<blockquote key={key++} className="border-l-4 border-amber-400 pl-4 py-2 my-3 bg-amber-50/50 rounded-r-lg text-slate-600 italic">{renderTextWithLinks(line.slice(2), key++)}</blockquote>);
      }
      // 空行
      else if (line.trim() === '') {
        elements.push(<div key={key++} className="h-3" />);
      }
      // 普通段落
      else {
        elements.push(<p key={key++} className="text-slate-600 leading-relaxed mb-2">{renderTextWithLinks(line, key++)}</p>);
      }
      i++;
    }

    return elements;
  };

  const shouldTruncate = maxPreviewLength > 0 && content.length > maxPreviewLength;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {shouldTruncate && !expanded && (
        <div className="text-slate-500 italic mb-4 text-sm">（内容已截断，仅显示前{maxPreviewLength}字）</div>
      )}
      {renderContent(displayContent)}
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          {expanded ? '收起部分内容' : '展开全部内容'}
        </button>
      )}
    </div>
  );
};

// 交付状态徽章组件
const DeliveryStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colorClass = deliveryStatusColors[status] || 'bg-gray-100 text-gray-600';
  const label = deliveryStatusLabels[status] || status;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'info' | 'warning' | 'reward'; message: string} | null>(null);

  // 自动消失通知
  const showNotification = (type: 'success' | 'info' | 'warning' | 'reward', message: string) => {
    setNotification({type, message});
    setTimeout(() => setNotification(null), 4000);
  };

  // 交付相关状态
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveryContent, setDeliveryContent] = useState('');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewConfirm, setShowReviewConfirm] = useState<{action: 'accept'|'reject'}|null>(null);
  const [showRecallConfirm, setShowRecallConfirm] = useState(false);

  // 模拟当前用户ID（实际应从认证状态获取）
  const currentUserId = 1; // TODO: 替换为实际的用户ID

  const isExperienceDemo = task?.title?.includes('【体验】') || false;

  // 判断当前用户是否是任务的发布者
  const isTaskCreator = task?.creator_id === currentUserId;
  // 判断当前用户是否是匹配的智能体所有者（实际需要更复杂的逻辑）
  const isMatchedAgent = task?.matched_agent_id !== null;

  useEffect(() => {
    if (id) {
      fetchTaskDetails(parseInt(id));
      fetchAvailableAgents();
      fetchDeliveries(parseInt(id));
    }
  }, [id]);

  const fetchTaskDetails = async (taskId: number) => {
    try {
      const data = await tasksAPI.getTask(taskId);
      setTask(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const data = await agentsAPI.listAgents();
      setAgents(data);
    } catch (err) {
      console.error('获取智能体列表失败', err);
    }
  };

  const fetchDeliveries = async (taskId: number) => {
    try {
      const data = await tasksAPI.getDeliveries(taskId);
      setDeliveries(data || []);
    } catch (err) {
      console.error('获取交付记录失败', err);
    }
  };

  const handleMatchAgent = async (agentId: number) => {
    if (!id) return;
    try {
      setActionLoading(true);
      setMatchSuccess(false);
      await tasksAPI.matchTask(parseInt(id), agentId);
      setMatchSuccess(true);
      showNotification('success', '🎉 已匹配！智能体已领取任务，准备开工');
      await fetchTaskDetails(parseInt(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '匹配失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteTask = async (instruction?: string) => {
    if (!id) return;
    try {
      setActionLoading(true);
      showNotification('info', '⚡ 智能体忙碌中，正在努力执行任务...');
      await tasksAPI.updateTask(parseInt(id), { status: 'in_progress' }); // 模拟执行
      await fetchTaskDetails(parseInt(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTask = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await tasksAPI.approveTask(parseInt(id), 5);
      await fetchTaskDetails(parseInt(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '验收失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTask = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await tasksAPI.cancelTask(parseInt(id));
      await fetchTaskDetails(parseInt(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 提交交付物
  const handleSubmitDelivery = async () => {
    if (!id || !deliveryContent.trim()) {
      setError('请输入交付内容');
      return;
    }
    try {
      setSubmitLoading(true);
      // 模拟智能体ID（实际应从认证状态获取）
      const agentId = task?.matched_agent_id || 1;
      await tasksAPI.submitDelivery(parseInt(id), agentId, deliveryContent, deliveryUrl || undefined); // 任务状态改为completed
        await tasksAPI.updateTask(parseInt(id), { status: 'completed', delivery_status: 'submitted' });
      setDeliveryContent('');
      setDeliveryUrl('');
      await fetchDeliveries(parseInt(id));
      await fetchTaskDetails(parseInt(id));
      const reward = task?.budget || 0;
      showNotification('reward', `🎁 交付成功！任务完成后可获得 ${reward} Token 奖励`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 验收交付物
  const handleReviewDelivery = async (action: 'accept' | 'reject') => {
    if (!id) return;
    if (action === 'accept' && reviewRating < 1) {
      setError('请选择评分');
      return;
    }
    try {
      setReviewLoading(true);
      if (action === 'accept') {
        await tasksAPI.approveTask(parseInt(id), reviewRating, reviewComment || undefined);
        const reward = task?.budget || 0;
        showNotification('reward', `✅ 验收通过！${reward} Token 已结算给智能体`);
      } else {
        await tasksAPI.rejectTask(parseInt(id));
        showNotification('warning', '❌ 已拒绝交付物，智能体需重新提交');
      }
      setReviewComment('');
      await fetchDeliveries(parseInt(id));
      await fetchTaskDetails(parseInt(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '验收失败');
    } finally {
      setReviewLoading(false);
      setShowReviewConfirm(null);
    }
  };

  // 撤回验收
  const handleRecallApproval = async () => {
    if (!id) return;
    try {
      setReviewLoading(true);
      // 撤回：恢复到completed状态，等待重新验收
      await tasksAPI.updateTask(parseInt(id), {
        status: 'completed',
        delivery_status: 'submitted'
      });
      await fetchTaskDetails(parseInt(id));
      showNotification('info', '🔄 已撤回验收，任务恢复待验收状态');
    } catch (err) {
      setError(err instanceof Error ? err.message : '撤回失败');
    } finally {
      setReviewLoading(false);
      setShowRecallConfirm(false);
    }
  };

  // 撤回退回
  const handleRecallRejection = async () => {
    if (!id) return;
    try {
      setReviewLoading(true);
      // 撤回退回：恢复到completed状态
      await tasksAPI.updateTask(parseInt(id), {
        status: 'completed',
        delivery_status: 'submitted'
      });
      await fetchTaskDetails(parseInt(id));
      showNotification('info', '🔄 已撤回，任务恢复待验收状态');
    } catch (err) {
      setError(err instanceof Error ? err.message : '撤回失败');
    } finally {
      setReviewLoading(false);
      setShowRecallConfirm(false);
    }
  };



  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 通知组件
  const NotificationBanner = () => {
    if (!notification) return null;
    const bgColors = {
      success: 'bg-gradient-to-r from-green-500 to-emerald-500',
      info: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
      reward: 'bg-gradient-to-r from-purple-500 to-pink-500',
    };
    return (
      <div className={`fixed top-4 right-4 z-50 ${bgColors[notification.type]} text-white px-6 py-3 rounded-xl shadow-lg animate-bounce`}>
        <p className="font-medium">{notification.message}</p>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-slate-600">{error || '任务不存在'}</p>
        <Link to="/tasks" className="text-blue-600 hover:underline mt-4 inline-block">
          返回任务列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/tasks')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回任务列表
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
              {isExperienceDemo && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  体验样例
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              任务ID: {task.id}
              {task.delivery_status && (
                <>
                  <span className="mx-1">·</span>
                  <DeliveryStatusBadge status={task.delivery_status} />
                </>
              )}
              {isExperienceDemo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium ml-2">
                  <Award className="w-3 h-3" />
                  高质量交付
                </span>
              )}
            </p>
          </div>
          <StatusBadge status={task.status as TaskStatus} />
        </div>

        <p className="text-slate-600 leading-relaxed">{task.description || '暂无描述'}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">预算</p>
            <p className="font-bold text-purple-600 text-lg">💎 {task.budget}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">截止时间</p>
            <p className="font-medium flex items-center justify-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              {formatDate(task.deadline)}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">发布时间</p>
            <p className="font-medium text-sm">{formatDate(task.created_at)}</p>
          </div>
          {task.rating && (
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">评分</p>
              <RatingStars rating={task.rating} />
            </div>
          )}
        </div>

        {task.requirements && task.requirements.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              能力要求
            </h3>
            <div className="flex flex-wrap gap-2">
              {task.requirements.map((req, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                  {req.category} Lv.{req.min_level}+
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-4">
          {task.status === 'open' && (
            <button
              onClick={() => handleCancelTask()}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
            >
              取消任务
            </button>
          )}
          {task.status === 'matched' && (
            <Card className="!p-4 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-700">🎉 已匹配！智能体已领取任务</p>
                  <p className="text-sm text-slate-500">智能体即将自动开始执行，请稍候...</p>
                </div>
              </div>
            </Card>
          )}
          {task.status === 'in_progress' && (
            <Card className="!p-4 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-700">⚡ 忙碌中</p>
                    <p className="text-sm text-slate-500">智能体正在努力执行任务...</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {task.status === 'completed' && task.deliveries && task.deliveries.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleApproveTask()}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                验收通过
              </button>
              <button
                onClick={() => handleRejectDelivery(task.deliveries[0].id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                打回重做
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* ========== 交付提交区域（智能体视角） ========== */}
      {(task.status === 'matched' || task.status === 'in_progress') && isMatchedAgent && (
        <Card className="!p-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">
              {task.status === 'matched' ? '🕐 智能体准备中' : '⚡ 智能体工作中'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              智能体会自动完成任务并提交交付物，无需手动操作
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
            </div>
            <p className="text-xs text-slate-400">
              通常1-5分钟完成，交付结果会自动出现在下方
            </p>
          </div>
        </Card>
      )}

      {/* ========== 交付记录展示区域 ========== */}
      {deliveries.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" />
            交付记录
          </h3>
          {/* 分享链接提示 */}
          {shareLink && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-green-800 flex items-center gap-2">
                    ✨ 交付成功！快分享给朋友吧
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    分享链接: <span className="font-mono">{shareLink}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + shareLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    copied ? 'bg-green-500 text-white' : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {copied ? '已复制 ✓' : '复制链接'}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">
                    提交时间: {formatDate(delivery.created_at)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/delivery/task_${id}_${delivery.id}`;
                        navigator.clipboard.writeText(link);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      复制链接
                    </button>
                    <Link
                      to={`/delivery/task_${id}_${delivery.id}`}
                      className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      查看详情 →
                    </Link>
                    <DeliveryStatusBadge status={delivery.status} />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 mb-3">
                  <RichMarkdownErrorBoundary>
                    <RichMarkdown content={delivery.content} maxPreviewLength={2000} />
                  </RichMarkdownErrorBoundary>
                  {delivery.result_url && (
                    <a
                      href={delivery.result_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-blue-600 hover:underline text-sm"
                    >
                      查看交付物: {delivery.result_url}
                    </a>
                  )}
                </div>
                {delivery.review_comment && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <strong>验收评价:</strong> {delivery.review_comment}
                    </p>
                    {delivery.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm text-amber-700">评分:</span>
                        <RatingStars rating={delivery.rating} />
                      </div>
                    )}
                  </div>
                )}
                {delivery.reviewed_at && (
                  <p className="text-xs text-slate-400 mt-2">
                    验收时间: {formatDate(delivery.reviewed_at)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ========== 验收操作区域（发布者视角） ========== */}
      {isTaskCreator && (task.delivery_status === 'submitted') && (
        <Card className="border-2 border-purple-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-purple-500" />
            验收交付物
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                评分
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`p-1 rounded transition-colors ${
                      star <= reviewRating ? 'text-amber-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-current' : ''}`} />
                  </button>
                ))}
                <span className="ml-2 text-slate-600">{reviewRating} 星</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                验收评价（可选）
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="对智能体的交付物进行评价..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewConfirm({action: 'accept'})}
                disabled={reviewLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-5 h-5" />
                {reviewLoading ? '处理中...' : '✅ 验收通过'}
              </button>
              <button
                onClick={() => setShowReviewConfirm({action: 'reject'})}
                disabled={reviewLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-5 h-5" />
                拒绝
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              验收通过后，任务预算将自动结算给智能体
            </p>
          </div>
        </Card>
      )}

      {/* ========== 已验收状态 + 撤回功能 ========== */}
      {isTaskCreator && task.status === 'approved' && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">已验收通过 ✅</p>
                <p className="text-sm text-green-600">任务完成，预算已结算</p>
              </div>
            </div>
            <button
              onClick={() => setShowRecallConfirm(true)}
              disabled={reviewLoading}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-white/80 rounded-lg transition-colors disabled:opacity-50"
            >
              撤回验收
            </button>
          </div>
        </Card>
      )}

      {/* 已退回状态 */}
      {isTaskCreator && task.delivery_status === 'rejected' && (
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">已退回重做 🔄</p>
                <p className="text-sm text-amber-600">智能体需重新提交交付物</p>
              </div>
            </div>
            <button
              onClick={() => handleRecallRejection()}
              disabled={reviewLoading}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-white/80 rounded-lg transition-colors disabled:opacity-50"
            >
              撤回退回
            </button>
          </div>
        </Card>
      )}

      {/* 验收确认弹窗 */}
      {showReviewConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${showReviewConfirm.action === 'accept' ? 'bg-green-100' : 'bg-red-100'}`}>
                {showReviewConfirm.action === 'accept' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {showReviewConfirm.action === 'accept' ? '确认验收通过' : '确认验收退回'}
                </h3>
                <p className="text-sm text-slate-500">
                  {showReviewConfirm.action === 'accept' ? '任务预算将自动结算给智能体' : '智能体需重新提交交付物'}
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">任务名称</span>
                <span className="text-slate-900 font-medium">{task?.title}</span>
              </div>
              {showReviewConfirm.action === 'accept' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">评分</span>
                  <span className="text-amber-600 font-medium">{reviewRating} 星</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">任务奖励</span>
                <span className="text-blue-600 font-medium">💎 {task?.budget}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewConfirm(null)}
                disabled={reviewLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => handleReviewDelivery(showReviewConfirm.action)}
                disabled={reviewLoading}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${
                  showReviewConfirm.action === 'accept' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90' 
                    : 'bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90'
                }`}
              >
                {reviewLoading ? '处理中...' : (showReviewConfirm.action === 'accept' ? '确认通过' : '确认退回')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 撤回确认弹窗 */}
      {showRecallConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">确认撤回验收</h3>
                <p className="text-sm text-slate-500">任务将恢复待验收状态</p>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                撤回后，任务将恢复到<span className="font-medium text-slate-900">待验收</span>状态，您可以重新验收或退回交付物。
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRecallConfirm(false)}
                disabled={reviewLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleRecallApproval}
                disabled={reviewLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reviewLoading ? '处理中...' : '确认撤回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {task.publisher && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
            发布者
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{task.publisher?.username || '未知用户'}</p>
              <p className="text-sm text-slate-500">{task.publisher?.email || ''}</p>
            </div>
          </div>
        </Card>
      )}

      {task.executor && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-slate-400" />
            执行智能体
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{task.executor.name}</p>
              <p className="text-sm text-slate-500">成功率 {task.executor.success_rate}% · 评分 {task.executor.avg_rating}</p>
            </div>
          </div>
        </Card>
      )}

      {task.result && (
        <Card className={isExperienceDemo ? 'border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50' : ''}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              {isExperienceDemo ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    智能体交付成果
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  任务成果
                </>
              )}
            </h3>
            {isExperienceDemo && (
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 text-sm font-medium">5.0</span>
              </div>
            )}
          </div>

          {isExperienceDemo ? (
            <div className="prose prose-slate max-w-none">
              <RichMarkdownErrorBoundary>
                <RichMarkdown content={task.result} />
              </RichMarkdownErrorBoundary>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4">
              <pre className="whitespace-pre-wrap text-sm text-slate-600 font-mono">{task.result}</pre>
            </div>
          )}

          {isExperienceDemo && (
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <strong>这是智能体生成的体验样例。</strong>
                你也可以发布类似任务，让AI智能体帮你完成！
              </p>
            </div>
          )}
        </Card>
      )}

      {task.status === 'open' && agents.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            推荐智能体
            <span className="text-xs text-slate-400 font-normal ml-auto">
              {(() => {
                const taskDesc = (task.title + ' ' + task.description).toLowerCase();
                const scored = agents.map(a => {
                  const aInfo = (a.name + ' ' + (a.description||'') + ' ' + (a.capabilities||[]).join(' ')).toLowerCase();
                  let score = 0;
                  const keywords = taskDesc.split(/[\s,，。、；：]+/).filter(w => w.length > 1);
                  keywords.forEach(kw => { if (aInfo.includes(kw)) score += 2; });
                  if (taskDesc.includes('视频') && (aInfo.includes('视频') || aInfo.includes('猎影') || aInfo.includes('甄选'))) score += 5;
                  if (taskDesc.includes('搜索') && (aInfo.includes('搜索') || aInfo.includes('猎影'))) score += 5;
                  if (taskDesc.includes('教材') && (aInfo.includes('教材') || aInfo.includes('点津'))) score += 5;
                  if (taskDesc.includes('批改') && (aInfo.includes('批改') || aInfo.includes('花仙子'))) score += 5;
                  if (taskDesc.includes('创作') && (aInfo.includes('创作') || aInfo.includes('灵感') || aInfo.includes('文心'))) score += 5;
                  if (taskDesc.includes('图') && (aInfo.includes('画') || aInfo.includes('墨彩'))) score += 5;
                  if (taskDesc.includes('音乐') && (aInfo.includes('韵律') || aInfo.includes('配乐'))) score += 5;
                  if (taskDesc.includes('写作') && (aInfo.includes('文心') || aInfo.includes('编剧'))) score += 5;
                  if (taskDesc.includes('提示词') && (aInfo.includes('创作') || aInfo.includes('灵感'))) score += 5;
                  score += (a.success_rate || 0) * 0.05;
                  score += (a.avg_rating || 0) * 0.1;
                  return { ...a, matchScore: score };
                });
                scored.sort((a, b) => b.matchScore - a.matchScore);
                return scored;
              })().length} 个可用
            </span>
          </h3>
          <div className="space-y-3">
            {(() => {
              const taskDesc = (task.title + ' ' + task.description).toLowerCase();
              const scored = agents.map(a => {
                const aInfo = (a.name + ' ' + (a.description||'') + ' ' + (a.capabilities||[]).join(' ')).toLowerCase();
                let score = 0;
                const keywords = taskDesc.split(/[\s,，。、；：]+/).filter(w => w.length > 1);
                keywords.forEach(kw => { if (aInfo.includes(kw)) score += 2; });
                if (taskDesc.includes('视频') && (aInfo.includes('视频') || aInfo.includes('猎影') || aInfo.includes('甄选'))) score += 5;
                if (taskDesc.includes('搜索') && (aInfo.includes('搜索') || aInfo.includes('猎影'))) score += 5;
                if (taskDesc.includes('教材') && (aInfo.includes('教材') || aInfo.includes('点津'))) score += 5;
                if (taskDesc.includes('批改') && (aInfo.includes('批改') || aInfo.includes('花仙子'))) score += 5;
                if (taskDesc.includes('创作') && (aInfo.includes('创作') || aInfo.includes('灵感') || aInfo.includes('文心'))) score += 5;
                if (taskDesc.includes('图') && (aInfo.includes('画') || aInfo.includes('墨彩'))) score += 5;
                if (taskDesc.includes('音乐') && (aInfo.includes('韵律') || aInfo.includes('配乐'))) score += 5;
                if (taskDesc.includes('写作') && (aInfo.includes('文心') || aInfo.includes('编剧'))) score += 5;
                if (taskDesc.includes('提示词') && (aInfo.includes('创作') || aInfo.includes('灵感'))) score += 5;
                score += (a.success_rate || 0) * 0.05;
                score += (a.avg_rating || 0) * 0.1;
                return { ...a, matchScore: score };
              });
              scored.sort((a, b) => b.matchScore - a.matchScore);
              return scored.slice(0, 8);
            })().map((agent, idx) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : idx < 3 ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {agent.name}
                      {idx === 0 && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">最佳匹配</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      成功率 {agent.success_rate}% · 评分 {agent.avg_rating}
                      {agent.matchScore > 0 && <span className="ml-1 text-blue-500">匹配度 {Math.min(99, Math.round(agent.matchScore * 5))}%</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleMatchAgent(agent.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50"
                >
                  匹配
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TaskDetailPage;

