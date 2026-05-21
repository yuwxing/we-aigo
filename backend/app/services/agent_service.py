"""
智能体服务模块
处理智能体相关的业务逻辑
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.agent import Agent
from app.models.task import Task
from app.models.transaction import Transaction, TransactionType

# 智能体注册赠送Token
AGENT_REGISTER_BONUS = 15000.0


class AgentService:
    """
    智能体服务类
    提供智能体的CRUD和业务操作
    """
    
    @staticmethod
    def create_agent(
        db: Session,
        name: str,
        owner_id: int,
        description: str = None,
        capabilities: List[Dict[str, Any]] = None,
        avatar_url: str = None,
        initial_token: float = AGENT_REGISTER_BONUS
    ) -> Agent:
        """
        创建新智能体
        
        Args:
            db: 数据库会话
            name: 智能体名称
            owner_id: 所有者ID
            description: 描述
            capabilities: 能力列表
            avatar_url: 头像URL
            initial_token: 初始Token余额，默认15000
            
        Returns:
            创建的智能体实例
        """
        agent = Agent(
            name=name,
            owner_id=owner_id,
            description=description,
            capabilities=capabilities or [],
            avatar_url=avatar_url,
            token_balance=initial_token
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)
        return agent
    
    @staticmethod
    def get_agent(db: Session, agent_id: int) -> Optional[Agent]:
        """
        获取智能体详情
        
        Args:
            db: 数据库会话
            agent_id: 智能体ID
            
        Returns:
            智能体实例或None
        """
        return db.query(Agent).filter(Agent.id == agent_id).first()
    
    @staticmethod
    def get_agents(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[int] = None,
        category: Optional[str] = None,
        min_level: Optional[int] = None
    ) -> List[Agent]:
        """
        获取智能体列表
        
        Args:
            db: 数据库会话
            skip: 跳过数量
            limit: 返回数量
            owner_id: 按所有者筛选
            category: 按能力类别筛选
            min_level: 最低能力等级
            
        Returns:
            智能体列表
        """
        query = db.query(Agent)
        
        if owner_id:
            query = query.filter(Agent.owner_id == owner_id)
        
        agents = query.offset(skip).limit(limit).all()
        
        # 内存过滤能力要求
        if category or min_level:
            filtered = []
            for agent in agents:
                capabilities = agent.capabilities or []
                if category:
                    # 检查是否有指定类别的能力
                    has_category = any(
                        cap.get("category") == category 
                        for cap in capabilities
                    )
                    if not has_category:
                        continue
                
                if min_level:
                    # 检查能力等级是否满足
                    meets_level = any(
                        cap.get("level", 0) >= min_level
                        for cap in capabilities
                    )
                    if not meets_level:
                        continue
                
                filtered.append(agent)
            return filtered
        
        return agents
    
    @staticmethod
    def update_agent(
        db: Session,
        agent_id: int,
        **kwargs
    ) -> Optional[Agent]:
        """
        更新智能体信息
        
        Args:
            db: 数据库会话
            agent_id: 智能体ID
            **kwargs: 要更新的字段
            
        Returns:
            更新后的智能体或None
        """
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return None
        
        for key, value in kwargs.items():
            if hasattr(agent, key) and key not in ["id", "created_at"]:
                setattr(agent, key, value)
        
        db.commit()
        db.refresh(agent)
        return agent
    
    @staticmethod
    def update_performance(
        db: Session,
        agent_id: int,
        success: bool,
        rating: int
    ) -> Optional[Agent]:
        """
        更新智能体性能统计
        
        Args:
            db: 数据库会话
            agent_id: 智能体ID
            success: 任务是否成功
            rating: 用户评分
            
        Returns:
            更新后的智能体
        """
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return None
        
        agent.update_performance(success, rating)
        db.commit()
        db.refresh(agent)
        return agent
    
    @staticmethod
    def add_token_balance(
        db: Session,
        agent_id: int,
        amount: float,
        task_id: Optional[int] = None
    ) -> Optional[Agent]:
        """
        增加智能体Token余额
        
        Args:
            db: 数据库会话
            agent_id: 智能体ID
            amount: 增加的金额
            task_id: 关联任务ID
            
        Returns:
            更新后的智能体
        """
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return None
        
        agent.token_balance += amount
        db.commit()
        db.refresh(agent)
        return agent
