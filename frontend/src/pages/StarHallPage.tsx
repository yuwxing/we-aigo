<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>we-aigo 数字校园</title>
<style>
*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:"Segoe UI","PingFang SC",sans-serif;
}

body{
background: radial-gradient(circle at top, #2b1b6a 0%, #12081f 55%, #05010c 100%);
color:#fff;
min-height:100vh;
overflow-x:hidden;
}

body::before{
content:"";
position:fixed;
inset:0;
background-image:
radial-gradient(white 1px, transparent 1px),
radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px);
background-size:140px 140px, 70px 70px;
opacity:0.25;
z-index:0;
}

/* ========== 星云大厅入口 ========== */
.entrance{
position:fixed;
inset:0;
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
text-align:center;
z-index:10;
background: radial-gradient(circle at center, rgba(168,85,247,0.25), transparent 60%);
backdrop-filter: blur(10px);
}

.entrance h1{
font-size:64px;
background:linear-gradient(90deg,#fff,#d8b4fe,#93c5fd);
-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
margin-bottom:18px;
}

.entrance .subtitle{
font-size:22px;
opacity:0.9;
max-width:700px;
line-height:1.8;
margin-bottom:40px;
}

/* 身份选择 */
.identity-select{
display:flex;
gap:30px;
margin-bottom:30px;
}

.identity-card{
width:200px;
height:240px;
border-radius:24px;
background:rgba(255,255,255,0.08);
border:2px solid rgba(255,255,255,0.15);
cursor:pointer;
transition:0.3s;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
gap:16px;
}

.identity-card:hover,
.identity-card.selected{
border-color:#a855f7;
background:rgba(168,85,247,0.2);
transform:translateY(-8px);
box-shadow:0 20px 40px rgba(168,85,247,0.3);
}

.identity-card .icon{
font-size:64px;
}

.identity-card h3{
font-size:22px;
}

.identity-card p{
font-size:14px;
opacity:0.7;
}

.enter-btn{
margin-top:20px;
padding:16px 40px;
border-radius:999px;
border:none;
background:linear-gradient(135deg, #a855f7, #6366f1);
color:#fff;
cursor:pointer;
font-size:20px;
font-weight:600;
transition:0.3s;
}

.enter-btn:hover{
transform:translateY(-4px);
box-shadow:0 15px 40px rgba(168,85,247,0.4);
}

.enter-btn:disabled{
opacity:0.5;
cursor:not-allowed;
transform:none;
}

/* ========== 校园主体 ========== */
.campus{
display:none;
padding:30px;
position:relative;
z-index:2;
}

.hero{
text-align:center;
margin-bottom:30px;
}

.hero h2{
font-size:48px;
margin-bottom:10px;
}

.hero p{
font-size:20px;
opacity:0.8;
}

.layout{
display:grid;
grid-template-columns:300px 1fr 300px;
gap:24px;
}

.panel{
background:rgba(255,255,255,0.07);
border:1px solid rgba(255,255,255,0.12);
border-radius:24px;
padding:20px;
backdrop-filter:blur(16px);
}

.panel h3{
margin-bottom:14px;
color:#f5d0fe;
font-size:16px;
}

.panel li{
margin-bottom:12px;
opacity:0.85;
line-height:1.6;
font-size:14px;
}

.center{
min-height:650px;
border-radius:30px;
background:rgba(255,255,255,0.05);
border:1px solid rgba(255,255,255,0.12);
position:relative;
overflow:hidden;
}

/* 角色悬浮球 */
.floating{
position:absolute;
width:130px;
height:130px;
border-radius:50%;
background:linear-gradient(135deg, rgba(168,85,247,0.3), rgba(99,102,241,0.3));
border:2px solid rgba(255,255,255,0.2);
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
animation:float 4s ease-in-out infinite;
cursor:pointer;
transition:0.3s;
}

.floating:hover{
transform:scale(1.1);
box-shadow:0 0 30px rgba(168,85,247,0.5);
}

.floating .avatar{
width:60px;
height:60px;
border-radius:50%;
background:rgba(255,255,255,0.15);
display:flex;
align-items:center;
justify-content:center;
font-size:32px;
margin-bottom:8px;
}

.floating small{
font-size:13px;
color:#f5d0fe;
}

/* 校长特殊样式 */
.floating.principal{
width:150px;
height:150px;
background:linear-gradient(135deg, rgba(251,191,36,0.4), rgba(168,85,247,0.4));
border-color:rgba(251,191,36,0.5);
}

.floating.principal .avatar{
width:70px;
height:70px;
font-size:40px;
}

.floating.principal small{
color:#fcd34d;
font-weight:600;
}

/* 角色介绍气泡 */
.floating .tooltip{
position:absolute;
bottom:-60px;
left:50%;
transform:translateX(-50%);
background:rgba(0,0,0,0.9);
padding:8px 14px;
border-radius:10px;
font-size:12px;
white-space:nowrap;
opacity:0;
transition:0.3s;
pointer-events:none;
}

.floating:hover .tooltip{
opacity:1;
}

@keyframes float{
0%{transform:translateY(0)}
50%{transform:translateY(-15px)}
100%{transform:translateY(0)}
}

.bottom{
margin-top:30px;
display:grid;
grid-template-columns:repeat(5,1fr);
gap:14px;
}

.card{
background:rgba(255,255,255,0.07);
border-radius:18px;
padding:20px 16px;
text-align:center;
border:1px solid rgba(255,255,255,0.12);
cursor:pointer;
transition:0.3s;
}

.card:hover{
transform:translateY(-6px);
background:rgba(168,85,247,0.2);
border-color:rgba(168,85,247,0.4);
}

.card .card-icon{
font-size:36px;
margin-bottom:10px;
}

.card h4{
font-size:16px;
margin-bottom:6px;
}

.card p{
font-size:12px;
opacity:0.7;
}

/* 身份徽章 */
.identity-badge{
position:fixed;
top:20px;
right:20px;
background:rgba(168,85,247,0.3);
padding:10px 20px;
border-radius:999px;
font-size:14px;
z-index:100;
display:flex;
align-items:center;
gap:8px;
}

.identity-badge .role-icon{
font-size:20px;
}

/* 装饰流星 */
.meteor{
position:fixed;
width:2px;
height:80px;
background:linear-gradient(to bottom, transparent, #fff);
opacity:0;
animation:meteor 3s linear infinite;
}

@keyframes meteor{
0%{opacity:0;transform:rotate(-45deg) translateY(-100px);}
10%{opacity:1;}
100%{opacity:0;transform:rotate(-45deg) translateY(100vh);}
}

/* 响应式 */
@media(max-width:1024px){
.layout{
grid-template-columns:1fr;
}
.identity-select{
flex-direction:column;
}
}

</style>
</head>

<body>

<!-- 流星装饰 -->
<div class="meteor" style="left:20%;animation-delay:0s"></div>
<div class="meteor" style="left:50%;animation-delay:1s"></div>
<div class="meteor" style="left:80%;animation-delay:2s"></div>

<!-- 星云大厅入口 -->
<div class="entrance" id="entrance">
<h1>✨ 星云大厅</h1>
<p class="subtitle">
你正在进入 we-aigo 数字校园的入口空间<br>
在这里，遇见你的AI伙伴，开启共同成长之旅
</p>

<div class="identity-select">
<div class="identity-card" onclick="selectIdentity('student', this)">
<span class="icon">🎓</span>
<h3>我是学生</h3>
<p>开启学习与成长之旅</p>
</div>
<div class="identity-card" onclick="selectIdentity('teacher', this)">
<span class="icon">👨‍🏫</span>
<h3>我是教师</h3>
<p>探索AI教学新方式</p>
</div>
</div>

<button class="enter-btn" id="enterBtn" onclick="enterCampus()" disabled>
选择身份后进入 →
</button>
</div>

<!-- 校园主体 -->
<div class="campus" id="campus">

<div class="identity-badge" id="identityBadge">
<span class="role-icon" id="roleIcon">🎓</span>
<span id="roleText">学生身份</span>
</div>

<div class="hero">
<h2>欢迎来到 we-aigo 数字校园</h2>
<p id="welcomeMsg">人与智能体共同成长的未来校园</p>
</div>

<div class="layout">

<div class="panel">
<h3>📢 校园广播</h3>
<ul>
<li>🎉 AI校长欢迎新生入学</li>
<li>🌟 创意广场新上线</li>
<li>📚 研究中心开放新课题</li>
</ul>

<h3>🌤 校园天气</h3>
<ul>
<li>✨ 星云晴朗</li>
<li>💡 创造力 92%</li>
<li>🌡 氛围温度 26°C</li>
</ul>

<h3>🎯 今日任务</h3>
<ul>
<li>□ 与AI导师对话</li>
<li>□ 认识AI宠物</li>
<li>□ 探索创意广场</li>
</ul>
</div>

<div class="center">
<!-- 中心漂浮角色 -->
<div class="floating principal" style="top:60px;left:50%;transform:translateX(-50%)">
<div class="avatar">👑</div>
<small>AI校长</small>
<div class="tooltip">欢迎来到数字校园！</div>
</div>

<div class="floating" style="top:200px;left:15%">
<div class="avatar">🌸</div>
<small>花仙子</small>
<div class="tooltip">情感陪伴伙伴</div>
</div>

<div class="floating" style="top:200px;right:15%">
<div class="avatar">📖</div>
<small>AI导师</small>
<div class="tooltip">学习成长向导</div>
</div>

<div class="floating" style="top:360px;left:30%">
<div class="avatar">🐾</div>
<small>AI宠物</small>
<div class="tooltip">学习伙伴等你领养</div>
</div>

<div class="floating" style="top:360px;right:30%">
<div class="avatar">🔬</div>
<small>研究员</small>
<div class="tooltip">探索AI前沿</div>
</div>

<div class="floating" style="bottom:40px;left:50%;transform:translateX(-50%)">
<div class="avatar">🎨</div>
<small>创作者</small>
<div class="tooltip">释放你的创意</div>
</div>
</div>

<div class="panel">
<h3>🧍 成长档案</h3>
<ul>
<li>等级：Lv.3 探索者</li>
<li>学分：1,280</li>
<li>连续学习：7天</li>
</ul>

<h3>📈 今日进度</h3>
<ul>
<li>学习 83%</li>
<li>互动 65%</li>
<li>创作 42%</li>
</ul>

<h3>🤝 AI伙伴</h3>
<ul>
<li>🌸 花仙子 - 陪伴中</li>
<li>🐾 宠物 - 待领养</li>
</ul>
</div>

</div>

<div class="bottom">
<div class="card" onclick="goToSpace('creative')">
<div class="card-icon">🎨</div>
<h4>创意广场</h4>
<p>展示你的AI创作</p>
</div>
<div class="card" onclick="goToSpace('library')">
<div class="card-icon">📚</div>
<h4>图书馆</h4>
<p>AI导师与知识</p>
</div>
<div class="card" onclick="goToSpace('garden')">
<div class="card-icon">🌸</div>
<h4>花园空间</h4>
<p>情感陪伴与成长</p>
</div>
<div class="card" onclick="goToSpace('dorm')">
<div class="card-icon">🏠</div>
<h4>宿舍空间</h4>
<p>个人主页与宠物</p>
</div>
<div class="card" onclick="goToSpace('lab')">
<div class="card-icon">🔬</div>
<h4>研究中心</h4>
<p>AI前沿探索</p>
</div>
</div>

</div>

<script>
let selectedIdentity = null;

function selectIdentity(identity, el){
selectedIdentity = identity;
document.querySelectorAll('.identity-card').forEach(c=>c.classList.remove('selected'));
el.classList.add('selected');
document.getElementById('enterBtn').disabled = false;
document.getElementById('enterBtn').textContent = identity === 'student' ? '成为学生 →' : '成为教师 →';
}

function enterCampus(){
if(!selectedIdentity) return;
document.getElementById('entrance').style.display='none';
document.getElementById('campus').style.display='block';

// 更新身份显示
const isStudent = selectedIdentity === 'student';
document.getElementById('roleIcon').textContent = isStudent ? '🎓' : '👨‍🏫';
document.getElementById('roleText').textContent = isStudent ? '学生身份' : '教师身份';
document.getElementById('welcomeMsg').textContent = isStudent 
    ? '探索知识的海洋，与AI共同成长'
    : '用AI赋能教学，开启智慧教育新篇章';
}

function goToSpace(space){
const spaces = {
creative: '创意广场 - 敬请期待',
library: '图书馆 - 即将开放',
garden: '花园空间 - 即将开放',
dorm: '宿舍空间 - 即将开放',
lab: '研究中心 - 即将开放'
};
alert(spaces[space]);
}

// 添加随机流星
setInterval(()=>{
const meteor = document.createElement('div');
meteor.className = 'meteor';
meteor.style.left = Math.random() * 100 + '%';
meteor.style.animationDelay = Math.random() * 3 + 's';
document.body.appendChild(meteor);
setTimeout(()=>meteor.remove(), 3000);
}, 4000);
</script>

</body>
</html>
