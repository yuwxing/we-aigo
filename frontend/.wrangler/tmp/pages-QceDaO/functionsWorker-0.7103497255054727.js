var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/compensate.ts
var onRequestGet = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const adminKey = url.searchParams.get("admin_key");
  const userId = parseInt(url.searchParams.get("user_id") || "0");
  const amount = parseInt(url.searchParams.get("amount") || "0");
  const description = url.searchParams.get("description") || "platform_compensation";
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/plain; charset=utf-8"
  };
  if (adminKey !== "huaxianzi_compensate_2026") {
    return new Response("AUTH_FAILED", { status: 403, headers });
  }
  if (!userId || !amount || amount <= 0) {
    return new Response(`INVALID_PARAMS userId=${userId} amount=${amount}`, { status: 400, headers });
  }
  try {
    const workerUrl = `https://we-aigo-worker.we-aigo-api.workers.dev/api/compensate-now?user_id=${userId}&amount=${amount}&description=${encodeURIComponent(description)}&admin_key=huaxianzi_compensate_2026`;
    const resp = await fetch(workerUrl);
    const text = await resp.text();
    return new Response(text, { status: resp.status, headers });
  } catch (e) {
    return new Response(`PROXY_ERROR: ${String(e)}`, { status: 502, headers });
  }
}, "onRequestGet");

// api/[[path]].js
var SUPABASE_URL = "https://mzjmfyoemcsoqzoooiej.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM";
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function sb(path, opts) {
  const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
  if (opts?.method === "PATCH" || opts?.method === "POST") headers["Prefer"] = "return=representation";
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...opts, headers });
}
__name(sb, "sb");
async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  const url = new URL(request.url);
  const path = url.pathname;
  let body = {};
  if (request.method === "POST") {
    try {
      body = await request.json();
    } catch (e) {
    }
  }
  try {
    if (path === "/api/pet" && request.method === "GET") {
      const userId = url.searchParams.get("user_id");
      if (!userId) return new Response(JSON.stringify({ error: "\u7F3A\u5C11user_id" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      const resp2 = await sb(`/user_pets?user_id=eq.${userId}&select=*`);
      const pets = await resp2.json();
      if (!pets || pets.length === 0) {
        return new Response(JSON.stringify({ success: true, hasPet: false, pet: null }), { headers: { ...CORS, "Content-Type": "application/json" } });
      }
      const pet = pets[0];
      const now = /* @__PURE__ */ new Date();
      const getCooldown = /* @__PURE__ */ __name((lastTime, hours) => {
        if (!lastTime) return { onCooldown: false, remaining: 0 };
        const diff = now.getTime() - new Date(lastTime).getTime();
        const remaining = Math.max(0, hours * 36e5 - diff);
        return { onCooldown: remaining > 0, remaining: Math.ceil(remaining / 1e3) };
      }, "getCooldown");
      return new Response(JSON.stringify({
        success: true,
        hasPet: true,
        pet: {
          id: pet.id,
          pet_type: pet.pet_type,
          pet_name: pet.pet_name,
          level: pet.level,
          exp: pet.exp,
          mood: pet.mood,
          hunger: pet.hunger,
          cooldowns: {
            vocab: getCooldown(pet.last_vocab, 2),
            sentence: getCooldown(pet.last_sentence, 3),
            quiz: getCooldown(pet.last_quiz, 4),
            checkIn: getCooldown(pet.last_check_in, 24)
          },
          history: []
        }
      }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }
    if (path === "/api/pet/init" && request.method === "POST") {
      const { user_id, pet_id, pet_name } = body;
      if (!user_id) return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u53C2\u6570" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      const checkResp = await sb(`/user_pets?user_id=eq.${user_id}&select=*`);
      const existing = await checkResp.json();
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ success: true, message: "\u5BA0\u7269\u5DF2\u5B58\u5728" }), { headers: { ...CORS, "Content-Type": "application/json" } });
      }
      const createResp = await sb("/user_pets", {
        method: "POST",
        body: JSON.stringify({ user_id, pet_type: pet_id || "junie", pet_name: pet_name || "\u5BA0\u7269", level: 1, exp: 0, mood: 80, hunger: 80 })
      });
      const created = await createResp.json();
      return new Response(JSON.stringify({ success: true, message: "\u5BA0\u7269\u521D\u59CB\u5316\u6210\u529F", pet: created }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }
    if (path === "/api/pet/adopt" && request.method === "POST") {
      const { user_id, pet_id, pet_name } = body;
      if (!user_id) return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u53C2\u6570" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      const checkResp = await sb(`/user_pets?user_id=eq.${user_id}&select=*`);
      const existing = await checkResp.json();
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ success: true, message: "\u5DF2\u9886\u517B" }), { headers: { ...CORS, "Content-Type": "application/json" } });
      }
      const createResp = await sb("/user_pets", {
        method: "POST",
        body: JSON.stringify({ user_id, pet_type: pet_id || "junie", pet_name: pet_name || "\u5BA0\u7269", level: 1, exp: 0, mood: 80, hunger: 80 })
      });
      const created = await createResp.json();
      return new Response(JSON.stringify({ success: true, message: "\u9886\u517B\u6210\u529F", pet: created }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }
    if (path === "/api/pet/interact" && request.method === "POST") {
      const { user_id, action } = body;
      if (!user_id || !action) return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u53C2\u6570" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      const configs = {
        vocab: { tokens: 15, exp: 5, mood: 10, hunger: 10, cooldown: 2, field: "last_vocab", desc: "\u80CC\u5355\u8BCD" },
        sentence: { tokens: 25, exp: 8, mood: 15, hunger: 10, cooldown: 3, field: "last_sentence", desc: "\u9020\u53E5" },
        quiz: { tokens: 35, exp: 10, mood: 20, hunger: 15, cooldown: 4, field: "last_quiz", desc: "\u6311\u6218" },
        checkin: { tokens: 50, exp: 10, mood: 10, hunger: 10, cooldown: 24, field: "last_check_in", desc: "\u7B7E\u5230" }
      };
      const config = configs[action];
      if (!config) return new Response(JSON.stringify({ error: "\u65E0\u6548\u64CD\u4F5C" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      const petResp = await sb(`/user_pets?user_id=eq.${user_id}&select=*`);
      const pets = await petResp.json();
      if (!pets || pets.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "\u4F60\u8FD8\u6CA1\u6709\u9886\u517B\u5BA0\u7269" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      }
      const pet = pets[0];
      const now = /* @__PURE__ */ new Date();
      const lastTime = pet[config.field];
      if (lastTime) {
        const diff = now.getTime() - new Date(lastTime).getTime();
        const cooldownMs = config.cooldown * 36e5;
        if (diff < cooldownMs) {
          return new Response(JSON.stringify({ success: false, error: "\u51B7\u5374\u4E2D", message: `\u8BF7\u7B49\u5F85 ${Math.ceil((cooldownMs - diff) / 6e4)} \u5206\u949F` }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
        }
      }
      const newMood = Math.min(100, Math.max(0, pet.mood + config.mood));
      const newHunger = Math.min(100, Math.max(0, pet.hunger + config.hunger));
      const newExp = pet.exp + config.exp;
      let newLevel = pet.level, leveledUp = false, bonusTokens = 0;
      if (newExp >= pet.level * 20) {
        newLevel = pet.level + 1;
        leveledUp = true;
        bonusTokens = 100;
      }
      await sb(`/user_pets?user_id=eq.${user_id}`, {
        method: "PATCH",
        body: JSON.stringify({ mood: newMood, hunger: newHunger, exp: newExp, level: newLevel, [config.field]: now.toISOString() })
      });
      const totalTokens = config.tokens + bonusTokens;
      const balResp = await sb(`/users?id=eq.${user_id}&select=token_balance`);
      const users = await balResp.json();
      if (users && users.length > 0) {
        const newBalance = users[0].token_balance + totalTokens;
        await sb(`/users?id=eq.${user_id}`, { method: "PATCH", body: JSON.stringify({ token_balance: newBalance }) });
      }
      await sb("/token_transactions", { method: "POST", body: JSON.stringify({ user_id, type: `pet_${action}`, amount: totalTokens, description: `\u5BA0\u7269${config.desc}\u5956\u52B1` }) });
      return new Response(JSON.stringify({ success: true, earned: totalTokens, leveledUp, newLevel, newMood, newHunger, newExp }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }
    if (path === "/api/sentence/check" && request.method === "POST") {
      const { word, sentence } = body;
      if (!word || !sentence) return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u53C2\u6570" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      const aiResp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer sk-17df56ac8d1b4544914816f45c3c7064" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "system", content: '\u4F60\u662F\u82F1\u8BED\u8001\u5E08\u3002\u8BC4\u5224\u5B66\u751F\u7528\u6307\u5B9A\u5355\u8BCD\u9020\u7684\u53E5\u5B50\u662F\u5426\u6B63\u786E\u3002\u8FD4\u56DEJSON: {"success":true/false,"message":"\u8BC4\u4EF7"}' }, { role: "user", content: `\u5355\u8BCD: ${word}
\u53E5\u5B50: ${sentence}` }],
          temperature: 0.3
        })
      });
      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || '{"success":false,"message":"\u8BC4\u5224\u5931\u8D25"}';
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), { headers: { ...CORS, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ success: sentence.toLowerCase().includes(word.toLowerCase()), message: content }), { headers: { ...CORS, "Content-Type": "application/json" } });
      }
    }
    const workerUrl = `https://we-aigo-worker.we-aigo-api.workers.dev${path}${url.search}`;
    const headers = new Headers(request.headers);
    headers.delete("host");
    const init = { method: request.method, headers };
    if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.arrayBuffer();
    const resp = await fetch(workerUrl, init);
    const data = await resp.text();
    return new Response(data, { status: resp.status, headers: { ...CORS, "Content-Type": resp.headers.get("Content-Type") || "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "\u670D\u52A1\u5668\u9519\u8BEF" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-QceDaO/functionsRoutes-0.21265368020131215.mjs
var routes = [
  {
    routePath: "/api/compensate",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../../../../../root/.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
