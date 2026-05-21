"""
Agent 接入 API 路由模块
为外部智能体提供标准化的任务接入接口
支持通过 API Key 认证，实现任务领取、提交等功能
"""
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.agent import Agent
from app.models.task import Task, TaskStatus

router = APIRouter(prefix="/agent-api", tags=["Agent接入API"])


# ==================== Pydantic 模型定义 ====================

class TaskResponse(BaseModel):
    """任务响应模型（Agent API专用）"""
    id: int
    title: str
    description: Optional[str]
    requirements: List[dict]
    budget: float
    deadline: Optional[str]
    status: str
    created_at: str
    result: Optional[str] = None

    class Config:
        from_attributes = True


class ClaimResponse(BaseModel):
    """领取任务响应"""
    success: bool
    message: str
    task: TaskResponse


class SubmitRequest(BaseModel):
    """提交任务结果请求"""
    result: str = Field(..., description="执行结果文本")
    tokens_used: int = Field(0, ge=0, description="使用的Token数量")


class SubmitResponse(BaseModel):
    """提交任务结果响应"""
    success: bool
    message: str
    task_id: int
    status: str


class MyTaskResponse(BaseModel):
    """我的任务响应"""
    id: int
    title: str
    status: str
    budget: float
    created_at: str
    matched_at: Optional[str]
    completed_at: Optional[str]
    result: Optional[str]

    class Config:
        from_attributes = True


class BalanceResponse(BaseModel):
    """余额查询响应"""
    agent_id: int
    name: str
    token_balance: float
    total_tasks: int
    completed_tasks: int
    success_rate: float


class GenerateKeyRequest(BaseModel):
    """生成API Key请求"""
    agent_id: int = Field(..., description="智能体ID")
    agent_name: str = Field(..., description="智能体名称")


class GenerateKeyResponse(BaseModel):
    """生成API Key响应"""
    agent_id: int
    api_key: str
    message: str


class ErrorResponse(BaseModel):
    """错误响应"""
    detail: str


# ==================== 辅助函数 ====================

def _task_to_response(task: Task) -> TaskResponse:
    """将Task模型转换为Agent API响应模型"""
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        requirements=task.requirements or [],
        budget=task.budget,
        deadline=task.deadline.isoformat() if task.deadline else None,
        status=task.status,
        created_at=task.created_at.isoformat() if task.created_at else None,
        result=task.result
    )


def verify_api_key(api_key: str, db: Session) -> Agent:
    """
    验证 API Key 并返回对应的 Agent
    
    Args:
        api_key: API Key
        db: 数据库会话
        
    Returns:
        Agent 实例
        
    Raises:
        HTTPException: API Key 无效
    """
    if not api_key:
        raise HTTPException(status_code=401, detail="缺少 API Key")
    
    agent = db.query(Agent).filter(Agent.api_key == api_key).first()
    if not agent:
        raise HTTPException(status_code=401, detail="无效的 API Key")
    
    return agent


# ==================== API 端点 ====================

@router.get("/tasks", response_model=List[TaskResponse])
def get_available_tasks(
    category: Optional[str] = Query(None, description="按能力类别筛选"),
    min_budget: Optional[float] = Query(None, description="最低预算"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    x_agent_api_key: str = Header(..., description="Agent API Key"),
    db: Session = Depends(get_db)
):
    """
    获取可用任务列表
    
    返回所有状态为 open（开放）的任务，Agent 可以领取这些任务。
    
    **认证**: 通过 X-Agent-API-Key header 传递 API Key
    
    **筛选参数**:
    - `category`: 按能力类别筛选（如"编程"、"写作"、"设计"）
    - `min_budget`: 筛选预算不低于此值的任务
    - `limit`: 返回任务数量上限，默认50条
    
    **返回示例**:
    ```json
    [
        {
            "id": 1,
            "title": "写一篇产品介绍文章",
            "description": "需要一篇关于智能助手的介绍",
            "requirements": [{"category": "写作", "min_level": 3}],
            "budget": 50.0,
            "deadline": "2024-12-31T23:59:59",
            "status": "open",
            "created_at": "2024-01-01T00:00:00",
            "result": null
        }
    ]
    ```
    """
    # 验证 API Key
    agent = verify_api_key(x_agent_api_key, db)
    
    # 查询开放状态的任务
    query = db.query(Task).filter(Task.status == TaskStatus.OPEN.value)
    
    # 按能力类别筛选（如果指定）
    if category:
        # 在 requirements JSON 中搜索类别
        query = query.filter(Task.requirements.op('->>')('category').like(f'%{category}%'))
    
    # 按最低预算筛选
    if min_budget is not None:
        query = query.filter(Task.budget >= min_budget)
    
    # 按创建时间倒序，限制返回数量
    tasks = query.order_by(Task.created_at.desc()).limit(limit).all()
    
    return [_task_to_response(task) for task in tasks]


@router.post("/tasks/{task_id}/claim", response_model=ClaimResponse)
def claim_task(
    task_id: int,
    x_agent_api_key: str = Header(..., description="Agent API Key"),
    db: Session = Depends(get_db)
):
    """
    领取任务
    
    Agent 通过此接口领取一个开放状态的任务。任务将被分配给该 Agent，
    状态从 open 变为 matched。
    
    **认证**: 通过 X-Agent-API-Key header 传递 API Key
    
    **业务规则**:
    1. 任务必须处于 open 状态
    2. 领取后任务状态变为 matched
    3. matched_at 时间戳被记录
    
    **返回示例**:
    ```json
    {
        "success": true,
        "message": "任务领取成功",
        "task": {
            "id": 1,
            "title": "写一篇产品介绍文章",
            "status": "matched",
            ...
        }
    }
    ```
    """
    # 验证 API Key
    agent = verify_api_key(x_agent_api_key, db)
    
    # 获取任务
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    # 验证任务状态
    if task.status != TaskStatus.OPEN.value:
        raise HTTPException(
            status_code=400, 
            detail=f"任务状态不是开放状态，当前状态: {task.status}"
        )
    
    # 领取任务
    task.matched_agent_id = agent.id
    task.status = TaskStatus.MATCHED.value
    task.matched_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    
    return ClaimResponse(
        success=True,
        message="任务领取成功",
        task=_task_to_response(task)
    )


@router.post("/tasks/{task_id}/submit", response_model=SubmitResponse)
def submit_task_result(
    task_id: int,
    submit_data: SubmitRequest,
    x_agent_api_key: str = Header(..., description="Agent API Key"),
    db: Session = Depends(get_db)
):
    """
    提交任务结果
    
    Agent 完成执行后，通过此接口提交任务结果。
    
    **认证**: 通过 X-Agent-API-Key header 传递 API Key
    
    **请求体**:
    ```json
    {
        "result": "这里是执行结果的详细描述...",
        "tokens_used": 500
    }
    ```
    
    **业务规则**:
    1. 任务必须属于当前 Agent（matched_agent_id 匹配）
    2. 任务状态必须为 matched 或 in_progress
    3. 提交后状态变为 completed
    4. submitted_at 时间戳被记录
    
    **返回示例**:
    ```json
    {
        "success": true,
        "message": "结果提交成功",
        "task_id": 1,
        "status": "completed"
    }
    ```
    """
    # 验证 API Key
    agent = verify_api_key(x_agent_api_key, db)
    
    # 获取任务
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    # 验证任务属于该 Agent
    if task.matched_agent_id != agent.id:
        raise HTTPException(status_code=403, detail="该任务不属于当前 Agent")
    
    # 验证任务状态
    if task.status not in [TaskStatus.MATCHED.value, TaskStatus.IN_PROGRESS.value]:
        raise HTTPException(
            status_code=400,
            detail=f"任务状态不允许提交结果，当前状态: {task.status}"
        )
    
    # 更新任务结果
    task.result = submit_data.result
    task.status = TaskStatus.COMPLETED.value
    task.submitted_at = datetime.utcnow()
    
    # 更新 Agent 统计数据
    agent.total_tasks += 1
    
    db.commit()
    db.refresh(task)
    
    return SubmitResponse(
        success=True,
        message="结果提交成功",
        task_id=task.id,
        status=task.status
    )


@router.get("/my-tasks", response_model=List[MyTaskResponse])
def get_my_tasks(
    status: Optional[str] = Query(None, description="按状态筛选"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    x_agent_api_key: str = Header(..., description="Agent API Key"),
    db: Session = Depends(get_db)
):
    """
    查看我的任务
    
    获取当前 Agent（通过 API Key 识别）已接取的所有任务。
    
    **认证**: 通过 X-Agent-API-Key header 传递 API Key
    
    **筛选参数**:
    - `status`: 按状态筛选（open/matched/in_progress/completed/approved/cancelled）
    - `limit`: 返回任务数量上限，默认50条
    
    **返回示例**:
    ```json
    [
        {
            "id": 1,
            "title": "写一篇产品介绍文章",
            "status": "matched",
            "budget": 50.0,
            "created_at": "2024-01-01T00:00:00",
            "matched_at": "2024-01-02T10:00:00",
            "completed_at": null,
            "result": null
        }
    ]
    ```
    """
    # 验证 API Key
    agent = verify_api_key(x_agent_api_key, db)
    
    # 查询该 Agent 的任务
    query = db.query(Task).filter(Task.matched_agent_id == agent.id)
    
    # 按状态筛选
    if status:
        query = query.filter(Task.status == status)
    
    # 按创建时间倒序
    tasks = query.order_by(Task.created_at.desc()).limit(limit).all()
    
    return [
        MyTaskResponse(
            id=task.id,
            title=task.title,
            status=task.status,
            budget=task.budget,
            created_at=task.created_at.isoformat() if task.created_at else None,
            matched_at=task.matched_at.isoformat() if task.matched_at else None,
            completed_at=task.completed_at.isoformat() if task.completed_at else None,
            result=task.result
        )
        for task in tasks
    ]


@router.get("/my-balance", response_model=BalanceResponse)
def get_my_balance(
    x_agent_api_key: str = Header(..., description="Agent API Key"),
    db: Session = Depends(get_db)
):
    """
    查看我的余额
    
    获取当前 Agent 的余额和统计数据。
    
    **认证**: 通过 X-Agent-API-Key header 传递 API Key
    
    **返回示例**:
    ```json
    {
        "agent_id": 1,
        "name": "花仙子",
        "token_balance": 1500.0,
        "total_tasks": 25,
        "completed_tasks": 23,
        "success_rate": 92.0
    }
    ```
    """
    # 验证 API Key
    agent = verify_api_key(x_agent_api_key, db)
    
    return BalanceResponse(
        agent_id=agent.id,
        name=agent.name,
        token_balance=agent.token_balance,
        total_tasks=agent.total_tasks,
        completed_tasks=agent.completed_tasks,
        success_rate=round(agent.success_rate * 100, 2) if agent.success_rate else 0.0
    )


@router.post("/generate-key", response_model=GenerateKeyResponse)
def generate_api_key(
    request: GenerateKeyRequest,
    db: Session = Depends(get_db)
):
    """
    生成 API Key
    
    为指定的 Agent 生成或更新 API Key。
    如果 Agent 已有 API Key，则返回现有 Key（不会重新生成）。
    
    **注意**: 此接口不需要认证，用于首次生成 API Key。
    建议在安全的服务器端环境中调用此接口。
    
    **请求体**:
    ```json
    {
        "agent_id": 1,
        "agent_name": "花仙子"
    }
    ```
    
    **返回示例**:
    ```json
    {
        "agent_id": 1,
        "api_key": "wego_550e8400-e29b-41d4-a716-446655440000",
        "message": "API Key 生成成功"
    }
    ```
    """
    # 验证 Agent 存在
    agent = db.query(Agent).filter(Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="智能体不存在")
    
    # 验证名称匹配（安全检查）
    if agent.name != request.agent_name:
        raise HTTPException(status_code=400, detail="智能体名称不匹配")
    
    # 如果已有 API Key，直接返回
    if agent.api_key:
        return GenerateKeyResponse(
            agent_id=agent.id,
            api_key=agent.api_key,
            message="Agent 已有 API Key"
        )
    
    # 生成新的 API Key（格式: wego_ + UUID）
    api_key = f"wego_{uuid.uuid4()}"
    agent.api_key = api_key
    
    db.commit()
    db.refresh(agent)
    
    return GenerateKeyResponse(
        agent_id=agent.id,
        api_key=api_key,
        message="API Key 生成成功"
    )


@router.get("/health")
def health_check():
    """
    健康检查
    
    用于验证 API 服务是否正常运行。
    不需要认证。
    
    **返回示例**:
    ```json
    {
        "status": "healthy",
        "service": "agent-api"
    }
    ```
    """
    return {"status": "healthy", "service": "agent-api"}
