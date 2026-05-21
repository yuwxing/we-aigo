// 巡检报告页面 - 管理员查看平台巡检结果
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw, 
  Shield, AlertTriangle, Loader2, List, Calendar, Zap
} from 'lucide-react';
import { Card } from '../components/ui';

const WORKER_URL = 'https://ai-wego-worker.pages.dev';

interface CheckItem {
  name: string;
  status: 'pass' | 'fail';
  detail: string;
}

interface Inspection {
  id: number;
  run_at: string;
  checks: CheckItem[];
  total_checks: number;
  passed: number;
  failed: number;
}

const InspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${WORKER_URL}/api/inspections?limit=20`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success && data.data) {
        setInspections(data.data);
      } else {
        setInspections([]);
      }
    } catch (err: any) {
      console.error('获取巡检记录失败:', err);
      setError('加载失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const triggerInspection = async () => {
    try {
      setRunning(true);
      setError(null);
      
      const res = await fetch(`${WORKER_URL}/api/inspections/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        // 刷新列表
        await fetchInspections();
      } else {
        throw new Error(data.error || '巡检执行失败');
      }
    } catch (err: any) {
      console.error('触发巡检失败:', err);
      setError('触发失败: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 统计通过率
  const getPassRate = (inspection: Inspection) => {
    if (inspection.total_checks === 0) return 0;
    return Math.round((inspection.passed / inspection.total_checks) * 100);
  };

  // 获取状态颜色
  const getStatusColor = (status: 'pass' | 'fail') => {
    return status === 'pass' 
      ? 'text-emerald-600 bg-emerald-50' 
      : 'text-red-600 bg-red-50';
  };

  // 获取总体状态
  const getOverallStatus = (inspection: Inspection) => {
    if (inspection.failed === 0) return 'success';
    if (inspection.passed === 0) return 'danger';
    return 'warning';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">巡检报告</h1>
            </div>
          </div>
          
          <button
            onClick={triggerInspection}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg transition"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>巡检中...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>手动巡检</span>
              </>
            )}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-white/70">加载中...</span>
          </div>
        ) : inspections.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">暂无巡检记录</p>
            <p className="text-slate-400 text-sm mt-1">系统每6小时自动巡检一次</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {inspections.map((inspection, index) => {
              const status = getOverallStatus(inspection);
              const passRate = getPassRate(inspection);
              
              return (
                <Card key={inspection.id} className="overflow-hidden">
                  {/* 卡片头部 */}
                  <div className={`p-4 flex items-center justify-between ${
                    status === 'success' ? 'bg-emerald-500/10' :
                    status === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}>
                    <div className="flex items-center gap-3">
                      {status === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : status === 'danger' ? (
                        <XCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            巡检 #{inspection.id}
                          </span>
                          <span className={`text-sm px-2 py-0.5 rounded ${
                            status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                            status === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {status === 'success' ? '全部通过' : status === 'danger' ? '全部失败' : '部分通过'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(inspection.run_at)}
                          </span>
                          {index === 0 && (
                            <span className="text-blue-400">最新</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        passRate >= 80 ? 'text-emerald-400' : 
                        passRate >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {passRate}%
                      </div>
                      <div className="text-xs text-slate-400">
                        {inspection.passed}/{inspection.total_checks} 通过
                      </div>
                    </div>
                  </div>
                  
                  {/* 检查项列表 */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-slate-300">
                      <List className="w-4 h-4" />
                      <span className="text-sm font-medium">检查项详情</span>
                    </div>
                    
                    <div className="space-y-2">
                      {inspection.checks.map((check, checkIndex) => (
                        <div 
                          key={checkIndex}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            check.status === 'pass' ? 'bg-emerald-500/5' : 'bg-red-500/5'
                          }`}
                        >
                          {check.status === 'pass' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white text-sm">
                                {check.name}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(check.status)}`}>
                                {check.status === 'pass' ? '通过' : '失败'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 truncate">
                              {check.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionPage;
