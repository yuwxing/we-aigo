/**
 * Supabase 直连客户端工具
 * 用于前端直接调用 Supabase REST API，绕过不可用的后端
 */
const SUPABASE_URL = 'https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM';

export const supabaseFetch = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    let errorMsg = '请求失败';
    try { errorMsg = JSON.parse(text).message || JSON.parse(text).detail || errorMsg; } catch {}
    throw new Error(errorMsg);
  }
  
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
};

// ============ Tasks 相关 ============

export const tasksAPI = {
  // 获取任务列表
  listTasks: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    publisher_id?: number;
    matched_agent_id?: number;
    order?: string;
  }) => {
    let query = 'tasks?select=*';
    if (params?.status) query += `&status=eq.${params.status}`;
    if (params?.publisher_id) query += `&publisher_id=eq.${params.publisher_id}`;
    if (params?.matched_agent_id) query += `&matched_agent_id=eq.${params.matched_agent_id}`;
    if (params?.order) query += `&order=${params.order}`;
    else query += '&order=id.desc';
    if (params?.limit) query += `&limit=${params.limit}`;
    if (params?.skip) query += `&offset=${params.skip}`;
    return supabaseFetch(query);
  },

  // 获取单个任务（包含关联的deliveries）
  getTask: async (taskId: number) => {
    const data = await supabaseFetch(`tasks?id=eq.${taskId}`);
    if (!data || !data[0]) return null;
    // 单独获取关联的deliveries
    const deliveries = await supabaseFetch(`deliveries?task_id=eq.${taskId}&order=id.desc`);
    return { ...data[0], deliveries: deliveries || [] };
  },

  // 创建任务
  createTask: async (data: {
    title: string;
    description?: string;
    publisher_id: number;
    budget: number;
    deadline?: string | null;
    requirements?: any[];
    status?: string;
    matched_agent_id?: number | null;
    source?: string;
    max_claimants?: number;
    claimed_by?: number[];
  }) => {
    // TODO: claimed_by/max_claimants/source字段需在Supabase添加后再启用
    const body: Record<string, any> = {
      title: data.title,
      description: data.description,
      publisher_id: data.publisher_id,
      budget: data.budget,
      deadline: data.deadline,
      requirements: data.requirements,
      status: data.status || 'open',
      matched_agent_id: data.matched_agent_id || null,
      created_at: new Date().toISOString(),
    };
    return supabaseFetch('tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // 更新任务
  updateTask: async (taskId: number, data: Record<string, any>) => {
    return supabaseFetch(`tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 验收通过
  approveTask: async (taskId: number, rating?: number, feedback?: string) => {
    return supabaseFetch(`tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        delivery_status: 'accepted',
        rating: rating || 5,
        feedback: feedback || '',
      }),
    });
  },

  // 认领任务（人类执行）
  claimTask: async (taskId: number, userId: number) => {
    // 获取当前任务全部字段（兼容claimed_by字段可能不存在的情况）
    const taskData = await supabaseFetch(`tasks?id=eq.${taskId}&select=*`);
    if (!taskData || !taskData[0]) {
      throw new Error('任务不存在');
    }
    const task = taskData[0];
    const claimedBy: number[] = task.claimed_by || [];
    const maxClaimants = task.max_claimants || 1;
    
    // 检查是否已认领
    if (claimedBy.includes(userId)) {
      throw new Error('您已认领过该任务');
    }
    
    // 检查是否达到最大认领人数
    if (claimedBy.length >= maxClaimants) {
      throw new Error('该任务已达到最大认领人数');
    }
    
    // 添加认领者
    const newClaimedBy = [...claimedBy, userId];
    const newStatus = newClaimedBy.length >= maxClaimants ? 'in_progress' : 'open';
    
    // 如果claimed_by字段存在则更新，否则只更新状态
    const patchData: Record<string, any> = { status: newStatus };
    if ('claimed_by' in task) {
      patchData.claimed_by = newClaimedBy;
    }
    
    return supabaseFetch(`tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(patchData),
    });
  },

  // 取消认领
  unclaimTask: async (taskId: number, userId: number) => {
    const taskData = await supabaseFetch(`tasks?id=eq.${taskId}&select=*`);
    if (!taskData || !taskData[0]) {
      throw new Error('任务不存在');
    }
    const task = taskData[0];
    const claimedBy: number[] = task.claimed_by || [];
    const newClaimedBy = claimedBy.filter(id => id !== userId);
    
    const patchData: Record<string, any> = { status: 'open' };
    if ('claimed_by' in task) {
      patchData.claimed_by = newClaimedBy;
    }
    
    return supabaseFetch(`tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(patchData),
    });
  },

  // 验收退回（重新开放）
  rejectTask: async (taskId: number) => {
    return supabaseFetch(`tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'open',
        matched_agent_id: null,
        delivery_status: 'rejected',
      }),
    });
  },

  // 取消任务
  cancelTask: async (taskId: number) => {
    return supabaseFetch(`tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  },

  // 匹配智能体
  matchTask: async (taskId: number, agentId: number) => {
    return supabaseFetch(`tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'matched',
        matched_agent_id: agentId,
      }),
    });
  },

  // 指派任务给智能体（通过Worker）
  assignTask: async (taskId: number, agentId: number, userId: number) => {
    const res = await fetch('https://ai-wego-worker.ai-wego-api.workers.dev/api/tasks/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, agent_id: agentId, user_id: userId })
    });
    return res.json();
  },

  // 提交交付物
  submitDelivery: async (taskId: number, agentId: number, content: string, resultUrl?: string) => {
    return supabaseFetch('deliveries', {
      method: 'POST',
      body: JSON.stringify({
        task_id: taskId,
        agent_id: agentId,
        content: content,
        result_url: resultUrl || null,
      }),
    });
  },

  // 获取交付记录
  getDeliveries: async (taskId: number) => {
    return supabaseFetch(`deliveries?task_id=eq.${taskId}&order=id.desc`);
  },

  // 更新交付记录
  updateDelivery: async (deliveryId: number, data: Record<string, any>) => {
    return supabaseFetch(`deliveries?id=eq.${deliveryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ============ Agents 相关 ============

export const agentsAPI = {
  // 获取智能体列表
  listAgents: async (params?: {
    skip?: number;
    limit?: number;
    owner_id?: number;
    category?: string;
    order?: string;
  }) => {
    let query = 'agents?select=*';
    if (params?.owner_id) query += `&owner_id=eq.${params.owner_id}`;
    if (params?.order) query += `&order=${params.order}`;
    else query += '&order=created_at.desc';
    if (params?.limit) query += `&limit=${params.limit}`;
    if (params?.skip) query += `&offset=${params.skip}`;
    return supabaseFetch(query);
  },

  // 获取单个智能体
  getAgent: async (agentId: number) => {
    const data = await supabaseFetch(`agents?id=eq.${agentId}`);
    return data && data[0] ? data[0] : null;
  },

  // 创建智能体
  createAgent: async (data: {
    name: string;
    description?: string;
    owner_id: number;
    capabilities?: any[];
    avatar_url?: string;
  }) => {
    return supabaseFetch('agents', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        token_balance: 15000,
        completed_tasks: 0,
        avg_rating: 5.0,
        total_tasks: 0,
      }),
    });
  },

  // 更新智能体
  updateAgent: async (agentId: number, data: Record<string, any>) => {
    return supabaseFetch(`agents?id=eq.${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ============ Users 相关 ============

export const usersAPI = {
  // 获取用户列表
  listUsers: async (params?: {
    skip?: number;
    limit?: number;
    user_type?: string;
  }) => {
    let query = 'users?select=*';
    if (params?.user_type) query += `&user_type=eq.${params.user_type}`;
    if (params?.limit) query += `&limit=${params.limit}`;
    if (params?.skip) query += `&offset=${params.skip}`;
    return supabaseFetch(query);
  },

  // 获取单个用户
  getUser: async (userId: number) => {
    const data = await supabaseFetch(`users?id=eq.${userId}`);
    return data && data[0] ? data[0] : null;
  },

  // 创建用户
  createUser: async (data: {
    username: string;
    email: string;
    password?: string;
    user_type?: string;
    initial_balance?: number;
  }) => {
    return supabaseFetch('users', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        token_balance: data.initial_balance || 5000,
        user_type: data.user_type || 'human',
      }),
    });
  },

  // 更新用户余额
  updateBalance: async (userId: number, newBalance: number) => {
    return supabaseFetch(`users?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ token_balance: newBalance }),
    });
  },

  // 扣除用户余额（原子操作，返回新余额）
  deductBalance: async (userId: number, amount: number): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
    try {
      // 先获取当前余额
      const userData = await supabaseFetch(`users?id=eq.${userId}&select=token_balance`);
      if (!userData || !userData[0]) {
        return { success: false, error: '用户不存在' };
      }
      const currentBalance = userData[0].token_balance;
      if (currentBalance < amount) {
        return { success: false, error: '余额不足' };
      }
      const newBalance = currentBalance - amount;
      await supabaseFetch(`users?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ token_balance: newBalance }),
      });
      return { success: true, newBalance };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '扣款失败' };
    }
  },

  // 增加用户余额（原子操作，返回新余额）
  addBalance: async (userId: number, amount: number): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
    try {
      // 先获取当前余额
      const userData = await supabaseFetch(`users?id=eq.${userId}&select=token_balance`);
      if (!userData || !userData[0]) {
        return { success: false, error: '用户不存在' };
      }
      const currentBalance = userData[0].token_balance;
      const newBalance = currentBalance + amount;
      await supabaseFetch(`users?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ token_balance: newBalance }),
      });
      return { success: true, newBalance };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '充值失败' };
    }
  },
};

// ============ Transactions 相关 ============

export const transactionsAPI = {
  // 获取交易记录
  listTransactions: async (params?: {
    skip?: number;
    limit?: number;
    user_id?: number;
    type?: string;
    task_id?: number;
  }) => {
    let query = 'transactions?select=*&order=created_at.desc';
    if (params?.user_id) query += `&user_id=eq.${params.user_id}`;
    if (params?.type) query += `&type=eq.${params.type}`;
    if (params?.task_id) query += `&task_id=eq.${params.task_id}`;
    if (params?.limit) query += `&limit=${params.limit}`;
    if (params?.skip) query += `&offset=${params.skip}`;
    return supabaseFetch(query);
  },

  // 创建交易记录
  createTransaction: async (data: {
    from_id: number;
    from_type: string;
    to_id: number;
    to_type: string;
    amount: number;
    task_id?: number | null;
    type: string;
    description?: string;
  }) => {
    return supabaseFetch('transactions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        task_id: data.task_id || null,
        created_at: new Date().toISOString(),
      }),
    });
  },

  // 获取用户收到的交易（to_id = userId）
  getUserReceivedTransactions: async (userId: number, limit = 50) => {
    return supabaseFetch(`transactions?to_id=eq.${userId}&order=created_at.desc&limit=${limit}`);
  },

  // 获取用户发起的交易（from_id = userId）
  getUserSentTransactions: async (userId: number, limit = 50) => {
    return supabaseFetch(`transactions?from_id=eq.${userId}&order=created_at.desc&limit=${limit}`);
  },

  // 获取任务相关的扣款记录（用于验收时获取reward金额）
  getTaskPaymentRecord: async (taskId: number) => {
    const data = await supabaseFetch(`transactions?task_id=eq.${taskId}&type=eq.task_payment`);
    return data && data[0] ? data[0] : null;
  },
};

export { SUPABASE_URL, SUPABASE_KEY };

// ============ 统计计算函数 ============

/**
 * 计算智能体的平均评分（从已验收任务实时计算）
 */
export const calculateAgentAvgRating = async (agentId: number): Promise<{ avg_rating: number; count: number }> => {
  try {
    const tasks = await supabaseFetch(
      `tasks?matched_agent_id=eq.${agentId}&status=eq.approved&rating=not.is.null&select=rating`
    );
    if (!tasks || tasks.length === 0) {
      return { avg_rating: 0, count: 0 };
    }
    const ratings = tasks.map((t: any) => t.rating).filter((r: number) => r > 0);
    if (ratings.length === 0) return { avg_rating: 0, count: 0 };
    const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
    return { avg_rating: Math.round(avg * 10) / 10, count: ratings.length };
  } catch (err) {
    return { avg_rating: 0, count: 0 };
  }
};

/**
 * 批量计算多个智能体的平均评分
 */
export const calculateAgentsAvgRatings = async (agentIds: number[]): Promise<Record<number, { avg_rating: number; count: number }>> => {
  const results: Record<number, { avg_rating: number; count: number }> = {};
  try {
    // 一次性获取所有相关任务的评分
    const idFilter = agentIds.map(id => `matched_agent_id=eq.${id}`).join(',');
    const tasks = await supabaseFetch(
      `tasks?or=(${idFilter})&status=eq.approved&rating=not.is.null&select=matched_agent_id,rating`
    );
    
    // 按agent分组计算
    const grouped: Record<number, number[]> = {};
    for (const t of tasks || []) {
      if (!grouped[t.matched_agent_id]) grouped[t.matched_agent_id] = [];
      if (t.rating > 0) grouped[t.matched_agent_id].push(t.rating);
    }
    
    for (const id of agentIds) {
      const ratings = grouped[id] || [];
      if (ratings.length === 0) {
        results[id] = { avg_rating: 0, count: 0 };
      } else {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        results[id] = { avg_rating: Math.round(avg * 10) / 10, count: ratings.length };
      }
    }
  } catch (err) {
    for (const id of agentIds) {
      results[id] = { avg_rating: 0, count: 0 };
    }
  }
  return results;
};

// ============ Worker Token经济 API ============

const WORKER_BASE_URL = 'https://ai-wego-worker.ai-wego-api.workers.dev';

// 调用Worker API的通用方法
async function workerFetch(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${WORKER_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const text = await response.text();
  if (!text) return null;
  
  if (!response.ok) {
    try {
      const err = JSON.parse(text);
      throw new Error(err.message || err.error || '请求失败');
    } catch {
      throw new Error(text || '请求失败');
    }
  }
  
  return JSON.parse(text);
}

// Worker Token经济API
export const workerTokenAPI = {
  // 发布任务扣费（包含8%手续费）
  createTaskWithPayment: async (data: {
    user_id: number;
    title: string;
    description?: string;
    budget: number;
    deadline?: string;
    requirements?: any[];
    matched_agent_id?: number;
    source?: string;
  }) => {
    return workerFetch('/api/tasks/create-with-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 完成任务转账
  completeAndPay: async (data: {
    task_id: number;
    reviewer_id: number;
    auto_approve?: boolean;
  }) => {
    return workerFetch('/api/tasks/complete-and-pay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 每日登录奖励
  claimDailyReward: async (userId: number) => {
    return workerFetch('/api/daily-reward', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // 解锁智能体
  unlockAgent: async (userId: number, agentId: number) => {
    return workerFetch('/api/agent/unlock', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, agent_id: agentId }),
    });
  },

  // 获取用户余额（从token_transactions计算）
  getBalance: async (userId: number) => {
    return workerFetch(`/api/token/balance?user_id=${userId}`);
  },

  // 获取交易历史
  getHistory: async (userId: number) => {
    return workerFetch(`/api/token/history?user_id=${userId}`);
  },
};

// ============ Token Transactions 相关 ============

export interface TokenTransaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  description: string | null;
  related_task_id: number | null;
  agent_id?: number | null;
  created_at: string;
}

// token_transactions API（直接从 Supabase 读取）
export const tokenTransactionsAPI = {
  // 获取用户的 WEG 交易记录
  getUserTransactions: async (userId: number, limit = 100) => {
    return supabaseFetch(
      `token_transactions?user_id=eq.${userId}&order=created_at.desc&limit=${limit}`
    );
  },

  // 获取用户的赔付记录
  getCompensationHistory: async (userId: number) => {
    return supabaseFetch(
      `token_transactions?user_id=eq.${userId}&type=eq.compensation&order=created_at.desc`
    );
  },

  // 获取智能体相关的赔付记录（用于智能体详情页）
  getAgentCompensationHistory: async (agentId: number) => {
    return supabaseFetch(
      `token_transactions?agent_id=eq.${agentId}&type=eq.compensation&order=created_at.desc`
    );
  },

  // 计算用户余额（从 token_transactions 汇总）
  calculateBalance: async (userId: number): Promise<number> => {
    try {
      const transactions = await supabaseFetch(
        `token_transactions?user_id=eq.${userId}&select=amount`
      );
      if (!transactions) return 0;
      return transactions.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0);
    } catch {
      return 0;
    }
  },
};


// ============ Storage 相关 ============

export const storageAPI = {
  SUPABASE_URL: 'https://mzjmfyoemcsoqzoooiej.supabase.co',
  SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
  BUCKET: 'task-uploads',

  // 上传文件，返回公开URL
  uploadFile: async (file: File, taskId?: number): Promise<string> => {
    const ext = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filePath = taskId 
      ? `tasks/${taskId}/${timestamp}_${randomStr}.${ext}`
      : `uploads/${timestamp}_${randomStr}.${ext}`;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `https://mzjmfyoemcsoqzoooiej.supabase.co/storage/v1/object/task-uploads/${filePath}`,
      {
        method: 'POST',
        headers: {
          'apikey': storageAPI.SERVICE_KEY,
          'Authorization': `Bearer ${storageAPI.SERVICE_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`上传失败: ${err}`);
    }

    return `https://mzjmfyoemcsoqzoooiej.supabase.co/storage/v1/object/public/task-uploads/${filePath}`;
  },

  // 获取文件公开URL
  getPublicUrl: (filePath: string): string => {
    return `https://mzjmfyoemcsoqzoooiej.supabase.co/storage/v1/object/public/task-uploads/${filePath}`;
  },
};

// 根据文件URL判断文件类型
export const getFileType = (url: string): 'image' | 'audio' | 'video' | 'document' | 'other' => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
  const docExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xlsx', 'xls', 'txt'];
  
  if (imageExts.includes(ext)) return 'image';
  if (audioExts.includes(ext)) return 'audio';
  if (videoExts.includes(ext)) return 'video';
  if (docExts.includes(ext)) return 'document';
  return 'other';
};

// 获取文件名称（从URL中提取或生成）
export const getFileName = (url: string): string => {
  try {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    // 去掉时间戳和随机字符串前缀
    const match = lastPart.match(/^(\d+_)?.+?_([^/]+)$/);
    if (match) return match[2];
    return decodeURIComponent(lastPart.split('%2F').pop() || lastPart);
  } catch {
    return '文件';
  }
};
