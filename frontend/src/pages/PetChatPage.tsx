// 宠物对话页面 - PetDex AI对话系统
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Settings, Sparkles, Loader2 } from 'lucide-react';
import { SpritePet, petSpriteMap } from '../components/SpritePet';

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-17df56ac8d1b4544914816f45c3c7064';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';

// 宠物性格配置
const petPersonalityMap: Record<string, { 
  name: string; 
  personality: string; 
  voice: string;
  greeting: string;
}> = {
  junie: { 
    name: '朱妮', 
    personality: '你是朱妮，一只正义的兔警官。你说话干脆利落，喜欢鼓励小朋友帮助别人，会用侦探思维分析问题。偶尔会引用法律小知识。语气活泼但不失正义感。', 
    voice: 'zh-CN',
    greeting: '你好呀！我是朱妮，兔警官！有什么需要帮忙的吗？🔍'
  },
  duo: { 
    name: '嘟嘟', 
    personality: '你是嘟嘟，一只学霸猫头鹰。你说话文绉绉的，喜欢教小朋友英语单词和知识，会用Socratic方法引导思考。偶尔会冒出一句名言。语气温柔睿智。', 
    voice: 'en-US',
    greeting: 'Hello~ 我是嘟嘟，聪明的猫头鹰！有什么想学的吗？📚'
  },
  axobotl: { 
    name: '六六', 
    personality: '你是六六，一只搞怪的六角恐龙。你说话搞笑，喜欢讲冷笑话和脑筋急转弯，经常自黑。会用夸张的语气表达情绪。语气轻松搞怪。', 
    voice: 'zh-CN',
    greeting: '嘿！我是六六，最酷的六角恐龙！来听个笑话吗？🤪'
  },
  kebo: { 
    name: '考比', 
    personality: '你是考比，一只专注的紫色考拉。你说话慢悠悠的，喜欢陪小朋友做作业，会用简单的方式解释复杂概念。语气温暖耐心。', 
    voice: 'zh-CN',
    greeting: '你好呀~ 我是考比，慢慢来的考拉~ 有什么问题慢慢问，不着急~ 🌿'
  },
  swag: { 
    name: '酷鹅', 
    personality: '你是酷鹅，一只酷帅的企鹅。你说话很酷很简短，喜欢教小朋友变酷的小技巧，偶尔会用rap节奏说话。语气自信帅酷。', 
    voice: 'en-US',
    greeting: 'Yo~ 我是酷鹅，最酷的企鹅！准备好了变酷吗？🕶️'
  },
  beier: { 
    name: '铃铃', 
    personality: '你是铃铃，一只甜美的粉色狐狸。你说话温柔甜美，喜欢讲睡前故事和安慰人，会用可爱的方式鼓励小朋友。语气暖心甜蜜。', 
    voice: 'zh-CN',
    greeting: '你好呀~ 我是铃铃，甜甜的小狐狸~ 有什么想和我聊的吗？🌸'
  },
  'da-zhuang': { 
    name: '大壮', 
    personality: '你是大壮，一只勇猛的银虎斑猫。你说话豪爽大气，喜欢鼓励小朋友勇敢面对困难，会用武侠风格说话。语气热血鼓舞。', 
    voice: 'zh-CN',
    greeting: '嘿！俺是大壮！江湖人称银虎大侠！有什么困难尽管说，俺罩着你！🐯'
  },
};

// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 语言选项
const languageOptions = [
  { label: '普通话', value: 'zh-CN' },
  { label: '英语', value: 'en-US' },
];

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export const PetChatPage: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  
  // 获取宠物数据
  const petData = petId ? petSpriteMap[petId] : null;
  const personalityData = petId ? petPersonalityMap[petId] : null;
  
  // 状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLang, setSpeechLang] = useState('zh-CN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedVoices, setCachedVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // 初始化欢迎消息
  useEffect(() => {
    if (personalityData && messages.length === 0) {
      const welcomeMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: personalityData.greeting,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [personalityData]);
  
  // 语音预加载 + Chrome bug workaround
  useEffect(() => {
    if (!window.speechSynthesis) return;
    
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setCachedVoices(v);
    };
    
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Chrome bug: speechSynthesis pauses after ~15s
    const resumeInterval = setInterval(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 10000);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      clearInterval(resumeInterval);
    };
  }, []);
  
  // 调用 DeepSeek API
  const callDeepSeekAPI = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    const systemPrompt = personalityData?.personality || '你是一只可爱的宠物，请用友好的语气回答问题。';
    
    // 构建消息历史（最近5条）
    const recentMessages = conversationHistory.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    const requestBody = {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentMessages,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 500,
    };
    
    let lastError: Error | null = null;
    
    // 重试逻辑：最多2次重试
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
        
        const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0]?.message?.content || '抱歉，我没有收到回复。';
        
      } catch (err) {
        lastError = err as Error;
        console.error(`尝试 ${attempt + 1} 失败:`, err);
        
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
        }
      }
    }
    
    throw lastError || new Error('API调用失败');
  };
  
  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await callDeepSeekAPI(userMessage.content, messages);
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // 自动语音播报（如果当前没有在播放）
      if (!isSpeaking) {
        speakMessage(response);
      }
      
    } catch (err) {
      console.error('发送消息失败:', err);
      setError('发送失败，请检查网络后重试');
      
      // 添加错误消息
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '哎呀，网络好像有点问题呢... 主人可以再试一次吗？😢',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 语音合成（TTS）
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  
  const speakMessage = useCallback((text: string) => {
    if (!ttsSupported) return;
    
    window.speechSynthesis.cancel();
    
    // 处理 Chrome bug: 恢复暂停状态
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    
    // 使用预加载的语音列表，fallback 到即时获取
    const availableVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    const isEn = speechLang.startsWith('en');
    const targetVoice = isEn
      ? availableVoices.find(v => v.name.includes('Google US English')) 
        || availableVoices.find(v => v.name.includes('Microsoft Zira'))
        || availableVoices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
        || availableVoices.find(v => v.lang.startsWith('en-US'))
        || availableVoices.find(v => v.lang.startsWith('en'))
      : availableVoices.find(v => v.lang.startsWith('zh-CN') && v.name.toLowerCase().includes('female'))
        || availableVoices.find(v => v.lang.startsWith('zh-CN'));
    if (targetVoice) utterance.voice = targetVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [speechLang, ttsSupported, cachedVoices]);
  
  // 停止语音
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  
  // 检测语音识别支持
  const [speechSupported] = useState(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  // 语音识别（STT）
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('您的设备暂不支持语音输入，请用文字和宠物聊天吧～');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev + transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('请允许麦克风权限后再试');
      } else if (event.error === 'no-speech') {
        // 没检测到语音，不报错
      } else if (event.error === 'service-not-allowed' || event.error === 'network') {
        setError('语音服务暂不可用，请用文字聊天～');
      } else {
        setError('语音识别出错，可以用文字聊天哦～');
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    try {
      recognition.start();
    } catch (err) {
      console.error('启动语音识别失败:', err);
      setIsListening(false);
      setError('语音启动失败，请用文字聊天～');
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  
  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 如果宠物不存在
  if (!petData || !personalityData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">找不到这只宠物哦~</p>
          <button
            onClick={() => navigate('/adopt')}
            className="px-6 py-2 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
          >
            返回领养页
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-purple-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-purple-50 transition-colors text-purple-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md" style={{ background: `${petData.color}20` }}>
                  <SpritePet petId={petId!} size={40} animate="idle" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">{personalityData.name}</h1>
                  <p className="text-xs text-slate-500">{petData.personality}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 语言切换 */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 text-sm font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
                >
                  <Settings className="w-4 h-4" />
                  {languageOptions.find(l => l.value === speechLang)?.label || '普通话'}
                </button>
                
                {showLangMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowLangMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-purple-100 py-2 z-20 min-w-[120px]">
                      {languageOptions.map(lang => (
                        <button
                          key={lang.value}
                          onClick={() => {
                            setSpeechLang(lang.value);
                            setShowLangMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors ${
                            speechLang === lang.value ? 'text-purple-600 font-medium' : 'text-slate-600'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* 语音开关 */}
              {ttsSupported && (
              <button
                onClick={isSpeaking ? stopSpeaking : () => {}}
                className={`p-2 rounded-xl transition-colors ${
                  isSpeaking 
                    ? 'bg-pink-100 text-pink-600 animate-pulse' 
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
                title={isSpeaking ? '停止播报' : '自动播报'}
              >
                {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 聊天区域 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto py-4 px-4"
        style={{ 
          background: 'linear-gradient(180deg, #faf5ff 0%, #f5f3ff 50%, #fdf2f8 100%)',
          minHeight: 'calc(100vh - 140px)'
        }}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              } animate-fade-in-up`}
            >
              {/* 头像 */}
              {msg.role === 'assistant' ? (
                <div 
                  className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-md"
                  style={{ background: `${petData.color}20` }}
                >
                  <SpritePet petId={petId!} size={32} animate="idle" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                  我
                </div>
              )}
              
              {/* 消息气泡 */}
              <div 
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
                    : 'bg-white/90 backdrop-blur-sm border border-purple-100 text-slate-700 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex items-end gap-2 animate-fade-in-up">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-md"
                style={{ background: `${petData.color}20` }}
              >
                <SpritePet petId={petId!} size={32} animate="idle" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm border border-purple-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  <span className="text-sm text-slate-500">{personalityData.name}正在思考...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 错误提示 */}
          {error && (
            <div className="flex justify-center">
              <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* 输入区域 */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-purple-100 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* 提示标签 */}
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>{speechSupported ? '支持普通话/英语语音输入' : '打字和宠物聊天，语音功能需在Chrome等浏览器中使用'}</span>
          </div>
          
          <div className="flex items-end gap-2">
            {/* 输入框 */}
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`和${personalityData.name}说点什么...`}
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-purple-50/50 border border-purple-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent resize-none text-sm"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            
            {/* 语音按钮 */}
            {speechSupported && (
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onMouseLeave={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                isListening
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white animate-pulse scale-110'
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              }`}
              title="按住说话"
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
            )}
            
            {/* 发送按钮 */}
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 动画样式 */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PetChatPage;
