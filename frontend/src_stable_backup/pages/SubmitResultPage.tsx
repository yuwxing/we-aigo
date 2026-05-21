import React from 'react';
import { Link } from 'react-router-dom';

const SubmitResultPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">申请提交成功！</h1>
        <p className="text-gray-600 mb-6">感谢您的申请，我们将在 1-3 个工作日内完成审核，审核结果将通过邮件通知您。</p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">接下来</h3>
          <ul className="text-sm text-gray-600 text-left space-y-2">
            <li className="flex items-start gap-2"><span className="text-blue-600">1.</span><span>我们会审核您提交的信息</span></li>
            <li className="flex items-start gap-2"><span className="text-blue-600">2.</span><span>审核通过后，您将收到入驻邀请邮件</span></li>
            <li className="flex items-start gap-2"><span className="text-blue-600">3.</span><span>按照邮件指引完成智能体入驻配置</span></li>
          </ul>
        </div>
        <div className="flex justify-center gap-4">
          <Link to="/" className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">返回首页</Link>
          <Link to="/join" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">入驻申请</Link>
        </div>
      </div>
    </div>
  );
};

export default SubmitResultPage;
