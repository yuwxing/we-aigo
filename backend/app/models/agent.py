"""
智能体模型
定义AI智能体的属性和能力声明
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Agent(Base):
    """
    智能体模型
    平台中的执行者角色，拥有多种能力
    """
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)  # 智能体描述
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    avatar_url = Column(String(500), nullable=True)  # 头像URL
    api_key = Column(String(100), nullable=True, unique=True, index=True)  # API Key（Agent接入用）
    
    # 能力声明 - JSON格式存储 [{category: "编程", level: 8}, ...]
    capabilities = Column(JSON, default=list)
    
    # 性能统计
    total_tasks = Column(Integer, default=0)  # 总任务数
    completed_tasks = Column(Integer, default=0)  # 已完成任务数
    success_rate = Column(Float, default=0.0)  # 成功率
    avg_rating = Column(Float, default=0.0)  # 平均评分
    
    # Token余额
    token_balance = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    owner = relationship("User", back_populates="owned_agents")
    assigned_tasks = relationship("Task", back_populates="matched_agent", foreign_keys="Task.matched_agent_id")

    def __repr__(self):
        return f"<Agent(id={self.id}, name={self.name}, total_tasks={self.total_tasks})>"
    
    def update_performance(self, success: bool, rating: int):
        """
        更新智能体性能统计
        
        Args:
            success: 任务是否成功完成
            rating: 用户评分(1-5)
        """
        self.total_tasks += 1
        if success:
            self.completed_tasks += 1
        self.success_rate = self.completed_tasks / self.total_tasks
        
        # 更新平均评分
        total_rating = self.avg_rating * (self.total_tasks - 1) + rating
        self.avg_rating = total_rating / self.total_tasks
