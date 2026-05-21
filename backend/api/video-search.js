// 教材视频搜索API - 真实B站视频搜索
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { query, subject, grade } = req.body;
    if (!query) {
      return res.status(400).json({ error: '查询内容不能为空' });
    }
    
    // 构建搜索关键词
    const parsed = parseQuery(query);
    const searchKeywords = buildSearchKeywords(parsed, subject, grade);
    
    // 调用B站API搜索视频
    const results = await searchBilibiliVideos(searchKeywords);
    
    return res.status(200).json({
      success: true,
      query,
      keywords: searchKeywords,
      results
    });
  } catch (error) {
    console.error('Video search error:', error);
    return res.status(500).json({
      success: false,
      error: '搜索失败，请稍后重试',
      results: []
    });
  }
}

function parseQuery(query) {
  const result = { subject: null, grade: null, chapter: null, keywords: [] };
  
  const subjectMap = {
    '物理': '物理', '数学': '数学', '语文': '语文', '英语': '英语',
    '化学': '化学', '历史': '历史', '地理': '地理', '生物': '生物',
    '政治': '政治', '科学': '科学'
  };
  
  for (const [key, value] of Object.entries(subjectMap)) {
    if (query.includes(key)) {
      result.subject = value;
      result.keywords.push(value);
      break;
    }
  }
  
  const gradeMap = {
    '小学': '小学', '小一': '小学一年级', '小二': '小学二年级', '小三': '小学三年级',
    '小四': '小学四年级', '小五': '小学五年级', '小六': '小学六年级',
    '初一': '初中一年级', '初二': '初中二年级', '初三': '初中三年级', '初中': '初中',
    '高一': '高中一年级', '高二': '高中二年级', '高三': '高中三年级', '高中': '高中'
  };
  
  for (const [key, value] of Object.entries(gradeMap)) {
    if (query.includes(key)) {
      result.grade = value;
      result.keywords.push(value);
      break;
    }
  }
  
  // 提取章节/知识点
  let chapter = query
    .replace(/初中|高中|小学|一年级|二年级|三年级|四年级|五年级|六年级/g, '')
    .replace(/物理|数学|语文|英语|化学|历史|地理|生物|政治|科学/g, '')
    .trim();
  
  if (chapter) {
    result.chapter = chapter;
    result.keywords.push(chapter);
  }
  
  return result;
}

function buildSearchKeywords(parsed, subject, grade) {
  const keywords = [];
  if (parsed.grade || grade) keywords.push(parsed.grade || grade);
  if (parsed.subject || subject) keywords.push(parsed.subject || subject);
  if (parsed.chapter) keywords.push(parsed.chapter);
  
  // 如果没有提取到关键词，直接使用原始查询
  if (keywords.length === 0) {
    keywords.push(parsed.keywords.join(' '));
  }
  
  return keywords.join(' ') + ' 教学';
}

// 搜索B站视频 - 使用多种策略
async function searchBilibiliVideos(keyword) {
  // 策略1: 尝试B站搜索API
  try {
    const results = await tryBilibiliApi(keyword);
    if (results && results.length > 0) {
      console.log('B站API搜索成功，获得', results.length, '条结果');
      return results;
    }
  } catch (e) {
    console.log('B站API失败，尝试备用方案:', e.message);
  }
  
  // 策略2: 抓取B站搜索页面
  try {
    const results = await scrapeBilibiliSearchPage(keyword);
    if (results && results.length > 0) {
      console.log('页面抓取成功，获得', results.length, '条结果');
      return results;
    }
  } catch (e) {
    console.log('页面抓取失败:', e.message);
  }
  
  // 策略3: 使用B站综合搜索API
  try {
    const results = await tryBilibiliComprehensiveApi(keyword);
    if (results && results.length > 0) {
      console.log('综合搜索成功，获得', results.length, '条结果');
      return results;
    }
  } catch (e) {
    console.log('综合搜索失败:', e.message);
  }
  
  // 降级方案：返回B站搜索链接
  return [{
    title: `在B站搜索"${keyword}"`,
    url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`,
    uploader: '点击链接访问B站搜索',
    views: '-',
    thumbnail: null,
    suitability: 100,
    color: 'from-blue-500 to-purple-500',
    teachingTips: `在B站搜索"${keyword}"，可以找到更多相关教学视频。`,
    summary: `请点击上方链接，跳转到B站进行视频搜索。`
  }];
}

// 尝试B站搜索API
async function tryBilibiliApi(keyword) {
  const apiUrl = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1&page_size=12`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
      'Origin': 'https://www.bilibili.com'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`B站返回错误: ${data.message}`);
  }
  
  const results = [];
  if (data.data && data.data.result) {
    const videos = data.data.result;
    
    for (let i = 0; i < Math.min(videos.length, 12); i++) {
      const video = videos[i];
      results.push({
        title: cleanHtmlEntities(video.title || ''),
        url: `https://www.bilibili.com/video/${video.bvid || video.aid}`,
        bvid: video.bvid,
        aid: video.aid,
        uploader: video.author || '未知UP主',
        views: formatNumber(video.play || 0),
        danmaku: formatNumber(video.video_review || 0),
        duration: formatDuration(video.duration),
        publishTime: video.pubdate ? formatDate(video.pubdate) : null,
        description: cleanHtmlEntities(video.description || ''),
        thumbnail: video.pic ? `https:${video.pic}` : null,
        suitability: calculateSuitability(video),
        color: getVideoColor(i),
        teachingTips: generateTeachingTips(video),
        keyTimePoints: generateKeyTimePoints(video),
        summary: generateSummary(video)
      });
    }
  }
  
  return results;
}

// 尝试B站综合搜索API (可能更稳定)
async function tryBilibiliComprehensiveApi(keyword) {
  // 使用 all 类型搜索，可能返回更多结果
  const apiUrl = `https://api.bilibili.com/x/web-interface/search/all?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1&page_size=12`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com'
    }
  });
  
  if (!response.ok) {
    throw new Error(`综合API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`B站返回错误: ${data.message}`);
  }
  
  const results = [];
  if (data.data && data.data.video) {
    const videos = data.data.video;
    
    for (let i = 0; i < Math.min(videos.length, 12); i++) {
      const video = videos[i];
      results.push({
        title: cleanHtmlEntities(video.title || ''),
        url: `https://www.bilibili.com/video/${video.bvid || video.aid}`,
        bvid: video.bvid,
        aid: video.aid,
        uploader: video.author || '未知UP主',
        views: formatNumber(video.play || 0),
        danmaku: formatNumber(video.video_review || 0),
        duration: formatDuration(video.duration),
        publishTime: video.pubdate ? formatDate(video.pubdate) : null,
        thumbnail: video.pic ? `https:${video.pic}` : null,
        suitability: calculateSuitability(video),
        color: getVideoColor(i),
        teachingTips: generateTeachingTips(video),
        keyTimePoints: generateKeyTimePoints(video),
        summary: generateSummary(video)
      });
    }
  }
  
  return results;
}

// 抓取B站搜索页面
async function scrapeBilibiliSearchPage(keyword) {
  const searchUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`;
  
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  });
  
  if (!response.ok) {
    throw new Error(`搜索页面请求失败: ${response.status}`);
  }
  
  const html = await response.text();
  
  // 从HTML中提取视频数据
  // B站搜索页面使用 __INITIAL_STATE__ 变量存储数据
  const stateMatch = html.match(/window\.__INITIAL_STATE__=({.*?});/s);
  
  if (stateMatch) {
    try {
      const state = JSON.parse(stateMatch[1]);
      const videos = extractVideosFromState(state);
      if (videos.length > 0) {
        return videos;
      }
    } catch (e) {
      console.log('解析__INITIAL_STATE__失败:', e.message);
    }
  }
  
  // 备用方案：正则匹配
  return extractVideosByRegex(html);
}

// 从 __INITIAL_STATE__ 中提取视频
function extractVideosFromState(state) {
  const results = [];
  
  try {
    // 尝试多种路径获取视频数据
    let videoData = state.videoData || state.video || state.list || [];
    
    if (!Array.isArray(videoData) && state.archive && state.archive.effects) {
      videoData = state.archive.effects.serverData || [];
    }
    
    if (typeof videoData === 'object' && !Array.isArray(videoData)) {
      videoData = Object.values(videoData);
    }
    
    if (Array.isArray(videoData)) {
      for (let i = 0; i < Math.min(videoData.length, 12); i++) {
        const v = videoData[i];
        if (v && (v.bvid || v.aid)) {
          results.push({
            title: cleanHtmlEntities(v.title || v.like || ''),
            url: `https://www.bilibili.com/video/${v.bvid || v.aid}`,
            bvid: v.bvid,
            aid: v.aid,
            uploader: v.author || v.owner?.name || v.upper?.name || '未知UP主',
            views: formatNumber(v.stat?.play || v.play || 0),
            danmaku: formatNumber(v.stat?.danmaku || v.danmaku || 0),
            duration: formatDuration(v.duration),
            publishTime: v.pubdate ? formatDate(v.pubdate) : null,
            thumbnail: v.pic ? (v.pic.startsWith('//') ? `https:${v.pic}` : v.pic) : null,
            suitability: calculateSuitability(v),
            color: getVideoColor(i),
            teachingTips: generateTeachingTips(v),
            keyTimePoints: generateKeyTimePoints(v),
            summary: generateSummary(v)
          });
        }
      }
    }
  } catch (e) {
    console.log('从state提取视频失败:', e.message);
  }
  
  return results;
}

// 通过正则从HTML提取视频
function extractVideosByRegex(html) {
  const results = [];
  
  // 尝试匹配 __ INITIAL_DATA__ 或其他数据
  const patterns = [
    /"bvid":"([^"]+)"/g,
    /"aid":(\d+).*?"title":"([^"]+)".*?"author":"([^"]+)".*?"play":"([^"]+)"/gs
  ];
  
  // 简化匹配：查找视频卡片结构
  const cardRegex = /<a[^>]+href="(\/video\/[^"]+)"[^>]*>[\s\S]*?title="([^"]*)"[\s\S]*?author="([^"]*)"[\s\S]*?play="([^"]*)"/g;
  
  let match;
  let count = 0;
  
  // 尝试匹配视频链接和基本信息
  const bvidMatches = html.match(/"bvid":"(BV[a-zA-Z0-9]{10})"/g) || [];
  const titleMatches = html.match(/title="([^"]*教学[^"]*)"/gi) || [];
  
  for (let i = 0; i < Math.min(bvidMatches.length, 12); i++) {
    const bvid = bvidMatches[i].match(/"bvid":"([^"]+)"/)[1];
    const title = titleMatches[i] ? titleMatches[i].match(/title="([^"]*)"/)[1] : `视频 ${i + 1}`;
    
    results.push({
      title: cleanHtmlEntities(title),
      url: `https://www.bilibili.com/video/${bvid}`,
      bvid: bvid,
      uploader: 'B站UP主',
      views: '未知',
      thumbnail: null,
      suitability: 90 - count * 3,
      color: getVideoColor(count),
      teachingTips: 'B站优质教学视频',
      summary: `B站教学视频：${cleanHtmlEntities(title)}`
    });
    count++;
  }
  
  return results;
}

// 工具函数
function cleanHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .trim();
}

function formatNumber(num) {
  if (!num && num !== 0) return '0';
  num = parseInt(num);
  if (isNaN(num)) return '0';
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

function formatDuration(duration) {
  if (!duration) return null;
  if (typeof duration === 'number') {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return String(duration);
}

function formatDate(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateSuitability(video) {
  let score = 70;
  
  const plays = parseInt(video.stat?.play || video.play || 0);
  if (plays > 100000) score += 15;
  else if (plays > 50000) score += 10;
  else if (plays > 10000) score += 5;
  
  const danmaku = parseInt(video.stat?.danmaku || video.video_review || video.danmaku || 0);
  if (danmaku > 1000) score += 8;
  else if (danmaku > 500) score += 5;
  
  const duration = video.duration;
  if (typeof duration === 'number') {
    if (duration >= 300 && duration <= 1800) score += 7;
  }
  
  return Math.min(100, score);
}

function getVideoColor(index) {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500',
    'from-indigo-500 to-violet-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-sky-500 to-cyan-500',
    'from-fuchsia-500 to-pink-500',
    'from-teal-500 to-green-500'
  ];
  return colors[index % colors.length];
}

function generateTeachingTips(video) {
  const tips = [];
  const plays = parseInt(video.stat?.play || video.play || 0);
  const danmaku = parseInt(video.stat?.danmaku || video.video_review || video.danmaku || 0);
  
  if (plays > 50000) {
    tips.push('热门视频，教学质量有保障');
  }
  if (danmaku > 500) {
    tips.push('弹幕互动活跃，便于课后讨论');
  }
  
  const duration = video.duration;
  if (typeof duration === 'number') {
    if (duration < 300) {
      tips.push('短视频，适合快速预习');
    } else if (duration <= 1200) {
      tips.push('中等时长，适合系统学习');
    } else {
      tips.push('长视频，建议分多次观看');
    }
  }
  
  return tips.length > 0 ? tips.join('；') : '优质教学视频资源';
}

function generateKeyTimePoints(video) {
  const duration = typeof video.duration === 'number' ? video.duration : 600;
  const points = ['00:00 课程导入'];
  
  const intervals = [
    { ratio: 0.2, label: '基础概念' },
    { ratio: 0.4, label: '核心知识点' },
    { ratio: 0.6, label: '例题讲解' },
    { ratio: 0.8, label: '总结归纳' }
  ];
  
  for (const p of intervals) {
    if (p.ratio < 1) {
      const time = Math.floor(duration * p.ratio);
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      points.push(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${p.label}`);
    }
  }
  
  return points.join(' | ');
}

function generateSummary(video) {
  const title = cleanHtmlEntities(video.title || '');
  const author = video.author || video.stat?.owner?.name || video.owner?.name || '未知UP主';
  const plays = formatNumber(video.stat?.play || video.play || 0);
  
  return `【${title}】由${author}上传，播放量${plays}。本视频讲解详细，适合课堂学习使用。`;
}
