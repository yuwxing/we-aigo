"""
任务路由模块
处理任务相关的API请求
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.database import get_db
from app.services.task_service import TaskService
from app.models.task import TaskStatus

router = APIRouter(prefix="/tasks", tags=["任务市场"])


# Pydantic模型定义
class RequirementInput(BaseModel):
    """能力要求输入模型"""
    category: str = Field(..., description="能力类别")
    min_level: int = Field(1, ge=1, le=10, description="最低等级要求")


class TaskCreate(BaseModel):
    """任务创建请求模型"""
    title: str = Field(..., max_length=200, description="任务标题")
    description: Optional[str] = Field(None, description="任务详细描述")
    publisher_id: int = Field(..., description="发布者用户ID")
    requirements: List[RequirementInput] = Field(default_factory=list, description="能力要求")
    budget: float = Field(..., gt=0, description="Token预算")
    deadline: Optional[datetime] = Field(None, description="截止时间")


class TaskMatchRequest(BaseModel):
    """任务匹配请求模型"""
    agent_id: int = Field(..., description="要匹配的智能体ID")


class TaskApproveRequest(BaseModel):
    """任务验收请求模型"""
    rating: int = Field(5, ge=1, le=5, description="评分 1-5")
    feedback: Optional[str] = Field(None, description="反馈意见")


class TaskExecuteResponse(BaseModel):
    """任务执行响应模型"""
    success: bool
    result: str
    tokens_used: int
    model: str


class TaskResponse(BaseModel):
    """任务响应模型"""
    id: int
    title: str
    description: Optional[str]
    publisher_id: int
    requirements: List[dict]
    budget: float
    deadline: Optional[datetime]
    status: str
    matched_agent_id: Optional[int]
    result: Optional[str]
    rating: Optional[int]
    feedback: Optional[str]
    created_at: str
    updated_at: str
    matched_at: Optional[str]
    completed_at: Optional[str]
    submitted_at: Optional[str]
    settled_at: Optional[str]
    delivery_status: Optional[str]
    result_url: Optional[str]
    settlement_rating: Optional[int]
    settlement_notes: Optional[str]

    class Config:
        from_attributes = True


def _task_to_response(task) -> TaskResponse:
    """将Task模型转换为响应模型"""
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        publisher_id=task.publisher_id,
        requirements=task.requirements or [],
        budget=task.budget,
        deadline=task.deadline,
        status=task.status,
        matched_agent_id=task.matched_agent_id,
        result=task.result,
        rating=task.rating,
        feedback=task.feedback,
        created_at=task.created_at.isoformat() if task.created_at else None,
        updated_at=task.updated_at.isoformat() if task.updated_at else None,
        matched_at=task.matched_at.isoformat() if task.matched_at else None,
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
        submitted_at=task.submitted_at.isoformat() if task.submitted_at else None,
        settled_at=task.settled_at.isoformat() if task.settled_at else None,
        delivery_status=task.delivery_status or "pending",
        result_url=task.result_url,
        settlement_rating=task.settlement_rating,
        settlement_notes=task.settlement_notes
    )


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    """
    发布新任务
    
    Args:
        task_data: 任务数据
        db: 数据库会话
        
    Returns:
        创建的任务信息
    """
    try:
        requirements = [
            {"category": req.category, "min_level": req.min_level}
            for req in task_data.requirements
        ]
        
        task = TaskService.create_task(
            db=db,
            title=task_data.title,
            publisher_id=task_data.publisher_id,
            description=task_data.description,
            requirements=requirements,
            budget=task_data.budget,
            deadline=task_data.deadline
        )
        
        return _task_to_response(task)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None, description="按状态筛选"),
    publisher_id: Optional[int] = Query(None, description="按发布者筛选"),
    matched_agent_id: Optional[int] = Query(None, description="按执行者筛选"),
    db: Session = Depends(get_db)
):
    """
    获取任务列表
    
    支持按状态、发布者、执行者筛选
    """
    tasks = TaskService.get_tasks(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        publisher_id=publisher_id,
        matched_agent_id=matched_agent_id
    )
    
    return [_task_to_response(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """
    获取任务详情
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        
    Returns:
        任务信息
    """
    task = TaskService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return _task_to_response(task)


@router.get("/{task_id}/details")
def get_task_details(task_id: int, db: Session = Depends(get_db)):
    """
    获取任务详情（含关联信息）
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        
    Returns:
        包含发布者和执行者信息的任务详情
    """
    details = TaskService.get_task_with_details(db, task_id)
    if not details:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return details


@router.put("/{task_id}/match", response_model=TaskResponse)
def match_agent_to_task(
    task_id: int,
    match_data: TaskMatchRequest,
    db: Session = Depends(get_db)
):
    """
    为任务匹配智能体
    
    Args:
        task_id: 任务ID
        match_data: 匹配数据（包含agent_id）
        db: 数据库会话
        
    Returns:
        更新后的任务信息
    """
    try:
        task = TaskService.match_agent(
            db=db,
            task_id=task_id,
            agent_id=match_data.agent_id
        )
        return _task_to_response(task)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{task_id}/execute", response_model=TaskExecuteResponse)
async def execute_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    执行任务
    
    调用LLM服务执行实际任务内容
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        
    Returns:
        执行结果
    """
    try:
        result = await TaskService.execute_task(db, task_id)
        return TaskExecuteResponse(
            success=result.get("success", True),
            result=result.get("result", ""),
            tokens_used=result.get("tokens_used", 0),
            model=result.get("model", "unknown")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{task_id}/complete", response_model=TaskResponse)
def approve_task(
    task_id: int,
    approve_data: TaskApproveRequest,
    db: Session = Depends(get_db)
):
    """
    验收任务并结算Token
    
    Args:
        task_id: 任务ID
        approve_data: 验收数据（评分、反馈）
        db: 数据库会话
        
    Returns:
        更新后的任务信息
    """
    try:
        task = TaskService.approve_task(
            db=db,
            task_id=task_id,
            rating=approve_data.rating,
            feedback=approve_data.feedback
        )
        return _task_to_response(task)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{task_id}/cancel", response_model=TaskResponse)
def cancel_task(task_id: int, db: Session = Depends(get_db)):
    """
    取消任务并退款
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        
    Returns:
        更新后的任务信息
    """
    try:
        task = TaskService.cancel_task(db, task_id)
        return _task_to_response(task)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{task_id}/reset", response_model=TaskResponse)
def reset_task(task_id: int, db: Session = Depends(get_db)):
    """
    重置任务状态到open（用于修复卡住的任务）
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        
    Returns:
        更新后的任务信息
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    # 只有in_progress状态可以重置
    if task.status not in ["in_progress", "matched"]:
        raise HTTPException(status_code=400, detail=f"任务状态不允许重置，当前状态: {task.status}")
    
    task.status = TaskStatus.OPEN.value
    task.matched_agent_id = None
    task.result = None
    task.matched_at = None
    
    db.commit()
    db.refresh(task)
    return _task_to_response(task)
