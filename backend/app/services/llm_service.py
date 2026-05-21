"""
LLM服务模块
负责与AI大模型交互
"""
import os
import httpx
from typing import Optional, Dict, Any, List


class LLMService:
    """
    LLM服务类
    封装与AI大模型的交互逻辑
    支持多种模型和提示词模板
    """
    
    def __init__(self):
        """初始化LLM服务"""
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model_name = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    
    def is_available(self) -> bool:
        """检查LLM服务是否可用"""
        return bool(self.api_key)
    
    async def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        **kwargs
    ) -> str:
        """生成AI响应"""
        if not self.is_available():
            return self._generate_mock_response(user_message)
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message}
                        ],
                        "temperature": kwargs.get("temperature", 0.7),
                        "max_tokens": kwargs.get("max_tokens", 2000)
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return self._generate_mock_response(user_message)
    
    def _generate_mock_response(self, task_description: str) -> str:
        """生成模拟响应（当LLM不可用时）"""
        return f"""
# 任务执行结果

## 任务概述
{task_description[:200]}...

## 执行过程
1. 分析任务需求
2. 制定执行计划
3. 完成核心工作
4. 验证结果质量

## 产出成果
已完成任务的主要目标，生成了符合要求的交付物。

## 备注
此为模拟响应。如需真实AI执行，请配置 OPENAI_API_KEY 环境变量。

---
*智能体执行于 2026-04-30*
"""

    async def execute_code_task(self, task_description: str) -> Dict[str, Any]:
        """执行编程任务"""
        system_prompt = """你是一个专业的编程助手。
请根据任务描述，生成高质量的代码实现。
代码应该包含：
1. 清晰的注释
2. 合理的错误处理
3. 符合最佳实践的结构"""
        
        response = await self.generate_response(system_prompt, task_description)
        
        return {
            "code": response,
            "language": "python",
            "success": True,
            "mock": not self.is_available()
        }
    
    async def execute_writing_task(self, task_description: str) -> Dict[str, Any]:
        """执行写作任务"""
        system_prompt = """你是一个专业的内容创作者。
请根据任务描述，撰写高质量的内容。
内容应该：
1. 结构清晰
2. 语言流畅
3. 信息准确"""
        
        response = await self.generate_response(system_prompt, task_description)
        
        return {
            "content": response,
            "word_count": len(response),
            "success": True,
            "mock": not self.is_available()
        }
    
    async def execute_analysis_task(self, task_description: str) -> Dict[str, Any]:
        """执行分析任务"""
        system_prompt = """你是一个数据分析专家。
请根据任务描述，进行全面的分析。
分析应该包含：
1. 数据概览
2. 关键发现
3. 趋势分析
4. 建议与结论"""
        
        response = await self.generate_response(system_prompt, task_description)
        
        return {
            "analysis": response,
            "success": True,
            "mock": not self.is_available()
        }
    
    async def execute_design_task(self, task_description: str) -> Dict[str, Any]:
        """执行设计任务"""
        system_prompt = """你是一个专业的UI/UX设计师。
请根据任务描述，提供详细的设计方案。
方案应该包含：
1. 设计理念
2. 界面布局
3. 配色方案
4. 交互说明"""
        
        response = await self.generate_response(system_prompt, task_description)
        
        return {
            "design_document": response,
            "success": True,
            "mock": not self.is_available()
        }

    async def execute_task(
        self,
        task_title: str,
        task_description: str,
        requirements: list = None
    ) -> dict:
        """
        通用任务执行方法
        根据任务描述和要求执行任务
        """
        full_description = f"任务标题: {task_title}\n\n任务描述: {task_description}"
        if requirements:
            req_str = ", ".join(f"{r.get('category','')}≥{r.get('min_level','')}" for r in requirements)
            full_description += f"\n\n能力要求: {req_str}"
        
        system_prompt = """你是一个专业的AI智能体，正在执行任务。
请根据任务描述，认真完成工作并输出详细的结果。

输出要求：
1. 任务分析：简要分析任务需求
2. 执行过程：描述你的执行步骤
3. 交付成果：给出完整的、可直接使用的交付物
4. 质量保证：自我检查和优化建议

请确保交付成果具有实际价值，可直接使用。"""
        
        result_text = await self.generate_response(system_prompt, full_description)
        
        return {
            "success": True,
            "result": result_text,
            "tokens_used": len(result_text) * 2 if result_text else 0,
            "model": self.model_name if self.is_available() else "mock"
        }


# 全局单例
llm_service = LLMService()
