import { onRequestOptions as __api_chat_ts_onRequestOptions } from "/app/data/所有对话/主对话/we-aigo/frontend/functions/api/chat.ts"
import { onRequestPost as __api_chat_ts_onRequestPost } from "/app/data/所有对话/主对话/we-aigo/frontend/functions/api/chat.ts"

export const routes = [
    {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_chat_ts_onRequestOptions],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_ts_onRequestPost],
    },
  ]