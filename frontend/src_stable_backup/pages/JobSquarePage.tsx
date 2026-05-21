// 求职广场页面 - 人才引进 & 实习招聘信息
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Building2, MapPin, Clock, ExternalLink, 
  Star, Flame, Filter, Search, ChevronRight, Sparkles,
  GraduationCap, Award, TrendingUp, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

// 数据类型定义
interface JobListing {
  id: number;
  type: 'talent' | 'internship';
  title: string;
  organization: string;
  location: string;
  salary: string;
  deadline: string;
  url?: string;
  description?: string;
  tags: string[];
  is_hot: boolean;
  published_at: string;
}

// 真实招聘数据（2026年5月4日验证，全部当前可报名，链接均指向真实官网）
// ⛔ 已截止的岗位必须移除，deadline必须与实际报名截止日期一致
const sampleJobListings: JobListing[] = [
  // 人才引进（当前可报名，与飞书推送同步 2026-05-05）
  {
    id: 1,
    type: 'talent',
    title: '广东工业大学2026年公开招聘工作人员',
    organization: '广东工业大学',
    location: '广州',
    salary: '编制内 / 5个计算机岗',
    deadline: '2026-05-16',
    url: 'https://www.qgsydw.com/xxywzlzt/bmzl/ggdx',
    description: '面向社会公开招聘，含5个计算机相关岗位，获聘人员为事业编制。',
    tags: ['编制', '本科', '广州', '计算机'],
    is_hot: true,
    published_at: '2026-05-05',
  },
  {
    id: 2,
    type: 'talent',
    title: '东莞市高层次人才目录（工程类计算机）',
    organization: '东莞市人社局',
    location: '东莞',
    salary: '高层次人才引进',
    deadline: '2026-12-31',
    url: 'https://dghrss.dg.gov.cn/attachment/0/410/410487/4532721.pdf',
    description: '东莞市高层次人才引进，工程类计算机方向长期可申请，符合条件即可申报。',
    tags: ['编制', '硕士', '东莞', '长期'],
    is_hot: false,
    published_at: '2026-05-05',
  },
  {
    id: 3,
    type: 'talent',
    title: '广东省人社厅2026年事业单位公开招聘',
    organization: '广东省人社厅',
    location: '广州',
    salary: '编制内',
    deadline: '2026-05-31',
    url: 'https://hrss.gd.gov.cn/gkmlpt/content/4/4891/mpost_4891584.html',
    description: '广东省属事业单位公开招聘，含多个信息技术岗位，获聘人员为事业编制。',
    tags: ['编制', '本科', '广州', '省级'],
    is_hot: true,
    published_at: '2026-05-05',
  },
  {
    id: 4,
    type: 'talent',
    title: '东莞检测院信息化岗位',
    organization: '东莞检测院',
    location: '东莞',
    salary: '编制内 / 信息化岗',
    deadline: '2026-05-08',
    url: 'https://news.southcn.com/node_fef829e26f/1f7087746b.shtml',
    description: '招聘信息化岗位，即将截止！5月8日截止报名，符合条件的尽快投递。',
    tags: ['编制', '本科', '东莞', '即将截止'],
    is_hot: true,
    published_at: '2026-05-05',
  },
  {
    id: 5,
    type: 'talent',
    title: '深圳市龙岗区2026年上半年公开招聘优秀教师20名',
    organization: '深圳市龙岗区教育局',
    location: '深圳',
    salary: '编制内 / 优秀教师',
    deadline: '2026-05-29',
    url: 'https://www.lg.gov.cn/lgjyj/gkmlpt/content/12/12763/mpost_12763179.html',
    description: '面向社会公开招聘优秀教师20名，本科及以上学历，网络报名5月19日至29日。',
    tags: ['编制', '本科', '深圳', '教师'],
    is_hot: false,
    published_at: '2026-05-01',
  },
  {
    id: 6,
    type: 'talent',
    title: '汕头大学计算机学院人才招聘',
    organization: '汕头大学',
    location: '汕头',
    salary: '编制内 / 长期招聘',
    deadline: '2026-12-31',
    url: 'http://job.stu.edu.cn/product/recruit/website/RecruitNoticeViewNew.jsp?FM_SYS_ID=stdx&entityId=94AC93770FBB48B480670E3E384243FA',
    description: '汕头大学计算机学院招聘教学科研人员，长期可投递，硕士及以上学历。',
    tags: ['编制', '硕士', '汕头', '教师'],
    is_hot: false,
    published_at: '2026-05-05',
  },
  // 实习招聘 - 与飞书推送同步（2026年5月5日）
  {
    id: 1001,
    type: 'internship',
    title: '网易游戏2027届精英实习生',
    organization: '网易游戏',
    location: '广州/杭州/上海',
    salary: '200-400元/天',
    deadline: '2026-06-30',
    url: 'https://game.campus.163.com/m/position/30',
    description: '游戏研发/策划/测试/美术/AI等，内推码uRw7Ka，高转正率，参与热门大作。',
    tags: ['游戏', '广州', '可转正', '内推码uRw7Ka'],
    is_hot: true,
    published_at: '2026-05-05',
  },
  {
    id: 1002,
    type: 'internship',
    title: '唯品会2027届技术实习生（可转正）',
    organization: '唯品会',
    location: '广州',
    salary: '200-250元/天',
    deadline: '2026-05-31',
    url: 'https://app-tc.mokahr.com/m/campus-recruitment/vipshophr/8015#/',
    description: '技术/产品/AI/职能四大方向，27届可转正，Mentor制一对一指导，网申至5.31。',
    tags: ['互联网', '广州', '电商', '可转正'],
    is_hot: true,
    published_at: '2026-05-04',
  },
  {
    id: 1004,
    type: 'internship',
    title: '广发证券IT实习生（国企·高薪19000-20000/月）',
    organization: '广发证券',
    location: '广州',
    salary: '19000-20000元/月',
    deadline: '2026-06-30',
    url: 'https://www.nowcoder.com/enterprise/2183',
    description: '金融科技实习，国企背景，前端/C++/Java/算法/数据方向，参与券商核心系统。',
    tags: ['金融', '广州', '国企', '高薪'],
    is_hot: true,
    published_at: '2026-05-04',
  },
  {
    id: 1005,
    type: 'internship',
    title: '浪潮通用软件Python开发实习生（国企）',
    organization: '浪潮通用软件',
    location: '济南',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://inspur.zhiye.com/campus',
    description: '国企背景，Python开发实习，参与企业级软件开发，6.30截止。',
    tags: ['国企', '济南', 'Python', '技术岗'],
    is_hot: false,
    published_at: '2026-05-04',
  },
  {
    id: 1006,
    type: 'internship',
    title: '浩鲸云计算C++开发实习生（1-1.5万/月）',
    organization: '浩鲸云计算',
    location: '南京',
    salary: '10000-15000元/月',
    deadline: '2026-06-30',
    url: 'https://hjcloud.zhiye.com/campus',
    description: 'C++开发实习，参与分布式系统研发，1-1.5万/月。',
    tags: ['云计算', '南京', 'C++', '技术岗'],
    is_hot: false,
    published_at: '2026-05-04',
  },
  {
    id: 1008,
    type: 'internship',
    title: '腾讯2026技术实习生（深圳·内推码2MR3134STJ）',
    organization: '腾讯',
    location: '深圳',
    salary: '200-600元/天',
    deadline: '2026-06-30',
    url: 'https://join.qq.com/post.html',
    description: '技术/产品/设计等716个岗位，内推码2MR3134STJ优先筛选，不限专业可转正。',
    tags: ['大厂', '深圳', '可转正', '内推码2MR3134STJ'],
    is_hot: true,
    published_at: '2026-05-04',
  },
];

// 城市选项
const cityOptions = ['全部', '广州', '深圳', '佛山', '珠海', '东莞', '全国'];

// 学历选项
const eduOptions = ['全部', '专科', '本科', '硕士', '博士'];

export const JobSquarePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'talent' | 'internship'>('talent');
  const [selectedCity, setSelectedCity] = useState('全部');
  const [selectedEdu, setSelectedEdu] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 尝试从 Supabase 获取数据
        const supabaseUrl = 'https://mzjmfyoemcsoqzoooiej.supabase.co';
        const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/job_listings?type=eq.${activeTab}&order=is_hot.desc,published_at.desc`,
          {
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // ⛔ 硬规则：过滤已截止岗位
            const now = new Date();
            const activeData = data.filter((job: JobListing) => new Date(job.deadline) >= now);
            if (activeData.length > 0) {
              setJobListings(activeData);
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.log('Supabase数据不可用，使用本地数据');
      }
      
      // Supabase 无数据时，使用本地真实数据（自动过滤已截止岗位）
      const now = new Date();
      const activeListings = sampleJobListings.filter(job => new Date(job.deadline) >= now);
      setJobListings(activeListings.filter(job => job.type === activeTab));
      setLoading(false);
    };

    loadData();
  }, [activeTab]);

  // 筛选数据
  const filteredJobs = jobListings.filter(job => {
    // 过滤已截止的岗位
    if (new Date(job.deadline) < new Date()) {
      return false;
    }
    // 城市筛选
    if (selectedCity !== '全部' && job.location !== selectedCity && job.location !== '全国') {
      return false;
    }
    // 学历筛选
    if (selectedEdu !== '全部' && !job.tags.includes(selectedEdu)) {
      return false;
    }
    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        job.title.toLowerCase().includes(keyword) ||
        job.organization.toLowerCase().includes(keyword) ||
        job.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }
    return true;
  });

  // 获取标签颜色
  const getTagColor = (tag: string) => {
    const colorMap: Record<string, string> = {
      '编制': 'bg-red-100 text-red-700 border-red-200',
      '高薪': 'bg-orange-100 text-orange-700 border-orange-200',
      '硕士': 'bg-blue-100 text-blue-700 border-blue-200',
      '博士': 'bg-purple-100 text-purple-700 border-purple-200',
      '本科': 'bg-green-100 text-green-700 border-green-200',
      '专科': 'bg-teal-100 text-teal-700 border-teal-200',
      '大厂': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      '央国企': 'bg-amber-100 text-amber-700 border-amber-200',
      '可转正': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      '即将截止': 'bg-rose-100 text-rose-700 border-rose-200',
      '远程': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      '广州': 'bg-pink-100 text-pink-700 border-pink-200',
      '深圳': 'bg-violet-100 text-violet-700 border-violet-200',
      '佛山': 'bg-slate-100 text-slate-700 border-slate-200',
      '珠海': 'bg-gray-100 text-gray-700 border-gray-200',
      '东莞': 'bg-neutral-100 text-neutral-700 border-neutral-200',
      '全国': 'bg-zinc-100 text-zinc-700 border-zinc-200',
      '教师': 'bg-rose-100 text-rose-700 border-rose-200',
      '公务员': 'bg-red-100 text-red-700 border-red-200',
      '金融': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      '技术岗': 'bg-blue-100 text-blue-700 border-blue-200',
      '产品': 'bg-purple-100 text-purple-700 border-purple-200',
      '管培': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      '电力': 'bg-amber-100 text-amber-700 border-amber-200',
      '云计算': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      '省级': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colorMap[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // 检查是否即将截止
  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  // 判断截止日期是否已过
  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-100/20 to-blue-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full border border-purple-200/50 mb-4">
            <Briefcase className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700 font-medium">智能体生态 · 求职服务</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-3">
            🎯 求职广场
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            每日精选人才引进公告 & 实习招聘信息，助你找到理想工作
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white/80 backdrop-blur-lg rounded-2xl p-1.5 shadow-lg shadow-purple-500/10 border border-purple-100/50">
            <button
              onClick={() => setActiveTab('talent')}
              className={clsx(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300',
                activeTab === 'talent'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <Building2 className="w-5 h-5" />
              人才引进
            </button>
            <button
              onClick={() => setActiveTab('internship')}
              className={clsx(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300',
                activeTab === 'internship'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <Briefcase className="w-5 h-5" />
              实习招聘
            </button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg shadow-purple-500/10 border border-purple-100/50 mb-6">
          {/* 搜索框 */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索职位、单位、标签..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>
          
          {/* 筛选栏 */}
          <div className="flex flex-wrap gap-4">
            {/* 城市筛选 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">城市:</span>
              <div className="flex flex-wrap gap-1">
                {cityOptions.map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={clsx(
                      'px-3 py-1.5 text-sm rounded-lg transition-all',
                      selectedCity === city
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 学历筛选 */}
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">学历:</span>
              <div className="flex flex-wrap gap-1">
                {eduOptions.map(edu => (
                  <button
                    key={edu}
                    onClick={() => setSelectedEdu(edu)}
                    className={clsx(
                      'px-3 py-1.5 text-sm rounded-lg transition-all',
                      selectedEdu === edu
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {edu}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600">
            共找到 <span className="font-bold text-purple-600">{filteredJobs.length}</span> 个职位
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              加载中...
            </div>
          )}
        </div>

        {/* 职位列表 */}
        {filteredJobs.length > 0 ? (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="group relative bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-purple-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* 热门标识 */}
                {job.is_hot && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-bl-xl flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    热门
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* 左侧信息 */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={clsx(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        activeTab === 'talent'
                          ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/25'
                          : 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25'
                      )}>
                        {activeTab === 'talent' ? (
                          <Building2 className="w-6 h-6 text-white" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-purple-600 transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-slate-700">{job.organization}</span>
                        </p>
                      </div>
                    </div>

                    {/* 基本信息 */}
                    <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        {job.salary}
                      </div>
                      <div className={clsx(
                        'flex items-center gap-1.5',
                        isDeadlinePassed(job.deadline) ? 'text-red-500' : 
                        isDeadlineNear(job.deadline) ? 'text-orange-500' : 'text-slate-500'
                      )}>
                        <Clock className="w-4 h-4" />
                        {isDeadlinePassed(job.deadline) ? '已截止' : `截止 ${job.deadline}`}
                      </div>
                    </div>

                    {/* 描述 */}
                    {job.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{job.description}</p>
                    )}

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2">
                      {job.tags.filter(tag => !['即将截止'].includes(tag)).map((tag) => (
                        <span
                          key={tag}
                          className={clsx(
                            'px-2.5 py-1 text-xs font-medium rounded-lg border',
                            getTagColor(tag)
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                      {/* 即将截止标签 */}
                      {(isDeadlineNear(job.deadline) && !isDeadlinePassed(job.deadline)) && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          即将截止
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 右侧操作 */}
                  <div className="flex md:flex-col items-center gap-2 md:items-end">
                    {job.url ? (
                      <button
                        onClick={() => {
                          try {
                            window.open(job.url, '_blank', 'noopener,noreferrer');
                          } catch {
                            window.location.href = job.url;
                          }
                        }}
                        className={clsx(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all hover:-translate-y-0.5',
                          activeTab === 'talent'
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/25 hover:shadow-xl'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25 hover:shadow-xl'
                        )}
                      >
                        查看详情
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className={clsx(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all cursor-not-allowed opacity-50',
                          activeTab === 'talent'
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        )}
                        disabled
                      >
                        暂无链接
                      </button>
                    )}
	                  </div>
	                </div>
	              </div>
            ))}
          </div>
        ) : (
          /* 空状态 */
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">暂无符合条件的职位</h3>
            <p className="text-slate-500 mb-6">试试调整筛选条件，或关注每日更新的招聘信息</p>
            <button
              onClick={() => {
                setSelectedCity('全部');
                setSelectedEdu('全部');
                setSearchKeyword('');
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              清除筛选条件
            </button>
          </div>
        )}

        {/* 底部信息 */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-lg rounded-full border border-purple-100/50 text-sm text-slate-600">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>数据来源：政府官网、知名企业招聘平台 · 每日更新</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            温馨提示：以上信息仅供参考，请以官方发布为准。投递前请核实信息的准确性。
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobSquarePage;
