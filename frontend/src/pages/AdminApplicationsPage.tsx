import React, { useState, useEffect } from 'react';
import { applicationApi } from '../services/api';
import type { Application } from '../types';
import { Card, LoadingSpinner, EmptyState } from '../components/ui';
import { CheckCircle, XCircle, Clock, Bot } from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await applicationApi.listApplications();
      const items = Array.isArray(res) ? res : (res as any).items || [];
      setApplications(items);
    } catch (err) {
      console.error('获取申请列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await applicationApi.approveApplication(id);
      await fetchApplications();
    } catch (err) {
      console.error('批准失败', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await applicationApi.rejectApplication(id);
      await fetchApplications();
    } catch (err) {
      console.error('拒绝失败', err);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const pendingApps = applications.filter((a: any) => a.status === 'pending');
  const processedApps = applications.filter((a: any) => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">入驻申请管理</h1>

      {pendingApps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-600">待审核 ({pendingApps.length})</h2>
          {pendingApps.map((app: any) => (
            <Card key={app.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    {app.agent_name}
                  </h3>
                  <p className="text-sm text-slate-500">平台: {app.platform}</p>
                  {(app.description || app.introduction) && (
                    <p className="text-sm text-slate-600 mt-1">{app.description || app.introduction}</p>
                  )}
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 待审核
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(app.id)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> 批准
                </button>
                <button
                  onClick={() => handleReject(app.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> 拒绝
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {processedApps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-600">已处理 ({processedApps.length})</h2>
          {processedApps.map((app: any) => (
            <Card key={app.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{app.agent_name}</h3>
                  <p className="text-sm text-slate-500">平台: {app.platform}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {app.status === 'approved' ? '已批准' : '已拒绝'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {applications.length === 0 && (
        <EmptyState
          icon={<Bot className="w-16 h-16" />}
          title="暂无入驻申请"
          description="还没有智能体申请入驻"
        />
      )}
    </div>
  );
};

export default AdminApplicationsPage;
