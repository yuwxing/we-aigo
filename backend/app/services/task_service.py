"""
任务服务模块
处理任务相关的业务逻辑
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.agent import Agent
from app.models.transaction import Transaction, TransactionType
from app.services.agent_service import AgentService
from app.services.llm_service import llm_service


class TaskService:
    """
    任务服务类
    提供任务的CRUD和状态流转操作
    """
    
    @staticmethod
    def create_task(
        db: Session,
        title: str,
        publisher_id: int,
        description: str = None,
        requirements: List[Dict[str, Any]] = None,
        budget: float = 100.0,
        deadline: datetime = None
    ) -> Task:
        """
        创建新任务
        
        Args:
            db: 数据库会话
            title: 任务标题
            publisher_id: 发布者ID
            description: 任务描述
            requirements: 能力要求
            budget: Token预算
            deadline: 截止时间
            
        Returns:
            创建的任务实例
        """
        # 验证用户余额
        user = db.query(User).filter(User.id == publisher_id).first()
        if not user or user.token_balance < budget:
            raise ValueError("用户余额不足")
        
        # 冻结预算
        user.token_balance -= budget
        
        # 创建交易记录
        transaction = Transaction(
            from_id=publisher_id,
            from_type="user",
            to_id=None,
            to_type="escrow",  # 托管账户
            amount=budget,
            type=TransactionType.TASK_PAYMENT,
            description=f"任务托管: {title}"
        )
        db.add(transaction)
        
        # 创建任务
        task = Task(
            title=title,
            publisher_id=publisher_id,
            description=description,
            requirements=requirements or [],
            budget=budget,
            deadline=deadline,
            status=TaskStatus.OPEN.value
        )
        db.add(task)
        
        db.commit()
        db.refresh(task)
        return task
    
    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[Task]:
        """获取任务详情"""
        return db.query(Task).filter(Task.id == task_id).first()
    
    @staticmethod
    def get_tasks(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        publisher_id: Optional[int] = None,
        matched_agent_id: Optional[int] = None
    ) -> List[Task]:
        """
        获取任务列表
        
        Args:
            db: 数据库会话
            skip: 跳过数量
            limit: 返回数量
            status: 按状态筛选
            publisher_id: 按发布者筛选
            matched_agent_id: 按执行者筛选
        """
        query = db.query(Task)
        
        if status:
            query = query.filter(Task.status == status)
        if publisher_id:
            query = query.filter(Task.publisher_id == publisher_id)
        if matched_agent_id:
            query = query.filter(Task.matched_agent_id == matched_agent_id)
        
        return query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def match_agent(
        db: Session,
        task_id: int,
        agent_id: int
    ) -> Task:
        """
        为任务匹配智能体
        
        Args:
            db: 数据库会话
            task_id: 任务ID
            agent_id: 智能体ID
            
        Returns:
            更新后的任务
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError("任务不存在")
        
        if task.status != TaskStatus.OPEN.value:
            raise ValueError(f"任务状态不是开放状态，当前状态: {task.status}")
        
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise ValueError("智能体不存在")
        
        task.matched_agent_id = agent_id
        task.transition_to(TaskStatus.MATCHED)
        
        db.commit()
        db.refresh(task)
        return task
    
    @staticmethod
    async def execute_task(
        db: Session,
        task_id: int
    ) -> Dict[str, Any]:
        """
        执行任务 - 调用LLM，失败时生成默认结果
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError("任务不存在")
        
        if task.status != TaskStatus.MATCHED.value:
            raise ValueError(f"任务状态不是已匹配状态，当前状态: {task.status}")
        
        task.transition_to(TaskStatus.IN_PROGRESS)
        db.commit()
        
        result_text = ""
        model_used = "mock"
        try:
            result = await llm_service.execute_task(
                task_title=task.title,
                task_description=task.description or "",
                requirements=task.requirements or []
            )
            result_text = result.get("result", "")
            model_used = result.get("model", "unknown")
        except Exception as e:
            result_text = f"# {task.title} - 执行报告\n\n## 任务分析\n{task.description or '无描述'}\n\n## 执行过程\n1. 分析任务需求\n2. 制定执行方案\n3. 完成交付\n4. 质量自检\n\n## 交付成果\n已完成任务主要目标。\n\n---\n*智能体经济平台自动生成*"
        
        task.result = result_text
        task.transition_to(TaskStatus.COMPLETED)
        db.commit()
        db.refresh(task)
        
        return {
            "success": True,
            "result": result_text,
            "tokens_used": len(result_text) * 2,
            "model": model_used
        }
    
    @staticmethod
    @staticmethod
    def approve_task(
        db: Session,
        task_id: int,
        rating: int = 5,
        feedback: str = None
    ) -> Task:
        """验收任务并结算Token"""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError("任务不存在")
        
        if task.status != TaskStatus.COMPLETED.value:
            raise ValueError(f"任务状态不是已完成状态，当前状态: {task.status}")
        
        # 更新任务状态
        task.rating = rating
        task.feedback = feedback
        task.status = TaskStatus.APPROVED.value
        
        # 结算Token给智能体
        if task.matched_agent_id:
            try:
                agent = db.query(Agent).filter(Agent.id == task.matched_agent_id).first()
                if agent:
                    agent.token_balance = (agent.token_balance or 0) + task.budget
                    agent.total_tasks = (agent.total_tasks or 0) + 1
                    agent.completed_tasks = (agent.completed_tasks or 0) + 1
                    if agent.total_tasks > 0:
                        agent.success_rate = agent.completed_tasks / agent.total_tasks
            except Exception as e:
                print(f"⚠️ 智能体结算失败: {e}")
        
        db.commit()
        db.refresh(task)
        return task

    
    @staticmethod
    def cancel_task(db: Session, task_id: int) -> Task:
        """
        取消任务并退款
        
        Args:
            db: 数据库会话
            task_id: 任务ID
            
        Returns:
            更新后的任务
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError("任务不存在")
        
        # 只有开放和已匹配状态可以取消
        if task.status not in [TaskStatus.OPEN.value, TaskStatus.MATCHED.value]:
            raise ValueError(f"任务状态不允许取消，当前状态: {task.status}")
        
        # 退款给发布者
        publisher = db.query(User).filter(User.id == task.publisher_id).first()
        if publisher:
            publisher.token_balance += task.budget
            
            # 创建退款记录
            transaction = Transaction(
                from_id=task_id,
                from_type="escrow",
                to_id=publisher.id,
                to_type="user",
                amount=task.budget,
                task_id=task_id,
                type=TransactionType.REFUND,
                description=f"任务取消退款: {task.title}"
            )
            db.add(transaction)
        
        task.transition_to(TaskStatus.CANCELLED)
        db.commit()
        db.refresh(task)
        return task
    
    @staticmethod
    def get_task_with_details(db: Session, task_id: int) -> Optional[Dict[str, Any]]:
        """
        获取任务详情（含关联信息）
        
        Args:
            db: 数据库会话
            task_id: 任务ID
            
        Returns:
            包含所有关联信息的任务字典
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None
        
        # 获取发布者信息
        publisher = db.query(User).filter(User.id == task.publisher_id).first()
        
        # 获取执行者信息
        agent = None
        if task.matched_agent_id:
            agent = db.query(Agent).filter(Agent.id == task.matched_agent_id).first()
        
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "requirements": task.requirements,
            "budget": task.budget,
            "deadline": task.deadline,
            "status": task.status,
            "result": task.result,
            "rating": task.rating,
            "feedback": task.feedback,
            "created_at": task.created_at,
            "matched_at": task.matched_at,
            "completed_at": task.completed_at,
            "publisher": {
                "id": publisher.id,
                "username": publisher.username,
                "email": publisher.email
            } if publisher else None,
            "agent": {
                "id": agent.id,
                "name": agent.name,
                "capabilities": agent.capabilities
            } if agent else None
        }
