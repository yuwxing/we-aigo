import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, GraduationCap, ChevronLeft, Wand2, Copy, Check, BookOpen, FlaskConical, Globe, Calculator, Leaf, Wrench, Map, Zap, Cpu, Microscope } from 'lucide-react';
import { Card } from '../components/ui';

// 8个预设教学场景
const presetScenes = [
  { name: '化学实验', emoji: '🧪', desc: '试管反应装置图', icon: FlaskConical, params: { subject: '化学', topic: '实验室制取氧气', grade: '初中', imageType: '示意图', style: '写实风格' } },
  { name: '地形地貌', emoji: '🌍', desc: '喀斯特地貌形成过程', icon: Globe, params: { subject: '地理', topic: '喀斯特地貌形成过程', grade: '高中', imageType: '流程图', style: '信息图' } },
  { name: '数学几何', emoji: '🔢', desc: '勾股定理证明图', icon: Calculator, params: { subject: '数学', topic: '勾股定理证明', grade: '初中', imageType: '结构图', style: '简笔画' } },
  { name: '生物细胞', emoji: '🌱', desc: '植物细胞结构图', icon: Leaf, params: { subject: '生物', topic: '植物细胞结构', grade: '初中', imageType: '结构图', style: '卡通风格' } },
  { name: '物理力学', emoji: '📐', desc: '力的分解与合成', icon: Wrench, params: { subject: '物理', topic: '力的分解与合成', grade: '高中', imageType: '示意图', style: '写实风格' } },
  { name: '历史地图', emoji: '🗺️', desc: '丝绸之路路线图', icon: Map, params: { subject: '历史', topic: '丝绸之路路线', grade: '初中', imageType: '场景图', style: '手绘风' } },
  { name: 'DNA结构', emoji: '🧬', desc: '双螺旋模型', icon: Microscope, params: { subject: '生物', topic: 'DNA双螺旋结构', grade: '高中', imageType: '结构图', style: '信息图' } },
  { name: '电路图', emoji: '⚡', desc: '串联并联电路', icon: Zap, params: { subject: '物理', topic: '串联电路与并联电路', grade: '初中', imageType: '示意图', style: '写实风格' } },
];

// 学科列表
const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '信息技术'];
// 年级列表
const grades = ['小学', '初中', '高中', '大学'];
// 图片类型列表
const imageTypes = ['示意图', '流程图', '结构图', '思维导图', '场景图', '数据图表'];
// 风格列表
const styles = ['卡通风格', '写实风格', '简笔画', '信息图', '扁平化', '手绘风'];

// 表单初始状态
const emptyForm = { subject: '', topic: '', grade: '', imageType: '', style: '' };

export const WordCardPage: React.FC = () => {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [copiedType, setCopiedType] = useState<'positive' | 'negative' | null>(null);
  const [result, setResult] = useState<{ positive: string; negative: string } | null>(null);

  const handlePresetClick = (preset: typeof presetScenes[0]) => {
    setForm(preset.params);
    setMode('custom');
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.topic || !form.grade || !form.imageType || !form.style) {
      return;
    }
    setSubmitting(true);
    
    // 模拟API调用，实际项目中可以调用后端API
    setTimeout(() => {
      generateLocalPrompt();
      setSubmitting(false);
    }, 1500);
  };

  // 本地提示词生成 - 生成中文自然语言描述，适配豆包对话式生图
  const generateLocalPrompt = () => {
    const subjectDesc = inferSubjectDesc(form.subject);
    const imageTypeDesc = inferImageTypeDesc(form.imageType);
    const styleDesc = inferStyleDesc(form.style);
    const gradeDesc = inferGradeDesc(form.grade);
    
    // 生成自然中文描述，豆包能直接理解
    const prompt = `请生成一张${form.subject}教学${form.imageType}，内容是"${form.topic}"，面向${form.grade}学生。${subjectDesc}${imageTypeDesc}${styleDesc}${gradeDesc}画面要清晰、科学准确，适合用作教学课件配图。`;

    setResult({ positive: prompt, negative: '' });
  };

  const inferSubjectDesc = (subject: string) => {
    const subjectMap: Record<string, string> = {
      '化学': '画面需要展示化学实验装置、反应过程或分子结构，',
      '物理': '画面需要展示物理原理、力学分析、电路或光学现象，',
      '生物': '画面需要展示生物结构、细胞组织、生命过程或生态系统，',
      '地理': '画面需要展示地形地貌、气候分布、地理现象或区域特征，',
      '数学': '画面需要展示几何图形、函数图像、数学关系或证明过程，',
      '历史': '画面需要展示历史场景、时间线、古代文明或重要事件，',
      '语文': '画面需要展示文学意境、诗词场景或经典故事画面，',
      '英语': '画面需要展示英语学习场景、词汇图解或语法示意，',
      '政治': '画面需要展示政治制度、经济关系或社会结构，',
      '信息技术': '画面需要展示计算机结构、网络原理或程序逻辑，',
    };
    return subjectMap[subject] || '';
  };

  const inferImageTypeDesc = (imageType: string) => {
    const typeMap: Record<string, string> = {
      '示意图': '用简洁的示意图呈现，标注关键部分，',
      '流程图': '用流程图呈现，用箭头标明步骤顺序，',
      '结构图': '用结构图呈现，展示各组成部分的关系，',
      '思维导图': '用思维导图呈现，中心主题向外展开分支，',
      '场景图': '用场景图呈现，展示真实的情境画面，',
      '数据图表': '用数据图表呈现，清晰展示数值和趋势，',
    };
    return typeMap[imageType] || '';
  };

  const inferStyleDesc = (style: string) => {
    const styleMap: Record<string, string> = {
      '卡通风格': '风格：卡通可爱，色彩鲜明，造型简洁有趣。',
      '写实风格': '风格：写实精细，细节丰富，科学严谨。',
      '简笔画': '风格：简笔画，线条清晰简洁，重点突出。',
      '信息图': '风格：信息图设计，扁平化配色，现代感强。',
      '扁平化': '风格：扁平化设计，纯色块拼接，干净利落。',
      '手绘风': '风格：手绘风格，笔触自然温暖，有纸张质感。',
    };
    return styleMap[style] || '';
  };

  const inferGradeDesc = (grade: string) => {
    const gradeMap: Record<string, string> = {
      '小学': '内容要简单易懂，色彩丰富活泼。',
      '初中': '内容要清晰明了，适度加入细节。',
      '高中': '内容要详细专业，注重科学准确性。',
      '大学': '内容要深入专业，达到学术论文配图水准。',
    };
    return gradeMap[grade] || '';
  };

  const handleCopy = (text: string, type: 'positive' | 'negative') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">教学图片生成器</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">一键生成教学配图提示词</h1>
        <p className="text-slate-500">填写教学场景参数，AI智能体帮你生成专业教学图片</p>
      </div>

      {/* 返回AI创作工坊链接 */}
      <div className="flex justify-center">
        <Link 
          to="/create"
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回AI创作工坊（人物绘画）</span>
        </Link>
      </div>

      {/* Mode Switch */}
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => setMode('preset')} 
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            mode === 'preset' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          🎯 场景预设
        </button>
        <button 
          onClick={() => setMode('custom')} 
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            mode === 'custom' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ✏️ 自由创作
        </button>
      </div>

      {/* Preset Mode */}
      {mode === 'preset' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {presetScenes.map((preset) => (
            <button 
              key={preset.name} 
              onClick={() => handlePresetClick(preset)}
              className="p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-purple-100 transition-colors">
                <preset.icon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="font-medium text-slate-800 group-hover:text-blue-600">{preset.name}</div>
              <div className="text-xs text-slate-400 mt-1">{preset.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Custom Form */}
      {mode === 'custom' && (
        <Card className="!p-6 space-y-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Wand2 className="w-5 h-5 text-blue-500" />
            教学场景参数
          </div>
          <p className="text-sm text-slate-500">请填写5项教学相关参数，AI将生成专业配图提示词</p>

          <div className="space-y-4">
            {/* 学科科目 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <BookOpen className="w-4 h-4 text-blue-500" /> 1. 学科科目
              </label>
              <select 
                value={form.subject} 
                onChange={e => setForm(f => ({...f, subject: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">请选择学科</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* 知识点 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Cpu className="w-4 h-4 text-purple-500" /> 2. 知识点
              </label>
              <input 
                type="text" 
                value={form.topic} 
                onChange={e => setForm(f => ({...f, topic: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="如：光合作用过程、二次函数图像、辛亥革命" 
              />
            </div>

            {/* 年级学段 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <GraduationCap className="w-4 h-4 text-green-500" /> 3. 年级学段
              </label>
              <div className="grid grid-cols-4 gap-2">
                {grades.map(g => (
                  <button
                    key={g}
                    onClick={() => setForm(f => ({...f, grade: g}))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.grade === g 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* 图片类型 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Sparkles className="w-4 h-4 text-pink-500" /> 4. 图片类型
              </label>
              <div className="grid grid-cols-3 gap-2">
                {imageTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({...f, imageType: t}))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.imageType === t 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 风格要求 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Wand2 className="w-4 h-4 text-orange-500" /> 5. 风格要求
              </label>
              <div className="grid grid-cols-3 gap-2">
                {styles.map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({...f, style: s}))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.style === s 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={submitting || !form.subject || !form.topic || !form.grade || !form.imageType || !form.style}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {submitting ? 'AI智能体生成中...' : '一键生成提示词'}
          </button>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="!p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-slate-800">提示词已生成</span>
          </div>
          
          {/* 使用引导 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="font-semibold text-slate-800 mb-1">复制提示词，去豆包生图</p>
                <ol className="text-sm text-slate-600 space-y-1">
                  <li>1. 点击「复制提示词」按钮</li>
                  <li>2. 打开豆包 → 对话框粘贴</li>
                  <li>3. 发送即可生成教学配图</li>
                </ol>
              </div>
            </div>
          </div>
          
          {/* 提示词 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">📝 生图提示词</span>
              <button 
                onClick={() => handleCopy(result.positive, 'positive')}
                className={`text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                  copiedType === 'positive' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
              >
                {copiedType === 'positive' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedType === 'positive' ? '已复制✓' : '复制提示词'}
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-sm whitespace-pre-wrap text-slate-700 border border-blue-100 leading-relaxed">
              {result.positive}
            </div>
          </div>
          
          {/* 快捷跳转豆包 */}
          <div className="pt-3 border-t border-slate-100">
            <a
              href="https://www.doubao.com/chat/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold text-base hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 no-underline"
            >
              🎨 打开豆包生图
            </a>
            <p className="text-xs text-slate-400 text-center mt-2">打开豆包对话，粘贴提示词发送即可</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WordCardPage;
