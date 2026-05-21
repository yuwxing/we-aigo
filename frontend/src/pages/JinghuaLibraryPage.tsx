import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BOOKS = [
  { id: 'thinking-fast-slow', title: '思考，快与慢', author: '丹尼尔·卡尼曼', cover: '🧠', category: '认知科学', color: '#3b82f6', rating: '9.2', tags: ['诺贝尔奖', '决策', '偏见'], summary: '系统1与系统2的博弈，揭示人类思维的底层逻辑' },
  { id: 'structure-scientific-revolutions', title: '科学革命的结构', author: '托马斯·库恩', cover: '🔬', category: '科学哲学', color: '#10b981', rating: '9.0', tags: ['范式转换', '科学史', '经典'], summary: '范式转换如何推动科学进步，改写你对研究的认知' },
  { id: 'art-of-research', title: '研究的艺术', author: '韦恩·布斯', cover: '🎨', category: '研究方法', color: '#f59e0b', rating: '8.8', tags: ['研究方法', '写作', '必读'], summary: '从选题到成文，研究全流程的实操指南' },
  { id: 'sapiens', title: '人类简史', author: '尤瓦尔·赫拉利', cover: '🦍', category: '人类学', color: '#ec4899', rating: '9.1', tags: ['人类学', '叙事', '全球畅销'], summary: '从认知革命到AI时代，人类的过去与未来' },
  { id: 'guns-germs-steel', title: '枪炮、病菌与钢铁', author: '贾雷德·戴蒙德', cover: '🌍', category: '文明史', color: '#ef4444', rating: '8.9', tags: ['文明演化', '跨学科', '宏大叙事'], summary: '为什么是欧亚大陆征服了世界？地理决定论的终极论证' },
  { id: 'design-everyday-things', title: '设计心理学', author: '唐纳德·诺曼', cover: '🎯', category: '设计思维', color: '#8b5cf6', rating: '8.6', tags: ['用户体验', '设计', '心理学'], summary: '好设计的底层逻辑，从日常物品理解认知原理' },
  { id: 'algorithms-to-live-by', title: '算法之美', author: '布莱恩·克里斯汀', cover: '💻', category: '计算机科学', color: '#06b6d4', rating: '8.4', tags: ['算法', '生活智慧', '跨界'], summary: '计算机算法如何解决人类日常决策问题' },
  { id: 'lonely-crowd', title: '孤独的人群', author: '大卫·里斯曼', cover: '👥', category: '社会学', color: '#64748b', rating: '8.5', tags: ['社会性格', '美国人', '经典'], summary: '传统导向→内在导向→他人导向，社会性格的代际变迁' },
];

const CATEGORIES = ['全部', '认知科学', '科学哲学', '研究方法', '文明史', '设计思维', '人类学', '计算机科学', '社会学'];

export default function JinghuaLibraryPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('jinghua_favorites') || '[]');
    setFavorites(saved);
  }, []);

  const filteredBooks = selectedCategory === '全部' ? BOOKS : BOOKS.filter(b => b.category === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 16px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => navigate('/jinghua')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 18, fontSize: 16, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}><div style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>AI图书馆</div><div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>精选好书 · 在线阅读</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ background: selectedCategory === cat ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', border: selectedCategory === cat ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)', color: selectedCategory === cat ? '#c4b5fd' : 'rgba(255,255,255,0.5)', padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{cat}</button>
        ))}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 8 }}>
        {filteredBooks.map(book => {
          const isFavorite = favorites.includes(book.id);
          return (
            <div 
              key={book.id} 
              onClick={() => navigate(`/jinghua/library/${book.id}`)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
            >
              {isFavorite && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 14, zIndex: 1 }}>❤️</div>
              )}
              <div style={{ height: 100, background: `linear-gradient(135deg, ${book.color}40, ${book.color}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>{book.cover}</div>
              <div style={{ padding: 12 }}>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{book.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{book.author}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '1px 6px', borderRadius: 8, fontSize: 10 }}>⭐ {book.rating}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>{book.summary}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
