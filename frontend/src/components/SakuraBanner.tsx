import React from 'react';

const SakuraBanner: React.FC = () => {
  return (
    <div className="relative w-full h-[220px] md:h-[340px] overflow-hidden rounded-2xl">
      {/* 天空渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fef0f2] via-[#fce4ec] to-[#f8d0d8]" />

      {/* 远景山 */}
      <svg className="absolute bottom-0 w-full h-[55%]" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" fill="none">
        <path d="M0 200 Q100 120 200 160 Q280 100 380 140 Q480 60 600 100 Q700 50 800 90 Q900 40 1000 80 Q1100 30 1200 60 L1200 200 Z" fill="rgba(200,160,170,0.12)" />
        <path d="M0 200 Q150 140 300 170 Q400 110 550 130 Q650 80 800 110 Q950 60 1100 90 Q1150 80 1200 100 L1200 200 Z" fill="rgba(180,140,155,0.08)" />
      </svg>

      {/* 樱花树 - 左侧 */}
      <svg className="absolute bottom-0 left-0 w-[45%] md:w-[38%] h-full" viewBox="0 0 400 340" preserveAspectRatio="xMidYMax meet" fill="none">
        {/* 树干 */}
        <path d="M160 340 Q165 280 170 240 Q175 200 180 160 Q182 130 175 100" stroke="rgba(160,120,130,0.25)" strokeWidth="8" strokeLinecap="round" />
        <path d="M175 220 Q140 190 110 170" stroke="rgba(160,120,130,0.2)" strokeWidth="4" strokeLinecap="round" />
        <path d="M178 180 Q200 150 230 130" stroke="rgba(160,120,130,0.2)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M172 160 Q140 130 120 110" stroke="rgba(160,120,130,0.18)" strokeWidth="3" strokeLinecap="round" />
        {/* 樱花簇 */}
        <g fill="rgba(220,160,175,0.2)">
          <circle cx="175" cy="95" r="22" /> <circle cx="195" cy="88" r="18" />
          <circle cx="155" cy="85" r="16" /> <circle cx="200" cy="105" r="14" />
          <circle cx="145" cy="100" r="13" /> <circle cx="110" cy="165" r="15" />
          <circle cx="125" cy="158" r="12" /> <circle cx="100" cy="155" r="10" />
          <circle cx="230" cy="125" r="14" /> <circle cx="245" cy="118" r="12" />
          <circle cx="120" cy="105" r="11" /> <circle cx="135" cy="100" r="9" />
        </g>
        <g fill="rgba(200,140,160,0.12)">
          <circle cx="165" cy="78" r="10" /> <circle cx="215" cy="95" r="8" />
          <circle cx="105" cy="148" r="9" /> <circle cx="240" cy="110" r="7" />
        </g>
      </svg>

      {/* 樱花树 - 右侧 */}
      <svg className="absolute bottom-0 right-0 w-[35%] md:w-[30%] h-[85%]" viewBox="0 0 300 340" preserveAspectRatio="xMidYMax meet" fill="none">
        <path d="M140 340 Q145 280 150 240 Q155 200 160 160 Q162 130 155 100" stroke="rgba(160,120,130,0.2)" strokeWidth="6" strokeLinecap="round" />
        <path d="M155 210 Q180 180 210 160" stroke="rgba(160,120,130,0.18)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M158 170 Q130 140 110 120" stroke="rgba(160,120,130,0.18)" strokeWidth="3" strokeLinecap="round" />
        <g fill="rgba(220,160,175,0.18)">
          <circle cx="155" cy="95" r="18" /> <circle cx="175" cy="88" r="14" />
          <circle cx="135" cy="85" r="13" /> <circle cx="180" cy="105" r="12" />
          <circle cx="128" cy="100" r="10" /> <circle cx="210" cy="155" r="12" />
          <circle cx="222" cy="148" r="10" />
        </g>
        <g fill="rgba(200,140,160,0.08)">
          <circle cx="145" cy="78" r="8" /> <circle cx="190" cy="95" r="7" />
        </g>
      </svg>

      {/* 飘落花瓣（少量点缀） */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 340" preserveAspectRatio="xMidYMid slice" fill="none">
        <g fill="rgba(220,160,175,0.15)">
          <ellipse cx="15%" cy="18%" rx="5" ry="3" transform="rotate(30 15% 18%)" />
          <ellipse cx="35%" cy="25%" rx="4" ry="2.5" transform="rotate(-20 35% 25%)" />
          <ellipse cx="55%" cy="12%" rx="6" ry="3" transform="rotate(45 55% 12%)" />
          <ellipse cx="75%" cy="22%" rx="4" ry="2" transform="rotate(-35 75% 22%)" />
          <ellipse cx="90%" cy="15%" rx="5" ry="2.5" transform="rotate(15 90% 15%)" />
          <ellipse cx="25%" cy="35%" rx="3" ry="2" transform="rotate(-10 25% 35%)" />
          <ellipse cx="65%" cy="32%" rx="4" ry="2" transform="rotate(25 65% 32%)" />
        </g>
      </svg>

      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#fce4ec]/60 to-transparent pointer-events-none" />
    </div>
  );
};

export default SakuraBanner;
