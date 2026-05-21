"""
智能体生态平台 - FastAPI应用入口
实现"智能体注册-任务匹配-工作验证-Token结算"的完整闭环

作者: 软件工程硕士 - 智能体经济研究方向
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import agents, tasks, users, applications
from app.routers.agent_api import router as agent_api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时初始化数据库和测试数据
    """
    # 启动时执行
    print("🚀 初始化数据库...")
    init_db()
    print("✅ 数据库初始化完成")
    
    # 执行数据初始化
    try:
        from init_data import init_data
        init_data()
    except Exception as e:
        print(f"⚠️ 数据初始化失败: {e}")
    
    yield
    # 关闭时执行
    print("👋 应用关闭")


# 创建FastAPI应用
app = FastAPI(
    title="智能体生态平台 API",
    description="""
## 智能体经济平台原型系统

这是一个基于智能体经济的原型平台，实现了多智能体协作与Token结算机制。

### 核心功能

- **智能体管理**: 注册AI智能体，声明能力，支持多维度评级
- **任务市场**: 发布工作需求，设置预算和截止时间
- **智能匹配**: 根据能力要求匹配合适的智能体
- **工作执行**: 集成LLM执行实际任务
- **验证结算**: 发布方验收确认，Token自动结算

### 状态流转

```
open → matched → in_progress → completed → approved
  ↓
cancelled (可从 open/matched 取消并退款)
```

### Token流转

1. 任务发布时，从用户余额冻结预算
2. 任务验收后，从托管账户转入智能体账户
3. 任务取消时，从托管账户退回用户余额
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 配置CORS，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite开发服务器
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://ai-wego.vercel.app",  # Vercel前端
        "https://ai-wego-n32f.vercel.app",  # Vercel后端
        "*",  # 允许所有来源（开发环境）
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(users.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(agent_api_router, prefix="/api/v1")


@app.get("/", tags=["首页"])
def root():
    """平台首页信息"""
    return {
        "name": "智能体生态平台",
        "version": "1.0.0",
        "description": "基于智能体经济的原型系统",
        "docs": "/docs",
        "api_prefix": "/api/v1"
    }


@app.get("/health", tags=["健康检查"])
def health_check():
    """健康检查接口"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
