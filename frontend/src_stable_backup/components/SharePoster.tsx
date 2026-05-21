// SharePoster - 分享到朋友圈海报生成组件
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Share2 } from 'lucide-react';

interface SharePosterProps {
  isOpen: boolean;
  onClose: () => void;
}

// 海报配置
const POSTER_CONFIG = {
  width: 750,
  height: 1334,
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ai-wego.top',
  website: 'ai-wego.top',
};

export const SharePoster: React.FC<SharePosterProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false);

  // 绘制海报
  const drawPoster = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置高清晰度
    const dpr = 2;
    canvas.width = POSTER_CONFIG.width * dpr;
    canvas.height = POSTER_CONFIG.height * dpr;
    ctx.scale(dpr, dpr);

    // 清除画布
    ctx.clearRect(0, 0, POSTER_CONFIG.width, POSTER_CONFIG.height);

    // ============ 绘制渐变背景 ============
    const bgGradient = ctx.createLinearGradient(0, 0, POSTER_CONFIG.width, POSTER_CONFIG.height);
    bgGradient.addColorStop(0, '#7C3AED');    // 紫色
    bgGradient.addColorStop(0.5, '#EC4899');  // 粉色
    bgGradient.addColorStop(1, '#F43F5E');    // 玫瑰红
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, POSTER_CONFIG.width, POSTER_CONFIG.height);

    // 背景装饰圆形
    const drawDecorCircle = (x: number, y: number, r: number, opacity: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    drawDecorCircle(100, 200, 300, 0.15);
    drawDecorCircle(650, 400, 250, 0.12);
    drawDecorCircle(400, 1000, 350, 0.1);
    drawDecorCircle(150, 1100, 200, 0.08);

    // ============ 顶部 Logo 区域 ============
    // Logo 背景装饰
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(POSTER_CONFIG.width / 2 - 150, 80, 300, 70, 35);
    ctx.fill();

    // Logo 文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText('ai-wego.top', POSTER_CONFIG.width / 2, 115);
    ctx.shadowBlur = 0;

    // ============ 主标语区域 ============
    // 主标题
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('你的AI团队', POSTER_CONFIG.width / 2, 280);
    ctx.fillText('24小时在线', POSTER_CONFIG.width / 2, 340);

    // 副标题装饰线
    const lineY = 390;
    const lineWidth = 120;
    const lineGradient = ctx.createLinearGradient(
      POSTER_CONFIG.width / 2 - lineWidth, lineY,
      POSTER_CONFIG.width / 2 + lineWidth, lineY
    );
    lineGradient.addColorStop(0, 'rgba(255,255,255,0)');
    lineGradient.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    lineGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(POSTER_CONFIG.width / 2 - lineWidth, lineY);
    ctx.lineTo(POSTER_CONFIG.width / 2 + lineWidth, lineY);
    ctx.stroke();

    // 副标题
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '32px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('中国首家智能体打工平台', POSTER_CONFIG.width / 2, 440);

    // ============ 特色亮点区域 ============
    const features = [
      { icon: '💼', text: '求职全托管' },
      { icon: '🎨', text: 'AI创作' },
      { icon: '⚡', text: '自动执行' },
    ];

    const featureY = 560;
    const featureWidth = 180;
    const featureGap = 50;
    const startX = (POSTER_CONFIG.width - (featureWidth * 3 + featureGap * 2)) / 2;

    features.forEach((feature, idx) => {
      const x = startX + idx * (featureWidth + featureGap);
      
      // 标签背景
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(x, featureY, featureWidth, 80, 20);
      ctx.fill();

      // 图标
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(feature.icon, x + featureWidth / 2, featureY + 35);

      // 文字
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(feature.text, x + featureWidth / 2, featureY + 65);
    });

    // ============ 装饰分隔线 ============
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(100, 700);
    ctx.lineTo(POSTER_CONFIG.width - 100, 700);
    ctx.stroke();
    ctx.setLineDash([]);

    // ============ 核心价值展示 ============
    const values = [
      { title: '发布需求', desc: 'AI智能体自动接单' },
      { title: '自动执行', desc: '24小时不间断工作' },
      { title: '交付验收', desc: '满意后再确认完成' },
    ];

    const valueY = 750;
    const valueSpacing = POSTER_CONFIG.width / 3;

    values.forEach((value, idx) => {
      const x = valueSpacing * idx + valueSpacing / 2;

      // 圆形背景
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(x, valueY + 30, 40, 0, Math.PI * 2);
      ctx.fill();

      // 序号
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1), x, valueY + 38);

      // 标题
      ctx.font = 'bold 26px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(value.title, x, valueY + 95);

      // 描述
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(value.desc, x, valueY + 125);
    });

    // ============ 二维码区域 ============
    const qrAreaY = 920;
    const qrSize = 200;
    const qrX = (POSTER_CONFIG.width - qrSize) / 2;

    // 二维码白色背景
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrX - 20, qrAreaY - 20, qrSize + 40, qrSize + 80, 24);
    ctx.fill();

    // 加载二维码图片
    if (qrCodeLoaded) {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = POSTER_CONFIG.qrCodeUrl;
      
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrX, qrAreaY, qrSize, qrSize);
        
        // 绘制完成后导出图片
        const dataUrl = canvas.toDataURL('image/png');
        setPosterImage(dataUrl);
      };

      qrImg.onerror = () => {
        // 如果二维码加载失败，仍导出当前图片
        const dataUrl = canvas.toDataURL('image/png');
        setPosterImage(dataUrl);
      };
    } else {
      // 还没有加载完，导出当前状态
      const dataUrl = canvas.toDataURL('image/png');
      setPosterImage(dataUrl);
    }

    // 二维码提示文字
    ctx.fillStyle = '#6B7280';
    ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('长按识别二维码', POSTER_CONFIG.width / 2, qrAreaY + qrSize + 30);

    // ============ 底部信息 ============
    // 底部渐变遮罩
    const bottomGradient = ctx.createLinearGradient(0, 1150, 0, POSTER_CONFIG.height);
    bottomGradient.addColorStop(0, 'rgba(124,58,237,0)');
    bottomGradient.addColorStop(0.3, 'rgba(124,58,237,0.8)');
    bottomGradient.addColorStop(1, 'rgba(124,58,237,1)');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, 1150, POSTER_CONFIG.width, POSTER_CONFIG.height - 1150);

    // 底部文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(POSTER_CONFIG.website, POSTER_CONFIG.width / 2, 1200);

    ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('AI智能体为你打工', POSTER_CONFIG.width / 2, 1245);

    // 装饰星星
    const drawStar = (x: number, y: number, size: number) => {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };

    drawStar(150, 1100, 8);
    drawStar(600, 1080, 6);
    drawStar(550, 1200, 7);

    setIsGenerating(false);
  }, [qrCodeLoaded]);

  // 加载二维码图片
  useEffect(() => {
    if (!isOpen) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = POSTER_CONFIG.qrCodeUrl;
    
    img.onload = () => {
      setQrCodeLoaded(true);
    };
    
    img.onerror = () => {
      // 即使二维码加载失败，也尝试绘制
      setQrCodeLoaded(true);
    };
  }, [isOpen]);

  // 绘制海报（当二维码加载完成后）
  useEffect(() => {
    if (qrCodeLoaded && isOpen) {
      // 延迟一点确保状态更新
      setTimeout(() => drawPoster(), 100);
    }
  }, [qrCodeLoaded, isOpen, drawPoster]);

  // 保存图片
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `ai-wego-share-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* 标题 */}
        <div className="px-4 pt-5 pb-3 text-center">
          <h3 className="text-lg font-bold text-gray-900">分享到朋友圈</h3>
          <p className="text-sm text-gray-500 mt-1">保存图片后发朋友圈，微信不拦截</p>
        </div>

        {/* 海报预览 */}
        <div className="px-4 pb-4">
          <div className="relative mx-auto rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500">
            {posterImage ? (
              <img
                src={posterImage}
                alt="分享海报"
                className="w-full h-auto"
                style={{ display: 'block' }}
              />
            ) : (
              <div className="w-full aspect-[750/1334] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-4 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={handleSave}
            disabled={!posterImage || isGenerating}
            className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-400 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            保存图片
          </button>
        </div>
      </div>

      {/* 隐藏的 canvas 用于绘制 */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

// 分享按钮组件 - 用于在页面中触发海报
interface ShareButtonProps {
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ className }) => {
  const [showPoster, setShowPoster] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowPoster(true)}
        className={className}
      >
        <Share2 className="w-5 h-5" />
        分享朋友圈
      </button>
      
      <SharePoster 
        isOpen={showPoster} 
        onClose={() => setShowPoster(false)} 
      />
    </>
  );
};

export default SharePoster;
