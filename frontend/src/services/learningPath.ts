const API_KEY = "替换成你的DeepSeek API Key";

export async function generateLearningPath(user: any) {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
你是一个AI学习路径引擎。

你必须为中学生生成【7天学习计划】。

要求：
- 每天1个任务
- 必须是循序渐进（基础 → 强化 → 应用 → 测试 → 复盘）
- 每天包含：
  1. Day编号
  2. 任务标题
  3. 学习目标
  4. 具体步骤（3-5步）
  5. XP奖励（10-50）
  6. 火星基地区域（英语核心区 / 语法实验室 / 听力站 / 写作舱）

输出必须结构清晰。
`,
        },
        {
          role: "user",
          content: `
学生信息：
年级：${user.grade}
学科：${user.subject}
水平：${user.level}
弱点：${user.weakness}
每天学习时间：${user.time}

请生成完整7天学习路径。
`,
        },
      ],
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}