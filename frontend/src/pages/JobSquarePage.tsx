// 求职广场页面 - 人才引进 & 实习招聘信息
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Building2, MapPin, Clock, ExternalLink, 
  Star, Flame, Filter, Search, ChevronRight, Sparkles,
  GraduationCap, Award, TrendingUp, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { DutyAgentCard } from '../components/DutyAgentWidget';
import { getDutyAgentByStation } from '../utils/dutyAgents';

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

// 真实招聘数据（2026年5月9日验证，全部当前可报名，链接均指向真实官网）
// ⛔ 已截止的岗位必须移除，deadline必须与实际报名截止日期一致
const sampleJobListings: JobListing[] = [
  // 人才引进（当前可报名，与飞书推送同步 2026-05-09）
  {
    id: 1,
    type: 'talent',
    title: '广州市国资委直属事业单位2026年引进20名急需人才公告',
    organization: '广州市国资委',
    location: '广州',
    salary: '事业编制',
    deadline: '2026-05-26',
    url: 'https://gzw.gz.gov.cn/xw/tzgg/content/post_10798154.html',
    description: '招聘计算机科学与技术、软件工程、网络空间安全、信息与通信工程、电子科学与技术等20名，硕士及以上，5月13日-26日报名。',
    tags: ['编制', '广州', '计算机', '免笔试'],
    is_hot: true,
    published_at: '2026-05-09',
  },
  {
    id: 2,
    type: 'talent',
    title: '东莞市教育局2026年5月招聘事业编制教职员476名',
    organization: '东莞市教育局',
    location: '东莞',
    salary: '事业编制',
    deadline: '2026-05-15',
    url: 'https://edu.dg.gov.cn/jyzx/gsgg/content/mpost_4534077.html',
    description: '高层次/急需紧缺人才岗位：信息科技教师方向，招聘计算机科学与技术(a0812)、软件工程(a0835)等，硕士可报，5月9日-15日报名。',
    tags: ['编制', '东莞', '硕士', '计算机'],
    is_hot: true,
    published_at: '2026-05-09',
  },
  {
    id: 3,
    type: 'talent',
    title: '广东工业大学2026年公开招聘工作人员',
    organization: '广东工业大学',
    location: '广州',
    salary: '事业编制',
    deadline: '2026-05-17',
    url: 'https://hrss.gd.gov.cn/gkmlpt/content/4/4891/mpost_4891584.html',
    description: '面向社会公开招聘事业编制，含软件工程、计算机科学与技术等专业，报名时间5月9日-17日，硕士及以上学历。',
    tags: ['编制', '广州', '计算机', '省属'],
    is_hot: true,
    published_at: '2026-05-09',
  },
  {
    id: 4,
    type: 'talent',
    title: '广东海洋大学2026年公开招聘教学科研人员',
    organization: '广东海洋大学',
    location: '湛江',
    salary: '事业编制',
    deadline: '2026-05-20',
    url: 'https://rsc.gdou.edu.cn/info/1028/2501.htm',
    description: '省属重点高校，101名教学科研人员，报名时间5月7日-20日，含计算机/电子信息类岗位，博士研究生学历为主。',
    tags: ['编制', '湛江', '计算机', '博士'],
    is_hot: false,
    published_at: '2026-05-09',
  },
  {
    id: 5,
    type: 'talent',
    title: '东莞市高层次和急需紧缺人才目录（2026年版）',
    organization: '东莞市人社局',
    location: '东莞',
    salary: '高层次人才引进',
    deadline: '2026-12-31',
    url: 'https://dghrss.dg.gov.cn/attachment/0/410/410487/4532721.pdf',
    description: '工程类计算机方向：软件工程(a0835)、计算机科学与技术(a0812)等，硕士可申请，5月1日起施行。',
    tags: ['编制', '硕士', '东莞', '长期'],
    is_hot: false,
    published_at: '2026-05-09',
  },
  // 实习招聘 - 与飞书推送同步（2026年5月7日）
  // ⛔ 已截止的岗位必须移除，deadline必须与实际报名截止日期一致
  {
    id: 1001,
    type: 'internship',
    title: '广发证券C++开发工程师(2026届)',
    organization: '广发证券',
    location: '广州',
    salary: '19000-25000元/月·15薪',
    deadline: '2026-06-30',
    url: 'https://www.nowcoder.com/enterprise/2183',
    description: '2026届硕士，计算机相关专业，熟练掌握C++，实习半个月起，免费宿舍+报销来程车票。',
    tags: ['金融', '广州', '国企', '硕士'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1002,
    type: 'internship',
    title: '广发证券JAVA开发工程师(2026届)',
    organization: '广发证券',
    location: '广州',
    salary: '19000-25000元/月·15薪',
    deadline: '2026-06-30',
    url: 'https://www.nowcoder.com/enterprise/2183',
    description: '2026届硕士，计算机相关专业，负责业务系统开发，免费宿舍+报销来程车票。',
    tags: ['金融', '广州', '国企', '硕士'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1003,
    type: 'internship',
    title: '广发证券前端开发工程师(26/27届)',
    organization: '广发证券',
    location: '广州',
    salary: '200元/工作日',
    deadline: '2026-06-30',
    url: 'https://www.nowcoder.com/enterprise/2183',
    description: '硕士学历，计算机相关专业，Web前端开发，线上/线下实习至少半个月。',
    tags: ['金融', '广州', '硕士', '前端'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1004,
    type: 'internship',
    title: '广发证券IT实习生(前端/C++/Java/算法/数据)',
    organization: '广发证券',
    location: '广州/深圳',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://www.nowcoder.com/enterprise/2183',
    description: '2026届硕士，计算机/软件工程/AI等专业，线上/线下实习半个月，包住宿+报销车票。',
    tags: ['金融', '广州', '国企', '多方向'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1005,
    type: 'internship',
    title: '汇丰科技中国2026校园实习生',
    organization: '汇丰科技',
    location: '广州',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://campus.51job.com/HSBCtech',
    description: '2026年底-2027年7月毕业，计算机/软件工程专业，实习3个月以上，每周至少3天。',
    tags: ['外企', '广州', '可转正', '计算机'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1006,
    type: 'internship',
    title: '华为AI工程师实习生(计算机视觉)',
    organization: '华为',
    location: '广州',
    salary: '200-250元/天',
    deadline: '2026-06-30',
    url: 'https://career.huawei.com/reccampportal/portal5/campus-recruitment-detail.html',
    description: '2026届本科，计算机视觉目标检测/图像识别算法研发，实习可转正。',
    tags: ['大厂', '广州', 'AI', '可转正'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1007,
    type: 'internship',
    title: '华为软件开发实习生',
    organization: '华为',
    location: '广州',
    salary: '200-250元/天',
    deadline: '2026-06-30',
    url: 'https://career.huawei.com/reccampportal/portal5/campus-recruitment-detail.html',
    description: '计算机/软件相关专业，分布式/互联网软件开发，敏捷开发模式。',
    tags: ['大厂', '广州', '软件开发', '多方向'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1008,
    type: 'internship',
    title: '华为2027届AI实习生(大模型/Agent/NLP)',
    organization: '华为',
    location: '广州/深圳/全国',
    salary: '面议',
    deadline: '2026-12-31',
    url: 'https://s.niuqizp.com/s_campus_华为2026校园招聘实习生/',
    description: '2027届在校生，大模型/Agent/强化学习/AI Infra等方向，体系化培养+导师制。',
    tags: ['大厂', 'AI', '可转正', '多城市'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1009,
    type: 'internship',
    title: '蜂助手Java开发工程师(2026届)',
    organization: '蜂助手',
    location: '广州',
    salary: '5000元/月(实习)',
    deadline: '2026-12-02',
    url: 'https://m.liepin.com/job/1978850651.shtml',
    description: '本科，2026届，系统软件和业务需求开发，秋招offer，实习后直接转正。',
    tags: ['互联网', '广州', 'Java', '可转正'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1010,
    type: 'internship',
    title: '网易游戏内容推广策划实习生',
    organization: '网易游戏',
    location: '广州',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://hr.game.163.com/recruit.html',
    description: '本科，策划游戏品牌活动，需附游戏经历和作品，每周4天以上，实习6个月。',
    tags: ['游戏', '广州', '市场', '实习'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1011,
    type: 'internship',
    title: '网易游戏广告投放实习生',
    organization: '网易游戏',
    location: '广州',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://hr.game.163.com/recruit.html',
    description: '本科，负责抖音/快手等渠道广告素材创意构思，脑洞大、网感好。',
    tags: ['游戏', '广州', '投放', '实习'],
    is_hot: false,
    published_at: '2026-05-07',
  },
  {
    id: 1012,
    type: 'internship',
    title: '网易游戏内容运营实习生(MuMu模拟器)',
    organization: '网易游戏',
    location: '广州',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://hr.game.163.com/recruit.html',
    description: '本科，每周4天以上，实习3个月以上，热爱游戏，熟悉国内主流手游。',
    tags: ['游戏', '广州', '运营', '实习'],
    is_hot: false,
    published_at: '2026-05-07',
  },
  {
    id: 1013,
    type: 'internship',
    title: '广汽智能驾驶算法开发实习生(硕士)',
    organization: '广汽研究院',
    location: '广州',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://www.zhipin.com/job_detail/8425912cb65706251XNy2di5F1JS.html',
    description: '硕士学历，智能驾驶规划和控制算法开发，C/C++/Python/MATLAB。',
    tags: ['汽车', '广州', '硕士', '算法'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1014,
    type: 'internship',
    title: '广汽集团软件测试实习生',
    organization: '广汽研究院',
    location: '广州',
    salary: '100-130元/天',
    deadline: '2026-06-30',
    url: 'https://m.lagou.com/wn/jobs/10484317.html',
    description: '计算机相关专业，实习6个月以上，软件产品测试，100-130元/天。',
    tags: ['汽车', '广州', '测试', '实习'],
    is_hot: false,
    published_at: '2026-05-07',
  },
  {
    id: 1015,
    type: 'internship',
    title: '比亚迪软件类实习生(深圳)',
    organization: '比亚迪',
    location: '深圳',
    salary: '150-400元/天',
    deadline: '2026-06-30',
    url: 'https://job.byd.com.cn',
    description: '2025/2026届硕博，Linux驱动/大模型/软件开发/算法等，实习2个月以上。',
    tags: ['新能源', '深圳', '多方向', '算法'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1016,
    type: 'internship',
    title: '字节跳动后端开发实习生(集团信息系统)',
    organization: '字节跳动',
    location: '深圳',
    salary: '200-250元/天',
    deadline: '2026-06-30',
    url: 'https://www.nowcoder.com/jobs/detail/370965',
    description: '2026届本科，计算机/软件工程，Java/C++/Python/Go，5天/周，4个月。',
    tags: ['互联网', '深圳', '后端', '可转正'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1017,
    type: 'internship',
    title: '字节跳动客户端开发实习生(端智能)',
    organization: '字节跳动',
    location: '深圳',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://jobs.bytedance.com/campus/m/position/detail/7468273726481615111',
    description: '2026届本科，计算机/AI相关专业优先，有Android/iOS开发经验优先。',
    tags: ['互联网', '深圳', '客户端', '可转正'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1018,
    type: 'internship',
    title: '字节跳动代码智能大模型算法实习生',
    organization: '字节跳动',
    location: '深圳',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://jobs.bytedance.com/campus/m/position/detail/7560523463564953863',
    description: '硕士，代码LLM后训练/RM/PPO，熟悉大模型训练/RL算法优先，发表论文优先。',
    tags: ['AI', '深圳', '算法', '硕士'],
    is_hot: true,
    published_at: '2026-05-07',
  },
  {
    id: 1019,
    type: 'internship',
    title: '鹿比科技Flutter开发实习(远程)',
    organization: '鹿比科技/Rubii',
    location: '远程',
    salary: '4000-6000元/月',
    deadline: '2026-06-30',
    url: 'https://eleduck.com/posts/lafv8r',
    description: 'AI角色UGC平台，Flutter开发，远程实习6个月以上，报销AI工具会员费。',
    tags: ['AI', '远程', 'Flutter', '移动端'],
    is_hot: false,
    published_at: '2026-05-07',
  },
  {
    id: 1020,
    type: 'internship',
    title: '智乐活Android开发实习(远程)',
    organization: '智乐活',
    location: '远程',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://m.zhipin.com/job_detail/f70a61e316e5585d031y39W0EFpZ.html',
    description: '2027届大专及以上，计算机专业，Kotlin开发，远程办公。',
    tags: ['教育AI', '远程', 'Android', '实习'],
    is_hot: false,
    published_at: '2026-05-07',
  },
  {
    id: 1021,
    type: 'internship',
    title: '小鹏汽车前端开发实习生',
    organization: '小鹏汽车',
    location: '广州',
    salary: '100-150元/天',
    deadline: '2026-06-30',
    url: 'https://xiaopeng.jobs.feishu.cn/campus/m/position',
    description: '本科，2027届，计算机相关专业，前端技术栈。',
    tags: ['汽车', '广州', '前端', '实习'],
    is_hot: false,
    published_at: '2026-05-07',
  },
  {
    id: 1022,
    type: 'internship',
    title: '小鹏汽车NLP算法实习生',
    organization: '小鹏汽车',
    location: '广州',
    salary: '200-250元/天',
    deadline: '2026-06-30',
    url: 'https://xiaopeng.jobs.feishu.cn/campus/m/position',
    description: '本科，计算机/NLP相关专业，AI产品算法方向。',
    tags: ['汽车', '广州', '算法', '实习'],
    is_hot: false,
    published_at: '2026-05-07',
  },
  // 实习招聘（2026年5月8日新增验证）
  {
    id: 1023,
    type: 'internship',
    title: '盛原成科技 - 软件测试实习生 ⭐新增',
    organization: '盛原成科技',
    location: '广州',
    salary: '150-180元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/a884b187586610560nB429W4GA~/',
    description: '本科，5天/周，6个月，负责产品/项目测试工作',
    tags: ['广州', '测试', '实习', '琶洲'],
    is_hot: true,
    published_at: '2026-05-08',
  },
  {
    id: 1024,
    type: 'internship',
    title: 'MINISO - 软件测试实习生 ⭐新增',
    organization: 'MINISO',
    location: '广州',
    salary: '130-150元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/a884b187586610560nB429W4GA~/',
    description: '本科，5天/周，6个月，智能供应链产品质量管控',
    tags: ['广州', '测试', '实习', '琶洲'],
    is_hot: true,
    published_at: '2026-05-08',
  },
  {
    id: 1025,
    type: 'internship',
    title: 'CVTE - 软件测试实习生 ⭐新增',
    organization: 'CVTE',
    location: '广州',
    salary: '120-170元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/a884b187586610560nB429W4GA~/',
    description: '大专，5天/周，6个月，TV主板测试',
    tags: ['广州', '测试', '实习', '黄埔'],
    is_hot: false,
    published_at: '2026-05-08',
  },
  {
    id: 1026,
    type: 'internship',
    title: '启辰科技 - 软件开发实习生 ⭐新增',
    organization: '启辰科技',
    location: '广州',
    salary: '130-180元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/a884b187586610560nB429W4GA~/',
    description: '本科，5天/周，3个月，后端/前端/算法方向',
    tags: ['广州', '开发', '实习', '黄埔'],
    is_hot: true,
    published_at: '2026-05-08',
  },
  {
    id: 1027,
    type: 'internship',
    title: '赛辰股份 - 26届软件测试实习生 ⭐新增',
    organization: '赛辰股份',
    location: '广州',
    salary: '150-200元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/a884b187586610560nB429W4GA~/',
    description: '本科，5天/周，6个月，软件测试基本理论',
    tags: ['广州', '测试', '实习', '黄埔'],
    is_hot: true,
    published_at: '2026-05-08',
  },
  {
    id: 1028,
    type: 'internship',
    title: '摩湃得 - Python后端开发实习(远程) ⭐新增',
    organization: '摩湃得',
    location: '远程',
    salary: '230-240元/天',
    deadline: '2026-06-30',
    url: 'https://m.zhipin.com/job_detail/88966392997f1076031y2N-8FFpV.html',
    description: '本科，计算机专业，AI编程，云函数开发',
    tags: ['远程', '后端', 'Python', 'AI'],
    is_hot: true,
    published_at: '2026-05-08',
  },
  {
    id: 1029,
    type: 'internship',
    title: '哼哼唧唧科技 - Web全栈开发实习(远程) ⭐新增',
    organization: '哼哼唧唧科技',
    location: '远程',
    salary: '200-250元/天',
    deadline: '2026-06-30',
    url: 'https://m.zhipin.com/job_detail/1bdd253a04caa68803153dy0GFpV.html',
    description: '本科，计算机专业，Django开发，可远程',
    tags: ['远程', '全栈', 'Python', '实习'],
    is_hot: true,
    published_at: '2026-05-08',
  },
  // 实习招聘（2026年5月10日新增验证）
  {
    id: 1030,
    type: 'internship',
    title: '浪潮通用软件 - Python开发实习生 ⭐新增',
    organization: '浪潮通用软件（国企）',
    location: '广州',
    salary: '100-120元/天',
    deadline: '2026-06-30',
    url: 'https://m.liepin.com/job/1981295613.shtml',
    description: '本科/硕士，HCM平台AI模块开发，大模型应用，2人',
    tags: ['国企', '广州', 'Python', 'AI'],
    is_hot: true,
    published_at: '2026-05-10',
  },
  {
    id: 1031,
    type: 'internship',
    title: '广州银行 - IT实习生(科技部门) ⭐新增',
    organization: '广州银行',
    location: '广州',
    salary: '面议',
    deadline: '2026-12-31',
    url: 'http://www.gzcb.com.cn/jrgy/rczp/zpgg/202601/t20260128_70899.html',
    description: '本科，计算机/软件工程专业，协助系统研发、大模型应用、数据建模',
    tags: ['国企', '广州', 'IT', '硕士可投'],
    is_hot: true,
    published_at: '2026-05-10',
  },
  {
    id: 1032,
    type: 'internship',
    title: '佳都科技 - C++开发工程师(2026届) ⭐新增',
    organization: '佳都科技',
    location: '广州',
    salary: '12000-20000元/月',
    deadline: '2026-06-30',
    url: 'https://m.zhipin.com/zhaopin/ccd2922cc911a9101H152tW5FQ~~/',
    description: '硕士，智能交通后端接口开发，C++程序设计和优化',
    tags: ['广州', 'C++', '硕士', '智能交通'],
    is_hot: true,
    published_at: '2026-05-10',
  },
  {
    id: 1033,
    type: 'internship',
    title: '中望软件 - C++研发工程师(2026届) ⭐新增',
    organization: '中望软件',
    location: '广州',
    salary: '20000-25000元/月·14薪',
    deadline: '2026-06-30',
    url: 'https://m.zhipin.com/zhaopin/ccd2922cc911a9101H152tW5FQ~~/',
    description: '硕士，CAD/CAM产品子模块研发，面向对象编程，代码重用',
    tags: ['广州', 'C++', '硕士', '软件'],
    is_hot: true,
    published_at: '2026-05-10',
  },
  {
    id: 1034,
    type: 'internship',
    title: 'LFX Mentorship - Volcano社区远程实习 ⭐新增',
    organization: 'Linux Foundation',
    location: '远程',
    salary: '3000美元',
    deadline: '2026-05-19',
    url: 'https://mentorship.lfx.linuxfoundation.org/',
    description: 'CNCF开源社区，Go开发，Kubernetes/云原生调度，6月8日-8月25日',
    tags: ['远程', '开源', 'Go', '云原生'],
    is_hot: true,
    published_at: '2026-05-10',
  },
  // 实习招聘（2026年5月12日新增验证）
  {
    id: 1036,
    type: 'internship',
    title: '飞数方程 - AI智能体开发工程师实习 ⭐新增',
    organization: '飞数方程',
    location: '广州',
    salary: '200-300元/天',
    deadline: '2026-06-30',
    url: 'https://m.zhipin.com/zhaopin/7d944418a86e468c0nB839-1FQ~~/',
    description: '硕士，2026届优先，计算机/软件工程/AI专业，服装新零售SaaS方向，需长期实习',
    tags: ['广州', 'AI', '硕士', '实习'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1037,
    type: 'internship',
    title: '南网数字运营 - 软件开发实习生 ⭐新增',
    organization: '南网数字运营',
    location: '广州',
    salary: '120-240元/天',
    deadline: '2026-12-31',
    url: 'https://www.zhaopin.com/jobdetail/CC120607100J40902761315.htm',
    description: '本科/硕士，计算机/软件工程专业，5天/周，6个月，央国企背景',
    tags: ['广州', '国企', '软件开发', '实习'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1038,
    type: 'internship',
    title: '浩鲸云计算 - C++开发实习生 ⭐新增',
    organization: '浩鲸云计算',
    location: '广州',
    salary: '10000-13000元/月',
    deadline: '2026-06-30',
    url: 'https://m.fjfzrcw.com/job/333410655.html',
    description: '本科/硕士，2026届，C++音视频开发，有转正机会，需提前到岗',
    tags: ['广州', 'C++', '硕士', '转正'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1039,
    type: 'internship',
    title: '深圳赛尔智控 - Agent应用开发实习 ⭐新增',
    organization: '深圳赛尔智控',
    location: '深圳',
    salary: '150-250元/天',
    deadline: '2027-03-30',
    url: 'https://m.liepin.com/job/1981360955.shtml',
    description: '本科/硕士，UniApp+Vue3+TypeScript移动端开发，4天/周，6个月，六险一金',
    tags: ['深圳', 'Agent', '移动端', '实习'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1040,
    type: 'internship',
    title: '字节跳动 - 后端开发实习(今日头条) ⭐新增',
    organization: '字节跳动',
    location: '深圳',
    salary: '200-250元/天',
    deadline: '2026-06-30',
    url: 'https://jobs.bytedance.com/campus/m/position/detail/7402876629515110682',
    description: '本科，计算机/软件工程，Java/C++/Python/Go，4天/周，4个月，可转正',
    tags: ['深圳', '后端', '可转正', '实习'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1041,
    type: 'internship',
    title: '腾讯音乐 - 前端开发暑期实习 ⭐新增',
    organization: '腾讯音乐',
    location: '深圳',
    salary: '300-400元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/88b04c22ad811f2d1nR90ty7GA~~/',
    description: '本科，计算机专业，负责TME前端业务（浏览器端/移动端/小程序）',
    tags: ['深圳', '前端', '暑期', '实习'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1042,
    type: 'internship',
    title: '腾讯天琴实验室 - 语音合成算法实习 ⭐新增',
    organization: '腾讯音乐',
    location: '深圳',
    salary: '200-300元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/88b04c22ad811f2d1nR90ty7GA~~/',
    description: '硕士，NLP/语音算法方向，参与语音合成/交互大模型技术研发',
    tags: ['深圳', '算法', '硕士', '语音'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1043,
    type: 'internship',
    title: '腾讯 - NLP算法实习生 ⭐新增',
    organization: '腾讯',
    location: '深圳',
    salary: '200-400元/天',
    deadline: '2026-06-30',
    url: 'https://m.bosszhipin.com/zhaopin/88b04c22ad811f2d1nR90ty7GA~~/',
    description: '硕士，计算机/NLP专业，2027/2028届优先，大模型应用',
    tags: ['深圳', '算法', '硕士', 'AI'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  {
    id: 1044,
    type: 'internship',
    title: 'Perfects.AI - 研发实习生(远程) ⭐新增',
    organization: 'Perfects.AI',
    location: '远程',
    salary: '100-150元/天',
    deadline: '2026-08-19',
    url: 'https://www.shixiseng.com/intern/inn_1alh7rpgc9e1',
    description: '本科/硕士，数据分析/前端/后端，AI留学咨询平台，线上实习',
    tags: ['远程', 'AI', '留学', '实习'],
    is_hot: true,
    published_at: '2026-05-12',
  },
  // 实习招聘（2026年5月15日新增验证）
  {
    id: 1046,
    type: 'internship',
    title: '广州交通规划研究院 - Python后端开发实习 ⭐新增',
    organization: '广州交通规划研究院（国企）',
    location: '广州',
    salary: '面议',
    deadline: '2026-12-31',
    url: 'https://www.yingjiesheng.com/job-007-968-320.html',
    description: '本科及以上，计算机/软件工程/GIS专业，3天/周，3个月，周末双休，员工餐厅，可转正',
    tags: ['国企', '广州', 'Python', '可转正'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1047,
    type: 'internship',
    title: '越秀集团 - 数据开发岗实习 ⭐新增',
    organization: '越秀集团（国企）',
    location: '广州',
    salary: '100元/天',
    deadline: '2026-12-31',
    url: 'https://m.liepin.com/job/1976828543.shtml',
    description: '本科，计算机/软件工程/数学统计专业，4天/周，3个月，数据中台项目开发',
    tags: ['国企', '广州', '数据', '实习'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1048,
    type: 'internship',
    title: '越秀集团 - AI智能体开发岗实习 ⭐新增',
    organization: '越秀集团（国企）',
    location: '广州',
    salary: '100元/天',
    deadline: '2026-12-31',
    url: 'https://m.liepin.com/lptjob/75850463',
    description: '本科，计算机/AI专业，4天/周，3个月，AI智能体开发/提示词设计/工作流搭建',
    tags: ['国企', '广州', 'AI', '智能体'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1049,
    type: 'internship',
    title: '广船国际 - 软件开发岗实习 ⭐新增',
    organization: '中国船舶广船国际（央企）',
    location: '广州',
    salary: '6000-8000元/月',
    deadline: '2026-06-30',
    url: 'https://www.yingjiesheng.com/job-007-968-127.html',
    description: '硕士，计算机/软件工程，6月底报到，实习2个月以上，免费住宿+班车，8人',
    tags: ['央企', '广州', '硕士', '软件开发'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1050,
    type: 'internship',
    title: '云纵科技 - 机器人软件开发实习 ⭐新增',
    organization: '云纵科技',
    location: '广州',
    salary: '200-300元/天',
    deadline: '2026-09-30',
    url: 'mailto:join@yundrone.cn',
    description: '985/211，计算机/软件/自动化，5天/周，3个月，Tauri/React/Rust，可转正',
    tags: ['广州', '机器人', '软件开发', 'AI'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1051,
    type: 'internship',
    title: '友邦资讯科技 - Java开发工程师(2026届) ⭐新增',
    organization: '友邦资讯科技（外企）',
    location: '广州',
    salary: '180-200元/天',
    deadline: '2026-09-30',
    url: 'https://m.liepin.com/job/1973797435.shtml',
    description: '本科，2026届，计算机相关专业，4天/周，6个月，可转正',
    tags: ['外企', '广州', 'Java', '可转正'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1052,
    type: 'internship',
    title: '广州中软 - 系统工程师(应届) ⭐新增',
    organization: '广州中软信息技术（国企）',
    location: '广州',
    salary: '3000-4000元/月(实习)',
    deadline: '2027-05-08',
    url: 'https://m.liepin.com/job/1982337875.shtml',
    description: '本科，2026届，计算机/信息工程，华南出差，实习转正6-10K',
    tags: ['国企', '广州', '系统', '可转正'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1053,
    type: 'internship',
    title: '康诺思腾 - 软件工程实习(云平台) ⭐新增',
    organization: '康诺思腾',
    location: '深圳',
    salary: '300-400元/天',
    deadline: '2027-04-27',
    url: 'https://www.liepin.com/job/1982119205.shtml',
    description: '本科，计算机/软件/AI专业，5天/周，6个月，前后端开发，AI能力集成',
    tags: ['深圳', '云平台', 'AI', '实习'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1054,
    type: 'internship',
    title: '康诺思腾 - AI软件工程实习 ⭐新增',
    organization: '康诺思腾',
    location: '深圳',
    salary: '300-400元/天',
    deadline: '2027-04-27',
    url: 'https://m.liepin.com/job/1978771335.shtml',
    description: '硕士，计算机/AI专业，4天/周，6个月，深度学习/计算机视觉/模型部署',
    tags: ['深圳', 'AI', '算法', '硕士'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1055,
    type: 'internship',
    title: '国家超算深圳中心 - 云计算部实习 ⭐新增',
    organization: '国家超级计算深圳中心',
    location: '深圳',
    salary: '面议',
    deadline: '2026-12-31',
    url: 'https://m.gaoxiaojob.com/job/detail/1945339.html',
    description: '本科，计算机/软件/AI专业，3个月以上，前端Vue/后端Java/Python，30人',
    tags: ['深圳', '国企', '云计算', '实习'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1056,
    type: 'internship',
    title: '腾讯云 - 大数据AI工程实习 ⭐新增',
    organization: '腾讯云',
    location: '深圳',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://www.zhipin.com/job_detail/f13ab312fd5937e303B939y9GFFS.html',
    description: '本科，计算机相关专业，大数据基础设施/Spark/Flink/AI能力',
    tags: ['深圳', '腾讯', '大数据', 'AI'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1057,
    type: 'internship',
    title: '字节跳动 - 多模态世界模型算法实习 ⭐新增',
    organization: '字节跳动Seed团队',
    location: '深圳',
    salary: '500元/天',
    deadline: '2026-09-30',
    url: 'https://m.liepin.com/job/1980110081.shtml',
    description: '硕士，计算机/AI专业，5天/周，6个月，大模型/多模态，Top Seed计划',
    tags: ['深圳', '算法', '硕士', '大模型'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1058,
    type: 'internship',
    title: '字节跳动 - 后端开发实习(集团信息系统) ⭐新增',
    organization: '字节跳动',
    location: '深圳',
    salary: '200-250元/天',
    deadline: '2026-06-30',
    url: 'https://www.nowcoder.com/jobs/detail/370965',
    description: '本科，计算机/软件工程，5天/周，4个月，Java/C++/Python/Go，可转正',
    tags: ['深圳', '后端', '可转正', '实习'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1059,
    type: 'internship',
    title: '百川云才 - AI应用研发实习(可远程) ⭐新增',
    organization: '百川云才',
    location: '远程',
    salary: '150-300元/天',
    deadline: '2027-03-26',
    url: 'https://m.liepin.com/job/1981284033.shtml',
    description: '硕士，计算机/软件专业，2-3天/周，3个月，AI招聘系统/小程序/前端Vue/后端Java',
    tags: ['远程', 'AI', '硕士', '可转正'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1060,
    type: 'internship',
    title: '上海补天石科技 - 后端开发实习(Go/Python) ⭐新增',
    organization: '上海补天石科技',
    location: '远程',
    salary: '250-300元/天',
    deadline: '2027-02-02',
    url: 'https://m.liepin.com/job/1980128975.shtml',
    description: '本科，计算机专业，4天/周，3个月，可远程，具身智能数据平台',
    tags: ['远程', '后端', 'Go', 'Python'],
    is_hot: true,
    published_at: '2026-05-15',
  },
  {
    id: 1045,
    type: 'internship',
    title: '鹿比科技 - Flutter开发实习(远程) ⭐新增',
    organization: '鹿比科技/Rubii',
    location: '远程',
    salary: '4000-6000元/月',
    deadline: '2026-06-30',
    url: 'https://eleduck.com/posts/lafv8r',
    description: 'AI角色UGC平台，Flutter开发，远程6个月以上，报销AI工具会员费',
    tags: ['远程', 'Flutter', 'AI', '实习'],
    is_hot: false,
    published_at: '2026-05-12',
  },
  // 实习招聘（2026年5月16日新增验证）
  {
    id: 1061,
    type: 'internship',
    title: '粤港澳大湾区国创中心 - 嵌入式软件开发实习 ⭐新增',
    organization: '粤港澳大湾区(广东)国创中心',
    location: '广州',
    salary: '200-250元/天',
    deadline: '2027-02-25',
    url: 'https://m.liepin.com/job/1980389409.shtml',
    description: '硕士，理工科，嵌入式数据库/C/C++/Linux，6个月以上',
    tags: ['广州', '硕士', '嵌入式', '事业单位'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  {
    id: 1062,
    type: 'internship',
    title: '广汽集团 - 智能座舱实习生 ⭐新增',
    organization: '广州汽车集团',
    location: '广州',
    salary: '100-120元/天',
    deadline: '2027-03-26',
    url: 'https://m.liepin.com/job/1981277109.shtml',
    description: '本科/硕士，计算机/信息技术，3天/周，3个月，可转正',
    tags: ['广州', '国企', '智能座舱', '实习'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  {
    id: 1063,
    type: 'internship',
    title: '广州市齐明软件 - AI开发工程师(实习) ⭐新增',
    organization: '广州市齐明软件科技',
    location: '广州',
    salary: '面议',
    deadline: '2027-01-01',
    url: 'https://m.yingjiesheng.com/job-007-968-626.html',
    description: '本科，计算机专业，Java/Python/vue.js，AI编码工具，可转正',
    tags: ['广州', 'AI', '实习', '智慧城市'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  {
    id: 1064,
    type: 'internship',
    title: '广州图灵科技 - Java开发实习 ⭐新增',
    organization: '广州图灵科技',
    location: '广州',
    salary: '2000-3000元/月',
    deadline: '2027-01-01',
    url: 'https://m.liepin.com/job/1981831013.shtml',
    description: '本科，计算机专业，6个月以上，Python/Java，Django/Flask',
    tags: ['广州', 'Java', 'Python', '实习'],
    is_hot: false,
    published_at: '2026-05-16',
  },
  {
    id: 1065,
    type: 'internship',
    title: '华大智造 - 前端软件开发实习 ⭐新增',
    organization: '华大智造',
    location: '深圳',
    salary: '150-300元/天',
    deadline: '2027-03-10',
    url: 'https://m.liepin.com/job/1980811725.shtml',
    description: '本科，计算机/软件专业，5天/周，6个月，Vue3/HTML5/CSS3',
    tags: ['深圳', '前端', '实习', '外企'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  {
    id: 1066,
    type: 'internship',
    title: '康诺思腾 - AI软件工程实习(A86843) ⭐新增',
    organization: '康诺思腾',
    location: '深圳',
    salary: '300-400元/天',
    deadline: '2027-01-01',
    url: 'https://m.liepin.com/lptjob/78771335/',
    description: '硕士，计算机/AI专业，4天/周，6个月，深度学习/计算机视觉/模型部署',
    tags: ['深圳', 'AI', '硕士', '实习'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  {
    id: 1067,
    type: 'internship',
    title: '字节跳动 - 游戏服务端开发实习(深圳) ⭐新增',
    organization: '字节跳动',
    location: '深圳',
    salary: '400元/天',
    deadline: '2027-04-28',
    url: 'https://m.liepin.com/job/1982160035.shtml',
    description: '本科，C++，5天/周，3个月，UE5游戏服务器，Top Seed转正实习',
    tags: ['深圳', '游戏', 'C++', '实习'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  {
    id: 1068,
    type: 'internship',
    title: 'V2EX - 前端/安卓跨端工程师(远程) ⭐新增',
    organization: 'V2EX招聘',
    location: '远程',
    salary: '10000-13000元/月',
    deadline: '2026-12-31',
    url: 'https://global.v2ex.co/t/1211546',
    description: 'JS/TS，Vue/React，网络加速产品，支持远程协作，3%项目分红',
    tags: ['远程', '前端', '跨端', '实习'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  {
    id: 1069,
    type: 'internship',
    title: 'LFX Mentorship - Volcano社区远程实习(新) ⭐新增',
    organization: 'Linux Foundation',
    location: '远程',
    salary: '3000美元',
    deadline: '2026-05-19',
    url: 'https://mentorship.lfx.linuxfoundation.org/',
    description: 'Go/Kubernetes，云原生调度平台开发，6月8日-8月25日，附申请链接',
    tags: ['远程', '开源', 'Go', '云原生'],
    is_hot: true,
    published_at: '2026-05-16',
  },
  // 实习招聘（2026年5月17日新增验证）
  {
    id: 1070,
    type: 'internship',
    title: '广船国际 - 软件开发岗(AI智能体方向) ⭐新增',
    organization: '中国船舶广船国际（央企）',
    location: '广州',
    salary: '6000-7000元/月',
    deadline: '2026-06-30',
    url: 'https://www.yingjiesheng.com/job-007-968-127.html',
    description: '硕士，计算机/软件工程，AI智能体开发/Java/SpringBoot，8人，实习2个月以上',
    tags: ['央企', '广州', '硕士', 'AI智能体'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1071,
    type: 'internship',
    title: '广州珠源信息 - AI应用实习工程师 ⭐新增',
    organization: '广州珠源信息技术（国企）',
    location: '广州',
    salary: '面议',
    deadline: '2026-12-31',
    url: 'https://m.yingjiesheng.com/job-007-962-154.html',
    description: '在读硕士，计算机/AI专业，RAG系统/大模型微调/水利信息化',
    tags: ['国企', '广州', '硕士', 'AI'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1072,
    type: 'internship',
    title: '广州优安信息 - 技术/开发实习生(可转正) ⭐新增',
    organization: '广州优安信息科技',
    location: '广州',
    salary: '3000-5000元/月',
    deadline: '2027-01-05',
    url: 'https://m.liepin.com/job/1979550099.shtml',
    description: '本科/硕士，计算机/软件工程，前后端/AI方向，招5人',
    tags: ['广州', '可转正', '全栈', '实习'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1073,
    type: 'internship',
    title: '网易游戏 - 程序类实习生(天下) ⭐新增',
    organization: '网易游戏',
    location: '广州',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://hr.game.163.com/recruit.html',
    description: '本科/硕士，C++/C#/TypeScript，游戏程序/工具开发，3人',
    tags: ['游戏', '广州', '程序', '实习'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1074,
    type: 'internship',
    title: '三七互娱 - 前端/客户端开发实习(27届) ⭐新增',
    organization: '三七互娱',
    location: '广州',
    salary: '面议',
    deadline: '2026-06-30',
    url: 'https://job.ustb.edu.cn/f/recruitmentinfo/show?recruitmentId=774d58cf387d468c86d21384935d0d0a',
    description: '27届(26年毕业)，前端开发/客户端开发/测试，实习可转正',
    tags: ['游戏', '广州', '实习', '可转正'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1075,
    type: 'internship',
    title: '唯品会 - 技术类日常实习 ⭐新增',
    organization: '唯品会',
    location: '广州',
    salary: '面议',
    deadline: '2026-05-31',
    url: 'https://www.wondercv.com/xiaozhao/vip-spring-2026-guangzhou-8309-b96633',
    description: '本科/硕士，产品/技术/AI方向，27届可转正，5月31日截止',
    tags: ['电商', '广州', '实习', '可转正'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1076,
    type: 'internship',
    title: '康诺思腾 - AI软件工程实习(A86843) ⭐新增',
    organization: '康诺思腾',
    location: '深圳',
    salary: '300-400元/天',
    deadline: '2027-04-27',
    url: 'https://m.liepin.com/job/1978771335.shtml',
    description: '硕士，计算机/AI专业，深度学习/手术视频分析/模型部署，2人',
    tags: ['深圳', 'AI', '硕士', '医疗'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1077,
    type: 'internship',
    title: '康诺思腾 - 软件工程实习(云平台) ⭐新增',
    organization: '康诺思腾',
    location: '深圳',
    salary: '300-400元/天',
    deadline: '2027-04-27',
    url: 'https://www.liepin.com/job/1982119205.shtml',
    description: '本科，计算机/软件专业，前后端/Web开发/AI集成，1人',
    tags: ['深圳', '云平台', '前后端', '实习'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1078,
    type: 'internship',
    title: '国家超算深圳中心 - 云计算部实习 ⭐新增',
    organization: '国家超级计算深圳中心（国企）',
    location: '深圳',
    salary: '面议',
    deadline: '2026-12-31',
    url: 'https://m.gaoxiaojob.com/job/detail/1945339.html',
    description: '本科，计算机/软件/AI专业，Vue前端/Java或Python后端，30人',
    tags: ['深圳', '国企', '云计算', '实习'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1079,
    type: 'internship',
    title: '国家超算深圳中心 - 高性能计算科研实习 ⭐新增',
    organization: '国家超级计算深圳中心（国企）',
    location: '深圳',
    salary: '面议',
    deadline: '2026-12-31',
    url: 'https://m.gaoxiaojob.com/job/detail/1945337.html',
    description: '硕士，理工科，MPI/CUDA/GPU编程，超算平台优化，20人',
    tags: ['深圳', '国企', 'HPC', '硕士'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1080,
    type: 'internship',
    title: '字节跳动 - 游戏服务端开发实习(深圳) ⭐新增',
    organization: '字节跳动',
    location: '深圳',
    salary: '400元/天',
    deadline: '2027-04-28',
    url: 'https://www.liepin.com/job/1982159779.shtml',
    description: '本科，C++/游戏开发，5天/周，3个月，Top Seed转正实习',
    tags: ['深圳', '游戏', 'C++', '可转正'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1081,
    type: 'internship',
    title: '腾讯 - 实习生(远程/线下可选) ⭐新增',
    organization: '腾讯',
    location: '远程',
    salary: '面议',
    deadline: '2026-05-31',
    url: 'https://www.wondercv.com/xiaozhao/tencent-2026-intern-global-8415-75af2c/',
    description: '本科/硕士，技术/产品/设计，10000+岗位，远程与线下可选，2个月以上',
    tags: ['远程', '互联网', '多方向', '可转正'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1082,
    type: 'internship',
    title: '意图网络 - 全栈开发实习(远程) ⭐新增',
    organization: '无穹幻想科技',
    location: '远程',
    salary: '2500元/月',
    deadline: '2026-05-31',
    url: 'https://m.haitou.cc/position/379916454/',
    description: '本科，Elixir/SvelteKit/PostgreSQL，远程办公，AI编程',
    tags: ['远程', '全栈', 'AI', '实习'],
    is_hot: true,
    published_at: '2026-05-17',
  },
  {
    id: 1083,
    type: 'internship',
    title: 'AI营养师 - 全栈开发实习(远程) ⭐新增',
    organization: '无穹幻想科技',
    location: '远程',
    salary: '1500-2000元/月',
    deadline: '2026-05-31',
    url: 'https://m.haitou.cc/position/379895923/',
    description: '本科，SpringBoot/UniApp/AI Coding，远程办公，3个月以上',
    tags: ['远程', '全栈', 'AI', '实习'],
    is_hot: true,
    published_at: '2026-05-17',
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-fuchsia-50 relative overflow-hidden">
      {/* 背景装饰 - 紫粉渐变光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-200/30 via-fuchsia-200/30 to-pink-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-full border border-violet-200/50 mb-4">
            <Briefcase className="w-4 h-4 text-violet-600" />
            <span className="text-sm text-violet-700 font-medium">智能体生态 · 求职服务</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-3">
            🎯 求职广场
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            每日精选人才引进公告 & 实习招聘信息，助你找到理想工作
          </p>
        </div>

        {/* 值班智能体入口 */}
        {(() => {
          const dutyAgent = getDutyAgentByStation('job-square');
          if (!dutyAgent) return null;
          return (
            <div className="max-w-2xl mx-auto mb-6">
              <DutyAgentCard 
                agent={dutyAgent} 
                onChat={() => window.location.href = '/pet-chat/junie'} 
              />
            </div>
          );
        })()}

        {/* Tab 切换 */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white/80 backdrop-blur-lg rounded-2xl p-1.5 shadow-lg shadow-violet-500/10 border border-violet-100/50">
            <button
              onClick={() => setActiveTab('talent')}
              className={clsx(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300',
                activeTab === 'talent'
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
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
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <Briefcase className="w-5 h-5" />
              实习招聘
            </button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg shadow-violet-500/10 border border-violet-100/50 mb-6">
          {/* 搜索框 */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
            <input
              type="text"
              placeholder="搜索职位、单位、标签..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50/80 rounded-xl border border-violet-100 focus:border-violet-300 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
            />
          </div>
          
          {/* 筛选栏 */}
          <div className="flex flex-wrap gap-4">
            {/* 城市筛选 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-slate-600">城市:</span>
              <div className="flex flex-wrap gap-1">
                {cityOptions.map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={clsx(
                      'px-3 py-1.5 text-sm rounded-lg transition-all',
                      selectedCity === city
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md'
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
              <GraduationCap className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-slate-600">学历:</span>
              <div className="flex flex-wrap gap-1">
                {eduOptions.map(edu => (
                  <button
                    key={edu}
                    onClick={() => setSelectedEdu(edu)}
                    className={clsx(
                      'px-3 py-1.5 text-sm rounded-lg transition-all',
                      selectedEdu === edu
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md'
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
                className="group relative bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-violet-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* 热门标识 */}
                {job.is_hot && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white text-xs px-3 py-1 rounded-bl-xl flex items-center gap-1">
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
                        'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25'
                      )}>
                        {activeTab === 'talent' ? (
                          <Building2 className="w-6 h-6 text-white" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-violet-600 transition-colors line-clamp-2">
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
                        <MapPin className="w-4 h-4 text-violet-500" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-fuchsia-500" />
                        {job.salary}
                      </div>
                      <div className={clsx(
                        'flex items-center gap-1.5',
                        isDeadlinePassed(job.deadline) ? 'text-red-500' : 
                        isDeadlineNear(job.deadline) ? 'text-fuchsia-500' : 'text-slate-500'
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
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        查看详情
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 cursor-not-allowed opacity-50"
                        disabled
                      >
                        暂无链接
                      </button>
                    )}
                  </div>	                </div>
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
              className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              清除筛选条件
            </button>
          </div>
        )}

        {/* 底部信息 */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-lg rounded-full border border-violet-100/50 text-sm text-slate-600">
            <Sparkles className="w-4 h-4 text-violet-500" />
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
