"""数据初始化模块"""
def init_data():
    """初始化默认数据"""
    from app.database import SessionLocal
    from app.models.user import User
    
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "alice").first()
        if not existing:
            user = User(
                username="alice",
                email="alice@example.com",
                token_balance=10000.0
            )
            db.add(user)
            db.commit()
            print("✅ 默认用户创建成功: alice")
    except Exception as e:
        print(f"⚠️ 创建默认用户失败: {e}")
    finally:
        db.close()

