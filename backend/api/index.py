"""
Vercel Serverless Function 入口
"""
from app.main import app

# Vercel需要这个handler
handler = app
