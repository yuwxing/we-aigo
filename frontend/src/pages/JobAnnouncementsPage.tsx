// 求职广场 - 从tasks表读取status=announcement的公告
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ExternalLink, Sparkles, AlertCircle, Building2, Briefcase } from 'lucide-react';

const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

interface Announcement {
  id: number;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
  source: string;
}

// 从description中提取链接
const extractLink = (desc: string): string | null => {
  const match = desc.match(/https?:\/\/[^\s\n]+/);
  return match ? match[0] : null;
};

// 渲染描述文本，链接不显示完整URL，显示"查看链接"
const renderDescription = (desc: string) => {
  return desc.split(/(https?:\/\/[^\s\n]+)/g).map((part, i) => 
    /^https?:\/\//.test(part) 
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">🔗 查看链接</a>
      : part
  );
};

const JobAnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${SUPABASE_URL}tasks?status=eq.announcement&select=id,title,description,deadline,created_at,source&order=created_at.desc&limit=50`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAnnouncements(await res.json());
    } catch (err: any) {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const isDeadlineNear = (deadline: string): boolean => {
    if (!deadline) return false;
    try {
      const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
      return diff >= 0 && diff <= 3;
    } catch { return false; }
  };

  // 事业编/人才引进：title 包含事业编、人才引进、编制、公务员、选调
  const careerAnns = announcements.filter(a => {
    const t = a.title.toLowerCase();
    return t.includes('事业编') || t.includes('人才引进') || t.includes('编制') || t.includes('公务员') || t.includes('选调');
  });
  // 实习招聘：title 或 description 包含实习、intern、校招、应届
  const internAnns = announcements.filter(a => {
    if (careerAnns.includes(a)) return false;
    const t = a.title.toLowerCase();
    const d = (a.description || '').toLowerCase();
    return t.includes('实习') || t.includes('intern') || t.includes('校招') || t.includes('应届') || d.includes('实习') || d.includes('intern');
  });
  // 其余的也放进实习（兜底）
  const otherAnns = announcements.filter(a => !careerAnns.includes(a) && !internAnns.includes(a));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  const renderCard = (a: Announcement, isCareer: boolean) => {
    const link = extractLink(a.description);
    return (
      <div key={a.id} className={`rounded-2xl overflow-hidden shadow-md ${isCareer ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 border border-indigo-200/60' : 'bg-white border border-purple-100/50'}`}>
        <div className="p-4">
          {/* 标签行 */}
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isCareer ? 'bg-indigo-600 text-white' : 'bg-purple-50 text-purple-600'}`}>
              {isCareer ? '🏛️ 事业编' : '💼 实习'}
            </span>
            <span className={`text-xs ${isCareer ? 'text-slate-500' : 'text-slate-400'}`}>
              {a.deadline && `截止 ${a.deadline.slice(0,10)}`}
              {isDeadlineNear(a.deadline) && ' ⚠️'}
            </span>
          </div>
          {/* 标题 */}
          <h3 className={`font-bold mb-2 ${isCareer ? 'text-lg text-slate-800' : 'text-base text-slate-800'}`}>
            {a.title.replace(/【.*?】/, '')}
          </h3>
          {/* 描述 */}
          <div className={`text-sm whitespace-pre-line leading-relaxed mb-3 ${isCareer ? 'text-slate-600' : 'text-slate-600'}`}>
            {renderDescription(a.description)}
          </div>
          {/* 底部按钮 */}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isCareer ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'}`}>
              {isCareer ? '查看公告' : '立即投递'}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  };

  // 实习区域显示 internAnns.concat(otherAnns)
  const allInternAnns = internAnns.concat(otherAnns);

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* 顶部 */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-6">
        <div className="max-w-xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5" /> 返回
          </button>
          <h1 className="text-2xl font-bold text-white mb-1">📋 求职广场</h1>
          <p className="text-white/80 text-sm">事业编 · 人才引进 · 实习招聘</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={fetchAnnouncements} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">重试</button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-500">暂无公告信息</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 事业编/人才引进 */}
            {careerAnns.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  事业编 · 人才引进
                  <span className="text-sm font-normal text-slate-400">({careerAnns.length})</span>
                </h2>
                <div className="space-y-4">
                  {careerAnns.map(a => renderCard(a, true))}
                </div>
              </section>
            )}

            {/* 实习招聘 */}
            {allInternAnns.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-pink-500" />
                  实习招聘
                  <span className="text-sm font-normal text-slate-400">({allInternAnns.length})</span>
                </h2>
                <div className="space-y-3">
                  {allInternAnns.map(a => renderCard(a, false))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobAnnouncementsPage;
