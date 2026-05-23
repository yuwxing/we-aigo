/**
 * we-aigo Cloudflare Worker - DeepSeek API 代理 + 任务执行引擎
 * 功能：
 * 1. POST /execute - 直接执行任务
 * 2. POST /api/execute-task - 异步执行任务（后台执行）
 * 3. POST /api/settle-task - 验收结算
 * 4. GET /health - 健康检查
 */

// 定时器超时设置（60秒）
const TIMEOUT_MS = 60000;

// 根据任务标题和描述推断任务类型
function inferTaskType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // 需要视觉产出的任务 - 当前Phase1只能文字交付
  if (text.includes('漫画') || text.includes('插画') || text.includes('海报') || text.includes('图片生成') || text.includes('绘画')) {
    return '视觉创作';
  }
  // 需要音频产出的任务
  if (text.includes('配乐') || text.includes('音乐') || text.includes('音频') || text.includes('语音')) {
    return '音频创作';
  }
  // 需要视频产出的任务
  if (text.includes('视频') || text.includes('剪辑') || text.includes('短视频')) {
    return '视频创作';
  }
  if (text.includes('翻译') || text.includes('英文') || text.includes('英语') || text.includes('外文')) {
    return '翻译润色';
  }
  if (text.includes('学习') || text.includes('辅导') || text.includes('教学') || text.includes('考试') || text.includes('课程')) {
    return '学习辅导';
  }
  if (text.includes('分析') || text.includes('数据') || text.includes('报告') || text.includes('统计')) {
    return '数据分析';
  }
  if (text.includes('创作') || text.includes('写作') || text.includes('文章') || text.includes('文案') || text.includes('诗')) {
    return '内容创作';
  }
  
  return '搜索整理';
}

// 判断当前Phase1的AI能力是否能执行该类型
function canExecuteByAI(taskType: string): boolean {
  const supportedTypes = ['翻译润色', '学习辅导', '数据分析', '内容创作', '搜索整理'];
  return supportedTypes.includes(taskType);
}

// 根据任务类型获取系统提示词
function getSystemPrompt(taskType: string): string {
  const prompts: Record<string, string> = {
    '搜索整理': `你是一个专业的信息搜索和整理助手。用户会给你一个任务描述，你需要：
1. 理解用户需求
2. 基于你的知识库，搜索和整理相关信息
3. 提供结构化的、有价值的答案
4. 包含关键信息点、来源链接（如果适用）
5. 使用清晰的格式输出

请用中文回复，格式清晰，重点突出。`,

    '内容创作': `你是一个专业的内容创作助手。用户会给你一个创作需求，你需要：
1. 理解创作目标和受众
2. 创作高质量、有创意的原创内容
3. 内容要有逻辑性、可读性
4. 根据内容类型调整风格

请用中文创作，内容完整、有价值。`,

    '数据分析': `你是一个专业的数据分析助手。用户会给你一个数据分析任务，你需要：
1. 理解数据和分析目标
2. 提供数据分析思路和方法
3. 解释数据洞察和趋势
4. 给出建议和结论

请用中文回复，分析要专业、逻辑清晰。`,

    '翻译润色': `你是一个专业的翻译和文字润色助手。用户会给你一段文字，你需要：
1. 准确翻译（如需要）
2. 优化语言表达
3. 提升文字质量
4. 保持原意和风格

请用中文回复，翻译/润色结果要专业、自然。`,

    '学习辅导': `你是一个耐心的学习辅导老师。用户会给你一个学习问题，你需要：
1. 理解问题核心
2. 用通俗易懂的方式解释
3. 给出例子帮助理解
4. 提供学习建议

请用中文回复，讲解要清晰、有耐心。`
  };

  return prompts[taskType] || prompts['搜索整理'];
}

// 调用 DeepSeek API
async function callDeepSeek(
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const url = `${baseUrl}/chat/completions`;
  
  const response = await Promise.race([
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    }),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('API 请求超时')), TIMEOUT_MS - 1000)
    )
  ]);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek API 返回空响应');
  }

  return data.choices[0].message.content;
}

// 调用 Supabase REST API（使用 service_role key）
async function supabaseRequest(
  url: string,
  serviceRoleKey: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      ...options.headers
    }
  });
  return response;
}

// ============ 状态映射 ============
// 统一的状态映射，处理旧状态的兼容
const STATUS_MAP: Record<string, string> = {
  'pending': 'pending_match',
  'open': 'pending_match',
  'matched': 'matched',
  'accepted': 'accepted',
  'in_progress': 'in_progress',
  'submitted': 'submitted',
  'completed': 'completed',
  'approved': 'completed',
  'deal': 'completed',
  'cancelled': 'cancelled',
  'rejected': 'arbitration',
  'arbitration': 'arbitration',
  'refunded': 'refunded',
};

function normalizeStatus(status: string): string {
  return STATUS_MAP[status] || status;
}

// ============ 时间线日志 ============
// 创建任务时间线日志
async function createTaskLog(
  supabaseUrl: string,
  serviceRoleKey: string,
  taskId: number,
  actorType: string,
  actorId: number | null,
  action: string,
  content: string,
  metadata?: any
): Promise<void> {
  try {
    const url = `${supabaseUrl}/rest/v1/task_logs`;
    await supabaseRequest(url, serviceRoleKey, 'POST', JSON.stringify({
      task_id: taskId,
      actor_type: actorType,
      actor_id: actorId,
      action,
      content,
      metadata: metadata || null
    }));
  } catch (error) {
    // 日志写入失败不影响主流程，只打印警告
    console.warn(`[Worker] 写入task_log失败:`, error);
  }
}

// 更新任务进度
async function updateTaskProgress(
  supabaseUrl: string,
  serviceRoleKey: string,
  taskId: number,
  progress: number
): Promise<void> {
  try {
    const url = `${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`;
    await supabaseRequest(url, serviceRoleKey, 'PATCH', JSON.stringify({ 
      progress,
      updated_at: new Date().toISOString()
    }));
  } catch (error) {
    console.warn(`[Worker] 更新任务进度失败:`, error);
  }
}

// ============ Agent信誉更新 ============
async function updateAgentReputation(
  supabaseUrl: string,
  serviceRoleKey: string,
  agentId: number,
  success: boolean
): Promise<void> {
  try {
    // 获取当前数据
    const url = `${supabaseUrl}/rest/v1/agents?id=eq.${agentId}&select=incomplete_count,reputation_score&limit=1`;
    const response = await supabaseRequest(url, serviceRoleKey);
    if (!response.ok) return;
    
    const data = await response.json();
    if (!data || data.length === 0) return;
    
    const agent = data[0];
    const currentIncomplete = agent.incomplete_count || 0;
    const currentReputation = agent.reputation_score || 100;
    
    const newIncompleteCount = success ? Math.max(0, currentIncomplete - 1) : currentIncomplete + 1;
    const reputationChange = success ? 5 : -10;
    const newReputation = Math.max(0, Math.min(100, currentReputation + reputationChange));
    
    const patchData: any = {
      incomplete_count: newIncompleteCount,
      reputation_score: newReputation
    };
    
    // 如果失败次数>=3，标记为restricted
    if (newIncompleteCount >= 3) {
      patchData.metadata = { restricted: true, restricted_at: new Date().toISOString() };
    }
    
    await supabaseRequest(url, serviceRoleKey, 'PATCH', JSON.stringify(patchData));
  } catch (error) {
    console.warn(`[Worker] 更新Agent信誉失败:`, error);
  }
}

// ============ 退款计算 ============
function calculateRefund(amount: number, progress: number): number {
  if (progress === 0) return amount; // 未开始100%退款
  if (progress >= 100) return 0; // 已完成不退款
  // 按进度比例退还
  return Math.round(amount * (1 - progress / 100) * 100) / 100;
}

// 更新任务状态
async function updateTaskStatus(
  supabaseUrl: string,
  serviceRoleKey: string,
  taskId: number,
  status: string
): Promise<void> {
  const normalizedStatus = normalizeStatus(status);
  const url = `${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`;
  
  const finalStatuses = ['completed', 'submitted', 'approved', 'deal'];
  
  const response = await supabaseRequest(url, serviceRoleKey, {
    method: 'PATCH',
    body: JSON.stringify({ 
      status: normalizedStatus,
      completed_at: finalStatuses.includes(normalizedStatus) 
        ? new Date().toISOString() : null
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`更新任务状态失败: ${error}`);
  }
}

// 创建交付物记录
async function createDelivery(
  supabaseUrl: string,
  serviceRoleKey: string,
  taskId: number,
  agentId: number,
  content: string
): Promise<void> {
  const url = `${supabaseUrl}/rest/v1/deliveries`;
  
  const response = await supabaseRequest(url, serviceRoleKey, {
    method: 'POST',
    body: JSON.stringify({
      task_id: taskId,
      agent_id: agentId,
      content: content,
      submitted_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`创建交付物失败: ${error}`);
  }
}

// 查询任务详情
async function getTask(supabaseUrl: string, serviceRoleKey: string, taskId: number): Promise<any> {
  const url = `${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}&select=*&limit=1`;
  
  const response = await supabaseRequest(url, serviceRoleKey);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`查询任务失败: ${error}`);
  }
  
  const data = await response.json();
  return data && data.length > 0 ? data[0] : null;
}

// 查询Agent（根据capabilities匹配任务类型）
async function findMatchingAgent(
  supabaseUrl: string, 
  serviceRoleKey: string, 
  taskType: string,
  agentId?: number
): Promise<any | null> {
  // 如果指定了agent_id，直接返回该agent
  if (agentId) {
    const url = `${supabaseUrl}/rest/v1/agents?id=eq.${agentId}&select=*&limit=1`;
    const response = await supabaseRequest(url, serviceRoleKey);
    if (response.ok) {
      const data = await response.json();
      return data && data.length > 0 ? data[0] : null;
    }
  }
  
  // 根据capabilities匹配
  // capabilities存的是中文标签，直接用中文匹配
  const capabilityMap: Record<string, string> = {
    '搜索整理': '搜索整理',
    '内容创作': '内容创作',
    '数据分析': '数据分析',
    '翻译润色': '翻译润色',
    '学习辅导': '学习辅导'
  };
  
  const capability = capabilityMap[taskType] || taskType;
  const url = `${supabaseUrl}/rest/v1/agents?capabilities=cs.{"${capability}"}&select=*&limit=1`;
  
  const response = await supabaseRequest(url, serviceRoleKey);
  if (response.ok) {
    const data = await response.json();
    if (data && data.length > 0) return data[0];
  }
  
  // 降级：返回第一个agent（agents表没有is_active字段）
  const fallbackUrl = `${supabaseUrl}/rest/v1/agents?select=*&limit=1`;
  const fallbackResponse = await supabaseRequest(fallbackUrl, serviceRoleKey);
  if (fallbackResponse.ok) {
    const data = await fallbackResponse.json();
    return data && data.length > 0 ? data[0] : null;
  }
  
  return null;
}

// 查询用户余额
async function getUserBalance(
  supabaseUrl: string, 
  serviceRoleKey: string, 
  userId: number
): Promise<number> {
  const url = `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=balance&limit=1`;
  
  const response = await supabaseRequest(url, serviceRoleKey);
  if (response.ok) {
    const data = await response.json();
    return data && data.length > 0 ? (data[0].balance || 0) : 0;
  }
  return 0;
}

// 更新用户余额
async function updateUserBalance(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: number,
  newBalance: number
): Promise<void> {
  const url = `${supabaseUrl}/rest/v1/users?id=eq.${userId}`;
  
  const response = await supabaseRequest(url, serviceRoleKey, {
    method: 'PATCH',
    body: JSON.stringify({ balance: newBalance })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`更新用户余额失败: ${error}`);
  }
}

// 创建交易记录
async function createTransaction(
  supabaseUrl: string,
  serviceRoleKey: string,
  taskId: number,
  userId: number,
  agentOwnerId: number,
  taskReward: number,
  platformAmount: number,
  agentAmount: number,
  type: string
): Promise<void> {
  const url = `${supabaseUrl}/rest/v1/transactions`;
  
  const response = await supabaseRequest(url, serviceRoleKey, {
    method: 'POST',
    body: JSON.stringify({
      task_id: taskId,
      user_id: userId,
      agent_owner_id: agentOwnerId,
      amount: taskReward,
      platform_amount: platformAmount,
      agent_amount: agentAmount,
      type: type,
      created_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`创建交易记录失败: ${error}`);
  }
}

// 执行任务的主要函数（同步版本）
async function executeTask(request: Request, env: any): Promise<Response> {
  const body = await request.json() as {
    taskId?: number;
    title?: string;
    description?: string;
    taskType?: string;
  };

  const { taskId, title, description, taskType } = body;

  if (!taskId || !title || !description) {
    return new Response(
      JSON.stringify({ error: '缺少必填参数: taskId, title, description' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const deepseekApiKey = env.DEEPSEEK_API_KEY;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;
  const deepseekBaseUrl = env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';

  if (!deepseekApiKey || !supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: '服务端配置不完整' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const taskTypeFinal = taskType || inferTaskType(title, description);
  const systemPrompt = getSystemPrompt(taskTypeFinal);
  const userMessage = `任务标题: ${title}\n\n任务描述: ${description}`;

  console.log(`[Worker] 开始执行任务 #${taskId}: ${title}`);
  console.log(`[Worker] 推断任务类型: ${taskTypeFinal}`);
  
  const result = await callDeepSeek(deepseekApiKey, deepseekBaseUrl, systemPrompt, userMessage);
  
  console.log(`[Worker] 任务 #${taskId} 执行完成`);
  
  const agentId = 1;
  await createDelivery(supabaseUrl, supabaseServiceKey, taskId, agentId, result);
  await updateTaskStatus(supabaseUrl, supabaseServiceKey, taskId, 'completed');

  console.log(`[Worker] 任务 #${taskId} 已标记为完成`);

  return new Response(
    JSON.stringify({
      success: true,
      taskId,
      result,
      taskType: taskTypeFinal,
      message: '任务执行完成'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// 异步执行任务（后台执行）
async function executeTaskAsync(
  taskId: number,
  agentId: number | undefined,
  supabaseUrl: string,
  supabaseServiceKey: string,
  deepseekApiKey: string,
  deepseekBaseUrl: string
): Promise<void> {
  try {
    console.log(`[Worker] 异步执行任务 #${taskId}`);
    
    // 1. 获取任务信息
    const task = await getTask(supabaseUrl, supabaseServiceKey, taskId);
    if (!task) {
      console.error(`[Worker] 任务 #${taskId} 不存在`);
      await updateTaskStatus(supabaseUrl, supabaseServiceKey, taskId, 'failed');
      return;
    }
    
    // 写日志：任务开始
    await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "system", null, "task_started", `任务已创建，等待智能体执行`);
    
    // 2. 根据任务类型匹配agent
    const taskType = inferTaskType(task.title || '', task.description || '');
    const agent = await findMatchingAgent(supabaseUrl, supabaseServiceKey, taskType, agentId);
    
    if (!agent) {
      console.error(`[Worker] 未找到匹配的Agent`);
      await updateTaskStatus(supabaseUrl, supabaseServiceKey, taskId, 'failed');
      await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "system", null, "agent_not_found", `未找到匹配的智能体`);
      return;
    }
    
    console.log(`[Worker] 匹配到Agent #${agent.id}: ${agent.name}`);
    
    // 写日志：已匹配智能体
    await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "system", null, "agent_matched", `已匹配智能体: ${agent.name}`, { agent_id: agent.id, agent_name: agent.name });
    
    // 2.5 更新task的matched_agent_id
    const matchUrl = `${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`;
    await supabaseRequest(matchUrl, supabaseServiceKey, 'PATCH', JSON.stringify({
      matched_agent_id: agent.id,
      status: 'in_progress'
    }));
    
    // 写日志：智能体接单
    await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "agent", agent.id, "accepted", `智能体已接单，开始执行任务`);
    await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "system", null, "progress_update", `正在分析需求...`, { progress: 20 });
    await updateTaskProgress(supabaseUrl, supabaseServiceKey, taskId, 20);
    
    // 3. 构造system prompt
    const systemPrompt = getSystemPrompt(taskType);
    const userMessage = `任务标题: ${task.title || ''}\n\n任务描述: ${task.description || ''}`;
    
    // 写日志：正在搜索
    await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "system", null, "progress_update", `正在搜索和整理信息...`, { progress: 50 });
    await updateTaskProgress(supabaseUrl, supabaseServiceKey, taskId, 50);
    
    // 4. 调用DeepSeek API
    const result = await callDeepSeek(deepseekApiKey, deepseekBaseUrl, systemPrompt, userMessage);
    
    console.log(`[Worker] 任务 #${taskId} AI执行完成`);
    
    // 写日志：正在生成内容
    await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "system", null, "progress_update", `正在生成交付内容...`, { progress: 80 });
    await updateTaskProgress(supabaseUrl, supabaseServiceKey, taskId, 80);
    
    // 5. 写入deliveries表
    await createDelivery(supabaseUrl, supabaseServiceKey, taskId, agent.id, result);
    
    // 6. 更新任务状态为submitted
    await updateTaskStatus(supabaseUrl, supabaseServiceKey, taskId, 'submitted');
    await updateTaskProgress(supabaseUrl, supabaseServiceKey, taskId, 100);
    
    // 写日志：任务完成
    await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "agent", agent.id, "delivery_submitted", `任务执行完成，已提交交付物`);
    
    // 更新Agent信誉（成功）
    await updateAgentReputation(supabaseUrl, supabaseServiceKey, agent.id, true);
    
    console.log(`[Worker] 任务 #${taskId} 已标记为submitted`);
  } catch (error) {
    console.error(`[Worker] 异步执行任务 #${taskId} 失败:`, error);
    await updateTaskStatus(supabaseUrl, supabaseServiceKey, taskId, 'failed');
    
    // 获取agent更新信誉
    const task = await getTask(supabaseUrl, supabaseServiceKey, taskId);
    if (task && task.matched_agent_id) {
      await updateAgentReputation(supabaseUrl, supabaseServiceKey, task.matched_agent_id, false);
      await createTaskLog(supabaseUrl, supabaseServiceKey, taskId, "system", null, "execution_failed", `任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 异步任务执行入口
async function executeTaskAsyncHandler(request: Request, env: any, ctx: any): Promise<Response> {
  const body = await request.json() as {
    task_id?: number;
    agent_id?: number;
  };

  const { task_id, agent_id } = body;

  if (!task_id) {
    return new Response(
      JSON.stringify({ error: '缺少必填参数: task_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;
  const deepseekApiKey = env.DEEPSEEK_API_KEY;
  const deepseekBaseUrl = env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';

  if (!deepseekApiKey || !supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: '服务端配置不完整' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 先获取任务信息，判断AI能否执行
  const taskInfo = await getTask(supabaseUrl, supabaseServiceKey, task_id);
  if (!taskInfo) {
    return new Response(
      JSON.stringify({ error: '任务不存在' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const taskType = inferTaskType(taskInfo.title || '', taskInfo.description || '');
  
  // 检查AI能力是否能执行该类型任务
  if (!canExecuteByAI(taskType)) {
    // 更新状态为pending_match，等待有能力的Agent接单
    await updateTaskStatus(supabaseUrl, supabaseServiceKey, task_id, 'pending_match');
    return new Response(
      JSON.stringify({
        success: false,
        status: 'pending_match',
        message: `当前AI暂不支持「${taskType}」类任务，任务已回到等待匹配状态，需要人工或高级Agent接单`,
        task_id,
        task_type: taskType
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 立即更新任务状态为 matched（表示已被接收，后台开始执行）
  await updateTaskStatus(supabaseUrl, supabaseServiceKey, task_id, 'matched');
  
  // 使用 ctx.waitUntil 在后台执行
  ctx.waitUntil(executeTaskAsync(
    task_id,
    agent_id,
    supabaseUrl,
    supabaseServiceKey,
    deepseekApiKey,
    deepseekBaseUrl
  ));

  // 立即返回
  return new Response(
    JSON.stringify({
      success: true,
      status: 'matched',
      message: '任务已接收，智能体正在执行中',
      task_id
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// 验收结算
async function settleTaskHandler(request: Request, env: any): Promise<Response> {
  const body = await request.json() as {
    task_id?: number;
    rating?: number;
    feedback?: string;
  };

  const { task_id, rating = 5, feedback } = body;

  if (!task_id) {
    return new Response(
      JSON.stringify({ error: '缺少必填参数: task_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: '服务端配置不完整' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. 获取任务信息
    const task = await getTask(supabaseUrl, supabaseServiceKey, task_id);
    if (!task) {
      return new Response(
        JSON.stringify({ error: '任务不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 验证任务状态
    if (task.status !== 'submitted') {
      return new Response(
        JSON.stringify({ error: `任务状态不是submitted，当前状态: ${task.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 更新任务状态为 approved
    await updateTaskStatus(supabaseUrl, supabaseServiceKey, task_id, 'approved');

    // 4. Token结算：平台抽成20%，agent_owner得80%
    const taskReward = task.budget || 10;
    const platformAmount = Math.round(taskReward * 0.2 * 100) / 100;
    const agentAmount = Math.round(taskReward * 0.8 * 100) / 100;

    // 5. 获取Agent owner信息
    const agentUrl = `${supabaseUrl}/rest/v1/agents?id=eq.${task.matched_agent_id}&select=owner_id&limit=1`;
    const agentResponse = await supabaseRequest(agentUrl, supabaseServiceKey);
    const agentData = await agentResponse.json();
    const agentOwnerId = agentData && agentData.length > 0 ? agentData[0].owner_id : null;

    // 6. 更新用户余额（扣除任务奖励）
    const currentBalance = await getUserBalance(supabaseUrl, supabaseServiceKey, task.user_id);
    const newBalance = currentBalance - taskReward;
    
    if (newBalance < 0) {
      return new Response(
        JSON.stringify({ error: '用户余额不足' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    await updateUserBalance(supabaseUrl, supabaseServiceKey, task.user_id, newBalance);

    // 7. 如果有agent_owner，给其增加收益（实际项目中可能需要单独的钱包表）
    if (agentOwnerId) {
      const ownerBalance = await getUserBalance(supabaseUrl, supabaseServiceKey, agentOwnerId);
      await updateUserBalance(supabaseUrl, supabaseServiceKey, agentOwnerId, ownerBalance + agentAmount);
    }

    // 8. 写入transactions记录
    await createTransaction(
      supabaseUrl,
      supabaseServiceKey,
      task_id,
      task.user_id,
      agentOwnerId || 0,
      taskReward,
      platformAmount,
      agentAmount,
      'task_settlement'
    );

    console.log(`[Worker] 任务 #${task_id} 结算完成: 奖励=${taskReward}, 平台=${platformAmount}, Agent=${agentAmount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '任务验收结算完成',
        settlement: {
          task_id,
          task_reward: taskReward,
          platform_amount: platformAmount,
          agent_amount: agentAmount,
          rating,
          feedback
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[Worker] 结算任务 #${task_id} 失败:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 主请求处理
async function handleRequest(request: Request, env: any, ctx?: any): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // POST /execute - 直接执行任务（同步）
  if (path === '/execute' && request.method === 'POST') {
    try {
      return await executeTask(request, env);
    } catch (error) {
      console.error('[Worker] 执行错误:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // POST /api/execute-task - 异步执行任务
  if (path === '/api/execute-task' && request.method === 'POST') {
    try {
      return await executeTaskAsyncHandler(request, env, ctx);
    } catch (error) {
      console.error('[Worker] 异步任务提交错误:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // POST /api/settle-task - 验收结算
  if (path === '/api/settle-task' && request.method === 'POST') {
    try {
      return await settleTaskHandler(request, env);
    } catch (error) {
      console.error('[Worker] 结算错误:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

// 取消任务处理器
async function cancelTaskHandler(request: Request, env: any): Promise<Response> {
  const body = await request.json() as {
    task_id?: number;
  };

  const { task_id } = body;

  if (!task_id) {
    return new Response(
      JSON.stringify({ error: '缺少必填参数: task_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: '服务端配置不完整' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. 获取任务信息
    const task = await getTask(supabaseUrl, supabaseServiceKey, task_id);
    if (!task) {
      return new Response(
        JSON.stringify({ error: '任务不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 检查任务状态（只有pending_match/matched/in_progress可以取消）
    const cancellableStatuses = ['pending_match', 'matched', 'in_progress', 'open', 'pending'];
    const normalizedStatus = normalizeStatus(task.status);
    if (!cancellableStatuses.includes(normalizedStatus)) {
      return new Response(
        JSON.stringify({ error: `任务状态不允许取消，当前状态: ${task.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 计算退款金额
    const amount = task.budget || 10;
    const progress = task.progress || 0;
    const refundAmount = calculateRefund(amount, progress);

    // 4. 退回用户余额
    const currentBalance = await getUserBalance(supabaseUrl, supabaseServiceKey, task.user_id);
    await updateUserBalance(supabaseUrl, supabaseServiceKey, task.user_id, currentBalance + refundAmount);

    // 5. 更新任务状态
    await updateTaskStatus(supabaseUrl, supabaseServiceKey, task_id, 'cancelled');
    
    // 更新refund_amount
    const updateUrl = `${supabaseUrl}/rest/v1/tasks?id=eq.${task_id}`;
    await supabaseRequest(updateUrl, supabaseServiceKey, 'PATCH', JSON.stringify({ 
      refund_amount: refundAmount 
    }));

    // 6. 写日志
    await createTaskLog(supabaseUrl, supabaseServiceKey, task_id, "user", task.user_id, "task_cancelled", `用户取消任务`);
    await createTaskLog(supabaseUrl, supabaseServiceKey, task_id, "system", null, "refund_processed", `已退款 ${refundAmount} Token`, { original_amount: amount, refund_amount: refundAmount, progress_at_cancel: progress });

    console.log(`[Worker] 任务 #${task_id} 已取消，退款 ${refundAmount} Token`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '任务取消成功',
        refund: {
          task_id,
          original_amount: amount,
          refund_amount: refundAmount,
          progress_at_cancel: progress
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[Worker] 取消任务 #${task_id} 失败:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 获取任务时间线
async function getTaskLogsHandler(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const taskId = url.searchParams.get('task_id');

  if (!taskId) {
    return new Response(
      JSON.stringify({ error: '缺少参数: task_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: '服务端配置不完整' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const logsUrl = `${supabaseUrl}/rest/v1/task_logs?task_id=eq.${taskId}&order=created_at.asc`;
    const response = await supabaseRequest(logsUrl, supabaseServiceKey);
    
    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `获取时间线失败: ${error}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const logs = await response.json();
    return new Response(
      JSON.stringify(logs),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[Worker] 获取任务时间线失败:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

  // POST /api/cancel-task - 取消任务
  if (path === '/api/cancel-task' && request.method === 'POST') {
    try {
      return await cancelTaskHandler(request, env);
    } catch (error) {
      console.error('[Worker] 取消任务错误:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // GET /api/task-logs - 获取任务时间线
  if (path === '/api/task-logs' && request.method === 'GET') {
    try {
      return await getTaskLogsHandler(request, env);
    } catch (error) {
      console.error('[Worker] 获取时间线错误:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // 健康检查
  if (path === '/health' && request.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 默认返回路由信息
  return new Response(
    JSON.stringify({ 
      message: 'we-aigo Worker API',
      routes: [
        'POST /execute',
        'POST /api/execute-task',
        'POST /api/settle-task',
        'POST /api/cancel-task',
        'GET /api/task-logs',
        'GET /health'
      ]
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 导出处理函数
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  }
};
