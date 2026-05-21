// 教材视频助手页面 v3 - 功能模块与智能体任务系统关联
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Video, Filter, Clock, Eye, ThumbsUp, ChevronDown, ChevronUp, Copy, ExternalLink, Sparkles, ArrowRight, Bot, Loader2, CheckCircle, X, Plus, Wand2 } from 'lucide-react';
import { Card } from '../components/ui';
import { videoSearch } from '../services/api';
import type { VideoSearchResult } from '../types';

// Supabase配置
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// 预设快捷标签
const quickTags = [
  { name: '初中物理', query: '初中物理' },
  { name: '高中数学', query: '高中数学' },
  { name: '小学语文', query: '小学语文' },
  { name: '初中英语', query: '初中英语' },
  { name: '高中化学', query: '高中化学' },
  { name: '初中历史', query: '初中历史' },
  { name: '初中地理', query: '初中地理' },
  { name: '高中生物', query: '高中生物' },
];

// 智能体工作流步骤
const workflowSteps = [
  { step: 1, name: '教材解析', agent: '教材解析师·点津', icon: BookOpen, color: 'from-blue-500 to-cyan-500', desc: '提取学科、年级、知识点' },
  { step: 2, name: '视频搜索', agent: '视频搜索师·猎影', icon: Video, color: 'from-purple-500 to-pink-500', desc: 'B站等多平台搜索' },
  { step: 3, name: '视频筛选', agent: '视频筛选师·甄选', icon: Filter, color: 'from-amber-500 to-orange-500', desc: '质量评估与适合度排序' },
  { step: 4, name: '内容整合', agent: '内容整合师·融通', icon: Sparkles, color: 'from-emerald-500 to-teal-500', desc: '生成推荐清单与教学建议' },
];

// 功能模块配置
interface FunctionModule {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  agentId: number;
  agentName: string;
  modalTitle: string;
  modalDescription: string;
  color: string;
}

const functionModules: FunctionModule[] = [
  {
    id: 'diagnose',
    icon: <Wand2 className="w-6 h-6" />,
    title: '诊断视频缺口',
    description: '分析教材章节的视频缺口情况',
    gradient: 'from-blue-500 to-cyan-500',
    agentId: 21,
    agentName: '教材解析师·点津',
    modalTitle: '诊断视频缺口',
    modalDescription: '请分析以下教材章节的视频缺口情况',
    color: 'blue'
  },
  {
    id: 'match',
    icon: <Filter className="w-6 h-6" />,
    title: '按教学环节匹配',
    description: '按导入→讲解→巩固→拓展四个环节匹配教学视频',
    gradient: 'from-purple-500 to-pink-500',
    agentId: 22,
    agentName: '视频搜索师·猎影',
    modalTitle: '按教学环节匹配视频',
    modalDescription: '按导入→讲解→巩固→拓展四个环节匹配教学视频',
    color: 'purple'
  },
  {
    id: 'generate',
    icon: <Sparkles className="w-6 h-6" />,
    title: '智能体自动补缺',
    description: '自动制作缺失环节的教学视频，兼顾视觉型和听觉型学生',
    gradient: 'from-emerald-500 to-teal-500',
    agentId: 24,
    agentName: '内容整合师·融通',
    modalTitle: '智能体制作教学视频',
    modalDescription: '自动制作缺失环节的教学视频，兼顾视觉型和听觉型学生',
    color: 'emerald'
  }
];

// 教学环节选项
const teachingPhases = [
  { id: 'intro', name: '导入', icon: '🎬' },
  { id: 'explain', name: '讲解', icon: '📖' },
  { id: 'practice', name: '巩固', icon: '✏️' },
  { id: 'expand', name: '拓展', icon: '🚀' },
];

// 学生类型选项
const studentTypes = [
  { id: 'visual', name: '视觉型', icon: '👁️', desc: '喜欢看图、看视频学习' },
  { id: 'auditory', name: '听觉型', icon: '👂', desc: '喜欢听讲解、听音频学习' },
];


// 任务创建弹窗组件
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: FunctionModule | null;
  initialKeyword?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, module, initialKeyword = '' }) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedStudentType, setSelectedStudentType] = useState<string>('visual');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  React.useEffect(() => {
    if (initialKeyword) setKeyword(initialKeyword);
  }, [initialKeyword]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const submitTask = async () => {
    if (!keyword.trim()) {
      showToast('请输入知识点', 'error');
      return;
    }
    if (!module) return;

    setSubmitting(true);
    try {
      const taskData = {
        title: `${module.modalTitle} - ${keyword}`,
        description: `${module.modalDescription}\n知识点：${keyword}\n教学环节：${selectedPhase || '未选择'}\n学生类型：${studentTypes.find(s => s.id === selectedStudentType)?.name || '视觉型'}`,
        status: 'matched',
        matched_agent_id: module.agentId,
        budget: 5,
        publisher_id: 3, requirements: []
      };

      const response = await fetch(`${SUPABASE_URL}tasks`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        showToast('✅ 任务创建成功！智能体正在处理中...');
        setTimeout(() => {
          onClose();
          setKeyword('');
          setSelectedPhase('');
        }, 1500);
      } else {
        throw new Error('创建失败');
      }
    } catch (error) {
      console.error('任务创建失败', error);
      showToast('任务创建失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !module) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* 弹窗内容 - 底部弹出式 */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* 顶部拖动条 */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
        
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* 标题 */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center text-white`}>
              {module.icon}
            </span>
            {module.modalTitle}
          </h3>
          <p className="text-sm text-slate-500 mt-2">{module.modalDescription}</p>
        </div>

        {/* 智能体信息 */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{module.agentName}</p>
            <p className="text-xs text-slate-500">自动匹配 · Agent ID: {module.agentId}</p>
          </div>
        </div>

        {/* 知识点输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            知识点 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="如：勾股定理、光的折射、英语现在完成时"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* 教学环节选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            教学环节
          </label>
          <div className="grid grid-cols-4 gap-2">
            {teachingPhases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhase(selectedPhase === phase.id ? '' : phase.id)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                  selectedPhase === phase.id
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <span className="text-lg">{phase.icon}</span>
                <span className="text-xs font-medium">{phase.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 学生类型选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            学生类型
          </label>
          <div className="grid grid-cols-2 gap-3">
            {studentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedStudentType(type.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedStudentType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{type.icon}</span>
                  <span className={`font-medium ${selectedStudentType === type.id ? 'text-blue-600' : 'text-slate-700'}`}>
                    {type.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={submitTask}
          disabled={submitting || !keyword.trim()}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            submitting || !keyword.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : `bg-gradient-to-r ${module.gradient} text-white hover:shadow-lg`
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              创建中...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              创建任务
            </>
          )}
        </button>
      </div>

      {/* Toast提示 */}
      {toast.show && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// 功能模块卡片组件
interface FunctionModuleCardProps {
  module: FunctionModule;
  onClick: () => void;
}

const FunctionModuleCard: React.FC<FunctionModuleCardProps> = ({ module, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative p-6 rounded-2xl bg-gradient-to-br ${module.gradient} text-white text-left transition-all duration-300 ${
        isHovered ? 'scale-105 shadow-2xl' : 'scale-100 shadow-lg'
      }`}
    >
      {/* 图标 */}
      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
        {module.icon}
      </div>
      
      {/* 标题 */}
      <h3 className="text-lg font-bold mb-2">{module.title}</h3>
      
      {/* 描述 */}
      <p className="text-sm text-white/80 line-clamp-2 mb-4">{module.description}</p>
      
      {/* 智能体标签 */}
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4" />
        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
          {module.agentName}
        </span>
      </div>
      
      {/* 点击提示 */}
      <div className={`absolute top-4 right-4 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-xs bg-white/30 px-2 py-1 rounded-full">点击使用</span>
      </div>
    </button>
  );
};

// 视频卡片组件
const VideoCard: React.FC<{ video: VideoSearchResult; index: number }> = ({ video, index }) => {
  const [expanded, setExpanded] = useState(false);
  const handleCopyLink = () => { navigator.clipboard.writeText(video.url); alert('视频链接已复制！'); };
  return (
    <Card className="overflow-hidden group">
      <div className={`h-1.5 bg-gradient-to-r ${video.color || 'from-blue-500 to-purple-500'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r ${video.color || 'from-blue-500 to-purple-500'}`}>TOP {index + 1}</span>
          <span className="flex items-center gap-1 text-amber-500"><ThumbsUp className="w-4 h-4" /><span className="text-sm font-medium">{video.suitability || 95}%</span></span>
        </div>
        <div className="relative mb-4 rounded-xl overflow-hidden bg-slate-100 aspect-video">
          {video.thumbnail ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200"><Video className="w-12 h-12 text-slate-300" /></div>}
          {video.duration && <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">{video.duration}</span>}
        </div>
        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{video.title}</h3>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3"><span>UP主: {video.uploader || '未知'}</span></div>
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{video.views || '0'}</span>
          {video.publishTime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{video.publishTime}</span>}
        </div>
        <div className="flex gap-2 mb-4">
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"><ExternalLink className="w-4 h-4" />观看视频</a>
          <button onClick={handleCopyLink} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"><Copy className="w-4 h-4" /></button>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
          <span>📚 教学建议</span>{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expanded && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg text-sm text-slate-700 space-y-2">
            {video.teachingTips && <div><strong>教学要点：</strong>{video.teachingTips}</div>}
            {video.keyTimePoints && <div><strong>关键时间点：</strong>{video.keyTimePoints}</div>}
            {video.summary && <div><strong>内容摘要：</strong>{video.summary}</div>}
          </div>
        )}
      </div>
    </Card>
  );
};

// 智能体派单提示组件
const AgentDispatchCard: React.FC<{ message: string; agentInfo: { id: number; name: string; description: string }; bilibiliUrl: string; taskId: string; }> = ({ message, agentInfo, bilibiliUrl, taskId }) => {
  return (
    <Card className="!p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center space-y-4">
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-4 border-white">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{message}</h3>
          <p className="text-sm text-slate-600">系统正在为您分配专业智能体制作专属视频</p>
        </div>
        <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-xl shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900">{agentInfo.name}</h4>
            <p className="text-sm text-slate-500">{agentInfo.description}</p>
          </div>
        </div>
        <div className="text-xs text-slate-400">任务编号: {taskId || '创建中...'}</div>
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-400">或者</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <a href={bilibiliUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">
          <ExternalLink className="w-5 h-5" />前往B站自行搜索
        </a>
        <p className="text-xs text-slate-400 mt-2">💡 提示：智能体正在后台制作视频，您可以在「任务中心」查看进度</p>
      </div>
    </Card>
  );
};

// 加载动画组件
const LoadingAnimation: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  return (
    <Card className="!p-6">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
        <h3 className="text-lg font-medium text-slate-700">
          {currentStep === 1 && '📖 正在解析教学内容...'}
          {currentStep === 2 && '🔍 正在搜索B站视频...'}
          {currentStep === 3 && '✨ 正在评估视频质量...'}
          {currentStep === 4 && '🎯 正在生成推荐结果...'}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-all ${
                step <= currentStep ? 'bg-blue-500 scale-110' : 'bg-slate-200'
              }`}
              style={{ animation: step <= currentStep ? 'pulse 1.5s infinite' : 'none', opacity: step === currentStep ? 1 : (step < currentStep ? 1 : 0.5) }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </Card>
  );
};

// 创建搜索任务的函数
const createSearchTask = async (keyword: string) => {
  try {
    const taskData = {
      title: `搜索"${keyword}"教学视频`,
      description: `快捷标签搜索任务\n知识点：${keyword}\n自动匹配：视频搜索师·猎影`,
      status: 'matched',
      matched_agent_id: 22,
      budget: 5,
      publisher_id: 3, requirements: []
    };

    const response = await fetch(`${SUPABASE_URL}tasks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (response.ok) {
      console.log('搜索任务创建成功');
    }
  } catch (error) {
    console.error('搜索任务创建失败', error);
  }
};

export const VideoSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 任务弹窗状态
  const [taskModal, setTaskModal] = useState<{
    isOpen: boolean;
    module: FunctionModule | null;
  }>({ isOpen: false, module: null });

  // 智能体派单状态
  const [agentDispatch, setAgentDispatch] = useState<{
    show: boolean;
    message: string;
    agentInfo: { id: number; name: string; description: string };
    bilibiliUrl: string;
    taskId: string;
  }>({
    show: false,
    message: '',
    agentInfo: { id: 12, name: '剪辑师-光影', description: '专业视频剪辑智能体' },
    bilibiliUrl: '',
    taskId: ''
  });

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    // B站搜索视频分区，关键词加"教学"后缀提升精准度
    const keyword = q;
    const biliUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}&search_type=video`;
    window.open(biliUrl, '_blank');
  };

  const handleTagClick = (tag: typeof quickTags[0]) => {
    const biliUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(tag.query)}&search_type=video`;
    window.open(biliUrl, '_blank');
  };

  const handleModuleClick = (module: FunctionModule) => {
    setTaskModal({ isOpen: true, module });
  };

  return (
    <div className="space-y-8">
      {/* 功能模块区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {functionModules.map((module) => (
          <FunctionModuleCard
            key={module.id}
            module={module}
            onClick={() => handleModuleClick(module)}
          />
        ))}
      </div>

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">教材视频助手</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">一句话找到课堂好视频</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">输入教学内容，智能体自动解析知识点，搜索B站等平台优质教学视频，生成带摘要和教学建议的推荐清单</p>
      </div>
      
      <Card className="!p-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
              placeholder="输入教学内容，如：初中物理-光的折射" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg" 
            />
          </div>
          <button 
            onClick={() => handleSearch()} 
            disabled={loading || !searchQuery.trim()} 
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <><span className="animate-spin">⚡</span>搜索中...</>
            ) : (
              <><Search className="w-5 h-5" />搜索</>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">输入关键词搜索教学视频，将跳转到哔哩哔哩查看相关内容</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-500 mr-2">快捷标签：</span>
          {quickTags.map((tag) => (
            <button 
              key={tag.name} 
              onClick={() => handleTagClick(tag)} 
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              {tag.name}
            </button>
          ))}
        </div>
      </Card>
      
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          智能体工作流程
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep >= step.step;
            const isCurrent = currentStep === step.step && loading;
            return (
              <div 
                key={step.step} 
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isActive ? `border-transparent bg-gradient-to-br ${step.color} text-white` : 'border-slate-200 bg-slate-50'
                } ${isCurrent ? 'scale-105 shadow-lg' : ''}`}
              >
                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isActive ? 'bg-white text-slate-900' : 'bg-slate-300 text-white'
                }`}>
                  {step.step}
                </div>
                <div className="text-center mt-2">
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-bold text-sm mb-1">{step.name}</h3>
                  <p className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{step.desc}</p>
                  <p className={`text-xs mt-1 font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{step.agent}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {loading ? '搜索中...' : agentDispatch.show ? '智能体派单' : `找到 ${searchResults.length} 个推荐视频`}
            </h2>
          </div>
          
          {loading ? (
            <LoadingAnimation currentStep={currentStep} />
          ) : agentDispatch.show ? (
            <AgentDispatchCard 
              message={agentDispatch.message}
              agentInfo={agentDispatch.agentInfo}
              bilibiliUrl={agentDispatch.bilibiliUrl}
              taskId={agentDispatch.taskId}
            />
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((video, index) => (
                <VideoCard key={index} video={video} index={index} />
              ))}
            </div>
          ) : (
            <Card className="!p-8 text-center">
              <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">未找到相关视频，请尝试其他关键词</p>
            </Card>
          )}
        </div>
      )}
            
      <Card className="!p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-lg font-bold text-slate-900 mb-4">📖 使用说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">1</span>
            <div>
              <h3 className="font-medium mb-1">输入教学内容</h3>
              <p className="text-slate-500">输入学科、年级、章节名称，如"初中物理-光的折射"</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold">2</span>
            <div>
              <h3 className="font-medium mb-1">智能体协作</h3>
              <p className="text-slate-500">4个专业智能体自动完成解析、搜索、筛选、整合</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">3</span>
            <div>
              <h3 className="font-medium mb-1">获取推荐清单</h3>
              <p className="text-slate-500">获得带摘要、时间点、教学建议的视频推荐</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">4</span>
            <div>
              <h3 className="font-medium mb-1">用于课堂教学</h3>
              <p className="text-slate-500">复制视频链接，直接在课堂使用</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* 任务创建弹窗 */}
      <TaskModal
        isOpen={taskModal.isOpen}
        onClose={() => setTaskModal({ isOpen: false, module: null })}
        module={taskModal.module}
        initialKeyword={searchQuery}
      />
    </div>
  );
};

export default VideoSearchPage;
