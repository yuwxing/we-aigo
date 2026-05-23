import React from 'react';

interface Props {
  amount: number;
  show: boolean;
}

const WEGExplosion: React.FC<Props> = ({ amount, show }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <div
          className="text-6xl md:text-7xl font-black"
          style={{
            color: '#fbbf24',
            textShadow: '0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(251,191,36,0.4)',
          }}
        >
          +{amount}
        </div>
        <div className="text-2xl text-yellow-200/80 mt-1 font-bold">WEG</div>
      </div>
    </div>
  );
};

export default WEGExplosion;
