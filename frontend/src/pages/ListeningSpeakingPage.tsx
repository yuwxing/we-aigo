import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';

// 文本相似度计算函数（Jaccard相似度）
const calculateSimilarity = (text1: string, text2: string): number => {
  const normalize = (text: string) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  };
  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return union.size > 0 ? intersection.size / union.size : 0;
};

// 评分函数
const scoreText = (input: string, reference: string, maxScore: number): { score: number; feedback: string } => {
  if (!input.trim()) {
    return { score: 0, feedback: '请先输入内容' };
  }
  const similarity = calculateSimilarity(input, reference);
  const score = Math.round(similarity * maxScore);
  let feedback = '';
  if (similarity >= 0.8) feedback = '🌟 非常棒！';
  else if (similarity >= 0.6) feedback = '👍 不错，继续练习';
  else if (similarity >= 0.4) feedback = '💪 还需努力';
  else feedback = '📚 多听多读再试试';
  return { score, feedback };
};

// 评分结果显示组件
const ScoreDisplay = ({ score, maxScore, feedback, inputText, reference }: { score: number; maxScore: number; feedback: string; inputText: string; reference: string }) => (
  <div style={{ marginTop: '12px', padding: '12px', background: '#f0f7ff', borderRadius: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1565c0' }}>得分：{score}/{maxScore}</span>
      <span style={{ fontSize: '14px', color: '#333' }}>{feedback}</span>
    </div>
    {inputText && (
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
        <span style={{ fontWeight: '500' }}>你的回答：</span>{inputText}
      </div>
    )}
    {reference && (
      <div style={{ fontSize: '13px', color: '#888' }}>
        <span style={{ fontWeight: '500' }}>参考答案：</span>{reference}
      </div>
    )}
  </div>
);

// Part D 详细评分组件
const DetailedScoreDisplay = ({ score, maxScore, feedback, inputText, reference }: { score: number; maxScore: number; feedback: string; inputText: string; reference: string }) => {
  const similarity = inputText.trim() ? calculateSimilarity(inputText, reference) : 0;
  const pronunciation = Math.min(5, Math.round(similarity * 5));
  const fluency = Math.min(5, Math.round(similarity * 5));
  const content = Math.min(5, Math.round(similarity * 4 + Math.random() * 2));
  const grammar = Math.min(5, Math.round(similarity * 5));
  
  return (
    <div style={{ marginTop: '12px', padding: '12px', background: '#f0f7ff', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1565c0' }}>总分：{score}/{maxScore}</span>
        <span style={{ fontSize: '14px', color: '#333' }}>{feedback}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
        {[
          { label: '发音', value: pronunciation, color: '#f44336' },
          { label: '流利', value: fluency, color: '#2196f3' },
          { label: '内容', value: content, color: '#4caf50' },
          { label: '语法', value: grammar, color: '#ff9800' },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '6px', background: '#fff', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#666' }}>{item.label}</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: item.color }}>{item.value}分</div>
          </div>
        ))}
      </div>
      {inputText && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
          <span style={{ fontWeight: '500' }}>你的回答：</span>{inputText}
        </div>
      )}
    </div>
  );
};

// Types
interface LSData {
  date: string;
  title_cn: string;
  title_en: string;
  source: string;
  part_a: {
    title: string;
    passage: string;
    pronunciation_tips: string[];
    pause_marks: string;
  };
  part_b: {
    title: string;
    conversations: {
      context: string;
      dialogue: string;
      questions: {
        question: string;
        options: string[];
        answer: string;
      }[];
    }[];
  };
  part_c: {
    title: string;
    situation: string;
    role: string;
    questions: {
      cn_question: string;
      en_answer: string;
    }[];
  };
  part_d: {
    title: string;
    topic: string;
    key_points: string[];
    sample_answer: string;
    scoring: {
      pronunciation: number;
      fluency: number;
      content: number;
      grammar: number;
      total: number;
    };
  };
}

const TABS = [
  { id: 'a', label: '🗣️ 朗读短文', shortLabel: '朗读' },
  { id: 'b', label: '🎧 听选信息', shortLabel: '听说' },
  { id: 'c', label: '💬 情景对话', shortLabel: '情景' },
  { id: 'd', label: '🎤 口头表达', shortLabel: '表达' },
];

export default function ListeningSpeakingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [data, setData] = useState<LSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('a');
  const [showPauseMarks, setShowPauseMarks] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState<number[]>([]);
  const [showSample, setShowSample] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null); // 'passage' | 'conv-0' | 'conv-1' etc.
  const [speaking, setSpeaking] = useState<string | null>(null); // 正在朗读的参考答案key
  
  // 语音预加载相关状态
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  
  // Part A 文本输入相关状态
  const [inputTextA, setInputTextA] = useState('');
  const [scoreA, setScoreA] = useState<{ score: number; feedback: string } | null>(null);
  
  // Part C 文本输入相关状态
  const [inputTextC, setInputTextC] = useState<Record<number, string>>({});
  const [scoreC, setScoreC] = useState<Record<number, { score: number; feedback: string }>>({});
  const [practiceCExpanded, setPracticeCExpanded] = useState<number[]>([]);
  
  // Part D 文本输入相关状态
  const [inputTextD, setInputTextD] = useState('');
  const [scoreD, setScoreD] = useState<{ score: number; feedback: string } | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  // 语音预加载
  useEffect(() => {
    if (!window.speechSynthesis) {
      setSpeechSupported(false);
      return;
    }
    
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Chrome bug workaround: speechSynthesis gets paused after ~15 seconds
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

  // 英文语音播放
  const speak = (text: string, rate: number = 0.9, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      toast.error('您的浏览器不支持语音播放，请使用Chrome或Safari浏览器');
      return;
    }
    // Chrome bug workaround
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1;
    
    // 优先使用预加载的语音列表，fallback 到即时获取
    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const enVoice = availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
      || availableVoices.find(v => v.lang.startsWith('en-US'))
      || availableVoices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
    
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      if (onEnd) onEnd();
    };
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  // 中文语音播放
  const speakChinese = (text: string) => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    
    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const zhVoice = availableVoices.find(v => v.lang.startsWith('zh'))
      || availableVoices.find(v => v.lang.includes('Chinese'));
    if (zhVoice) utterance.voice = zhVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';
      
      const resp = await fetch(
        `${SUPABASE_URL}tasks?status=eq.ls_daily&select=id,title,description&order=id.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const rows = await resp.json();
      
      if (rows.length > 0) {
        const content = JSON.parse(rows[0].description);
        setData(content);
      } else {
        setError('暂无今日听说内容');
      }
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (qKey: string, option: string) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qKey]: option }));
  };

  const handleSubmit = () => {
    if (!data) return;
    setSubmitted(true);
    // 计算正确率
    let correct = 0;
    let total = 0;
    data.part_b.conversations.forEach((conv, ci) => {
      conv.questions.forEach((q, qi) => {
        const key = `${ci}-${qi}`;
        total++;
        if (selectedAnswers[key] === q.answer) correct++;
      });
    });
    toast.success(`答对 ${correct}/${total} 题！继续加油！`);
  };

  const toggleAnswer = (idx: number) => {
    if (expandedAnswers.includes(idx)) {
      setExpandedAnswers(prev => prev.filter(i => i !== idx));
    } else {
      setExpandedAnswers(prev => [...prev, idx]);
    }
  };

  const togglePracticeC = (idx: number) => {
    if (practiceCExpanded.includes(idx)) {
      setPracticeCExpanded(prev => prev.filter(i => i !== idx));
    } else {
      setPracticeCExpanded(prev => [...prev, idx]);
    }
  };

  const handleComplete = async () => {
    if (!user?.phone) {
      toast.error('请先登录');
      return;
    }
    // 记录完成状态到 localStorage
    const key = `ls_completed_${data?.date}`;
    localStorage.setItem(key, 'true');
    toast.success('已完成今日听说训练！');
    navigate('/benefits');
  };

  // Part A 评分处理
  const handleGradeA = () => {
    if (!data?.part_a.passage) return;
    const result = scoreText(inputTextA, data.part_a.passage, 20);
    setScoreA(result);
    toast.success(`得分：${result.score}/20 - ${result.feedback}`);
  };

  // Part C 单题评分处理
  const handleGradeC = (idx: number, reference: string) => {
    const input = inputTextC[idx] || '';
    if (!input.trim()) {
      toast.error('请先输入回答内容');
      return;
    }
    const result = scoreText(input, reference, 5);
    setScoreC(prev => ({ ...prev, [idx]: result }));
    toast.success(`问题${idx + 1}得分：${result.score}/5 - ${result.feedback}`);
  };

  // Part D 评分处理
  const handleGradeD = () => {
    if (!data?.part_d.sample_answer) return;
    if (!inputTextD.trim()) {
      toast.error('请先输入口头表达内容');
      return;
    }
    const result = scoreText(inputTextD, data.part_d.sample_answer, 20);
    setScoreD(result);
    toast.success(`得分：${result.score}/20 - ${result.feedback}`);
  };

  // 渲染朗读短文
  const renderPartA = () => {
    if (!data) return null;
    const { part_a } = data;
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            📖 {part_a.title}
          </div>
          
          {/* 原版短文 */}
          <div style={{ 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '12px',
            lineHeight: '1.8',
            fontSize: '15px'
          }}>
            {part_a.passage}
          </div>
          
          {/* 语音播放按钮 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => {
                if (playing === 'passage') {
                  window.speechSynthesis.cancel();
                  setPlaying(null);
                } else {
                  setPlaying('passage');
                  speak(part_a.passage, 0.85, () => setPlaying(null));
                }
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: playing === 'passage' ? '#e53935' : '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {playing === 'passage' ? '⏹️ 停止播放' : '🔊 听范读'}
            </button>
            <button
              onClick={() => {
                setPlaying('passage-slow');
                speak(part_a.passage, 0.6, () => setPlaying(null));
              }}
              style={{
                padding: '12px 16px',
                background: '#ff9800',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🐢 慢速
            </button>
          </div>
          
          {/* 停顿标注切换 */}
          <button
            onClick={() => setShowPauseMarks(!showPauseMarks)}
            style={{
              width: '100%',
              padding: '12px',
              background: showPauseMarks ? '#e8f5e9' : '#f0f7ff',
              border: `2px solid ${showPauseMarks ? '#4caf50' : '#2196f3'}`,
              borderRadius: '8px',
              color: showPauseMarks ? '#2e7d32' : '#1565c0',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            {showPauseMarks ? '🔊 隐藏停顿标注' : '👁️ 显示停顿标注'}
          </button>
          
          {/* 停顿标注版 */}
          {showPauseMarks && (
            <div style={{ 
              background: '#e8f5e9', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px',
              lineHeight: '2',
              fontSize: '15px'
            }}>
              <div style={{ fontSize: '12px', color: '#2e7d32', marginBottom: '8px' }}>
                📌 意群停顿标记（/ 表示停顿位置）
              </div>
              {part_a.pause_marks.split('/').map((segment, i) => (
                <span key={i} style={{ display: 'inline' }}>
                  {segment.trim()}{i < part_a.pause_marks.split('/').length - 1 && (
                    <span style={{ color: '#4caf50', fontWeight: 'bold', margin: '0 2px' }}>/</span>
                  )}
                  {' '}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* 练习朗读卡片 */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
            ✏️ 练习朗读
          </div>
          <div style={{ 
            background: '#f9f9f9', 
            borderRadius: '8px', 
            padding: '12px',
            fontSize: '12px',
            color: '#666',
            marginBottom: '12px'
          }}>
            💡 听完后，试着默写你朗读的内容，然后点击"对比评分"查看得分
          </div>
          <textarea
            value={inputTextA}
            onChange={(e) => setInputTextA(e.target.value)}
            placeholder="试着默写你朗读的内容..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleGradeA}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              background: 'linear-gradient(135deg, #9c27b0 0%, #e040fb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            对比评分
          </button>
          
          {/* Part A 评分结果 */}
          {scoreA && (
            <ScoreDisplay 
              score={scoreA.score} 
              maxScore={20} 
              feedback={scoreA.feedback}
              inputText={inputTextA}
              reference={part_a.passage}
            />
          )}
        </div>
        
        {/* 朗读要点 */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            💡 朗读要点
          </div>
          {part_a.pronunciation_tips.map((tip, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '10px 12px',
                background: i === 0 ? '#fff3e0' : i === 1 ? '#e3f2fd' : '#f3e5f5',
                borderRadius: '6px',
                marginBottom: '8px',
                fontSize: '13px',
                lineHeight: '1.6',
                borderLeft: `3px solid ${i === 0 ? '#ff9800' : i === 1 ? '#2196f3' : '#9c27b0'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{tip}</span>
                <button
                  onClick={() => speak(tip, 0.75)}
                  style={{ 
                    padding: '2px 8px', 
                    background: '#e3f2fd', 
                    border: '1px solid #90caf9', 
                    borderRadius: '10px', 
                    fontSize: '11px', 
                    color: '#1565c0', 
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: '8px'
                  }}
                >
                  🔊
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染听选信息
  const renderPartB = () => {
    if (!data) return null;
    const { part_b } = data;
    return (
      <div style={{ padding: '16px' }}>
        {part_b.conversations.map((conv, ci) => (
          <div 
            key={ci} 
            style={{ 
              background: '#fff', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ 
              fontSize: '12px', 
              color: '#fff',
              background: '#2196f3',
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '12px',
              marginBottom: '12px'
            }}>
              {conv.context}
            </div>
            
            {/* 语音播放：先听再看 */}
            <button
              onClick={() => {
                const key = `conv-${ci}`;
                if (playing === key) {
                  window.speechSynthesis.cancel();
                  setPlaying(null);
                } else {
                  setPlaying(key);
                  // 提取对话中的英文部分（去除A:/B:标记）
                  const cleanDialogue = conv.dialogue
                    .replace(/[AB]:\s*/g, '')
                    .replace(/\n/g, '. ');
                  speak(cleanDialogue, 0.85, () => setPlaying(null));
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                background: playing === `conv-${ci}` ? '#e53935' : '#1565c0',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {playing === `conv-${ci}` ? '⏹️ 停止' : '🎧 听对话（先听再看文字）'}
            </button>
            
            <div style={{ 
              background: '#f5f5f5', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {conv.dialogue}
            </div>
            
            {conv.questions.map((q, qi) => {
              const key = `${ci}-${qi}`;
              const isCorrect = submitted && selectedAnswers[key] === q.answer;
              const isWrong = submitted && selectedAnswers[key] && selectedAnswers[key] !== q.answer;
              return (
                <div key={qi} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    {qi + 1}. {q.question}
                  </div>
                  <button
                    onClick={() => speak(q.question, 0.85)}
                    style={{
                      padding: '4px 10px',
                      background: '#e3f2fd',
                      border: '1px solid #90caf9',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#1565c0',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  >
                    🔊 听题目
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {q.options.map((opt, oi) => {
                      const letter = ['A', 'B', 'C'][oi];
                      const isSelected = selectedAnswers[key] === letter;
                      const isAnswer = q.answer === letter;
                      let bgColor = '#f5f5f5';
                      let borderColor = '#e0e0e0';
                      if (isSelected && !submitted) {
                        bgColor = '#e3f2fd';
                        borderColor = '#2196f3';
                      }
                      if (submitted && isAnswer) {
                        bgColor = '#e8f5e9';
                        borderColor = '#4caf50';
                      }
                      if (submitted && isWrong && isSelected) {
                        bgColor = '#ffebee';
                        borderColor = '#f44336';
                      }
                      return (
                        <button
                          key={oi}
                          onClick={() => handleAnswerSelect(key, letter)}
                          disabled={submitted}
                          style={{
                            padding: '10px 12px',
                            background: bgColor,
                            border: `2px solid ${borderColor}`,
                            borderRadius: '8px',
                            textAlign: 'left',
                            fontSize: '13px',
                            cursor: submitted ? 'default' : 'pointer',
                            color: '#333'
                          }}
                        >
                          {opt}
                          {submitted && isAnswer && <span style={{ marginLeft: '8px', color: '#4caf50' }}>✓</span>}
                          {submitted && isWrong && isSelected && <span style={{ marginLeft: '8px', color: '#f44336' }}>✗</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < 3}
            style={{
              width: '100%',
              padding: '14px',
              background: Object.keys(selectedAnswers).length >= 3 ? '#2196f3' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: Object.keys(selectedAnswers).length >= 3 ? 'pointer' : 'not-allowed'
            }}
          >
            提交答案
          </button>
        )}
      </div>
    );
  };

  // 渲染情景对话
  const renderPartC = () => {
    if (!data) return null;
    const { part_c } = data;
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            💬 {part_c.title}
          </div>
          <div style={{ 
            background: '#fff3e0', 
            borderRadius: '8px', 
            padding: '16px',
            marginBottom: '12px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#e65100' }}>
              📋 情景
            </div>
            {part_c.situation}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#1565c0',
            fontWeight: '500'
          }}>
            你的角色：{part_c.role}
          </div>
        </div>
        
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', textAlign: 'center' }}>
          💡 先自己思考，再点击查看参考答案
        </div>
        
        {part_c.questions.map((q, idx) => (
          <div 
            key={idx}
            style={{ 
              background: '#fff', 
              borderRadius: '12px', 
              marginBottom: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <button
              onClick={() => toggleAnswer(idx)}
              style={{
                width: '100%',
                padding: '16px',
                background: '#fff',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  <span style={{ 
                    background: '#9c27b0', 
                    color: '#fff', 
                    padding: '2px 8px', 
                    borderRadius: '10px',
                    fontSize: '12px',
                    marginRight: '8px'
                  }}>
                    {idx + 1}
                  </span>
                  {q.cn_question}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(q.en_answer, 0.85);
                  }}
                  style={{
                    padding: '4px 10px',
                    background: '#e3f2fd',
                    border: '1px solid #90caf9',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#1565c0',
                    cursor: 'pointer'
                  }}
                >
                  🔊 听题
                </button>
                <span style={{ 
                  color: '#9c27b0',
                  fontSize: '18px',
                  transition: 'transform 0.2s'
                }}>
                  {expandedAnswers.includes(idx) ? '▲' : '▼'}
                </span>
              </div>
            </button>
            
            {expandedAnswers.includes(idx) && (
              <div style={{ 
                padding: '0 16px 16px 16px',
                background: '#f3e5f5',
                borderTop: '1px solid #e1bee7'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginTop: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#4a148c',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      参考回答：
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#333',
                      lineHeight: '1.6'
                    }}>
                      {q.en_answer}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '12px' }}>
                    <button
                      onClick={() => {
                        const key = `answer-${idx}`;
                        if (speaking === key) {
                          window.speechSynthesis.cancel();
                          setSpeaking(null);
                        } else {
                          setSpeaking(key);
                          speak(q.en_answer, 0.85, () => setSpeaking(null));
                        }
                      }}
                      style={{
                        padding: '6px 14px',
                        background: speaking === `answer-${idx}` ? '#e53935' : '#7b1fa2',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {speaking === `answer-${idx}` ? '⏹️ 停止' : '🔊 听读音'}
                    </button>
                    <button
                      onClick={() => speak(q.en_answer, 0.6)}
                      style={{
                        padding: '6px 14px',
                        background: '#ff9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🐢 慢速
                    </button>
                  </div>
                </div>
                
                {/* 练习作答折叠区域 */}
                <div style={{ 
                  background: '#fff',
                  borderRadius: '8px',
                  marginTop: '12px',
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => togglePracticeC(idx)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#f0f7ff',
                      border: '1px solid #e1bee7',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1565c0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>📝 练习作答</span>
                    <span>{practiceCExpanded.includes(idx) ? '▲' : '▼'}</span>
                  </button>
                  {practiceCExpanded.includes(idx) && (
                    <div style={{ padding: '12px' }}>
                      <textarea
                        value={inputTextC[idx] || ''}
                        onChange={(e) => setInputTextC(prev => ({ ...prev, [idx]: e.target.value }))}
                        placeholder="输入你的回答..."
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          padding: '10px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        onClick={() => handleGradeC(idx, q.en_answer)}
                        style={{
                          marginTop: '8px',
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #9c27b0 0%, #e040fb 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        评分
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Part C 评分结果 */}
                {scoreC[idx] && (
                  <ScoreDisplay 
                    score={scoreC[idx].score} 
                    maxScore={5} 
                    feedback={scoreC[idx].feedback}
                    inputText={inputTextC[idx] || ''}
                    reference={q.en_answer}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 渲染口头表达
  const renderPartD = () => {
    if (!data) return null;
    const { part_d } = data;
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            🎤 {part_d.title}
          </div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '16px'
          }}>
            话题：{part_d.topic}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              📝 答题要点
            </div>
            {part_d.key_points.map((point, i) => (
              <div 
                key={i}
                style={{ 
                  padding: '10px 12px',
                  background: '#e3f2fd',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  borderLeft: '3px solid #2196f3'
                }}
              >
                {point}
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setShowSample(!showSample)}
            style={{
              width: '100%',
              padding: '12px',
              background: showSample ? '#e8f5e9' : '#fff3e0',
              border: `2px solid ${showSample ? '#4caf50' : '#ff9800'}`,
              borderRadius: '8px',
              color: showSample ? '#2e7d32' : '#e65100',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            {showSample ? '🙈 隐藏参考范文' : '📖 查看参考范文'}
          </button>
          
          {showSample && (
            <div style={{ 
              background: '#e8f5e9', 
              borderRadius: '8px', 
              padding: '16px',
              marginBottom: '12px',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              {part_d.sample_answer}
            </div>
          )}
          
          {/* 语音播放：听范文朗读 */}
          {showSample && (
            <button
              onClick={() => {
                if (playing === 'sample') {
                  window.speechSynthesis.cancel();
                  setPlaying(null);
                } else {
                  setPlaying('sample');
                  speak(part_d.sample_answer, 0.85, () => setPlaying(null));
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                background: playing === 'sample' ? '#e53935' : '#2e7d32',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {playing === 'sample' ? '⏹️ 停止' : '🔊 听范文朗读'}
            </button>
          )}
        </div>
        
        {/* 口头表达练习卡片 */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
            ✏️ 口头表达练习
          </div>
          <div style={{ 
            background: '#f9f9f9', 
            borderRadius: '8px', 
            padding: '12px',
            fontSize: '12px',
            color: '#666',
            marginBottom: '12px'
          }}>
            💡 根据话题和答题要点，练习口头表达内容，然后点击"对比评分"查看得分
          </div>
          <textarea
            value={inputTextD}
            onChange={(e) => setInputTextD(e.target.value)}
            placeholder="输入你的口头表达内容..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleGradeD}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              background: 'linear-gradient(135deg, #9c27b0 0%, #e040fb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            对比评分
          </button>
          
          {/* Part D 评分结果 */}
          {scoreD && (
            <DetailedScoreDisplay 
              score={scoreD.score} 
              maxScore={20} 
              feedback={scoreD.feedback}
              inputText={inputTextD}
              reference={part_d.sample_answer}
            />
          )}
        </div>
        
        {/* 评分标准 */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            ⭐ 评分标准（总分 {part_d.scoring.total} 分）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { label: '发音', value: part_d.scoring.pronunciation, color: '#f44336' },
              { label: '流利度', value: part_d.scoring.fluency, color: '#2196f3' },
              { label: '内容', value: part_d.scoring.content, color: '#4caf50' },
              { label: '语法', value: part_d.scoring.grammar, color: '#ff9800' },
            ].map((item, i) => (
              <div 
                key={i}
                style={{ 
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: item.color }}>
                  {item.value}分
                </div>
              </div>
            ))}
          </div>
          <div style={{ 
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1565c0'
          }}>
            满分 {part_d.scoring.total} 分
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎧</div>
          <div style={{ color: '#666' }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
          <div style={{ color: '#666', marginBottom: '16px' }}>{error}</div>
          <button 
            onClick={() => navigate('/benefits')}
            style={{
              padding: '12px 24px',
              background: '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f0f7ff',
      paddingBottom: '100px'
    }}>
      {/* 顶部导航 */}
      <div style={{
        background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
        color: '#fff',
        padding: '16px',
        paddingTop: 'max(16px, env(safe-area-inset-top))'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <button 
            onClick={() => navigate('/benefits')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          <div style={{ 
            flex: 1, 
            textAlign: 'center', 
            fontSize: '17px', 
            fontWeight: '600',
            marginRight: '36px'
          }}>
            每日听说训练
          </div>
        </div>
        
        {/* 语音状态提示 */}
        {!speechSupported && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            ⚠️ 您的浏览器不支持语音播放，请使用Chrome或Safari
          </div>
        )}
        {speechSupported && voices.length === 0 && (
          <div style={{
            background: '#fff3e0',
            color: '#e65100',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            🔄 正在加载语音...
          </div>
        )}
        {speechSupported && voices.length > 0 && (
          <div style={{
            background: '#e8f5e9',
            color: '#2e7d32',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            ✅ 语音已就绪
          </div>
        )}
        
        {/* 日期和来源 */}
        <div style={{ 
          textAlign: 'center',
          fontSize: '13px',
          opacity: 0.9
        }}>
          {data?.date} · {data?.source}
        </div>
        <div style={{ 
          textAlign: 'center',
          fontSize: '15px',
          fontWeight: '600',
          marginTop: '4px'
        }}>
          {data?.title_cn}
        </div>
      </div>
      
      {/* Tab 切换 */}
      <div style={{
        display: 'flex',
        background: '#fff',
        padding: '8px 4px',
        overflowX: 'auto',
        gap: '4px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1 0 auto',
              minWidth: '80px',
              padding: '10px 8px',
              background: activeTab === tab.id ? '#e3f2fd' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === tab.id ? '#1565c0' : '#666',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 内容区域 */}
      <div style={{ marginTop: '8px' }}>
        {activeTab === 'a' && renderPartA()}
        {activeTab === 'b' && renderPartB()}
        {activeTab === 'c' && renderPartC()}
        {activeTab === 'd' && renderPartD()}
      </div>
      
      {/* 底部完成按钮 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        padding: '16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={handleComplete}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ✅ 完成学习
        </button>
      </div>
    </div>
  );
}
