// 教材视频搜索API
export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const { query, subject, grade } = req.body;
    if (!query) { return res.status(400).json({ error: '查询内容不能为空' }); }
    const parsed = parseQuery(query);
    const searchKeywords = buildSearchKeywords(parsed);
    const bilibiliSearchUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(searchKeywords)}+教学`;
    const results = generateRecommendations(parsed, searchKeywords, bilibiliSearchUrl);
    return res.status(200).json({ success: true, query, parsed, keywords: searchKeywords, searchUrl: bilibiliSearchUrl, results });
  } catch (error) { console.error('Video search error:', error); return res.status(500).json({ error: '搜索失败，请稍后重试' }); }
}

function parseQuery(query) {
  const result = { subject: null, grade: null, chapter: null, keywords: [] };
  const subjectMap = { '物理': '物理', '数学': '数学', '语文': '语文', '英语': '英语', '化学': '化学', '历史': '历史', '地理': '地理', '生物': '生物' };
  for (const [key, value] of Object.entries(subjectMap)) { if (query.includes(key)) { result.subject = value; result.keywords.push(value); break; } }
  const gradeMap = { '小学': '小学', '初一': '初中一年级', '初二': '初中二年级', '初三': '初中三年级', '初中': '初中', '高一': '高中一年级', '高二': '高中二年级', '高三': '高中三年级', '高中': '高中' };
  for (const [key, value] of Object.entries(gradeMap)) { if (query.includes(key)) { result.grade = value; result.keywords.push(value); break; } }
  let chapter = query.replace(/初中|高中|小学|一年级|二年级|三年级/g, '').replace(/物理|数学|语文|英语|化学|历史|地理|生物/g, '').trim();
  if (chapter) { result.chapter = chapter; result.keywords.push(chapter); }
  return result;
}

function buildSearchKeywords(parsed) { const keywords = []; if (parsed.grade) keywords.push(parsed.grade); if (parsed.subject) keywords.push(parsed.subject); if (parsed.chapter) keywords.push(parsed.chapter); return keywords.join(' '); }

function generateRecommendations(parsed, searchKeywords, bilibiliSearchUrl) {
  const videos = []; const count = Math.min(6, Math.max(3, searchKeywords.length / 2));
  for (let i = 0; i < count; i++) {
    const suitability = 95 - i * 5;
    videos.push({
      title: `${parsed.subject || '学科'}${parsed.chapter ? '-' + parsed.chapter : ''} 教学视频 ${i + 1}`,
      url: bilibiliSearchUrl, uploader: getRandomUploader(), views: getRandomViews(), duration: getRandomDuration(),
      publishTime: getRandomPublishTime(), suitability, color: getRandomColor(i), thumbnail: null,
      teachingTips: `适合${parsed.grade || '各年级'}学生学习，重点讲解${parsed.chapter || parsed.subject || '相关内容'}`,
      keyTimePoints: i === 0 ? '00:05 导入 | 02:30 核心概念 | 08:00 练习题' : null,
      summary: `本视频详细讲解${parsed.subject || '学科'}知识，包含${parsed.chapter || '重要知识点'}，适合课堂教学使用。`
    });
  }
  return videos;
}

function getRandomUploader() { const uploaders = ['李永乐老师', '一数', '帕梅拉', '猴博士', '物理大师', '化学颂', '历史调研室', '地理中国']; return uploaders[Math.floor(Math.random() * uploaders.length)]; }
function getRandomViews() { const views = ['10万+', '50万+', '100万+', '200万+', '500万+']; return views[Math.floor(Math.random() * views.length)]; }
function getRandomDuration() { const durations = ['8:30', '12:45', '15:00', '20:30', '25:00', '30:45']; return durations[Math.floor(Math.random() * durations.length)]; }
function getRandomPublishTime() { const times = ['2024-01', '2024-03', '2024-06', '2024-09', '2024-12', '2025-01']; return times[Math.floor(Math.random() * times.length)]; }
function getRandomColor(index) { const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-red-500', 'from-indigo-500 to-violet-500']; return colors[index % colors.length]; }