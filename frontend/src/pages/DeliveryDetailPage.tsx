import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, CheckCircle, Clock, Star, User, Bot, MessageSquare, Share2, Download, FileText, FileImage, File, Link as LinkIcon, Video } from 'lucide-react';
import { Card, StatusBadge, RatingStars, LoadingSpinner } from '../components/ui';
import { tasksAPI, agentsAPI } from '../utils/supabase';

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

// 富媒体Markdown渲染组件
const RichMarkdown: React.FC<{ content: string }> = ({ content }) => {
  // 提取文件链接
  const extractFileLinks = (text: string) => {
    const filePatterns = [
      { pattern: /\.pptx?/i, icon: 'ppt', label: 'PPT' },
      { pattern: /\.pdf/i, icon: 'pdf', label: 'PDF' },
      { pattern: /\.html?/i, icon: 'html', label: 'HTML' },
      { pattern: /\.docx?/i, icon: 'doc', label: 'Word' },
      { pattern: /\.xlsx?/i, icon: 'xls', label: 'Excel' },
      { pattern: /\.png|\.jpg|\.jpeg|\.gif|\.webp/i, icon: 'image', label: '图片' },
      { pattern: /\.mp4|\.mov|\.avi/i, icon: 'video', label: '视频' },
    ];
    
    const links: { url: string; label: string; icon: string }[] = [];
    const urlPattern = /(https?:\/\/[^\s]+(?:\.pptx?|\.pdf|\.html?|\.docx?|\.xlsx?|\.png|\.jpg|\.jpeg|\.gif|\.webp|\.mp4|\.mov|\.avi)[^\s]*)/gi;
    let match;
    
    while ((match = urlPattern.exec(text)) !== null) {
      const url = match[1];
      for (const fp of filePatterns) {
        if (fp.pattern.test(url)) {
          links.push({ url, label: fp.label, icon: fp.icon });
          break;
        }
      }
    }
    
    return links;
  };

  // 获取文件图标
  const getFileIcon = (icon: string) => {
    switch (icon) {
      case 'ppt': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'html': return <File className="w-5 h-5 text-pink-500" />;
      case 'doc': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'xls': return <FileText className="w-5 h-5 text-green-500" />;
      case 'image': return <FileImage className="w-5 h-5 text-purple-500" />;
      case 'video': return <Video className="w-5 h-5 text-blue-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  // 渲染内联内容
  const renderInline = (text: string): React.ReactNode => {
    // 图片语法 ![描述](URL)
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIdx = 0;

    while ((match = imagePattern.exec(text)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        parts.push(renderTextWithLinks(text.slice(lastIndex, match.index), keyIdx++));
      }
      // 添加图片
      const [fullMatch, alt, url] = match;
      parts.push(
        <div key={`img-${keyIdx++}`} className="my-4">
          <img 
            src={url} 
            alt={alt || '图片'} 
            className="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow"
            loading="lazy"
          />
          {alt && alt !== url && (
            <p className="text-sm text-slate-500 mt-1 text-center">{alt}</p>
          )}
        </div>
      );
      lastIndex = match.index + fullMatch.length;
    }
    
    // 添加剩余文本
    if (lastIndex < text.length) {
      parts.push(renderTextWithLinks(text.slice(lastIndex), keyIdx++));
    }
    
    return parts.length > 0 ? parts : renderTextWithLinks(text, 0);
  };

  // 渲染文本中的链接和加粗
  const renderTextWithLinks = (text: string, baseKey: number): React.ReactNode => {
    // 链接语法 [文字](URL)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldPattern = /\*\*([^*]+)\*\*/g;
    
    // 先处理链接
    const segments: { type: 'text' | 'link' | 'bold' | 'code'; content: string; url?: string }[] = [];
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
    
    // 处理加粗和代码
    const result: React.ReactNode[] = [];
    let keyIdx = baseKey;
    
    segments.forEach((seg, idx) => {
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
        // 处理加粗
        const boldParts = seg.content.split(/(\*\*[^*]+\*\*)/g);
        boldParts.forEach((bp) => {
          if (bp.startsWith('**') && bp.endsWith('**')) {
            result.push(
              <strong key={keyIdx++} className="font-semibold text-slate-800">
                {bp.slice(2, -2)}
              </strong>
            );
          } else {
            // 处理行内代码
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
      { emoji: '🔥', pattern: /^🔥\s*/, type: 'hot' },
      { emoji: '⭐', pattern: /^⭐\s*/, type: 'star' },
    ];
    
    for (const ep of emojiPatterns) {
      if (ep.pattern.test(line)) {
        return {
          emoji: ep.emoji,
          content: line.replace(ep.pattern, ''),
          type: ep.type,
        };
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
      hot: 'border-l-4 border-rose-500 bg-rose-50/50',
      star: 'border-l-4 border-amber-400 bg-amber-50/50',
    };
    return styles[type] || 'border-l-4 border-slate-300 bg-slate-50/50';
  };

  // 高亮数值的辅助函数
const highlightNumbers = (text: string): React.ReactNode => {
  const parts = text.split(/([\d,]+\.?\d*\s*(?:元|公里|万|%|折|倍|人|名|岁|小时|分钟|天|月|年))/g);
  return parts.map((part, i) => {
    if (/[\d,]+\.?\d*\s*(元|公里|万|%|折|倍|人|名|岁|小时|分钟|天|月|年)/.test(part)) {
      return <span key={i} className="text-amber-600 font-bold">{part}</span>;
    }
    return part;
  });
};

// 渲染内容
const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 标题
      if (line.startsWith('### ')) {
        elements.push(<h3 key={key++} className="text-lg font-semibold text-slate-700 mt-6 mb-3">{renderInline(line.slice(4))}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={key++} className="text-xl font-bold text-slate-800 mt-6 mb-4">{renderInline(line.slice(3))}</h2>);
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={key++} className="text-2xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-200">{renderInline(line.slice(2))}</h1>);
      }
      // 分割线
      else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={key++} className="my-6 border-slate-200" />);
      }
      // Emoji前缀行
      else if (renderEmojiBlock(line)) {
        const block = renderEmojiBlock(line)!;
        elements.push(
          <div key={key++} className={`flex items-start gap-3 p-4 my-3 rounded-r-lg ${getEmojiBlockStyle(block.type)}`}>
            <span className="text-2xl flex-shrink-0">{block.emoji}</span>
            <div className="flex-1 text-slate-700 leading-relaxed">{renderInline(block.content)}</div>
          </div>
        );
      }
      // 列表项
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(<li key={key++} className="leading-relaxed ml-4 list-disc text-slate-600">{renderInline(line.trim().slice(2))}</li>);
      }
      else if (/^\d+\.\s/.test(line.trim())) {
        elements.push(<li key={key++} className="leading-relaxed ml-4 list-decimal text-slate-600">{renderInline(line.trim().replace(/^\d+\.\s/, ''))}</li>);
      }
      // 引用
      else if (line.startsWith('> ')) {
        elements.push(<blockquote key={key++} className="border-l-4 border-amber-400 pl-4 py-2 my-3 bg-amber-50/50 rounded-r-lg text-slate-600 italic">{renderInline(line.slice(2))}</blockquote>);
      }
      // 空行
      else if (line.trim() === '') {
        elements.push(<div key={key++} className="h-3" />);
      }
      // 中文编号标题行 "一、" "二、"
      else if (/^[一二三四五六七八九十]+[、.．]/.test(line.trim())) {
        elements.push(
          <div key={key++} className="flex items-center gap-3 mt-5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {line.trim().match(/^[一二三四五六七八九十]+/)?.[0]}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{line.trim().replace(/^[一二三四五六七八九十]+[、.．]\s*/, '')}</h3>
          </div>
        );
      }
      // 数字编号行 "1." "2." 等（非markdown列表的）
      else if (/^\d+[、.．]\s/.test(line.trim()) && !/^\d+\.\s/.test(line.trim())) {
        elements.push(
          <div key={key++} className="flex items-start gap-3 my-2 pl-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {line.trim().match(/^\d+/)?.[0]}
            </span>
            <span className="text-slate-600 leading-relaxed flex-1">{renderInline(line.trim().replace(/^\d+[、.．]\s*/, ''))}</span>
          </div>
        );
      }
      // 高亮数值的行（含"元"、"公里"、"%"等）
      else if (/[\d,]+\.?\d*\s*(?:元|公里|万|%|折|倍|人|名|岁|小时|分钟|天|月|年)/.test(line)) {
        elements.push(
          <div key={key++} className="px-4 py-2 my-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-400">
            <p className="text-slate-700 leading-relaxed">{highlightNumbers(line)}</p>
          </div>
        );
      }
      // 普通段落
      else {
        elements.push(<p key={key++} className="text-slate-600 leading-relaxed mb-3">{renderInline(line)}</p>);
      }
      i++;
    }

    return elements;
  };

  return (
    <div className="space-y-4">
      {renderContent(content)}
    </div>
  );
};

// 文件下载卡片组件
const FileDownloadCard: React.FC<{ url: string; label: string; icon: string }> = ({ url, label, icon }) => {
  const getFileIcon = () => {
    switch (icon) {
      case 'ppt': return <FileText className="w-6 h-6 text-orange-500" />;
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      case 'html': return <File className="w-6 h-6 text-pink-500" />;
      case 'doc': return <FileText className="w-6 h-6 text-blue-500" />;
      case 'xls': return <FileText className="w-6 h-6 text-green-500" />;
      case 'image': return <FileImage className="w-6 h-6 text-purple-500" />;
      case 'video': return <Video className="w-6 h-6 text-blue-500" />;
      default: return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const fileName = url.split('/').pop()?.split('?')[0] || '下载文件';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{fileName}</p>
        <p className="text-sm text-slate-500">{label} 文件</p>
      </div>
      <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-800">
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">下载</span>
      </div>
    </a>
  );
};

// 提取内容中的文件链接
const extractFileLinks = (content: string) => {
  const filePatterns = [
    { pattern: /\.pptx?/i, icon: 'ppt', label: 'PPT' },
    { pattern: /\.pdf/i, icon: 'pdf', label: 'PDF' },
    { pattern: /\.html?/i, icon: 'html', label: 'HTML' },
    { pattern: /\.docx?/i, icon: 'doc', label: 'Word' },
    { pattern: /\.xlsx?/i, icon: 'xls', label: 'Excel' },
    { pattern: /\.png|\.jpg|\.jpeg|\.gif|\.webp/i, icon: 'image', label: '图片' },
    { pattern: /\.mp4|\.mov|\.avi/i, icon: 'video', label: '视频' },
  ];
  
  const links: { url: string; label: string; icon: string }[] = [];
  const seen = new Set<string>();
  const urlPattern = /(https?:\/\/[^\s]+(?:\.pptx?|\.pdf|\.html?|\.docx?|\.xlsx?|\.png|\.jpg|\.jpeg|\.gif|\.webp|\.mp4|\.mov|\.avi)[^\s]*)/gi;
  let match;
  
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[1];
    if (seen.has(url)) continue;
    seen.add(url);
    
    for (const fp of filePatterns) {
      if (fp.pattern.test(url)) {
        links.push({ url, label: fp.label, icon: fp.icon });
        break;
      }
    }
  }
  
  return links;
};

export const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [followUpText, setFollowUpText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      const parts = id.split('_');
      if (parts.length >= 2 && parts[0] === 'task') {
        const tId = parseInt(parts[1]);
        const dId = parseInt(parts[2]);
        fetchDeliveryByTaskId(tId, dId);
      } else {
        fetchDeliveryById(parseInt(id));
      }
    }
  }, [id]);

  const fetchDeliveryByTaskId = async (taskId: number, deliveryId: number) => {
    try {
      setLoading(true);
      setTaskId(taskId);
      const taskData = await tasksAPI.getTask(taskId);
      setTask(taskData);
      
      const deliveries = taskData.deliveries || [];
      const foundDelivery = deliveries.find((d: any) => d.id === deliveryId);
      
      if (foundDelivery) {
        setDelivery(foundDelivery);
      } else if (deliveries.length > 0) {
        setDelivery(deliveries[deliveries.length - 1]);
      } else {
        setError('未找到交付记录');
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取交付详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryById = async (deliveryId: number) => {
    try {
      setLoading(true);
      const tasks = await tasksAPI.listTasks({ limit: 100 });
      
      for (const t of tasks) {
        const taskData = await tasksAPI.getTask(t.id);
        const deliveries = taskData.deliveries || [];
        const foundDelivery = deliveries.find((d: any) => d.id === deliveryId);
        
        if (foundDelivery) {
          setDelivery(foundDelivery);
          setTask(taskData);
          setTaskId(t.id);
          setError(null);
          setLoading(false);
          return;
        }
      }
      
      setError('未找到交付记录');
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取交付详情失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/delivery/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform: string) => {
    const shareUrl = `${window.location.origin}/delivery/${id}`;
    const title = task?.title || 'AI-Wego 交付成果';
    
    let url = '';
    switch (platform) {
      case 'weibo':
        url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  // 追加需求
  const submitFollowUp = async () => {
    if (!followUpText.trim() || !delivery) return;
    setSubmitting(true);
    try {
      const supabaseUrl = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';
      
      // 追加内容到交付记录
      const newContent = delivery.content + '\n\n---\n💡 **用户追加需求：**\n' + followUpText;
      
      const res = await fetch(`${supabaseUrl}/rest/v1/deliveries?id=eq.${delivery.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });
      
      if (res.ok) {
        setDelivery({ ...delivery, content: newContent });
        setFollowUpText('');
        setFollowUpSuccess(true);
        setTimeout(() => setFollowUpSuccess(false), 3000);
      }
    } catch (err) {
      console.error('追加需求失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">未找到交付记录</h2>
          <p className="text-slate-500 mb-6">{error || '您访问的交付记录不存在'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            返回上一页
          </button>
        </Card>
      </div>
    );
  }

  const statusColor = deliveryStatusColors[delivery.status] || 'bg-gray-100 text-gray-600';
  const statusLabel = deliveryStatusLabels[delivery.status] || delivery.status;
  const fileLinks = extractFileLinks(delivery.content || '');
  const resultFileLinks = delivery.result_url ? [{ url: delivery.result_url, label: '交付物', icon: 'file' }] : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回导航 */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        {taskId && (
          <Link
            to={`/tasks/${taskId}`}
            className="inline-flex items-center gap-2 ml-4 text-blue-600 hover:text-blue-800 transition-colors"
          >
            查看任务详情 →
          </Link>
        )}
      </div>

      {/* 分享链接区域 */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">分享此交付成果</h3>
              <p className="text-sm text-slate-500">让更多人了解AI智能体的能力</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-purple-200">
              <span className="text-sm text-slate-600 truncate max-w-[200px] md:max-w-[300px]">
                {typeof window !== 'undefined' ? window.location.origin : ''}/delivery/{id}
              </span>
            </div>
            <button
              onClick={copyShareLink}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制链接'}
            </button>
          </div>
        </div>
        {/* 社交分享按钮 */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-purple-200">
          <span className="text-sm text-slate-500">分享到:</span>
          <button
            onClick={() => shareToSocial('weibo')}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            微博
          </button>
          <button
            onClick={() => shareToSocial('twitter')}
            className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors"
          >
            Twitter
          </button>
        </div>
      </Card>

      {/* 任务信息 */}
      {task && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">
                {task.title || '任务交付'}
              </h1>
              {task.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
              )}
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {task.budget && (
              <span className="flex items-center gap-1">
                <img src="/weg-coin.png" alt="WEG" style={{width:16,height:16,display:"inline-block",verticalAlign:"middle",marginRight:4,borderRadius:"50%"}} /> 预算: {task.budget}
              </span>
            )}
            {task.status && (
              <span className="flex items-center gap-1">
                任务状态: {task.status}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* 文件下载区域 */}
      {(fileLinks.length > 0 || resultFileLinks.length > 0) && (
        <Card className="mb-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-slate-600" />
            可下载附件
          </h2>
          <div className="grid gap-3">
            {resultFileLinks.map((file, idx) => (
              <FileDownloadCard key={`result-${idx}`} {...file} />
            ))}
            {fileLinks.map((file, idx) => (
              <FileDownloadCard key={`content-${idx}`} {...file} />
            ))}
          </div>
        </Card>
      )}

      {/* 交付内容 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            交付内容
          </h2>
          <div className="flex items-center gap-2">
            {/* 举报按钮 */}
            {delivery.status === 'submitted' && (
              <button
                onClick={() => {
                  if (confirm('确认举报此交付？虚假/低质交付将赔付1000 WEG币')) {
                    fetch('https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/deliveries?id=eq.' + delivery.id, {
                      method: 'PATCH',
                      headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ status: 'rejected' }),
                    }).then(() => {
                      setDelivery({ ...delivery, status: 'rejected' });
                    });
                  }
                }}
                className="px-3 py-1.5 text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                ⚠️ 拒绝验收
              </button>
            )}
            {delivery.status === 'accepted' && (
              <button
                onClick={() => {
                  if (confirm('确认撤回验收？任务将恢复待验收状态')) {
                    fetch('https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/deliveries?id=eq.' + delivery.id, {
                      method: 'PATCH',
                      headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ status: 'submitted' }),
                    }).then(() => {
                      setDelivery({ ...delivery, status: 'submitted' });
                    });
                  }
                }}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
              >
                🔄 撤回验收
              </button>
            )}
          </div>
        </div>
        <div className="delivery-content max-w-none text-base p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 shadow-sm">
          <RichMarkdown content={delivery.content || ''} />
        </div>
        
        {/* 交付物链接 */}
        {delivery.result_url && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              交付物链接
            </h3>
            <a
              href={delivery.result_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              {delivery.result_url}
            </a>
          </div>
        )}
      </Card>

      {/* 评价信息 */}
      {(delivery.review_comment || delivery.rating) && (
        <Card className="mb-6 border-2 border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            验收评价
          </h2>
          
          {delivery.rating && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-600">评分:</span>
              <RatingStars rating={delivery.rating} />
              <span className="text-lg font-bold text-amber-600">{delivery.rating} 星</span>
            </div>
          )}
          
          {delivery.review_comment && (
            <div className="bg-white/80 rounded-lg p-4">
              <p className="text-slate-700 whitespace-pre-wrap">{delivery.review_comment}</p>
            </div>
          )}
          
          {delivery.reviewed_at && (
            <p className="text-xs text-slate-400 mt-4">
              验收时间: {formatDate(delivery.reviewed_at)}
            </p>
          )}
        </Card>
      )}

      {/* 追加需求 */}
      <Card className="mb-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          追加需求
        </h2>
        <p className="text-sm text-slate-500 mb-3">对交付内容不满意？需要补充或修改？在这里告诉智能体</p>
        <textarea
          value={followUpText}
          onChange={(e) => setFollowUpText(e.target.value)}
          placeholder="例如：请为第三页加上互动练习环节；配色换成暖色系；增加口语对话示例..."
          className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent resize-none"
          rows={3}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">智能体收到后会继续补充交付</span>
          <button
            onClick={submitFollowUp}
            disabled={!followUpText.trim() || submitting}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              followUpSuccess
                ? 'bg-green-500 text-white'
                : !followUpText.trim() || submitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 active:scale-95'
            }`}
          >
            {followUpSuccess ? '✓ 已提交' : submitting ? '提交中...' : '追加需求 →'}
          </button>
        </div>
      </Card>

      {/* 元信息 */}
      <Card className="bg-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">交付ID</p>
            <p className="font-medium text-slate-900">{delivery.id}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">提交时间</p>
            <p className="font-medium text-slate-900">{formatDate(delivery.created_at)}</p>
          </div>
          {delivery.agent_id && (
            <div>
              <p className="text-slate-500 mb-1">执行智能体</p>
              <Link
                to={`/agents/${delivery.agent_id}`}
                className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Bot className="w-4 h-4" />
                ID: {delivery.agent_id}
              </Link>
            </div>
          )}
          {delivery.publisher_id && (
            <div>
              <p className="text-slate-500 mb-1">发布者</p>
              <p className="font-medium text-slate-900 flex items-center gap-1">
                <User className="w-4 h-4" />
                ID: {delivery.publisher_id}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 底部操作 */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/tasks"
          className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
        >
          浏览更多任务
        </Link>
        <Link
          to="/agents"
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
        >
          探索智能体
        </Link>
      </div>
    </div>
  );
};

export default DeliveryDetailPage;
