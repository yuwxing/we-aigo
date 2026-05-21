/**
 * TypeScript类型定义
 * 定义前端使用的数据结构
 */

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'human' | 'agent';
  token_balance: number;
  created_at: string;
}

// 用户注册请求
export interface UserRegisterRequest {
  username: string;
  email: string;
  password?: string;
  user_type: 'human' | 'agent';
}

export interface BalanceResponse {
  user_id: number;
  username: string;
  token_balance: number;
}

// 能力相关类型
export interface Capability {
  category: string;
  level: number;
}

export interface CapabilityInput {
  category: string;
  level: number;
}

// 智能体相关类型
export interface Agent {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  api_key?: string;  // API Key (仅所有者可见)
  capabilities: Capability[];
  total_tasks: number;
  completed_tasks: number;
  success_rate: number;
  avg_rating: number;
  token_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AgentStats {
  agent_id: number;
  total_tasks: number;
  completed_tasks: number;
  success_rate: number;
  avg_rating: number;
  token_balance: number;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  owner_id: number;
  capabilities: CapabilityInput[];
  avatar_url?: string;
  initial_token?: number;
}

// 任务相关类型
export type TaskStatus = 'open' | 'matched' | 'in_progress' | 'completed' | 'approved' | 'cancelled';

export interface Requirement {
  category: string;
  min_level: number;
}

export type DeliveryStatus = 'pending' | 'submitted' | 'accepted' | 'rejected';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  publisher_id: number;
  requirements: Requirement[];
  budget: number;
  deadline: string | null;
  status: TaskStatus;
  delivery_status?: DeliveryStatus;
  matched_agent_id: number | null;
  result: string | null;
  result_url: string | null;
  rating: number | null;
  feedback: string | null;
  settlement_rating: number | null;
  settlement_notes: string | null;
  created_at: string;
  updated_at: string;
  matched_at: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  settled_at: string | null;
  is_archived?: boolean; // 已归档标识
  auto_execute_at?: string | null; // 自动执行时间（AI发现任务专用）
  claimed_by?: number[]; // 认领者ID列表
  max_claimants?: number; // 最大认领人数
  source?: string; // 任务来源：manual/ai_discovered
}

export interface TaskDetails extends Task {
  publisher: {
    id: number;
    username: string;
    email: string;
  };
  agent: {
    id: number;
    name: string;
    capabilities: Capability[];
  } | null;
  executor?: {
    id: number;
    name: string;
    success_rate: number;
    avg_rating: number;
  } | null;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  publisher_id: number;
  requirements: Requirement[];
  budget: number;
  deadline?: string;
}

export interface TaskMatchRequest {
  agent_id: number;
}

export interface TaskApproveRequest {
  rating?: number;
  feedback?: string;
}

export interface TaskAssignRequest {
  agent_id: number;
}

export interface TaskSubmitRequest {
  result: string;
  result_url?: string;
  notes?: string;
}

export interface TaskSettleRequest {
  rating: number;
  notes?: string;
}

export interface TaskExecuteResponse {
  success: boolean;
  result: string;
  tokens_used: number;
  model: string;
}

// 交易相关类型
export interface Transaction {
  id: number;
  from_id: number | null;
  from_type: string | null;
  to_id: number | null;
  to_type: string | null;
  amount: number;
  task_id: number | null;
  type: string;
  description: string | null;
  created_at: string;
}

// 入驻申请相关类型
export interface ApplicationCapability {
  category: string;
  level: number;
}

export interface Application {
  id: number;
  agent_name: string;
  platform: string;
  platform_other?: string;
  description?: string;
  capabilities: ApplicationCapability[];
  level: number;
  contact: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  portfolio_url: string | null;
  introduction: string | null;
  reason?: string;
  notes: string | null;
  admin_notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationRequest {
  agent_name: string;
  platform: string;
  platform_other?: string;
  description?: string;
  capabilities: ApplicationCapability[];
  level?: number;
  contact?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  portfolio_url?: string;
  introduction?: string;
  reason?: string;
}

export interface ApplicationStatusUpdate {
  status?: 'approved' | 'rejected';
  notes?: string;
  admin_notes?: string;
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Agent API Key 相关类型
export interface GenerateKeyRequest {
  agent_id: number;
  agent_name: string;
}

export interface GenerateKeyResponse {
  agent_id: number;
  api_key: string;
  message: string;
}

export interface AgentBalanceResponse {
  agent_id: number;
  name: string;
  token_balance: number;
  total_tasks: number;
  completed_tasks: number;
  success_rate: number;
}

// 分页相关
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ============ 视频搜索相关类型 ============
export interface VideoSearchResult {
  title: string;
  url: string;
  uploader?: string;
  views?: string;
  duration?: string;
  publishTime?: string;
  suitability?: number;
  color?: string;
  thumbnail?: string;
  teachingTips?: string;
  keyTimePoints?: string;
  summary?: string;
}
