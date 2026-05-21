from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 数据库配置 - 优先使用环境变量，支持PostgreSQL和SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/agent_eco_platform.db")

# 处理postgres://前缀（SQLAlchemy需要postgresql://）
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Supabase连接URL修正：Vercel Serverless必须使用Transaction Pooler
# 1. 直连(db.xxx.supabase.co:5432)自动转换为Pooler
# 2. Pooler中aws-0修正为aws-1（本项目在东京区域的正确前缀）
try:
    import re
    # 情况1: 直连自动转换
    direct_match = re.match(r"postgresql://([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:5432/(.+)", DATABASE_URL)
    if direct_match:
        user, password, project_ref, dbname = direct_match.groups()
        DATABASE_URL = f"postgresql://postgres.{project_ref}:{password}@aws-1-ap-northeast-1.pooler.supabase.com:6543/{dbname}?sslmode=require"
    
    # 情况2: Pooler中aws-0修正为aws-1
    DATABASE_URL = DATABASE_URL.replace(
        "aws-0-ap-northeast-1.pooler.supabase.com",
        "aws-1-ap-northeast-1.pooler.supabase.com"
    )
    
    # 确保有sslmode
    if "pooler.supabase.com" in DATABASE_URL and "sslmode" not in DATABASE_URL:
        DATABASE_URL += "&sslmode=require" if "?" in DATABASE_URL else "?sslmode=require"
except Exception as e:
    print(f"⚠️ 数据库URL转换失败: {e}")

# 根据数据库类型配置连接参数
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# 创建SQLAlchemy引擎
engine_kwargs = {
    "connect_args": connect_args,
    "echo": False,
}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.models import Agent, Task, User, Transaction
    Base.metadata.create_all(bind=engine)
