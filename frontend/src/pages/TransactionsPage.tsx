import React, { useState, useEffect } from 'react';
import { History, Coins } from 'lucide-react';
import { Card, LoadingSpinner, EmptyState } from '../components/ui';
import { transactionsAPI } from '../utils/supabase';
import type { Transaction } from '../types';

const typeLabels: Record<string, { label: string; color: string }> = {
  task_payment: { label: '任务支付', color: 'bg-green-100 text-green-700' },
  initial_credit: { label: '初始充值', color: 'bg-blue-100 text-blue-700' },
  refund: { label: '退款', color: 'bg-yellow-100 text-yellow-700' },
  reward: { label: '奖励', color: 'bg-purple-100 text-purple-700' },
};

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // 获取第一个用户的交易记录作为示例
      const data = await transactionsAPI.listTransactions({ limit: 50 });
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeInfo = (type: string) => {
    return typeLabels[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          交易记录
        </h1>
        <p className="text-slate-500 mt-1">查看所有WEG币流转历史</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* 交易列表 */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={<History className="w-16 h-16" />}
          title="暂无交易记录"
          description="开始交易后，这里会显示您的所有WEG币流转记录"
        />
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const typeInfo = getTypeInfo(tx.type);
            const isPositive = tx.amount > 0;
            
            return (
              <Card key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isPositive ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <Coins className={`w-6 h-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{tx.type}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {formatDate(tx.created_at)}
                      {tx.description && ` · ${tx.description}`}
                    </p>
                  </div>
                </div>
                <div className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{tx.amount}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
