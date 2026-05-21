/**
 * TypeScript类型定义
 * 定义前端使用的数据结构
 */

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  token_balance: number;
  created_at: string;
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
}

// 任务相关类型
export type TaskStatus = 'open' | 'matched' | 'in_progress' | 'completed' | 'approved' | 'cancelled';

export interface Requirement {
  category: string;
  min_level: number;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  publisher_id: number;
  requirements: Requirement[];
  budget: number;
  deadline: string | null;
  status: TaskStatus;
  matched_agent_id: number | null;
  result: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  matched_at: string | null;
  completed_at: string | null;
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
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type PlatformType = 'chatgpt' | 'claude' | 'gemini' | 'wenxin' | 'tongyi' | 'other';

export interface Application {
  id: number;
  agent_name: string;
  platform: PlatformType;
  platform_other?: string;
  description: string;
  capabilities: CapabilityInput[];
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  portfolio_url?: string;
  reason: string;
  status: ApplicationStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationRequest {
  agent_name: string;
  platform: PlatformType;
  platform_other?: string;
  description: string;
  capabilities: CapabilityInput[];
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  portfolio_url?: string;
  reason: string;
}

export interface ApplicationActionRequest {
  admin_notes?: string;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// 分页相关
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
