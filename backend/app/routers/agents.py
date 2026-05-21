"""
智能体路由模块
处理智能体相关的API请求
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.database import get_db
from app.services.agent_service import AgentService

router = APIRouter(prefix="/agents", tags=["智能体管理"])

# 智能体注册赠送Token
AGENT_REGISTER_BONUS = 15000.0


# Pydantic模型定义
class CapabilityInput(BaseModel):
    """能力输入模型"""
    category: str = Field(..., description="能力类别: 编程/写作/设计/分析")
    level: int = Field(..., ge=1, le=10, description="能力等级 1-10")


class AgentCreate(BaseModel):
    """智能体创建请求模型"""
    name: str = Field(..., max_length=100, description="智能体名称")
    description: Optional[str] = Field(None, description="智能体描述")
    owner_id: int = Field(..., description="所有者用户ID")
    capabilities: List[CapabilityInput] = Field(default_factory=list, description="能力列表")
    avatar_url: Optional[str] = Field(None, description="头像URL")
    initial_token: Optional[float] = Field(None, description="初始Token（可选）")


class AgentUpdate(BaseModel):
    """智能体更新请求模型"""
    name: Optional[str] = None
    description: Optional[str] = None
    capabilities: Optional[List[CapabilityInput]] = None
    avatar_url: Optional[str] = None


class AgentResponse(BaseModel):
    """智能体响应模型"""
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    capabilities: List[dict]
    total_tasks: int
    completed_tasks: int
    success_rate: float
    avg_rating: float
    token_balance: float
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class AgentStatsResponse(BaseModel):
    """智能体统计响应模型"""
    agent_id: int
    total_tasks: int
    completed_tasks: int
    success_rate: float
    avg_rating: float
    token_balance: float


@router.post("/", response_model=AgentResponse, status_code=201)
def create_agent(agent_data: AgentCreate, db: Session = Depends(get_db)):
    """
    注册新智能体
    
    Args:
        agent_data: 智能体数据
        db: 数据库会话
        
    Returns:
        创建的智能体信息
    """
    # 检查名称唯一性
    existing = AgentService.get_agents(db, owner_id=agent_data.owner_id)
    if any(a.name == agent_data.name for a in existing):
        raise HTTPException(status_code=400, detail="智能体名称已存在")
    
    # 转换能力格式
    capabilities = [
        {"category": cap.category, "level": cap.level}
        for cap in agent_data.capabilities
    ]
    
    # 确定初始Token余额
    initial_token = agent_data.initial_token if agent_data.initial_token else AGENT_REGISTER_BONUS
    
    agent = AgentService.create_agent(
        db=db,
        name=agent_data.name,
        owner_id=agent_data.owner_id,
        description=agent_data.description,
        capabilities=capabilities,
        avatar_url=agent_data.avatar_url,
        initial_token=initial_token
    )
    
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        owner_id=agent.owner_id,
        capabilities=agent.capabilities or [],
        total_tasks=agent.total_tasks,
        completed_tasks=agent.completed_tasks,
        success_rate=round(agent.success_rate * 100, 2),
        avg_rating=round(agent.avg_rating, 2),
        token_balance=agent.token_balance,
        created_at=agent.created_at.isoformat(),
        updated_at=agent.updated_at.isoformat()
    )


@router.get("/", response_model=List[AgentResponse])
def list_agents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    owner_id: Optional[int] = Query(None, description="按所有者筛选"),
    category: Optional[str] = Query(None, description="按能力类别筛选"),
    min_level: Optional[int] = Query(None, ge=1, le=10, description="最低能力等级"),
    db: Session = Depends(get_db)
):
    """
    获取智能体列表
    
    支持按所有者、能力类别、最低等级筛选
    """
    agents = AgentService.get_agents(
        db=db,
        skip=skip,
        limit=limit,
        owner_id=owner_id,
        category=category,
        min_level=min_level
    )
    
    return [
        AgentResponse(
            id=a.id,
            name=a.name,
            description=a.description,
            owner_id=a.owner_id,
            capabilities=a.capabilities or [],
            total_tasks=a.total_tasks,
            completed_tasks=a.completed_tasks,
            success_rate=round(a.success_rate * 100, 2),
            avg_rating=round(a.avg_rating, 2),
            token_balance=a.token_balance,
            created_at=a.created_at.isoformat(),
            updated_at=a.updated_at.isoformat()
        )
        for a in agents
    ]


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    """
    获取智能体详情
    
    Args:
        agent_id: 智能体ID
        db: 数据库会话
        
    Returns:
        智能体信息
    """
    agent = AgentService.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="智能体不存在")
    
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        owner_id=agent.owner_id,
        capabilities=agent.capabilities or [],
        total_tasks=agent.total_tasks,
        completed_tasks=agent.completed_tasks,
        success_rate=round(agent.success_rate * 100, 2),
        avg_rating=round(agent.avg_rating, 2),
        token_balance=agent.token_balance,
        created_at=agent.created_at.isoformat(),
        updated_at=agent.updated_at.isoformat()
    )


@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: int,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db)
):
    """
    更新智能体信息
    
    Args:
        agent_id: 智能体ID
        agent_data: 更新数据
        db: 数据库会话
        
    Returns:
        更新后的智能体信息
    """
    update_data = {}
    
    if agent_data.name is not None:
        update_data["name"] = agent_data.name
    if agent_data.description is not None:
        update_data["description"] = agent_data.description
    if agent_data.capabilities is not None:
        update_data["capabilities"] = [
            {"category": cap.category, "level": cap.level}
            for cap in agent_data.capabilities
        ]
    if agent_data.avatar_url is not None:
        update_data["avatar_url"] = agent_data.avatar_url
    
    agent = AgentService.update_agent(db, agent_id, **update_data)
    if not agent:
        raise HTTPException(status_code=404, detail="智能体不存在")
    
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        owner_id=agent.owner_id,
        capabilities=agent.capabilities or [],
        total_tasks=agent.total_tasks,
        completed_tasks=agent.completed_tasks,
        success_rate=round(agent.success_rate * 100, 2),
        avg_rating=round(agent.avg_rating, 2),
        token_balance=agent.token_balance,
        created_at=agent.created_at.isoformat(),
        updated_at=agent.updated_at.isoformat()
    )


@router.get("/{agent_id}/stats", response_model=AgentStatsResponse)
def get_agent_stats(agent_id: int, db: Session = Depends(get_db)):
    """
    获取智能体统计信息
    
    Args:
        agent_id: 智能体ID
        db: 数据库会话
        
    Returns:
        统计信息
    """
    agent = AgentService.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="智能体不存在")
    
    return AgentStatsResponse(
        agent_id=agent.id,
        total_tasks=agent.total_tasks,
        completed_tasks=agent.completed_tasks,
        success_rate=round(agent.success_rate * 100, 2),
        avg_rating=round(agent.avg_rating, 2),
        token_balance=agent.token_balance
    )
