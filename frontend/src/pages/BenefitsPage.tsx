// 宠物英语角 - 背单词 / 听说训练 / 英语每日训练
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic, FileText, Search, Volume2, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

// Supabase 配置
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

// 听说训练数据
interface ListeningItem {
  id: number;
  title: string;
  description: string;
  audio_url?: string;
  level: string;
  duration?: string;
}

interface WordResult {
  word: string;
  phonetic: string;
  meaning: string;
  examples: string[];
  level?: string;
}

export default function BenefitsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'vocab' | 'listening' | 'daily'>('home');
  const [searchWord, setSearchWord] = useState('');
  const [wordResult, setWordResult] = useState<WordResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [listeningList, setListeningList] = useState<ListeningItem[]>([]);
  const [listeningLoading, setListeningLoading] = useState(false);
  const [selectedListening, setSelectedListening] = useState<ListeningItem | null>(null);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);

  // 背单词搜索
  const handleWordSearch = async () => {
    if (!searchWord.trim()) return;
    setSearchLoading(true);
    setWordResult(null);
    try {
      // 查询本地词库（tasks表存了背单词数据）
      const resp = await fetch(
        `${SUPABASE_URL}tasks?status=eq.vocabulary&select=id,title,description&limit=100`,
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
      const keyword = searchWord.trim().toLowerCase();
      
      // 模糊匹配
      const found = rows.find((r: any) => {
        const d = JSON.parse(r.description || '{}');
        return d.word?.toLowerCase().includes(keyword) || 
               d.meaning?.toLowerCase().includes(keyword) ||
               r.title?.toLowerCase().includes(keyword);
      });

      if (found) {
        const d = JSON.parse(found.description || '{}');
        setWordResult({
          word: d.word || found.title || searchWord,
          phonetic: d.phonetic || '',
          meaning: d.meaning || d.definition || '',
          examples: d.examples || d.example ? [d.example] : [],
          level: d.level || ''
        });
      } else {
        // 查不到则调用词典API
        const dictResp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(keyword)}`);
        if (dictResp.ok) {
          const dictData = await dictResp.json();
          const entry = dictData[0];
          const meanings = entry.meanings || [];
          const firstMeaning = meanings[0] || {};
          const examples: string[] = [];
          meanings.forEach((m: any) => {
            (m.definitions || []).slice(0, 2).forEach((def: any) => {
              if (def.example) examples.push(def.example);
            });
          });
          setWordResult({
            word: entry.word || searchWord,
            phonetic: entry.phonetic || (entry.phonetics?.[0]?.text) || '',
            meaning: firstMeaning.partOfSpeech + ': ' + (firstMeaning.definitions?.[0]?.definition || ''),
            examples,
            level: ''
          });
        } else {
          setWordResult({
            word: searchWord,
            phonetic: '',
            meaning: '未找到释义',
            examples: []
          });
        }
      }
    } catch (e) {
      setWordResult({
        word: searchWord,
        phonetic: '',
        meaning: '查询失败，请重试',
        examples: []
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // 朗读单词
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.8;
      window.speechSynthesis.speak(utter);
    }
  };

  // 加载听说训练列表
  const loadListeningList = async () => {
    setListeningLoading(true);
    try {
      const resp = await fetch(
        `${SUPABASE_URL}tasks?status=eq.ls_daily&select=id,title,description&order=id.desc&limit=20`,
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
      const items: ListeningItem[] = rows.map((r: any) => {
        const d = JSON.parse(r.description || '{}');
        return {
          id: r.id,
          title: r.title || d.title || '听说训练',
          description: d.description || d.content || '',
          audio_url: d.audio_url,
          level: d.level || '中级',
          duration: d.duration || ''
        };
      });
      setListeningList(items);
    } catch (e) {
      console.error('加载听说训练失败', e);
    } finally {
      setListeningLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'listening' && listeningList.length === 0) {
      loadListeningList();
    }
  }, [activeTab]);

  // 播放音频
  const playAudio = (item: ListeningItem) => {
    if (!item.audio_url) return;
    setPlayingAudio(item.id);
    const audio = new Audio(item.audio_url);
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = () => setPlayingAudio(null);
    audio.play();
  };

  const renderHome = () => (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* 顶部标语 */}
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🐾</div>
        <h1 className="text-2xl font-bold text-[#6366F1]">宠物英语角</h1>
        <p className="text-[#94A3B8] text-sm mt-1">陪宠物一起学英语，每天进步一点点 ✨</p>
      </div>

      {/* 三大功能入口 */}
      <div className="grid grid-cols-1 gap-4">
        {/* 背单词 */}
        <button
          onClick={() => setActiveTab('vocab')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100 flex items-center gap-4 text-left hover:shadow-md hover:border-indigo-200 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#1E293B] text-lg">背单词</h3>
            <p className="text-[#64748B] text-sm mt-0.5">查单词、学发音、记例句</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#CBD5E1]" />
        </button>

        {/* 听说训练 */}
        <button
          onClick={() => setActiveTab('listening')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 flex items-center gap-4 text-left hover:shadow-md hover:border-pink-200 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#1E293B] text-lg">听说训练</h3>
            <p className="text-[#64748B] text-sm mt-0.5">每日听力练习，口语同步提升</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#CBD5E1]" />
        </button>

        {/* 英语每日训练 */}
        <button
          onClick={() => navigate('/english-daily')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 flex items-center gap-4 text-left hover:shadow-md hover:border-emerald-200 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#1E293B] text-lg">英语每日训练</h3>
            <p className="text-[#64748B] text-sm mt-0.5">阅读、词汇、语法、写作专项</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#CBD5E1]" />
        </button>
      </div>

      {/* 底部装饰 */}
      <div className="text-center pt-6 pb-2">
        <p className="text-[#CBD5E1] text-xs">每日坚持，积少成多 🐱</p>
      </div>
    </div>
  );

  const renderVocab = () => (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-2 text-[#6366F1] font-medium"
      >
        ← 返回
      </button>

      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#6366F1]">🔤 背单词</h2>
        <p className="text-[#94A3B8] text-sm mt-1">输入单词，查看释义和例句</p>
      </div>

      {/* 搜索框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchWord}
          onChange={e => setSearchWord(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleWordSearch()}
          placeholder="输入英文单词，如 apple"
          className="flex-1 px-4 py-3 bg-white rounded-xl border border-indigo-100 text-[#1E293B] placeholder-[#CBD5E1] outline-none focus:border-indigo-300 transition-colors"
        />
        <button
          onClick={handleWordSearch}
          disabled={searchLoading}
          className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {searchLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 搜索结果 */}
      {wordResult && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-2xl font-bold text-[#1E293B]">{wordResult.word}</h3>
              {wordResult.phonetic && (
                <p className="text-[#94A3B8] text-sm mt-0.5">{wordResult.phonetic}</p>
              )}
            </div>
            <button
              onClick={() => speakWord(wordResult.word)}
              className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="border-t border-indigo-50 pt-3 mt-3">
            <p className="text-[#475569] leading-relaxed">{wordResult.meaning}</p>
          </div>

          {wordResult.examples.length > 0 && (
            <div className="border-t border-indigo-50 pt-3 mt-3 space-y-2">
              <h4 className="text-sm font-bold text-[#6366F1]">例句</h4>
              {wordResult.examples.map((ex, i) => (
                <div key={i} className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-[#475569] text-sm italic">"{ex}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderListening = () => (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-2 text-[#EC4899] font-medium"
      >
        ← 返回
      </button>

      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#EC4899]">🎧 听说训练</h2>
        <p className="text-[#94A3B8] text-sm mt-1">每日听力练习，提升英语听力能力</p>
      </div>

      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <button
          onClick={loadListeningList}
          disabled={listeningLoading}
          className="flex items-center gap-1 text-sm text-[#EC4899] hover:text-pink-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${listeningLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {listeningLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
        </div>
      ) : listeningList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#94A3B8]">暂无听说训练内容</p>
          <p className="text-[#CBD5E1] text-xs mt-1">每日12:00自动更新</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listeningList.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedListening(selectedListening?.id === item.id ? null : item)}
              className={`w-full bg-white rounded-2xl p-4 shadow-sm border text-left transition-all ${
                selectedListening?.id === item.id ? 'border-pink-300 ring-2 ring-pink-100' : 'border-pink-50 hover:border-pink-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1E293B] text-sm truncate">{item.title}</h3>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{item.level} · {item.duration || '不限时长'}</p>
                  </div>
                </div>
                {item.audio_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); playAudio(item); }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      playingAudio === item.id
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-50 text-pink-500 hover:bg-pink-100'
                    }`}
                  >
                    {playingAudio === item.id ? (
                      <div className="w-3 h-3 bg-white rounded-sm" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* 展开内容 */}
              {selectedListening?.id === item.id && (
                <div className="mt-3 pt-3 border-t border-pink-50">
                  <p className="text-[#475569] text-sm leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 pb-20">
      {/* 顶部导航栏 */}
      {activeTab !== 'home' && (
        <div className="bg-white/80 backdrop-blur-md px-4 py-3 sticky top-0 z-20 border-b border-indigo-50">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="text-[#6366F1] font-medium text-sm"
            >
              ← 返回
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-bold text-[#6366F1]">
                {activeTab === 'vocab' && '🔤 背单词'}
                {activeTab === 'listening' && '🎧 听说训练'}
                {activeTab === 'daily' && '📖 英语每日训练'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 主内容 */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'vocab' && renderVocab()}
      {activeTab === 'listening' && renderListening()}

      {/* 底部Tab指示 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
