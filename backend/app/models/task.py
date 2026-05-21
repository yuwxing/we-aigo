"""
任务模型
定义平台任务的属性和状态流转
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
from app.database import Base


class TaskStatus(str, PyEnum):
    """
    任务状态枚举
    定义任务的完整生命周期
    """
    OPEN = "open"           # 开放 - 等待接取
    MATCHED = "matched"    # 已匹配 - 已指定执行者
    IN_PROGRESS = "in_progress"  # 进行中 - 正在执行
    COMPLETED = "completed"      # 已完成 - 待验收
    APPROVED = "approved"        # 已验收 - 任务结束
    CANCELLED = "cancelled"      # 已取消 - 任务终止


class Task(Base):
    """
    任务模型
    平台中用户发布的工作请求
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # 发布者
    publisher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 能力要求 - JSON格式 [{category: "编程", min_level: 5}, ...]
    requirements = Column(JSON, default=list)
    
    # 预算和时间
    budget = Column(Float, nullable=False)  # Token预算
    deadline = Column(DateTime, nullable=True)  # 截止时间
    
    # 状态和执行信息
    status = Column(String(20), default=TaskStatus.OPEN.value, index=True)
    matched_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    
    # 执行结果
    result = Column(Text, nullable=True)  # 执行结果/产出
    rating = Column(Integer, nullable=True)  # 评分(1-5)
    feedback = Column(Text, nullable=True)  # 反馈意见
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    matched_at = Column(DateTime, nullable=True)  # 匹配时间
    completed_at = Column(DateTime, nullable=True)  # 完成时间
    submitted_at = Column(DateTime, nullable=True)  # 提交时间
    settled_at = Column(DateTime, nullable=True)  # 结算时间
    
    # 交付状态
    delivery_status = Column(String(20), default="pending", nullable=True)  # pending/checked
    
    # 交付成果URL
    result_url = Column(Text, nullable=True)  # 交付成果URL
    
    # 结算评分和备注
    settlement_rating = Column(Integer, nullable=True)  # 结算评分
    settlement_notes = Column(Text, nullable=True)  # 结算备注

    # 关联关系
    publisher = relationship("User", back_populates="published_tasks", foreign_keys=[publisher_id])
    matched_agent = relationship("Agent", back_populates="assigned_tasks", foreign_keys=[matched_agent_id])

    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"
    
    def transition_to(self, new_status: TaskStatus):
        """
        任务状态转换
        
        Args:
            new_status: 目标状态
            
        Raises:
            ValueError: 无效的状态转换
        """
        valid_transitions = {
            TaskStatus.OPEN: [TaskStatus.MATCHED, TaskStatus.CANCELLED],
            TaskStatus.MATCHED: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
            TaskStatus.IN_PROGRESS: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
            TaskStatus.COMPLETED: [TaskStatus.APPROVED, TaskStatus.CANCELLED],
            TaskStatus.APPROVED: [],
            TaskStatus.CANCELLED: []
        }
        
        current = TaskStatus(self.status)
        if new_status in valid_transitions.get(current, []):
            self.status = new_status.value
            if new_status == TaskStatus.MATCHED:
                self.matched_at = datetime.utcnow()
            elif new_status == TaskStatus.COMPLETED:
                self.completed_at = datetime.utcnow()
        else:
            raise ValueError(f"Invalid transition from {current.value} to {new_status.value}")
