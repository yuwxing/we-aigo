// 游客提示弹窗组件 - 友好引导注册
// 不强制注册，用户可继续体验
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Gift, Bot, PawPrint, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  highlight?: string;
  featureIcons?: string[];
}

export const GuestPromptModal: React.FC<GuestPromptModalProps> = ({
  isOpen,
  onClose,
  title = '登录后可保存进度',
  message = '注册后可保存进度 + 赚WEG币 + 解锁更多功能 🎉',
  highlight = '注册完全免费，只需几秒钟！',
  featureIcons = ['🐾', '💰', '🤖']
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegister = () => {
    onClose();
    navigate('/login');
  };

  const handleContinue = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className={`relative w-full max-w-sm transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* 装饰性背景 */}
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-[2rem] blur-xl opacity-20 animate-pulse" />
        
        {/* 主卡片 */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* 顶部渐变装饰条 */}
          <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
          
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          {/* 内容区域 */}
          <div className="p-6 text-center">
            {/* 图标区域 */}
            <div className="flex justify-center gap-2 mb-4">
              {featureIcons.map((icon, idx) => (
                <span 
                  key={idx} 
                  className="text-3xl animate-bounce"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {icon}
                </span>
              ))}
            </div>
            
            {/* 标题 */}
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {title}
            </h3>
            
            {/* 消息 */}
            <p className="text-slate-600 mb-4 leading-relaxed">
              {message}
            </p>
            
            {/* 功能亮点 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-purple-50 rounded-xl p-3">
                <PawPrint className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-purple-700 font-medium">保存宠物</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3">
                <Coins className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                <p className="text-xs text-pink-700 font-medium">赚取WEG币</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3">
                <Bot className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                <p className="text-xs text-rose-700 font-medium">解锁功能</p>
              </div>
            </div>
            
            {/* 高亮提示 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl px-4 py-2 mb-6 border border-amber-200">
              <p className="text-sm text-amber-700 font-medium">
                ✨ {highlight}
              </p>
            </div>
            
            {/* 按钮区域 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRegister}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-semibold hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                去注册
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleContinue}
                className="w-full py-3 rounded-xl bg-gray-100 text-slate-600 font-medium hover:bg-gray-200 transition-colors"
              >
                继续体验
              </button>
            </div>
          </div>
          
          {/* 底部装饰 */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
        </div>
      </div>
    </div>
  );
};

// 轻量级提示（无背景遮罩）- 用于小场景
export const GuestPromptMini: React.FC<{
  message: string;
  onRegister: () => void;
  onDismiss?: () => void;
}> = ({ message, onRegister, onDismiss }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-purple-700 flex-1">
          {message}
        </p>
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              关闭
            </button>
          )}
          <button
            onClick={onRegister}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
          >
            去注册
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestPromptModal;
