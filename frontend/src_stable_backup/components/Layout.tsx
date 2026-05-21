import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bot, List, PlusCircle, History, Menu, X, Home, Sparkles, Gift, GraduationCap, Briefcase, Coins, ShieldCheck, LogOut, Palette, Heart, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '../contexts/UserContext';
import PetWidget from './PetWidget';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
  { path: '/agents', label: '智能体', icon: <Bot className="w-5 h-5" /> },
  { path: '/adopt', label: '宠物领养', icon: <Heart className="w-5 h-5" /> },
  { path: '/tasks', label: '任务大厅', icon: <List className="w-5 h-5" /> },
  { path: '/job-square', label: '求职广场', icon: <Briefcase className="w-5 h-5" />, highlight: true },
  { path: '/create-task', label: '发布', icon: <PlusCircle className="w-5 h-5" /> },
  { path: '/create', label: '创作工坊', icon: <Palette className="w-5 h-5" /> },
  { path: '/balance', label: '余额', icon: <Coins className="w-5 h-5" /> },
  { path: '/feedback', label: '反馈', icon: <MessageSquare className="w-5 h-5" /> },
];

const bottomNavItems: NavItem[] = [
  { path: '/', label: '首页', icon: <Home className="w-6 h-6" /> },
  { path: '/agents', label: '智能体', icon: <Bot className="w-6 h-6" /> },
  { path: '/adopt', label: '领养', icon: <Heart className="w-6 h-6" /> },
  { path: '/benefits', label: '福利', icon: <Gift className="w-6 h-6" /> },
  { path: '/job-square', label: '求职', icon: <Briefcase className="w-6 h-6" />, highlight: true },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [balance, setBalance] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 监听登录/登出事件
  useEffect(() => {
    const handleLogin = () => {
      // 重新从Context获取用户状态，Context会自动更新
    };
    const handleLogout = () => {
      // 登出后跳转到首页
      navigate('/');
    };
    window.addEventListener('user-login', handleLogin);
    window.addEventListener('user-logout', handleLogout);
    return () => {
      window.removeEventListener('user-login', handleLogin);
      window.removeEventListener('user-logout', handleLogout);
    };
  }, [navigate]);

  // 获取余额
  useEffect(() => {
    if (user?.id) {
      fetchBalance(user.id);
    } else {
      setBalance(0);
    }
  }, [user]);

  const fetchBalance = async (userId: number) => {
    try {
      const response = await fetch(`https://mzjmfyoemcsoqzoooiej.supabase.co/rest/v1/users?id=eq.${userId}&select=token_balance`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16am1meW9lbWNzb3F6b29vaWVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MDgwMCwiZXhwIjoyMDkzMDY2ODAwfQ.BaovYmOpmOANyo6fmSPKV1FwNwLWlkVVSa7r8KsaMtM'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setBalance(data[0].token_balance || 0);
        }
      }
    } catch (err) {
      console.error('获取余额失败', err);
    }
  };

  // 退出登录处理
  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen page-wrapper">
      {/* 顶部装饰光效 */}
      <div className="fixed top-0 left-0 right-0 h-64 pointer-events-none overflow-hidden z-0">
        <div className="light-orb light-orb-purple w-96 h-96 -top-32 -left-32 animate-glow" />
        <div className="light-orb light-orb-pink w-80 h-80 -top-16 right-0 animate-glow" style={{ animationDelay: '1s' }} />
      </div>

      <header className="glass-card sticky top-0 z-50 border-b border-purple-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text-purple-pink">
                ai-wego.top
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    item.highlight && 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:-translate-y-0.5',
                    !item.highlight && location.pathname === item.path
                      ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                      : !item.highlight && 'text-slate-600 hover:bg-purple-50/50 nav-item-glow'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all btn-gradient-primary"
              >
                <Gift className="w-4 h-4" />
                注册送Token
              </Link>

              {user ? (
                <>
                  {/* 平台主人专属：审核中心入口 */}
                  {user.id === 19 && (
                    <Link
                      to="/admin/feedback"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 hover:from-red-100 hover:to-orange-100 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">审核中心</span>
                    </Link>
                  )}

                  <Link
                    to="/balance"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-200 hover:bg-purple-50 transition-all glass-card"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Coins className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-bold gradient-text-purple-pink">
                      {balance.toLocaleString()}
                    </span>
                  </Link>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {user.username[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{user.username}</span>
                  </div>

                  {/* 退出登录按钮 */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all border border-red-200"
                    title="退出登录"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                  登录 / 注册
                </Link>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-purple-600" />
              ) : (
                <Menu className="w-6 h-6 text-purple-600" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full glass-card border-b border-purple-100/50 shadow-xl">
            <div className="px-4 py-4 space-y-2">
              {user ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <Link to="/balance" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Token 余额</p>
                      <p className="text-lg font-bold gradient-text-purple-pink">{balance.toLocaleString()}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {user.username[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{user.username}</span>
                  </div>
                </div>
              ) : (
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg mb-4 btn-gradient-primary"
                >
                  <Sparkles className="w-5 h-5" />
                  登录 / 注册
                </Link>
              )}

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
                    item.highlight && 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg',
                    !item.highlight && location.pathname === item.path
                      ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                      : !item.highlight && 'text-slate-600 hover:bg-purple-50/50 nav-item-glow'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              {/* 平台主人专属：审核中心入口 */}
              {user && user.id === 19 && (
                <Link
                  to="/admin/feedback"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200"
                >
                  <ShieldCheck className="w-5 h-5" />
                  审核中心
                </Link>
              )}

              {/* 退出登录按钮 */}
              {user && (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-red-50 text-red-600 border border-red-200 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  退出登录
                </button>
              )}

              <Link
                to="/register"
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg btn-gradient-primary"
              >
                <Gift className="w-5 h-5" />
                注册送Token
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 底部导航栏 - 梦幻风格 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-purple-100/50 z-50">
        <div className="flex justify-around py-2 px-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px]',
                item.highlight
                  ? location.pathname === item.path
                    ? 'text-white'
                    : 'text-slate-400'
                  : location.pathname === item.path
                    ? 'bottom-nav-selected'
                    : 'text-slate-400'
              )}
            >
              {item.highlight ? (
                <div className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all',
                  location.pathname === item.path
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 animate-glow'
                    : 'bg-slate-200'
                )}>
                  {item.icon}
                </div>
              ) : (
                <>
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 relative z-10">
        {children}
      </main>

      <div className="h-4 lg:hidden" />

      {/* 宠物漂浮组件 - 仅在有已领养宠物时显示 */}
      <PetWidget />
    </div>
  );
};

export default Layout;
