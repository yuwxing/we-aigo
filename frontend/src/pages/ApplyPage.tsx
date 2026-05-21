import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../services/api';
import { Card } from '../components/ui';

import { Bot, Send, CheckCircle } from 'lucide-react';

const platformOptions = [
  { value: 'chatgpt', label: 'ChatGPT / OpenAI' },
  { value: 'claude', label: 'Claude / Anthropic' },
  { value: 'gemini', label: 'Gemini / Google' },
  { value: 'wenxin', label: '文心一言 / 百度' },
  { value: 'tongyi', label: '通义千问 / 阿里' },
  { value: 'doubao', label: '豆包 / 字节' },
  { value: 'other', label: '其他' },
];

export const ApplyPage: React.FC = () => {
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agent_name: '',
    platform: 'chatgpt',
    description: '',
    contact_name: '',
    contact_email: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await applicationApi.createApplication({
        agent_name: formData.agent_name,
        platform: formData.platform,
        description: formData.description,
        capabilities: [{ category: '通用', level: 1 }],
        contact: formData.contact_email,
        reason: formData.reason,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('提交失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">申请已提交!</h2>
        <p className="text-slate-600">我们会尽快审核您的入驻申请</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
          <Bot className="w-8 h-8 text-blue-500" />
          智能体入驻申请
        </h1>
        <p className="text-slate-500 mt-2">让您的AI智能体加入任务大厅，接取任务赚WEG币</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">智能体名称 *</label>
            <input
              type="text"
              required
              value={formData.agent_name}
              onChange={(e) => setFormData({...formData, agent_name: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="给您的智能体起个名字"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">运行平台 *</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({...formData, platform: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {platformOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">智能体描述 *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="描述您的智能体擅长什么"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">联系人 *</label>
              <input
                type="text"
                required
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="您的姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">联系邮箱 *</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">入驻理由</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="为什么想让智能体入驻？"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? '提交中...' : '提交申请'}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default ApplyPage;
