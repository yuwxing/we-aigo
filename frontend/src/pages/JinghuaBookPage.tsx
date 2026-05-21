import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const WORKER_URL = 'https://ai-wego-worker.ai-wego-api.workers.dev';

const BOOKS: Record<string, {
  title: string; author: string; cover: string; category: string; color: string;
  rating: string; tags: string[]; summary: string;
  aiGuide: string; keyConcepts: { name: string; desc: string }[];
  readTime: string; suitableFor: string;
  chapters: {
    title: string; readTime: string; summary: string;
    keyPoints: string[]; annotations: { marker: string; note: string }[];
    thinkQuestion: string;
  }[];
}> = {
  'thinking-fast-slow': {
    title: '思考，快与慢', author: '丹尼尔·卡尼曼', cover: '🧠',
    category: '认知科学', color: '#3b82f6', rating: '9.2',
    tags: ['诺贝尔奖', '决策', '偏见'],
    summary: '系统1与系统2的博弈，揭示人类思维的底层逻辑',
    aiGuide: '这是一本改变你思维方式的书。卡尼曼用40年的研究告诉我们：人类的大脑有两种思考模式——快速直觉的系统1和缓慢理性的系统2。理解这两个系统，你就能在研究中避免认知陷阱，做出更严谨的判断。',
    keyConcepts: [
      { name: '系统1', desc: '快速、自动、直觉的思维，占日常思考95%' },
      { name: '系统2', desc: '缓慢、费力、理性的思维，需主动调动' },
      { name: '锚定效应', desc: '先入为主的信息严重影响后续判断' },
      { name: '可得性启发', desc: '越容易想到的事例越容易被高估概率' },
    ],
    readTime: '约30分钟', suitableFor: '所有研究者，特别是做实验设计和数据分析的',
    chapters: [
      {
        title: '两个系统', readTime: '8分钟',
        summary: '我们的大脑有两种运行方式。系统1是自动的、快速的，它让你一眼识别朋友的脸；系统2是费力的、缓慢的，它让你计算17×24。问题在于：系统1总是抢先回答，而系统2常常懒得核查。',
        keyPoints: ['系统1是自动运行的，你无法关闭它', '系统2很懒，只有在系统1遇到困难时才被激活', '大部分错误不是因为不聪明，而是因为系统2太懒了'],
        annotations: [
          { marker: '系统1是自动运行的', note: '你在研究中的第一反应往往是偏见驱动的。看到数据时的"直觉判断"很可能是系统1在作祟，需要用系统2来核查。' },
          { marker: '系统2很懒', note: '这解释了为什么论文中的逻辑漏洞很难自己发现——你读了太多遍，系统2不再认真核查了。建议：写完论文后间隔一周再审阅。' },
        ],
        thinkQuestion: '你在研究中哪些决策是系统1做出的？哪些经过了系统2的审查？',
      },
      {
        title: '锚定效应', readTime: '8分钟',
        summary: '如果你先看到一个数字（哪怕它毫无关系），你的判断会被这个数字"锚定"。转盘停在10的人估计非洲国家占联合国25%，停在65的人估计45%。同一个问题差了20个百分点，仅仅因为一个随机数字。',
        keyPoints: ['锚定效应无处不在，连专家也难以免疫', '谈判中的第一报价就是最典型的锚', '对抗锚定的唯一方法：主动寻找反面证据'],
        annotations: [
          { marker: '连专家也难以免疫', note: '这在同行评审中特别危险——评审人看到的第一篇论文质量会影响对后续论文的判断。这也是为什么双盲评审更公平。' },
        ],
        thinkQuestion: '你选择研究课题时，是否被最初的文献"锚定"了？',
      },
      {
        title: '可得性启发', readTime: '8分钟',
        summary: '我们判断一件事的频率时，依据的是"想到相关例子的容易程度"而不是真实数据。911之后美国人大量避免坐飞机，但开车更危险——因为飞机失事的画面更"可得"。',
        keyPoints: ['媒体报道越多的事件越容易被高估概率', '亲身经历比统计数据更有"可得性"', '学术研究中：最近读到的文献更容易被引用'],
        annotations: [
          { marker: '最近读到的文献更容易被引用', note: '这就是为什么文献综述要系统检索——如果你只引用最近读到的文献，你的综述就会有偏差。用PRISMA等系统性检索策略来对抗可得性偏见。' },
        ],
        thinkQuestion: '你的文献综述中是否存在"可得性偏差"——引用的大多是最近读到的文献？',
      },
    ]
  },
  'structure-scientific-revolutions': {
    title: '科学革命的结构', author: '托马斯·库恩', cover: '🔬',
    category: '科学哲学', color: '#10b981', rating: '9.0',
    tags: ['范式转换', '科学史', '经典'],
    summary: '范式转换如何推动科学进步，改写你对研究的认知',
    aiGuide: '库恩告诉我们：科学不是线性进步的，而是通过"范式转换"跳跃式发展。这本书会彻底改变你对"科学研究"的理解。',
    keyConcepts: [
      { name: '范式', desc: '科学共同体共享的理论框架和方法论' },
      { name: '常规科学', desc: '在范式内进行的解谜活动' },
      { name: '反常', desc: '现有范式无法解释的现象' },
      { name: '范式转换', desc: '旧范式被新范式替代的根本性变革' },
    ],
    readTime: '约25分钟', suitableFor: '所有研究者，理解自己学科的发展阶段',
    chapters: [
      {
        title: '常规科学的本质', readTime: '8分钟',
        summary: '常规科学不是发现新事物，而是在范式框架内"解谜"。大多数科学家的大部分时间都在做"扫尾工作"——验证、精确化、扩展已有理论，而不是质疑根本假设。',
        keyPoints: ['常规科学的目标是让理论与观测更精确匹配', '科学家被训练成在范式内工作', '重大突破往往来自"局外人"'],
        annotations: [
          { marker: '重大突破往往来自局外人', note: '跨学科研究的价值就在这里——你从一个范式中带来的工具和视角，可能是另一个范式急需的。不要害怕做"局外人"。' },
        ],
        thinkQuestion: '你目前的研究是在"范式内解谜"还是"挑战范式"？',
      },
      {
        title: '反常与危机', readTime: '8分钟',
        summary: '当范式内出现越来越多无法解释的现象时，常规科学开始动摇。科学家尝试各种修补，但反常继续累积，最终信任崩溃，进入危机期。危机不是坏事，它是新范式诞生前的阵痛。',
        keyPoints: ['反常一开始会被忽视或压制', '修补是第一反应，但修补越多范式越脆弱', '危机的标志：科学家开始质疑方法论本身'],
        annotations: [
          { marker: '反常一开始会被忽视', note: '如果你的研究结果与主流理论矛盾，不要轻易放弃。历史上很多重大发现都是从"反常"开始的。当然，先排除自己方法的问题。' },
        ],
        thinkQuestion: '你的研究领域有没有"被忽视的反常"？你有勇气去面对它吗？',
      },
      {
        title: '范式转换', readTime: '8分钟',
        summary: '范式转换不是理性的"比较和选择"，而更像"格式塔转换"——你看到的还是同样的世界，但组织方式完全不同了。新旧范式之间不可通约，因为它们用不同的标准评判什么是好的解释。',
        keyPoints: ['范式转换不是渐进的，而是跳跃式的', '新范式不是旧范式的简单扩展', '竞争范式之间往往"说不通"'],
        annotations: [
          { marker: '全新的视角', note: 'AI对科学研究的影响可能就是一次范式转换——不是用AI加速传统方法，而是用AI重新定义什么是"研究"。' },
        ],
        thinkQuestion: 'AI是否正在引发你所在学科的范式转换？',
      },
    ]
  },
  'art-of-research': {
    title: '研究的艺术', author: '韦恩·布斯', cover: '🎨',
    category: '研究方法', color: '#f59e0b', rating: '8.8',
    tags: ['研究方法', '写作', '必读'],
    summary: '从选题到成文，研究全流程的实操指南',
    aiGuide: '这是写给每一个做研究的人的实用指南。不管你是本科生还是博士，这本书都能帮你解决选题、论证、写作的具体问题。它是研究方法的"操作系统"。',
    keyConcepts: [
      { name: '研究对话', desc: '做研究就是加入一个持续对话' },
      { name: '论证三要素', desc: '主张+理由+证据，缺一不可' },
      { name: '读者意识', desc: '写作时始终想着你的读者' },
    ],
    readTime: '约25分钟', suitableFor: '正在写论文的每一个人',
    chapters: [
      {
        title: '从问题到研究', readTime: '8分钟',
        summary: '好研究始于好问题。布斯建议：不要一开始就找"答案"，而是先找一个值得追问的"问题"。从"我注意到X"到"我想知道为什么X"再到"如果X成立，那意味着什么"。',
        keyPoints: ['选题的本质是找到值得追问的问题', '好问题有三个特征：具体、可研究、有意义', '从日常生活和阅读中都能发现问题'],
        annotations: [
          { marker: '从日常生活和阅读中都能发现问题', note: '这也是AI图书馆的价值——你读到某个概念时觉得"这不对"或"这还能更深入"，那就是选题的起点。读书笔记要记下你的疑问，而不只是摘录。' },
        ],
        thinkQuestion: '你最近有没有因为某个发现而觉得"不对劲"？那就是选题的起点。',
      },
      {
        title: '构建论证', readTime: '8分钟',
        summary: '论证不是堆砌证据，而是用理由把证据和主张连接起来。布斯的框架：主张←理由←证据←承认←回应。五要素齐全，论证才站得住。',
        keyPoints: ['主张必须明确、可争议', '理由是连接证据和主张的逻辑桥梁', '承认并回应反对意见，反而增强论证力量'],
        annotations: [
          { marker: '承认并回应反对意见', note: '很多论文的"讨论"部分太弱，就是因为只说了支持自己的证据，没有预判和回应反对。好的讨论应该像辩论赛——先替对手把最有力的话说了，然后反驳它。' },
        ],
        thinkQuestion: '你的论文中，最可能被质疑的观点是什么？你有没有提前回应？',
      },
    ]
  },
  'sapiens': {
    title: '人类简史', author: '尤瓦尔·赫拉利', cover: '🦍',
    category: '人类学', color: '#ec4899', rating: '9.1',
    tags: ['人类学', '叙事', '全球畅销'],
    summary: '从认知革命到AI时代，人类的过去与未来',
    aiGuide: '赫拉利用一个核心论点贯穿全书：智人之所以统治地球，是因为我们拥有"虚构故事"的能力。理解这一点，你就理解了人类社会的底层代码。',
    keyConcepts: [
      { name: '认知革命', desc: '7万年前，智人获得了虚构和想象的能力' },
      { name: '虚构故事', desc: '货币、法律、公司都是"共同的想象"' },
      { name: '农业革命陷阱', desc: '进步可能是个陷阱——小麦驯化了人类' },
    ],
    readTime: '约20分钟', suitableFor: '想理解人类社会底层逻辑的人',
    chapters: [
      {
        title: '认知革命', readTime: '10分钟',
        summary: '7万年前，智人的大脑发生了关键突变——我们开始能谈论并相信"不存在的事物"。猴子能说"河边有狮子"，但只有人类能说"河边的守护灵要求我们这样做"。这种虚构能力让智人突破了150人的社交上限，实现大规模协作。',
        keyPoints: ['虚构能力是智人最独特、最强大的工具', '所有社会制度都是"共同的想象"', '大规模协作的基础是共同相信的故事'],
        annotations: [
          { marker: '共同相信的故事', note: '学术共同体也是靠"共同故事"维系的——范式就是"共同故事"。你在论文中引用经典理论，本质上是在说"我也相信这个故事"。' },
        ],
        thinkQuestion: '你研究的领域里，有哪些"共同相信的故事"可能只是虚构？',
      },
    ]
  },
  'guns-germs-steel': {
    title: '枪炮、病菌与钢铁', author: '贾雷德·戴蒙德', cover: '🌍',
    category: '文明史', color: '#ef4444', rating: '8.9',
    tags: ['文明演化', '跨学科', '宏大叙事'],
    summary: '为什么是欧亚大陆征服了世界？地理决定论的终极论证',
    aiGuide: '戴蒙德用跨学科方法回答了一个宏大问题。答案不是种族优劣，而是地理。这本书教会你如何做跨学科的因果论证。',
    keyConcepts: [
      { name: '大陆轴线', desc: '东西走向让同纬度农业技术快速传播' },
      { name: '驯化不平等', desc: '适合驯化的动植物恰好集中在欧亚大陆' },
      { name: '地理决定论', desc: '地理从根本上塑造文明发展轨迹' },
    ],
    readTime: '约20分钟', suitableFor: '对跨学科研究、因果推理感兴趣的人',
    chapters: [
      {
        title: '大陆轴线的力量', readTime: '10分钟',
        summary: '欧亚大陆是东西走向的，同一纬度带气候相似，作物和技术能从中国一路传播到西班牙。而美洲和非洲是南北走向，穿越几个气候带，农业传播极其缓慢。这个简单的地理差异，导致了文明发展速度的巨大差异。',
        keyPoints: ['东西走向=同纬度=气候相似=农业快速传播', '南北走向=不同气候=适应性障碍=发展缓慢', '地理不是命运，但它是起点条件'],
        annotations: [
          { marker: '地理不是命运', note: '这是一个很好的因果论证范例——找到最底层的自变量（地理），层层推导到因变量（文明差距）。你的论文也可以尝试"追根溯源"的论证结构。' },
        ],
        thinkQuestion: '你研究的问题中，有没有被忽视的"底层变量"？',
      },
    ]
  },
  'design-everyday-things': {
    title: '设计心理学', author: '唐纳德·诺曼', cover: '🎯',
    category: '设计思维', color: '#8b5cf6', rating: '8.6',
    tags: ['用户体验', '设计', '心理学'],
    summary: '好设计的底层逻辑，从日常物品理解认知原理',
    aiGuide: '诺曼告诉我们：如果你不会用，不是你笨，是设计差。这本书的"可供性""映射""反馈"概念，能改善你的论文和演讲的表达。',
    keyConcepts: [
      { name: '可供性', desc: '物品本身暗示它的使用方式' },
      { name: '映射', desc: '控制操作和结果的对应要自然直观' },
      { name: '反馈', desc: '每个操作都应该有即时可感知的响应' },
    ],
    readTime: '约20分钟', suitableFor: '做UI/UX设计、学术表达、演讲展示的人',
    chapters: [
      {
        title: '可供性的力量', readTime: '10分钟',
        summary: '一扇门如果是拉的，就不应该有推的把手。这些看似简单的道理常被忽视。诺曼称这些"暗示使用方式"的特性为"可供性"——好的设计让正确操作显而易见，让错误操作不可能发生。',
        keyPoints: ['可供性是物品暗示使用方式的特性', '好的设计不需要说明书', '如果用户犯错，错在设计师不在用户'],
        annotations: [
          { marker: '如果用户犯错', note: '这个原则同样适用于论文写作——如果读者误解了你的论文，不是读者笨，是你没写清楚。你的论证结构应该有"可供性"——让读者自然地跟着逻辑走。' },
        ],
        thinkQuestion: '你的论文中，有没有让读者"不知道该推还是该拉"的地方？',
      },
    ]
  },
  'algorithms-to-live-by': {
    title: '算法之美', author: '布莱恩·克里斯汀', cover: '💻',
    category: '计算机科学', color: '#06b6d4', rating: '8.4',
    tags: ['算法', '生活智慧', '跨界'],
    summary: '计算机算法如何解决人类日常决策问题',
    aiGuide: '排序算法告诉你如何整理书架，探索-利用算法告诉你什么时候尝试新事物。计算机科学其实是人类决策的数学化表达。',
    keyConcepts: [
      { name: '探索-利用', desc: '尝试新选项还是坚持已知最好的？' },
      { name: '排序', desc: '最优排序策略取决于数据特征' },
      { name: '缓存', desc: '把最常用的东西放在最近的地方' },
    ],
    readTime: '约20分钟', suitableFor: '对AI算法和决策科学感兴趣的人',
    chapters: [
      {
        title: '探索与利用的平衡', readTime: '10分钟',
        summary: '去那家已证明好吃的老店（利用），还是尝试新店（探索）？这个看似简单的问题是最深刻的难题之一。最优策略：时间充裕时多探索，时间有限时多利用。',
        keyPoints: ['探索-利用是所有决策的根本矛盾', '年轻时应多探索，年长时应多利用——数学上的最优解', '"后悔最小化"：选择让你未来后悔最少的选项'],
        annotations: [
          { marker: '年轻时应多探索', note: '对研究者来说：在研究早期（硕博阶段）应广泛探索不同方向；到了职业中期应聚焦深耕。如果你还在探索期，不要因为"不够聚焦"而焦虑。' },
        ],
        thinkQuestion: '你目前的研究策略偏向探索还是利用？按你的学术阶段合理吗？',
      },
    ]
  },
  'lonely-crowd': {
    title: '孤独的人群', author: '大卫·里斯曼', cover: '👥',
    category: '社会学', color: '#64748b', rating: '8.5',
    tags: ['社会性格', '美国人', '经典'],
    summary: '传统导向→内在导向→他人导向，社会性格的代际变迁',
    aiGuide: '里斯曼的类型学不仅能理解美国社会，也能理解当代中国——社交媒体时代的"他人导向"更加强化了。',
    keyConcepts: [
      { name: '传统导向', desc: '行为标准来自传统和祖辈' },
      { name: '内在导向', desc: '内心有明确的指南针' },
      { name: '他人导向', desc: '行为标准来自同龄人' },
    ],
    readTime: '约20分钟', suitableFor: '对类型学方法、社会变迁研究感兴趣的人',
    chapters: [
      {
        title: '三种社会性格', readTime: '10分钟',
        summary: '传统导向的人遵循祖辈规矩；内在导向的人内化了父母期望，像有内置陀螺仪的箭；他人导向的人对同伴态度极其敏感，追求的不是"做正确的事"而是"被喜欢"。',
        keyPoints: ['三种导向不是好坏之分，而是适应不同社会形态', '内在导向适合开拓时代，他人导向适合消费社会', '社交媒体正在把更多人推向"他人导向"'],
        annotations: [
          { marker: '社交媒体正在把更多人推向他人导向', note: '学术圈也成立——"追热点"而非"追好奇心"就是他人导向的科研。你的选题是因为真的好奇，还是因为容易发文章？' },
        ],
        thinkQuestion: '你的研究选题是内在导向还是他人导向？',
      },
    ]
  },

  // ==================== 理解AI时代书单 ====================
  'shehuixinlixue': {
    title: '社会心理学', author: '戴维·迈尔斯', cover: '👥',
    category: '理解人', color: '#6366f1', rating: '8.8',
    tags: ['社会影响', '从众', '偏见'],
    summary: '理解个体在社会中的心理机制——从众、服从、偏见与群体动力',
    aiGuide: '社会心理学研究人在社会中的心理——为什么我们会从众？为什么旁观者越多，伸出援手的可能性越低？赫拉利的《人类简史》本质上就是一部社会心理学巨著，理解社会心理是理解人类协作的基础。',
    readTime: '约40分钟', suitableFor: '对传播学、教育、管理、AI社会影响感兴趣的读者',
    chapters: [
      { title: '社会影响', readTime: '10分钟', summary: '从众、服从与顺从的社会心理机制', keyPoints: ['社会认同理论：跟随群体也是跟随身份认同', '从众的原因：信息性社会影响+规范性社会影响'], annotations: [], thinkQuestion: 'AI推荐算法如何利用社会影响原理？' },
      { title: '偏见与歧视', readTime: '10分钟', summary: '偏见的形成机制与消除策略', keyPoints: ['内隐偏见：即使嘴上说平等，潜意识也有偏见', '刻板印象威胁：被提醒负面刻板印象会降低表现'], annotations: [], thinkQuestion: 'AI系统中的偏见从哪来？' },
    ]
  },
  'wuqezhong': {
    title: '乌合之众', author: '古斯塔夫·勒庞', cover: '🎭',
    category: '理解人', color: '#8b5cf6', rating: '8.6',
    tags: ['群体心理', '领袖', '非理性'],
    summary: '群体心理的经典之作，揭示集体行为的非理性本质',
    aiGuide: '勒庞1895年写的这本书，关于群体情绪、非理性、领袖操控的洞察今天依然精准。互联网时代让乌合之众的力量放大了千万倍。理解群体心理是理解舆论、民粹和一切大规模社会现象的前提。赫拉利在《人类简史》中也大量运用了勒庞的群体心理框架。',
    readTime: '约20分钟', suitableFor: '对传播学、政治学、舆论研究感兴趣的读者',
    chapters: [
      { title: '群体特征', readTime: '8分钟', summary: '个体融入群体后的心理变化', keyPoints: ['群体中的个体责任感分散', '情绪传染在社交媒体上比线下更强'], annotations: [], thinkQuestion: '网络舆论事件中的群体心理有哪些特征？' },
      { title: '领袖操控', readTime: '6分钟', summary: '断言、重复和传染三步操控法', keyPoints: ['断言的重复是最有效的操控手段', '现代媒体让断言的传播速度提升了千万倍'], annotations: [], thinkQuestion: 'AI时代谁在扮演群体领袖的角色？' },
    ]
  },
  'minzhuzhuyiyujiaoyu': {
    title: '民主主义与教育', author: '约翰·杜威', cover: '🏫',
    category: '理解教育', color: '#0ea5e9', rating: '9.0',
    tags: ['杜威', '教育民主', '做中学'],
    summary: '杜威的实用主义教育哲学——教育即生活、学校即社会',
    aiGuide: '杜威是20世纪最重要的教育哲学家。以做中学为核心，他主张教育不是为未来生活做准备，教育本身就是生活。在AI时代，学会学习比学会知识更重要的洞见比以往任何时候都更紧迫。',
    readTime: '约30分钟', suitableFor: '所有关心教育的人',
    chapters: [
      { title: '教育即经验', readTime: '10分钟', summary: '教育是经验的持续重组', keyPoints: ['好的经验有两个标准：互动性和延伸性', '教育的目标是培养持续学习的能力而非装满知识'], annotations: [], thinkQuestion: 'AI时代，什么样的经验最有价值？' },
      { title: '做中学', readTime: '8分钟', summary: '通过实践和解决问题来学习', keyPoints: ['思维不是孤立发生的，它发生在行动中', '项目式学习是杜威理念的现代体现'], annotations: [], thinkQuestion: '你如何把做中学应用到你的研究中？' },
    ]
  },
  'aimier': {
    title: '爱弥儿', author: '让-雅克·卢梭', cover: '🌱',
    category: '理解教育', color: '#14b8a6', rating: '8.7',
    tags: ['卢梭', '自然教育', '儿童'],
    summary: '自然主义教育经典，尊重儿童发展规律',
    aiGuide: '卢梭说教育始于出生。他在18世纪就提出要尊重儿童的天性和发展节奏，这比现代发展心理学早了两百年。读这本书，理解什么叫做不破坏性的教育。在AI时代，卢梭关于过早的理性教育会破坏自然发展的警示尤其值得深思。',
    readTime: '约25分钟', suitableFor: '教育工作者和家长',
    chapters: [
      { title: '自然教育', readTime: '10分钟', summary: '尊重儿童自然发展的教育', keyPoints: ['教育要跟随儿童的发展阶段，而不是强迫推进', '儿童是通过感官和行动来认识世界的'], annotations: [], thinkQuestion: '当代教育中有哪些违背自然教育原则的做法？' },
      { title: '消极教育', readTime: '8分钟', summary: '教育者的任务是保护而非灌输', keyPoints: ['最好的教育是创造条件让儿童自己发现', '过早的理性教育会破坏儿童的自然发展'], annotations: [], thinkQuestion: '这对AI时代的人才培养有什么启示？' },
    ]
  },
  'xuehuishengcun': {
    title: '学会生存', author: 'UNESCO教育报告', cover: '📚',
    category: '理解教育', color: '#84cc16', rating: '8.5',
    tags: ['UNESCO', '终身学习', '未来教育'],
    summary: 'UNESCO教育报告，定义21世纪教育的四大支柱',
    aiGuide: '这本书提出了学会认知、学会做事、学会共处、学会生存四大教育支柱。1972年的报告，预言了终身学习、学习的个性化等理念。在AI时代，这四大支柱的内涵发生了巨变——学会共处不仅是与人共处，也包括与AI共处。',
    readTime: '约20分钟', suitableFor: '教育政策制定者和实践者',
    chapters: [
      { title: '终身学习', readTime: '8分钟', summary: '一次教育无法支撑一生', keyPoints: ['知识更新速度越来越快，终身学习从选择变成必须', '学习能力的培养比学习内容更重要'], annotations: [], thinkQuestion: 'AI时代，终身学习的内涵发生了什么变化？' },
    ]
  },
  'yuletaizhi': {
    title: '娱乐至死', author: '尼尔·波兹曼', cover: '📺',
    category: '理解技术', color: '#f59e0b', rating: '8.9',
    tags: ['媒介理论', '奥威尔', '赫胥黎'],
    summary: '媒介即隐喻——娱乐正在消解严肃公共话语',
    aiGuide: '奥威尔担心的是极权窒息，赫胥黎担心的是娱乐至死。波兹曼说我们正在变成后者。电视和社交媒体把一切变成娱乐。在AI时代，波兹曼的问题变成了：ChatGPT是娱乐的工具还是思考的工具？',
    readTime: '约25分钟', suitableFor: '关心媒体、文化、教育的人',
    chapters: [
      { title: '媒介即隐喻', readTime: '10分钟', summary: '媒介形式塑造内容本身', keyPoints: ['口语媒介产生史诗，印刷媒介产生论证，电视媒介产生娱乐', 'AI时代的新媒介形式在塑造什么样的思维？'], annotations: [], thinkQuestion: '你每天使用的AI工具在如何塑造你的思维？' },
      { title: '娱乐的逻辑', readTime: '8分钟', summary: '为什么一切都被娱乐化了', keyPoints: ['娱乐不需要理由，它逃避痛苦、追求快感', '严肃内容要获得关注必须披上娱乐外衣'], annotations: [], thinkQuestion: 'AI生成内容是增强了还是削弱了娱乐化趋势？' },
    ]
  },
  'shikong': {
    title: '失控', author: '凯文·凯利', cover: '🌐',
    category: '理解技术', color: '#10b981', rating: '9.1',
    tags: ['KK', '复杂性', '分布式'],
    summary: 'KK观察技术文明的史诗级巨作，预见互联网和AI',
    aiGuide: '凯文·凯利1994年写的书，预言了云计算、众包、物联网、区块链等几乎所有后来的重要技术趋势。他用生物学的逻辑理解技术——分布式、自组织、涌现。在AI时代，KK关于涌现和分布式智慧的洞见是理解大语言模型为什么有效的关键。',
    readTime: '约35分钟', suitableFor: '科技从业者和未来学爱好者',
    chapters: [
      { title: '分布式', readTime: '12分钟', summary: '无中心的自组织系统', keyPoints: ['蜂群思维：没有中央控制，但整体比个体聪明', '互联网和AI都是分布式系统的胜利'], annotations: [], thinkQuestion: 'AI大模型是分布式的胜利还是集中的体现？' },
      { title: '涌现', readTime: '10分钟', summary: '整体大于部分之和', keyPoints: ['蚂蚁没有智慧，蚁群有；神经元没有意识，大脑有', 'AI的智能是涌现的吗？'], annotations: [], thinkQuestion: '什么规模的系统开始涌现智能？' },
    ]
  },
  'jishulongduan': {
    title: '技术垄断', author: '尼尔·波兹曼', cover: '⚙️',
    category: '理解技术', color: '#ef4444', rating: '8.6',
    tags: ['波斯曼', '技术批判', '尼尔·波兹曼'],
    summary: '技术发展的阴暗面——文化被技术殖民',
    aiGuide: '波兹曼三部曲的第三部。他提出技术垄断——当一种技术变成文化的核心时，其他一切都围绕它重组，而它的负面影响被系统性地忽视。在AI时代，波兹曼的批判框架依然犀利：我们是否正在经历一场AI技术垄断？',
    readTime: '约20分钟', suitableFor: '对数字技术持批判态度的读者',
    chapters: [
      { title: '技术垄断的机制', readTime: '10分钟', summary: '新技术如何压制旧智慧', keyPoints: ['每种新技术都带来一种新的崇拜', '效率崇拜正在消灭人文教育'], annotations: [], thinkQuestion: 'AI时代最容易被忽视的代价是什么？' },
    ]
  },
  'guofu': {
    title: '国富论', author: '亚当·斯密', cover: '💰',
    category: '理解经济', color: '#7c3aed', rating: '8.8',
    tags: ['亚当·斯密', '市场', '看不见的手'],
    summary: '经济学奠基之作——理解市场机制的经典',
    aiGuide: '亚当·斯密不只是自由市场之父，他也是道德哲学家。《国富论》中的分工理论和看不见的手是理解现代经济的起点。在AI时代，斯密关于分工受市场范围限制的观点有了新的意义：AI扩大了市场范围吗？',
    readTime: '约30分钟', suitableFor: '经济学初学者和想理解市场机制的人',
    chapters: [
      { title: '看不见的手', readTime: '12分钟', summary: '市场如何协调个体利益', keyPoints: ['个人追求私利通过市场机制促进公共利益', '但市场失灵时看不见的手就不管用了'], annotations: [], thinkQuestion: 'AI时代有哪些新的市场失灵？' },
      { title: '分工理论', readTime: '8分钟', summary: '分工如何推动财富增长', keyPoints: ['分工受市场范围限制——这解释了为什么全球化是趋势', 'AI正在重新定义分工的边界'], annotations: [], thinkQuestion: 'AI会怎样改变全球分工格局？' },
    ]
  },
  'zibenlun': {
    title: '资本论', author: '卡尔·马克思', cover: '⚒️',
    category: '理解经济', color: '#dc2626', rating: '8.5',
    tags: ['马克思', '劳动价值', '剥削'],
    summary: '政治经济学经典——理解资本主义的运作逻辑',
    aiGuide: '不管你是否认同马克思的政治立场，《资本论》是理解资本主义逻辑的必读书。他提出的商品拜物教、剩余价值等概念，在今天讨论平台经济、数字劳动、贫富分化时依然有强大的解释力。AI时代，数据劳动者是新的无产阶级吗？',
    readTime: '约35分钟', suitableFor: '关心社会公平、经济结构的人',
    chapters: [
      { title: '商品拜物教', readTime: '12分钟', summary: '为什么我们把商品当作物而不是关系', keyPoints: ['人与人之间的关系被掩盖为物与物之间的关系', '数字平台上的用户是不是另一种商品？'], annotations: [], thinkQuestion: '平台经济中有哪些商品拜物教的表现？' },
      { title: '剩余价值', readTime: '10分钟', summary: '劳动如何被转化为资本利润', keyPoints: ['工资是劳动力的价格，不是劳动的价值', '这解释了为什么老板和员工之间永远存在利益对立'], annotations: [], thinkQuestion: '零工经济中的剩余价值如何体现？' },
    ]
  },
  'ershiyishijiZibenlun': {
    title: '21世纪资本论', author: '托马斯·皮凯蒂', cover: '📊',
    category: '理解经济', color: '#b45309', rating: '8.7',
    tags: ['皮凯蒂', '不平等', 'r>g'],
    summary: 'r>g——资本收益率持续高于经济增长率的世纪预言',
    aiGuide: '皮凯蒂用20个国家300年的数据证明：资本主义的核心矛盾不是经济危机，而是财富不平等会自我强化。他的公式r>g是理解当代贫富分化的钥匙。在AI时代，这个公式有了新的变数：AI带来的生产率提升会让r>g更严重还是得到缓解？',
    readTime: '约25分钟', suitableFor: '关心不平等、贫富分化的读者',
    chapters: [
      { title: 'r>g公式', readTime: '10分钟', summary: '为什么财富不平等会自我强化', keyPoints: ['资本的回报率高于经济增长率时，资本家的财富增速超过整体', '这解释了为什么努力工作无法改变阶层'], annotations: [], thinkQuestion: 'AI带来的生产率提升会让r>g更严重还是得到缓解？' },
      { title: '不平等的机制', readTime: '8分钟', summary: '什么让不平等持续扩大', keyPoints: ['资本收入占比上升，劳动收入占比下降', '教育的世袭效应——财富可以传承，能力不能'], annotations: [], thinkQuestion: 'AI会加剧还是缓解教育世袭效应？' },
    ]
  },
  'weidadeboyi': {
    title: '伟大的博弈', author: '约翰·戈尔曼', cover: '🏛️',
    category: '理解经济', color: '#0d9488', rating: '8.6',
    tags: ['华尔街', '金融史', '资本市场'],
    summary: '华尔街和金融史的史诗——理解资本市场的本性',
    aiGuide: '戈尔曼讲述了华尔街350年的历史。这不是金融教科书，而是一部关于贪婪、恐惧、创新的故事。理解华尔街，才能理解今天全球金融体系的逻辑和风险。在AI时代，算法交易、高频交易、AI投资顾问正在重塑金融市场的博弈规则。',
    readTime: '约30分钟', suitableFor: '对金融史感兴趣的读者',
    chapters: [
      { title: '华尔街的本性', readTime: '12分钟', summary: '贪婪与创新的双面', keyPoints: ['每一次金融危机都伴随着金融创新', '监管和创新永远在博弈'], annotations: [], thinkQuestion: 'AI会给金融创新带来什么新风险？' },
    ]
  },
  'zhirenshizhi': {
    title: '智人之上', author: '尤瓦尔·赫拉利', cover: '🤖',
    category: '理解AI', color: '#7c3aed', rating: '9.0',
    tags: ['赫拉利', 'AI与民主', '信息管控'],
    summary: '尤瓦尔·赫拉利论AI时代的信息与权力',
    aiGuide: '赫拉利是《人类简史》三部曲的最新力作，这次他把注意力转向AI如何改变人类社会的信息流动和权力结构。当AI能生成信息、伪造记忆、操控选择时，民主和自由的基础将被重新审视。这是本清单中最新的一本，也是最直接讨论AI的一本。',
    readTime: '约30分钟', suitableFor: '所有关心AI未来的人',
    chapters: [
      { title: '信息与权力', readTime: '12分钟', summary: '谁控制信息，谁就控制世界', keyPoints: ['历史是胜利者书写的——AI让书写历史变得更便宜', '深度伪造不只是假新闻，它能改变人们对真实本身的信任'], annotations: [], thinkQuestion: '你的领域面临哪些AI信息操控的风险？' },
      { title: '硅幕', readTime: '10分钟', summary: 'AI时代的信息茧房', keyPoints: ['民主制度建立在共同事实的基础上', '当AI能为每个人定制现实时，公共讨论的基础何在？'], annotations: [], thinkQuestion: '如何在AI时代维护共同事实？' },
    ]
  },
  'shengming3': {
    title: '生命3.0', author: '马克斯·泰格马克', cover: '🧬',
    category: '理解AI', color: '#06b6d4', rating: '9.1',
    tags: ['泰格马克', 'AI未来', '生命定义'],
    summary: '重新定义生命——从生物进化到智能设计',
    aiGuide: '泰格马克提出了一个震撼的框架：生命1.0（不能设计自己的软件和硬件）、生命2.0（能设计软件）、生命3.0（能设计软件和硬件）。AI就是走向生命3.0的过程。他冷静分析了各种AI未来的可能性——不是危言耸听，不是盲目乐观，而是严肃的物理学家思维。',
    readTime: '约35分钟', suitableFor: '对AI未来持严肃思考的人',
    chapters: [
      { title: '生命3.0的定义', readTime: '12分钟', summary: '生命不再受限于生物进化', keyPoints: ['智能可以从生物载体中解放出来', '这是人类历史上最大的变革，但也可能是最后一次'], annotations: [], thinkQuestion: '如果生命3.0成为可能，人类意味着什么？' },
      { title: 'AI风险', readTime: '10分钟', summary: '智能爆炸与控制问题', keyPoints: ['超级智能可能带来目标对齐问题', '一个比人类聪明的AI如果目标与人类不一致，后果是灾难性的'], annotations: [], thinkQuestion: '你如何理解AI的对齐问题？' },
    ]
  },
  'superintelligence': {
    title: 'Superintelligence', author: '尼克·波斯特罗姆', cover: '🧠',
    category: '理解AI', color: '#8b5cf6', rating: '9.2',
    tags: ['博斯特罗姆', '超级智能', '控制'],
    summary: '牛津哲学家的超级智能风险经典',
    aiGuide: '这是关于AI风险最严肃、最系统的哲学著作。波斯特罗姆用严密的逻辑分析：如果超级智能出现，它会是什么样子、我们能否控制它、如何为它做准备。比起科幻式的AI恐慌，这本书提供了更清醒的思考框架。泰格马克的《生命3.0》很大程度上是对这本书的回应和延伸。',
    readTime: '约35分钟', suitableFor: '严肃对待AI风险的人',
    chapters: [
      { title: '智能爆炸', readTime: '12分钟', summary: '为什么超级智能可能突然出现', keyPoints: ['更聪明的AI能设计出更聪明的AI，形成递归改进', '智能爆炸的速度可能远超人类预期'], annotations: [], thinkQuestion: '你对智能爆炸怎么看？' },
      { title: '控制问题', readTime: '10分钟', summary: '我们能控制比自己聪明的东西吗', keyPoints: ['激励相容原则：让AI的目标与人类利益一致', '但我们真的知道自己想要什么吗？'], annotations: [], thinkQuestion: '如果目标对齐无法完美实现，我们该怎么办？' },
    ]
  },

};

// 消息类型
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// AI批注组件
function AIAnnotation({ text, note }: { text: string; note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span 
        style={{ color: '#fbbf24', borderBottom: '1px dashed #fbbf24', cursor: 'pointer' }} 
        onClick={() => setOpen(!open)}
      >
        {text} 💡
      </span>
      {open && (
        <div style={{ background: 'rgba(245,158,11,0.1)', padding: 12, borderRadius: 10, marginTop: 8, borderLeft: '3px solid #f59e0b' }}>
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 'bold' }}>AI解读</span>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.7, margin: '4px 0 0' }}>{note}</p>
        </div>
      )}
    </>
  );
}

// 聊天消息气泡组件
function ChatBubble({ message, isUser }: { message: ChatMessage; isUser: boolean }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }}>
      <div style={{ 
        maxWidth: '80%',
        background: isUser ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)',
        border: isUser ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '10px 14px',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
    </div>
  );
}

export default function JinghuaBookPage() {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const book = bookId ? BOOKS[bookId] : null;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showAuthorChat, setShowAuthorChat] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'note'>('chat'); // 'chat' 聊天模式, 'note' 笔记模式
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookId) {
      const favorites = JSON.parse(localStorage.getItem('jinghua_favorites') || '[]');
      setIsFavorite(favorites.includes(bookId));
      
      const savedNote = localStorage.getItem(`jinghua_notes_${bookId}`) || '';
      setNoteText(savedNote);
      
      // 加载聊天历史
      const savedChat = localStorage.getItem(`jinghua_chat_${bookId}`);
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      } else {
        // 如果没有历史消息，添加欢迎语
        setChatMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `你好！我是《${book?.title}》的作者${book?.author}。很高兴你能读我的书！有什么想法或问题，欢迎随时与我交流。`,
          timestamp: Date.now(),
        }]);
      }
    }
  }, [bookId, book]);

  // 滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 保存聊天历史
  useEffect(() => {
    if (bookId && chatMessages.length > 0) {
      localStorage.setItem(`jinghua_chat_${bookId}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, bookId]);

  const toggleFavorite = () => {
    if (!bookId) return;
    const favorites = JSON.parse(localStorage.getItem('jinghua_favorites') || '[]');
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== bookId);
    } else {
      newFavorites = [...favorites, bookId];
    }
    localStorage.setItem('jinghua_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const saveNote = () => {
    if (bookId) {
      localStorage.setItem(`jinghua_notes_${bookId}`, noteText);
    }
  };

  const publishNote = () => {
    if (!noteText.trim()) {
      alert('请先写下笔记内容');
      return;
    }
    saveNote();
    navigator.clipboard.writeText(noteText).then(() => {
      alert('笔记已保存！内容已复制到剪贴板，可直接粘贴分享。');
    }).catch(() => {
      alert('笔记已保存！请手动复制分享。');
    });
  };

  // 发送消息给作者
  const sendMessage = async () => {
    if (!inputMessage.trim() || !book || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 准备书籍内容摘要
      const bookContent = `
书名：《${book.title}》
作者：${book.author}

书籍简介：${book.summary}

AI导读：${book.aiGuide}

关键概念：
${book.keyConcepts.map(c => `- ${c.name}：${c.desc}`).join('\n')}

核心章节：
${book.chapters.map(ch => `
【${ch.title}】
${ch.summary}
核心观点：
${ch.keyPoints.map(p => `- ${p}`).join('\n')}
`).join('\n')}
`.trim();

      // 调用Worker的 /author-chat 端点
      const response = await fetch(`${WORKER_URL}/author-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: book.author,
          bookTitle: book.title,
          bookContent: bookContent,
          messages: chatMessages.concat([userMessage]).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || '未知错误');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，我现在无法回复，请稍后再试。',
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 清除聊天历史
  const clearChatHistory = () => {
    if (book && confirm('确定要清除与作者的对话历史吗？')) {
      setChatMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `你好！我是《${book.title}》的作者${book.author}。很高兴你能读我的书！有什么想法或问题，欢迎随时与我交流。`,
        timestamp: Date.now(),
      }]);
      if (bookId) {
        localStorage.removeItem(`jinghua_chat_${bookId}`);
      }
    }
  };

  const renderAnnotatedText = (text: string, annotations: { marker: string; note: string }[]) => {
    if (!annotations.length) return <span>{text}</span>;
    
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    
    annotations.forEach((ann) => {
      const idx = remaining.indexOf(ann.marker);
      if (idx !== -1) {
        if (idx > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
        }
        parts.push(
          <AIAnnotation key={key++} text={ann.marker} note={ann.note} />
        );
        remaining = remaining.slice(idx + ann.marker.length);
      }
    });
    
    if (remaining) {
      parts.push(<span key={key++}>{remaining}</span>);
    }
    
    return <>{parts}</>;
  };

  if (!book) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div>书籍不存在</div>
          <button onClick={() => navigate('/jinghua/library')} style={{ marginTop: 16, background: 'rgba(139,92,246,0.3)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: 10, cursor: 'pointer' }}>返回书架</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: showAuthorChat ? 280 : 100 }}>
      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => navigate('/jinghua/library')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 18, fontSize: 16, cursor: 'pointer' }}>←</button>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>阅读中</div>
      </div>

      {/* 书籍头部 */}
      <div style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 80, height: 110, borderRadius: 12, background: `linear-gradient(135deg, ${book.color}40, ${book.color}20)`, border: `1px solid ${book.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0 }}>{book.cover}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{book.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>{book.author}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>⭐ {book.rating}</span>
            <span style={{ background: `${book.color}20`, color: book.color, padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{book.category}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>{book.summary}</div>
        </div>
      </div>

      {/* AI导读区 */}
      <div style={{ padding: 16, margin: 16, background: `linear-gradient(135deg, ${book.color}15, ${book.color}05)`, borderRadius: 16, border: `1px solid ${book.color}25` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <span style={{ color: book.color, fontWeight: 'bold', fontSize: 16 }}>AI导读</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.8, margin: '0 0 16px' }}>{book.aiGuide}</p>
        
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8 }}>💡 关键概念</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {book.keyConcepts.map((concept, idx) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: 10 }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{concept.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{concept.desc}</div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>阅读时间</div>
            <div style={{ color: 'white', fontSize: 13, marginTop: 2 }}>{book.readTime}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>适合人群</div>
            <div style={{ color: 'white', fontSize: 13, marginTop: 2 }}>{book.suitableFor}</div>
          </div>
        </div>
      </div>

      {/* 章节内容 */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>📖 核心章节</div>
        {book.chapters.map((chapter, cIdx) => (
          <div key={cIdx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{chapter.title}</div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>⏱ {chapter.readTime}</span>
              </div>
            </div>
            
            <div style={{ padding: 16 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.8 }}>
                {renderAnnotatedText(chapter.summary, chapter.annotations)}
              </div>
              
              <div style={{ marginTop: 16 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>💎 核心观点</div>
                {chapter.keyPoints.map((point, pIdx) => (
                  <div key={pIdx} style={{ background: `linear-gradient(90deg, ${book.color}15, transparent)`, padding: '8px 12px', borderRadius: 8, marginBottom: 6, borderLeft: `3px solid ${book.color}` }}>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{point}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 16, background: 'rgba(139,92,246,0.1)', padding: 12, borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ color: '#c4b5fd', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>🤔 思考题</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>{chapter.thinkQuestion}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部操作栏 - 在导航栏上方 */}
      <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', display: 'flex', gap: 12, zIndex: 40 }}>
        <button onClick={() => setShowAuthorChat(!showAuthorChat)} style={{ flex: 1, background: showAuthorChat ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)', border: showAuthorChat ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>💬 与作者对话</button>
        <button onClick={toggleFavorite} style={{ flex: 1, background: isFavorite ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)', border: isFavorite ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>{isFavorite ? '❤️ 已收藏' : '🤍 收藏'}</button>
      </div>

      {/* 与作者对话弹窗 */}
      {showAuthorChat && (
        <div style={{ position: 'fixed', bottom: 120, left: 0, right: 0, top: 0, background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          {/* 聊天顶部 */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setShowAuthorChat(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 16, fontSize: 14, cursor: 'pointer' }}>←</button>
              <span style={{ fontSize: 20 }}>{book.cover}</span>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>💬 与 {book.author} 对话</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>《{book.title}》</div>
              </div>
            </div>
            <button onClick={clearChatHistory} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>🗑 清空</button>
          </div>

          {/* 模式切换 */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={() => setChatMode('chat')}
              style={{ 
                flex: 1, 
                background: chatMode === 'chat' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', 
                border: chatMode === 'chat' ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)', 
                color: 'white', 
                padding: '8px', 
                borderRadius: 8, 
                fontSize: 13, 
                cursor: 'pointer' 
              }}
            >💬 聊天</button>
            <button 
              onClick={() => setChatMode('note')}
              style={{ 
                flex: 1, 
                background: chatMode === 'note' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', 
                border: chatMode === 'note' ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)', 
                color: 'white', 
                padding: '8px', 
                borderRadius: 8, 
                fontSize: 13, 
                cursor: 'pointer' 
              }}
            >📝 笔记</button>
          </div>

          {/* 聊天消息区域 */}
          {chatMode === 'chat' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '80px' }}>
              {chatMessages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} isUser={msg.role === 'user'} />
              ))}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 16, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                    ✨ {book.author} 正在思考...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          ) : (
            /* 笔记模式 */
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button
                  onClick={publishNote}
                  style={{ background: 'rgba(139,92,246,0.8)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                >
                  📤 发布/分享
                </button>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onBlur={saveNote}
                placeholder="写下你的读书心得..."
                style={{ width: '100%', minHeight: 300, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, color: 'white', fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* 输入框区域 - 仅聊天模式显示 */}
          {chatMode === 'chat' && (
            <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="向作者提问..."
                disabled={isLoading}
                style={{ flex: 1, minHeight: 40, maxHeight: 120, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '10px 16px', color: 'white', fontSize: 14, resize: 'none', lineHeight: 1.4 }}
              />
              <button 
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                style={{ 
                  width: 44, 
                  height: 44, 
                  background: inputMessage.trim() && !isLoading ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  borderRadius: 22, 
                  fontSize: 18, 
                  cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  opacity: inputMessage.trim() && !isLoading ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? '⏳' : '➤'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
