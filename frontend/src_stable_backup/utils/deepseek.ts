/**
 * DeepSeek API 调用工具
 */
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
export const DEEPSEEK_API_KEY = 'sk-17df56ac8d1b4544914816f45c3c7064';
export const DEEPSEEK_MODEL = 'deepseek-chat';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: 'interviewer' | 'student' | 'mentor' | 'resume' | 'career' | 'user';
  timestamp: number;
}

export interface DeepSeekResponse {
  id: string;
  choices: {
    delta?: { content: string };
    message?: { content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 发送消息到 DeepSeek API
 */
export async function sendToDeepSeek(
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API 错误: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed: DeepSeekResponse = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            onChunk?.(content);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  return fullContent;
}

/**
 * 发送消息到 DeepSeek API（非流式）
 */
export async function sendToDeepSeekSync(
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 1500,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API 错误: ${response.status} - ${error}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}
