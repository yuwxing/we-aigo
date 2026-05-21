// 智能体值班体系配置
// 每个版块配置对应的值班智能体

export interface DutyAgent {
  id: number;
  name: string;
  avatar: string;
  title: string;
  description: string;
  station: string; // 值班版块
  duties: string[]; // 职责描述
}

// 值班智能体配置
export const dutyAgents: DutyAgent[] = [
  {
    id: 0, // 调度官 - 任务大厅
    name: '调度官',
    avatar: '/pets/zhiyuan.png',
    title: '任务调度专家',
    description: '智能匹配任务与智能体，优化任务分配效率',
    station: 'tasks',
    duties: ['任务匹配', '智能调度', '进度跟踪']
  },
  {
    id: 22, // 猎影 - 求职广场
    name: '猎影',
    avatar: '/pets/lieying.png',
    title: '招聘信息猎手',
    description: '实时搜集整理最新招聘信息，不错过任何机会',
    station: 'job-square',
    duties: ['信息搜集', '公告更新', '机会提醒']
  },
  {
    id: 21, // 点津 - 英语角
    name: '点津',
    avatar: '/pets/dianjin.png',
    title: '英语学习导师',
    description: '每日推送英语学习内容，解答英语学习疑问',
    station: 'english-corner',
    duties: ['每日推送', '词汇讲解', '语法辅导']
  },
  {
    id: 0, // 省钱助手 - 福利页 (复用宠物头像)
    name: '省钱助手',
    avatar: '/pets/rabbit.jpg',
    title: '优惠信息管家',
    description: '搜集整理各类优惠信息，帮你省钱',
    station: 'benefits',
    duties: ['优惠搜集', '比价分析', '省钱攻略']
  },
  {
    id: 25, // 反馈收集师 - 反馈中心
    name: '反馈收集师',
    avatar: '/pets/fankui.png',
    title: '用户反馈处理专家',
    description: '处理用户反馈，跟进问题解决进度',
    station: 'feedback',
    duties: ['问题记录', '赔付跟进', '服务改进']
  },
  {
    id: 13, // 文心 - 创作工坊
    name: '文心',
    avatar: '/pets/wenxin.png',
    title: '创意写作大师',
    description: '提供AIGC模板和创作指导，激发创意灵感',
    station: 'create',
    duties: ['模板推荐', '创作指导', '灵感激发']
  }
];

// 根据版块获取值班智能体
export const getDutyAgentByStation = (station: string): DutyAgent | undefined => {
  return dutyAgents.find(agent => agent.station === station);
};

// 获取所有值班中的智能体
export const getOnDutyAgents = (): DutyAgent[] => {
  return dutyAgents;
};

// 判断智能体是否在值班
export const isAgentOnDuty = (agentId: number): boolean => {
  return dutyAgents.some(agent => agent.id === agentId);
};

// 获取智能体值班版块
export const getAgentDutyStation = (agentId: number): string | undefined => {
  const agent = dutyAgents.find(a => a.id === agentId);
  return agent?.station;
};
