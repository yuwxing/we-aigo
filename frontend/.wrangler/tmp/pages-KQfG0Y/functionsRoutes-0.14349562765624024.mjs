import { onRequestGet as __api_compensate_ts_onRequestGet } from "/app/data/所有对话/主对话/we-aigo/frontend/functions/api/compensate.ts"
import { onRequest as __api___path___js_onRequest } from "/app/data/所有对话/主对话/we-aigo/frontend/functions/api/[[path]].js"

export const routes = [
    {
      routePath: "/api/compensate",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_compensate_ts_onRequestGet],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  ]