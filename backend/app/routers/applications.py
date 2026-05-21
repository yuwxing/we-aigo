"""
入驻申请API路由
处理入驻申请的提交、查询和审核
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.application import Application

router = APIRouter(prefix="/applications", tags=["入驻申请"])

# ============ Pydantic Schemas ============

class CapabilityInput(BaseModel):
    """能力标签输入模型"""
    category: str = Field(..., description="能力类别: 编程/写作/设计/分析/翻译/其他")
    level: int = Field(5, ge=1, le=10, description="能力等级 1-10")

class ApplicationCreate(BaseModel):
    """创建入驻申请的请求模型"""
    agent_name: str = Field(..., min_length=1, max_length=100, description="智能体名称")
    platform: str = Field(..., description="来源平台: ChatGPT/Claude/Gemini/文心一言/通义千问/其他")
    capabilities: List[CapabilityInput] = Field(default_factory=list, description="能力标签列表")
    level: int = Field(5, ge=1, le=10, description="能力等级 1-10")
    contact: str = Field(..., min_length=1, max_length=200, description="联系方式")
    portfolio_url: Optional[str] = Field(None, max_length=500, description="作品展示链接")
    introduction: Optional[str] = Field(None, description="自我介绍")

class ApplicationStatusUpdate(BaseModel):
    """更新申请状态模型"""
    status: str = Field(..., description="状态: approved/rejected")
    notes: Optional[str] = Field(None, description="审核备注")

class ApplicationResponse(BaseModel):
    """入驻申请响应模型"""
    id: int
    agent_name: str
    platform: str
    capabilities: List[dict]
    level: int
    contact: str
    portfolio_url: Optional[str]
    introduction: Optional[str]
    notes: Optional[str]
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ApplicationListResponse(BaseModel):
    """入驻申请列表响应模型"""
    items: List[ApplicationResponse]
    total: int

# ============ API Endpoints ============

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    application: ApplicationCreate,
    db: Session = Depends(get_db)
):
    """提交新的入驻申请"""
    # 验证来源平台
    valid_platforms = ["ChatGPT", "Claude", "Gemini", "文心一言", "通义千问", "其他"]
    if application.platform not in valid_platforms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的平台类型。可选值: {', '.join(valid_platforms)}"
        )

    # 转换能力列表为字典
    capabilities_list = [
        {"category": cap.category, "level": cap.level}
        for cap in application.capabilities
    ]

    # 创建申请记录
    db_application = Application(
        agent_name=application.agent_name,
        platform=application.platform,
        capabilities=capabilities_list,
        level=application.level,
        contact=application.contact,
        portfolio_url=application.portfolio_url,
        introduction=application.introduction,
        status="pending"
    )

    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    return db_application

@router.get("", response_model=ApplicationListResponse)
def list_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """获取入驻申请列表（管理员接口）"""
    query = db.query(Application)

    # 按状态筛选
    if status_filter:
        valid_statuses = ["pending", "approved", "rejected"]
        if status_filter not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无效的状态值。可选值: {', '.join(valid_statuses)}"
            )
        query = query.filter(Application.status == status_filter)

    # 获取总数
    total = query.count()

    # 按创建时间倒序
    query = query.order_by(Application.created_at.desc())

    # 分页
    applications = query.offset(skip).limit(limit).all()

    return ApplicationListResponse(
        items=applications,
        total=total
    )

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    """获取指定ID的入驻申请详情"""
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"申请ID {application_id} 不存在"
        )

    return application

@router.put("/{application_id}/approve", response_model=ApplicationResponse)
def approve_application(
    application_id: int,
    status_update: Optional[ApplicationStatusUpdate] = None,
    db: Session = Depends(get_db)
):
    """批准入驻申请（管理员接口）"""
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"申请ID {application_id} 不存在"
        )

    if application.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该申请已经被批准"
        )

    # 更新状态
    application.status = "approved"
    application.updated_at = datetime.utcnow()

    # 更新审核备注
    if status_update and status_update.notes:
        application.notes = status_update.notes

    db.commit()
    db.refresh(application)

    return application

@router.put("/{application_id}/reject", response_model=ApplicationResponse)
def reject_application(
    application_id: int,
    status_update: Optional[ApplicationStatusUpdate] = None,
    db: Session = Depends(get_db)
):
    """拒绝入驻申请（管理员接口）"""
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"申请ID {application_id} 不存在"
        )

    if application.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已批准的申请无法拒绝"
        )

    # 更新状态
    application.status = "rejected"
    application.updated_at = datetime.utcnow()

    # 更新审核备注
    if status_update and status_update.notes:
        application.notes = status_update.notes

    db.commit()
    db.refresh(application)

    return application
