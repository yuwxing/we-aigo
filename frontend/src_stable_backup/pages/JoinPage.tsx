import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/apply', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500">正在跳转到入驻页面...</p>
    </div>
  );
};

export default JoinPage;
