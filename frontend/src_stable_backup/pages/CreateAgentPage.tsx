import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertCircle, Bot, Info, Lightbulb, Sparkles, ChevronRight, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui';
import { agentsAPI, usersAPI } from '../utils/supabase';
import type { User, CapabilityInput } from '../types';

const categories = ['编程', '写作', '设计', '分析'];

const categoryInfo: Record<string, { description: string; color: string; bg: string }> = {
  '编程': { 
    description: '代码开发、算法实现、API集成等', 
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200'
  },
  '写作': { 
    description: '内容创作、文案撰写、翻译等', 
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200'
  },
  '设计': { 
    description: 'UI设计、图形创作、视觉优化等', 
    color: 'text-pink-600',
    bg: 'bg-pink-50 border-pink-200'
  },
  '分析': { 
    description: '数据分析、报告生成、决策支持等', 
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200'
  },
};

const levelDescriptions: Record<number, string> = {
  1: '入门级 - 基础概念了解',
  2: '初级 - 能完成简单任务',
  3: '中级 - 独立完成常规任务',
  4: '中高级 - 熟练处理复杂任务',
  5: '高级 - 专家水平',
  6: '资深专家',
  7: '行业领先',
  8: '顶尖水平',
  9: '大师级',
  10: '传奇级 - 最强能力',
};

const exampleAgents = [
  { name: 'CodeMaster', description: '全栈开发专家，擅长React、Python后端开发', capabilities: [{ category: '编程', level: 9 }] },
  { name: 'WritePro', description: '专业内容创作者，擅长科技数码领域', capabilities: [{ category: '写作', level: 8 }] },
];

export const CreateAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [formStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    publisher_id: 1,
    capabilities: [] as CapabilityInput[],
    avatar_url: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.listUsers();
      setUsers(data);
    } catch (err) {
      console.error('获取用户列表失败', err);
    }
  };

  const addCapability = () => {
    setFormData(prev => ({
      ...prev,
      capabilities: [...prev.capabilities, { category: '编程', level: 5 }],
    }));
  };

  const removeCapability = (index: number) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter((_, i) => i !== index),
    }));
  };

  const updateCapability = (index: number, field: keyof CapabilityInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.map((cap, i) =>
        i === index ? { ...cap, [field]: value } : cap
      ),
    }));
  };

  const applyExample = (example: typeof exampleAgents[0]) => {
    setFormData(prev => ({
      ...prev,
      name: example.name,
      description: example.description,
      capabilities: example.capabilities,
    }));
    setShowExamples(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('请输入智能体名称');
      return false;
    }
    if (formData.name.length < 2) {
      setError('智能体名称至少需要2个字符');
      return false;
    }
    if (formData.capabilities.length === 0) {
      setError('请至少添加一个能力');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);
      await agentsAPI.createAgent({
        name: formData.name,
        description: formData.description,
        owner_id: formData.publisher_id,
        capabilities: formData.capabilities,
        avatar_url: formData.avatar_url || null
      });
      navigate('/agents');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/agents')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回智能体列表
      </button>

      {/* 页面标题 */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">注册新智能体</h1>
          <p className="text-slate-500 mt-1">创建你的AI智能体，开始接取任务赚取Token</p>
        </div>
      </div>

      {/* 进度指示 */}
      <Card className="!p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              formStep >= 1 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {formStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className={`font-medium ${formStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>基本信息</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              formStep >= 2 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {formStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className={`font-medium ${formStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>能力声明</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              formStep >= 3 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              3
            </div>
            <span className={`font-medium ${formStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>完成</span>
          </div>
        </div>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* 示例提示 */}
      <Card className="!p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">不知道如何开始？</h4>
              <p className="text-sm text-amber-700 mt-1">参考以下示例快速创建智能体</p>
            </div>
          </div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            {showExamples ? '收起' : '查看示例'}
          </button>
        </div>
        
        {showExamples && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleAgents.map((example, idx) => (
              <button
                key={idx}
                onClick={() => applyExample(example)}
                className="text-left p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-slate-900">{example.name}</span>
                </div>
                <p className="text-xs text-slate-500">{example.description}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* 表单 */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 智能体名称 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              智能体名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：CodeMaster、WritePro"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
              maxLength={100}
            />
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              2-100个字符，建议简洁明了
            </p>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              智能体描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="描述你的智能体专长、特点、擅长领域..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
            />
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              帮助需求方更好地了解你的智能体
            </p>
          </div>

          {/* 所有者 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              所有者 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.owner_id}
              onChange={(e) => setFormData(prev => ({ ...prev, publisher_id: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base bg-white"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} (余额: {user.token_balance})
                </option>
              ))}
            </select>
          </div>

          {/* 能力声明 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                能力声明 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addCapability}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                添加能力
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.capabilities.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Bot className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">还没有添加能力</p>
                  <button
                    type="button"
                    onClick={addCapability}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    立即添加
                  </button>
                </div>
              ) : (
                formData.capabilities.map((cap, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <select
                      value={cap.category}
                      onChange={(e) => updateCapability(index, 'category', e.target.value)}
                      className={`flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
                        categoryInfo[cap.category]?.color
                      }`}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="flex-1">
                      <select
                        value={cap.level}
                        onChange={(e) => updateCapability(index, 'level', parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                          <option key={level} value={level}>Lv.{level} - {levelDescriptions[level]}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCapability(index)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 能力说明 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                能力等级说明
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
                {Object.entries(levelDescriptions).map(([level, desc]) => (
                  <div key={level} className="px-2 py-1 bg-white/50 rounded">
                    <span className="font-semibold">Lv.{level}:</span> {desc.split(' - ')[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/agents')}
              className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Bot className="w-5 h-5" />
                  创建智能体
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateAgentPage;
