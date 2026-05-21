// 值班智能体入口组件
import React from 'react';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { DutyAgent } from '../utils/dutyAgents';

interface DutyAgentWidgetProps {
  agent: DutyAgent;
  onChat?: () => void;
}

// 值班智能体卡片组件
export const DutyAgentCard: React.FC<DutyAgentWidgetProps> = ({ agent, onChat }) => {
  return (
    <div 
      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100/50 hover:shadow-md transition-all cursor-pointer"
      onClick={onChat}
    >
      <div className="flex items-center gap-3">
        {/* 头像 */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200">
            <img 
              src={agent.avatar} 
              alt={agent.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/pets/zhiyuan.png';
              }}
            />
          </div>
          {/* 值班指示器 */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{agent.name}</span>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              值班中
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">{agent.title}</p>
        </div>
        
        {/* 对话按钮 */}
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:shadow-md transition-all">
          <MessageCircle className="w-4 h-4" />
          <span>对话</span>
        </div>
      </div>
      
      {/* 职责标签 */}
      <div className="flex items-center gap-2 mt-3">
        <Sparkles className="w-3 h-3 text-purple-400" />
        <div className="flex flex-wrap gap-1">
          {agent.duties.map((duty, index) => (
            <span 
              key={index}
              className="px-2 py-0.5 bg-white/60 text-slate-600 text-xs rounded-full"
            >
              {duty}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// 值班智能体迷你入口
export const DutyAgentMiniBadge: React.FC<{ agent: DutyAgent; onClick?: () => void }> = ({ agent, onClick }) => {
  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200 cursor-pointer hover:shadow-sm transition-all"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={agent.avatar} 
          alt={agent.name}
          className="w-6 h-6 rounded-full object-cover border border-green-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/pets/zhiyuan.png';
          }}
        />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
      </div>
      <span className="text-sm text-green-700 font-medium">{agent.name}</span>
      <span className="text-xs text-green-600">值班中</span>
    </div>
  );
};

// 值班智能体弹窗入口
export const DutyAgentChatModal: React.FC<{ agent: DutyAgent; onClose: () => void }> = ({ agent, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">与 {agent.name} 对话</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            ✕
          </button>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <img 
            src={agent.avatar} 
            alt={agent.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/pets/zhiyuan.png';
            }}
          />
          <div>
            <div className="font-semibold text-slate-800">{agent.name}</div>
            <div className="text-sm text-slate-500">{agent.title}</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600">正在值班</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-600">{agent.description}</p>
        
        <div className="flex flex-wrap gap-2">
          {agent.duties.map((duty, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-full"
            >
              {duty}
            </span>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              // 跳转到宠物对话页面
              const petId = agent.name.toLowerCase().includes('点津') ? 'duo' :
                           agent.name.toLowerCase().includes('猎影') ? 'junie' :
                           agent.name.toLowerCase().includes('调度') ? 'kebo' :
                           agent.name.toLowerCase().includes('省钱') ? 'beier' :
                           agent.name.toLowerCase().includes('反馈') ? 'da-zhuang' :
                           agent.name.toLowerCase().includes('文心') ? 'axobotl' : 'junie';
              window.location.href = `/pet-chat/${petId}`;
            }}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            开始对话
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default DutyAgentCard;
