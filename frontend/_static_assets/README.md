# Cloudflare Pages Configuration for we-aigo

## 项目结构说明
# - 源码位于: frontend/
# - 构建输出: frontend/dist/
# - 构建命令: cd frontend && npm run build
# - 运行环境: Vite + React + TypeScript

## 重定向规则
# API 请求代理到后端服务
/api/v1/*  https://api.we-aigo.top/api/v1/:splat  200
/api/*     https://api.we-aigo.top/api/v1/:splat  200

## 缓存策略
# index.html - 不缓存，确保每次获取最新版本
# assets/* - 长期缓存，文件名带hash

## 部署方式
# 方式1: GitHub集成（推荐）
# 在 Cloudflare Dashboard 中设置:
#   - Repository: yuwxing/we-aigo
#   - Branch: main
#   - Root directory: frontend
#   - Build command: npm run build
#   - Build output directory: dist
#   - Environment variables:
#     - VITE_API_URL: https://api.we-aigo.top

# 方式2: Wrangler CLI 部署
# npx wrangler pages deploy frontend/dist --project-name=we-aigo
