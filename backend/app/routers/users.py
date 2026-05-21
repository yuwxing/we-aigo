"""
用户路由模块
处理用户相关的API请求
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction

router = APIRouter(prefix="/users", tags=["用户管理"])

# 注册奖励Token配置
HUMAN_REGISTER_BONUS = 5000.0  # 人类用户注册赠送
AGENT_REGISTER_BONUS = 15000.0  # 智能体注册赠送


# Pydantic模型定义
class UserCreate(BaseModel):
    """用户创建请求模型"""
    username: str
    email: EmailStr
    password: Optional[str] = None
    user_type: str = "human"  # human 或 agent
    initial_balance: Optional[float] = None  # 可选，不传则使用默认值


class UserRegister(BaseModel):
    """用户注册请求模型（前端专用）"""
    username: str
    email: EmailStr
    password: Optional[str] = None
    user_type: str = "human"  # human 或 agent


class UserResponse(BaseModel):
    """用户响应模型"""
    id: int
    username: str
    email: str
    user_type: str
    token_balance: float
    created_at: str

    class Config:
        from_attributes = True


class BalanceResponse(BaseModel):
    """余额响应模型"""
    user_id: int
    username: str
    token_balance: float


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    创建新用户（通用接口）
    
    Args:
        user_data: 用户数据
        db: 数据库会话
        
    Returns:
        创建的用户信息
    """
    # 检查用户名是否已存在
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    # 检查邮箱是否已存在
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="邮箱已被使用")
    
    # 根据用户类型确定初始Token余额
    if user_data.initial_balance is not None:
        initial_balance = user_data.initial_balance
    elif user_data.user_type == "agent":
        initial_balance = AGENT_REGISTER_BONUS
    else:
        initial_balance = HUMAN_REGISTER_BONUS
    
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        user_type=user_data.user_type,
        token_balance=initial_balance
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        user_type=user.user_type,
        token_balance=user.token_balance,
        created_at=user.created_at.isoformat()
    )


@router.post("/register", response_model=UserResponse, status_code=201)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    用户注册接口（前端专用）
    人类用户赠送5000 Token，智能体用户赠送15000 Token
    
    Args:
        user_data: 注册数据
        db: 数据库会话
        
    Returns:
        创建的用户信息
    """
    # 检查用户名是否已存在
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    # 检查邮箱是否已存在
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="邮箱已被使用")
    
    # 根据用户类型确定初始Token余额
    if user_data.user_type == "agent":
        initial_balance = AGENT_REGISTER_BONUS
    else:
        initial_balance = HUMAN_REGISTER_BONUS
    
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        user_type=user_data.user_type,
        token_balance=initial_balance
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        user_type=user.user_type,
        token_balance=user.token_balance,
        created_at=user.created_at.isoformat()
    )


@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_type: Optional[str] = Query(None, description="按用户类型筛选(human/agent)"),
    db: Session = Depends(get_db)
):
    """
    获取用户列表
    
    Args:
        skip: 跳过数量
        limit: 返回数量
        user_type: 按用户类型筛选
        db: 数据库会话
        
    Returns:
        用户列表
    """
    query = db.query(User)
    
    if user_type:
        query = query.filter(User.user_type == user_type)
    
    users = query.offset(skip).limit(limit).all()
    return [
        UserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            user_type=u.user_type,
            token_balance=u.token_balance,
            created_at=u.created_at.isoformat()
        )
        for u in users
    ]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    获取用户详情
    
    Args:
        user_id: 用户ID
        db: 数据库会话
        
    Returns:
        用户信息
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        user_type=user.user_type,
        token_balance=user.token_balance,
        created_at=user.created_at.isoformat()
    )


@router.get("/{user_id}/balance", response_model=BalanceResponse)
def get_user_balance(user_id: int, db: Session = Depends(get_db)):
    """
    获取用户Token余额
    
    Args:
        user_id: 用户ID
        db: 数据库会话
        
    Returns:
        余额信息
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return BalanceResponse(
        user_id=user.id,
        username=user.username,
        token_balance=user.token_balance
    )


@router.get("/{user_id}/transactions", response_model=List[dict])
def get_user_transactions(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    获取用户交易记录
    
    Args:
        user_id: 用户ID
        skip: 跳过数量
        limit: 返回数量
        db: 数据库会话
        
    Returns:
        交易记录列表
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "type": t.type,
            "amount": t.amount,
            "balance_after": t.balance_after,
            "description": t.description,
            "created_at": t.created_at.isoformat()
        }
        for t in transactions
    ]


@router.post("/users/{user_id}/compensate")
async def compensate_user(user_id: int, amount: int = 1000, reason: str = "平台赔付"):
    """给用户赔付Token"""
    from app.database import get_db
    from app.models.user import User
    from app.models.transaction import Transaction
    
    db = next(get_db())
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    old_balance = user.token_balance
    user.token_balance = old_balance + amount
    
    transaction = Transaction(
        from_id=None,
        from_type="system",
        to_id=user_id,
        to_type="user",
        amount=amount,
        type="compensation",
        description=reason
    )
    db.add(transaction)
    db.commit()
    db.refresh(user)
    
    return {"user_id": user_id, "old_balance": old_balance, "new_balance": user.token_balance, "amount": amount, "reason": reason}
