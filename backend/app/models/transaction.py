"""
交易模型
记录平台内的Token流转历史
"""
from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from datetime import datetime
from app.database import Base


class TransactionType(str):
    """
    交易类型常量
    """
    TASK_PAYMENT = "task_payment"      # 任务支付
    INITIAL_CREDIT = "initial_credit"   # 初始充值
    REFUND = "refund"                   # 退款
    REWARD = "reward"                   # 奖励
    COMPENSATION = "compensation"     # 赔付


class Transaction(Base):
    """
    交易记录模型
    记录所有Token流转交易
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    
    # 交易双方 (可以是user或agent)
    from_id = Column(Integer, nullable=True)  # 发送方 (null表示系统)
    from_type = Column(String(20), nullable=True)  # user 或 agent
    to_id = Column(Integer, nullable=True)    # 接收方
    to_type = Column(String(20), nullable=True)
    
    # 交易金额
    amount = Column(Float, nullable=False)
    
    # 关联任务
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    
    # 交易类型
    type = Column(String(20), nullable=False)
    
    # 描述
    description = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Transaction(id={self.id}, amount={self.amount}, type={self.type})>"
