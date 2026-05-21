# API密钥配置

本文件记录所有第三方API密钥，请在Cloudflare Worker环境变量中配置这些值。

## 搜索API

### Serper.dev
- **用途**: 实时Google搜索，为AI聊天提供真实链接
- **免费额度**: 2500次/月
- **注册地址**: https://serper.dev
- **获取Key**: 登录后进入 Dashboard -> API Keys -> Generate API Key
- **环境变量名**: `SERPER_API_KEY`

配置示例:
```bash
# Cloudflare Workers环境变量
SERPER_API_KEY=your_serper_api_key_here
```

## 其他API

### DeepSeek
- **用途**: AI对话生成
- **环境变量名**: `DEEEPSEEK_API_KEY`
- **当前值**: sk-17df56ac8d1b4544914816f45c3c7064 (已配置)

### Supabase
- **用途**: 数据库操作
- **环境变量名**: `SUPABASE_SERVICE_KEY`, `SUPABASE_URL`
- **当前值**: 已配置
