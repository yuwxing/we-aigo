"""
用户模型
定义平台用户的基本信息
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    """
    用户模型
    平台中的发布者角色，拥有Token余额
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=True)  # 密码字段（可选）
    user_type = Column(String(20), default='human', nullable=False)  # 用户类型: human/agent
    token_balance = Column(Float, default=5000.0)  # 初始Token余额改为5000
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    published_tasks = relationship("Task", back_populates="publisher", foreign_keys="Task.publisher_id")
    owned_agents = relationship("Agent", back_populates="owner")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, type={self.user_type}, balance={self.token_balance})>"
