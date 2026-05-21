"""
数据库初始化脚本
用于初始化示例数据，便于测试
"""
from app.database import SessionLocal, engine, Base
from app.models import Agent, Task, User, Transaction
from app.models.task import TaskStatus
from datetime import datetime, timedelta


def init_database():
    """初始化数据库并创建示例数据"""
    print("📦 创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("✅ 表创建完成")

    db = SessionLocal()

    try:
        # 检查是否已有数据
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"ℹ️  数据库已有 {existing_users} 个用户，跳过初始化")
            return

        print("👤 创建示例用户...")
        # 创建示例用户
        users = [
            User(username="alice", email="alice@example.com", token_balance=5000.0),
            User(username="bob", email="bob@example.com", token_balance=3000.0),
            User(username="charlie", email="charlie@example.com", token_balance=2000.0),
        ]
        for u in users:
            db.add(u)
        db.commit()
        print(f"✅ 创建了 {len(users)} 个用户")

        # 刷新获取ID
        for u in users:
            db.refresh(u)

        print("🤖 创建示例智能体...")
        # 创建示例智能体
        agents = [
            Agent(
                name="CodeMaster",
                description="专注于编程任务的AI助手，精通多种编程语言",
                owner_id=users[0].id,
                capabilities=[
                    {"category": "编程", "level": 9},
                    {"category": "分析", "level": 7}
                ],
                total_tasks=15,
                completed_tasks=14,
                success_rate=0.93,
                avg_rating=4.8,
                token_balance=1500.0
            ),
            Agent(
                name="WritePro",
                description="专业写作助手，擅长各类文案和文档创作",
                owner_id=users[0].id,
                capabilities=[
                    {"category": "写作", "level": 10},
                    {"category": "分析", "level": 6}
                ],
                total_tasks=20,
                completed_tasks=18,
                success_rate=0.90,
                avg_rating=4.6,
                token_balance=1800.0
            ),
            Agent(
                name="DesignBot",
                description="创意设计助手，提供UI/UX和视觉设计方案",
                owner_id=users[1].id,
                capabilities=[
                    {"category": "设计", "level": 8},
                    {"category": "写作", "level": 5}
                ],
                total_tasks=12,
                completed_tasks=11,
                success_rate=0.92,
                avg_rating=4.7,
                token_balance=1200.0
            ),
            Agent(
                name="DataAnalyzer",
                description="数据分析专家，擅长数据挖掘和可视化",
                owner_id=users[1].id,
                capabilities=[
                    {"category": "分析", "level": 9},
                    {"category": "编程", "level": 7}
                ],
                total_tasks=8,
                completed_tasks=8,
                success_rate=1.0,
                avg_rating=4.9,
                token_balance=900.0
            ),
            Agent(
                name="MultiTalent",
                description="全能型助手，多领域均有涉猎",
                owner_id=users[2].id,
                capabilities=[
                    {"category": "编程", "level": 6},
                    {"category": "写作", "level": 7},
                    {"category": "设计", "level": 5},
                    {"category": "分析", "level": 6}
                ],
                total_tasks=5,
                completed_tasks=4,
                success_rate=0.80,
                avg_rating=4.2,
                token_balance=400.0
            ),
        ]
        for a in agents:
            db.add(a)
        db.commit()
        print(f"✅ 创建了 {len(agents)} 个智能体")

        # 刷新获取ID
        for a in agents:
            db.refresh(a)

        print("📋 创建示例任务...")
        # 创建示例任务
        tasks = [
            Task(
                title="网站后端API开发",
                description="需要开发一个RESTful API服务，包含用户管理和数据CRUD功能",
                publisher_id=users[1].id,
                requirements=[
                    {"category": "编程", "min_level": 7}
                ],
                budget=500.0,
                deadline=datetime.utcnow() + timedelta(days=7),
                status=TaskStatus.OPEN.value
            ),
            Task(
                title="产品介绍文案撰写",
                description="为一款AI产品撰写产品介绍、用户手册和营销文案",
                publisher_id=users[2].id,
                requirements=[
                    {"category": "写作", "min_level": 8}
                ],
                budget=300.0,
                deadline=datetime.utcnow() + timedelta(days=3),
                status=TaskStatus.OPEN.value
            ),
            Task(
                title="移动端App UI设计",
                description="为一款社交App设计界面，包含登录、主页、个人中心等核心页面",
                publisher_id=users[0].id,
                requirements=[
                    {"category": "设计", "min_level": 7}
                ],
                budget=800.0,
                deadline=datetime.utcnow() + timedelta(days=5),
                status=TaskStatus.MATCHED.value,
                matched_agent_id=agents[2].id,
                matched_at=datetime.utcnow() - timedelta(hours=2)
            ),
            Task(
                title="销售数据分析报告",
                description="分析Q4销售数据，识别趋势和机会点，输出可视化报告",
                publisher_id=users[0].id,
                requirements=[
                    {"category": "分析", "min_level": 8}
                ],
                budget=400.0,
                deadline=datetime.utcnow() + timedelta(days=2),
                status=TaskStatus.IN_PROGRESS.value,
                matched_agent_id=agents[3].id,
                matched_at=datetime.utcnow() - timedelta(days=1)
            ),
        ]
        for t in tasks:
            db.add(t)
        db.commit()
        print(f"✅ 创建了 {len(tasks)} 个任务")

        print("\n🎉 数据库初始化完成!")
        print("\n📊 初始数据汇总:")
        print(f"   - 用户: {len(users)} 个")
        print(f"   - 智能体: {len(agents)} 个")
        print(f"   - 任务: {len(tasks)} 个")

    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
