/**
 * API服务模块
 * 封装与后端的HTTP请求
 * 支持环境变量配置API地址
 */
import axios, { AxiosResponse } from 'axios';
import type {
  VideoSearchResult,
  User,
  Agent,
  AgentStats,
  CreateAgentRequest,
  Task,
  TaskDetails,
  CreateTaskRequest,
  TaskMatchRequest,
  TaskApproveRequest,
  TaskExecuteResponse,
  TaskAssignRequest,
  TaskSubmitRequest,
  TaskSettleRequest,
  Transaction,
  BalanceResponse,
  Application,
  CreateApplicationRequest,
  ApplicationStatusUpdate,
  ApplicationListResponse,
  ApplicationStats,
  GenerateKeyRequest,
  GenerateKeyResponse,
  AgentBalanceResponse,
} from '../types';

// 获取API基础地址
const getApiBaseURL = () => {
  // 生产环境使用环境变量或相对路径
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // 开发环境使用Vite代理
  return '/api/v1';
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 直接返回data
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    const message = error.response?.data?.detail || '请求失败';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// ============ 用户相关API ============

export const userApi = {
  // 创建用户（通用）
  createUser: (data: { username: string; email: string; password?: string; user_type?: string; initial_balance?: number }): Promise<User> =>
    apiClient.post('/users/', data),

  // 用户注册（专用接口，自动赠送Token）
  register: (data: { username: string; email: string; password?: string; user_type: 'human' | 'agent'; agent_name?: string; agent_description?: string; capabilities?: any[] }): Promise<User> =>
  {
    // 使用本地API路由，避免跨域和缓存问题
    return fetch('/api/v1/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => {
      if (!res.ok) return res.json().then(err => Promise.reject(new Error(err.error || err.detail || '注册失败')));
      return res.json();
    });
  },

  // 获取用户列表
  listUsers: (params?: { skip?: number; limit?: number; user_type?: string }): Promise<User[]> =>
    apiClient.get('/users/', { params }),

  // 获取用户详情
  getUser: (userId: number): Promise<User> =>
    apiClient.get(`/users/${userId}`),

  // 获取用户余额
  getBalance: (userId: number): Promise<BalanceResponse> =>
    apiClient.get(`/users/${userId}/balance`),

  // 获取用户交易记录
  getTransactions: (userId: number, params?: { skip?: number; limit?: number }): Promise<Transaction[]> =>
    apiClient.get(`/users/${userId}/transactions`, { params }),
};

// ============ 智能体相关API ============

export const agentApi = {
  // 创建智能体
  createAgent: (data: CreateAgentRequest): Promise<Agent> =>
    apiClient.post('/agents/', data),

  // 获取智能体列表
  listAgents: (params?: {
    skip?: number;
    limit?: number;
    owner_id?: number;
    category?: string;
    min_level?: number;
  }): Promise<Agent[]> => {
    const query = new URLSearchParams();
    if (params?.skip) query.set('skip', String(params.skip));
    if (params?.limit) query.set('limit', String(params.limit));
    return fetch('/api/v1/agents/?' + query.toString()).then(r => r.ok ? r.json() : []);
  },

  // 获取智能体详情
  getAgent: (agentId: number): Promise<Agent> =>
    apiClient.get(`/agents/${agentId}`),

  // 更新智能体
  updateAgent: (agentId: number, data: Partial<CreateAgentRequest>): Promise<Agent> =>
    apiClient.put(`/agents/${agentId}`, data),

  // 获取智能体统计
  getAgentStats: (agentId: number): Promise<AgentStats> =>
    apiClient.get(`/agents/${agentId}/stats`),

  // 生成 Agent API Key
  generateApiKey: (data: GenerateKeyRequest): Promise<GenerateKeyResponse> =>
    apiClient.post('/agent-api/generate-key', data),

  // 获取 Agent 余额（通过 Agent API）
  getAgentBalance: (apiKey: string): Promise<AgentBalanceResponse> =>
    apiClient.get('/agent-api/my-balance', {
      headers: { 'X-Agent-API-Key': apiKey }
    }),
};

// ============ 任务相关API ============

export const taskApi = {
  // 创建任务
  createTask: (data: CreateTaskRequest): Promise<Task> =>
    apiClient.post('/tasks/', data),

  // 获取任务列表
  listTasks: (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    publisher_id?: number;
    matched_agent_id?: number;
  }): Promise<Task[]> => {
    const query = new URLSearchParams();
    if (params?.skip) query.set('skip', String(params.skip));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', String(params.status));
    if (params?.publisher_id) query.set('publisher_id', String(params.publisher_id));
    if (params?.matched_agent_id) query.set('matched_agent_id', String(params.matched_agent_id));
    return fetch('/api/v1/tasks/?' + query.toString()).then(r => r.ok ? r.json() : []);
  },

  // 获取任务详情
  getTask: (taskId: number): Promise<TaskDetails> =>
    fetch(`/api/v1/tasks/${taskId}`).then(r => r.ok ? r.json() : Promise.reject(new Error('获取任务详情失败'))),

  // 获取任务详情（别名）
  getTaskDetails: (taskId: number): Promise<TaskDetails> =>
    fetch(`/api/v1/tasks/${taskId}`).then(r => r.ok ? r.json() : Promise.reject(new Error('获取任务详情失败'))),

  // 匹配任务
  matchTask: (taskId: number, data: TaskMatchRequest): Promise<any> =>
    fetch(`/api/v1/tasks/${taskId}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.detail || e.error || '匹配失败')))),

  // 分配任务给智能体（手动模式）
  assignTask: (taskId: number, data: TaskAssignRequest): Promise<Task> =>
    apiClient.post(`/tasks/${taskId}/assign`, data),

  // 提交任务结果（手动模式）
  submitTaskResult: (taskId: number, data: TaskSubmitRequest): Promise<Task> =>
    apiClient.post(`/tasks/${taskId}/submit`, data),

  // 接受任务
  acceptTask: (taskId: number, agentId: number): Promise<any> =>
    apiClient.post(`/tasks/${taskId}/accept`, { agent_id: agentId }),

  // 完成任务
  completeTask: (taskId: number): Promise<any> =>
    apiClient.post(`/tasks/${taskId}/complete`),

  // 验收任务
  approveTask: (taskId: number, data: TaskApproveRequest): Promise<any> =>
    apiClient.post(`/tasks/${taskId}/approve`, data),

  // 验收并结算（手动模式）
  settleTask: (taskId: number, data: TaskSettleRequest): Promise<Task> =>
    apiClient.post(`/tasks/${taskId}/settle`, data),

  // 取消任务
  cancelTask: (taskId: number): Promise<any> =>
    apiClient.post(`/tasks/${taskId}/cancel`),

  // 执行任务
  executeTask: (taskId: number, instruction: string): Promise<TaskExecuteResponse> =>
    apiClient.post(`/tasks/${taskId}/execute`, { instruction }),

  // ============ 交付相关API ============

  // 提交交付物（智能体调用）
  submitDelivery: (taskId: number, agentId: number, content: string, resultUrl?: string): Promise<any> =>
    fetch(`/api/v1/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, content, result_url: resultUrl }),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.detail || '提交交付物失败')))),

  // 获取交付记录
  getDelivery: (taskId: number): Promise<any[]> =>
    fetch(`/api/v1/tasks/${taskId}`).then(r => r.ok ? r.json() : {}).then(d => d.deliveries || []),

  // 验收交付物（任务发布者调用）
  reviewDelivery: (taskId: number, action: 'accept' | 'reject', rating?: number, comment?: string): Promise<any> =>
    fetch(`/api/v1/tasks/${taskId}/${action === 'accept' ? 'approve' : 'cancel'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, feedback: comment }),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.detail || '验收失败')))),
};

// ============ 交易相关API ============

export const transactionApi = {
  // 获取交易记录
  getTransactions: (params?: { skip?: number; limit?: number }): Promise<Transaction[]> =>
    apiClient.get('/transactions/', { params }),

  // 获取交易详情
  getTransaction: (transactionId: number): Promise<Transaction> =>
    apiClient.get(`/transactions/${transactionId}`),
};

// ============ 入驻申请相关API ============

export const applicationApi = {
  // 创建入驻申请
  createApplication: (data: CreateApplicationRequest): Promise<Application> =>
    apiClient.post('/applications', data),

  // 获取申请列表
  listApplications: (params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<ApplicationListResponse> =>
    apiClient.get('/applications', { params }),

  // 获取申请详情
  getApplication: (applicationId: number): Promise<Application> =>
    apiClient.get(`/applications/${applicationId}`),

  // 批准申请
  approveApplication: (applicationId: number, data?: ApplicationStatusUpdate): Promise<Application> =>
    apiClient.put(`/applications/${applicationId}/approve`, data),

  // 拒绝申请
  rejectApplication: (applicationId: number, data?: ApplicationStatusUpdate): Promise<Application> =>
    apiClient.put(`/applications/${applicationId}/reject`, data),

  // 更新申请状态
  updateApplication: (applicationId: number, data: ApplicationStatusUpdate): Promise<Application> =>
    apiClient.put(`/applications/${applicationId}`, data),

  // 获取申请统计
  getApplicationStats: (): Promise<ApplicationStats> =>
    apiClient.get('/applications/stats/summary'),
};

// 导出 api 实例以便直接使用
export { apiClient as api };

// ============ 视频搜索相关API ============
export const videoSearch = async (query: string, subject?: string, grade?: string): Promise<VideoSearchResult[]> => {
  try {
    const response = await fetch('/api/video-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, subject, grade }),
    });
    
    if (!response.ok) { throw new Error('视频搜索失败'); }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Video search error:', error);
    return [];
  }
};

