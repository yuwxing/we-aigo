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
  }) => {
    return supabaseFetch('tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: data.status || 'open',
        matched_agent_id: data.matched_agent_id || null,
        created_at: new Date().toISOString(),
      }),
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
        token_balance: 100,
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
        token_balance: data.initial_balance || 100,
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
