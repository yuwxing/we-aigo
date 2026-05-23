import React from 'react';

const SakuraDecorations: React.FC = () => {
  return (
    <>
      {/* 手绘樱花枝干剪影 */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none" aria-hidden="true">
        <svg
          className="w-full h-full opacity-[0.08] md:opacity-[0.10]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke="#d4a0a0" fill="#d4a0a0" strokeLinecap="round">
            {/* 主枝干 */}
            <path d="M-30 680 C80 640 200 580 320 500 C400 450 480 400 580 340 C660 290 760 250 900 200 C980 170 1080 150 1230 140" strokeWidth="5" fill="none" />
            <path d="M280 520 C300 480 310 430 340 380" strokeWidth="3" fill="none" />
            <path d="M520 360 C550 320 570 280 555 230" strokeWidth="3" fill="none" />
            <path d="M750 260 C780 220 800 180 790 140" strokeWidth="3" fill="none" />
            <path d="M160 600 C180 560 170 520 200 480" strokeWidth="2.5" fill="none" />
            <path d="M1000 180 C1020 150 1010 120 1040 95" strokeWidth="2.5" fill="none" />

            {/* 樱花簇 */}
            <circle cx="340" cy="375" r="14" />
            <circle cx="360" cy="365" r="11" />
            <circle cx="328" cy="360" r="9" />
            <circle cx="350" cy="350" r="8" />
            <circle cx="555" cy="225" r="16" />
            <circle cx="578" cy="215" r="12" />
            <circle cx="542" cy="208" r="10" />
            <circle cx="568" cy="240" r="9" />
            <circle cx="790" cy="135" r="15" />
            <circle cx="810" cy="125" r="11" />
            <circle cx="778" cy="120" r="9" />
            <circle cx="800" cy="148" r="8" />
            <circle cx="200" cy="475" r="12" />
            <circle cx="220" cy="465" r="9" />
            <circle cx="1040" cy="90" r="11" />
            <circle cx="1055" cy="82" r="8" />

            {/* 散落花瓣 */}
            <circle cx="420" cy="440" r="6" />
            <circle cx="480" cy="390" r="7" />
            <circle cx="650" cy="300" r="8" />
            <circle cx="870" cy="220" r="6" />
            <circle cx="140" cy="550" r="7" />
            <circle cx="700" cy="200" r="5" />
          </g>
        </svg>
      </div>

      {/* 模糊光斑 */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none" aria-hidden="true">
        <div className="absolute top-[8%] left-[12%] w-[280px] h-[280px] bg-pink-200/25 rounded-full blur-[80px] animate-[bokeh-float_8s_ease-in-out_infinite]" />
        <div className="absolute top-[35%] right-[8%] w-[220px] h-[220px] bg-rose-100/25 rounded-full blur-[70px] animate-[bokeh-float_10s_ease-in-out_infinite]" style={{ animationDelay: '-3s' }} />
        <div className="absolute bottom-[15%] left-[25%] w-[180px] h-[180px] bg-pink-100/20 rounded-full blur-[60px] animate-[bokeh-float_7s_ease-in-out_infinite]" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-[55%] left-[60%] w-[200px] h-[200px] bg-rose-100/20 rounded-full blur-[75px] animate-[bokeh-float_9s_ease-in-out_infinite]" style={{ animationDelay: '-2s' }} />
      </div>

      {/* 飘落花瓣 */}
      <div className="fixed inset-0 pointer-events-none z-[1] select-none" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="petal"
            style={{
              left: `${2 + (i * 5.2) % 98}%`,
              width: `${7 + (i * 3) % 11}px`,
              height: `${7 + (i * 3) % 11}px`,
              animationDelay: `${(i * 0.7) % 12}s`,
              animationDuration: `${9 + (i * 0.4) % 7}s`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default SakuraDecorations;
