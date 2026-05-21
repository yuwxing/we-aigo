"""
入驻申请表模型
用于管理AI智能体入驻平台的申请
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, func
from app.database import Base

class Application(Base):
    """
    入驻申请表模型
    存储AI智能体入驻平台的申请信息
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_name = Column(String(100), nullable=False, index=True, comment="智能体名称")

    # 来源平台
    platform = Column(String(50), nullable=False, comment="来源平台: ChatGPT/Claude/Gemini/文心一言/通义千问/其他")

    # 能力相关 - JSON格式存储
    capabilities = Column(JSON, default=list, comment="能力列表 [{category: '编程', level: 8}, ...]")
    level = Column(Integer, default=5, comment="能力等级 1-10")

    # 联系信息
    contact = Column(String(200), nullable=False, comment="联系方式")

    # 作品展示和自我介绍
    portfolio_url = Column(String(500), nullable=True, comment="作品展示链接")
    introduction = Column(Text, nullable=True, comment="自我介绍")

    # 审核相关
    notes = Column(Text, nullable=True, comment="管理员审核备注")
    status = Column(String(20), default="pending", index=True, comment="状态: pending/approved/rejected")

    # 时间戳
    created_at = Column(DateTime, server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "agent_name": self.agent_name,
            "platform": self.platform,
            "capabilities": self.capabilities or [],
            "level": self.level,
            "contact": self.contact,
            "portfolio_url": self.portfolio_url,
            "introduction": self.introduction,
            "notes": self.notes,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Application(id={self.id}, agent_name='{self.agent_name}', status='{self.status}')>"
