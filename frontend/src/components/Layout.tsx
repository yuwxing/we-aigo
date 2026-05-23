import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Bot, List, PlusCircle, Menu, X, Home,
  Sparkles, Gift, Briefcase, Coins, ShieldCheck,
  LogOut, Palette, MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '../contexts/UserContext';
import PetWidget from './PetWidget';
import { FeedbackButton } from './FeedbackButton';

// 维护公告
const SITE_NOTICE = '';

const navItems = [
  { path: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
  { path: '/agents', label: '智能体', icon: <Bot className="w-5 h-5" /> },
  { path: '/benefits', label: '宠物英语角', icon: <Gift className="w-5 h-5" /> },
  { path: '/tasks', label: '任务大厅', icon: <List className="w-5 h-5" /> },
  { path: '/job-square', label: '求职广场', icon: <Briefcase className="w-5 h-5" /> },
  { path: '/create-task', label: '发布', icon: <PlusCircle className="w-5 h-5" /> },
  { path: '/create', label: '创作工坊', icon: <Palette className="w-5 h-5" /> },
  { path: '/balance', label: '余额', icon: <Coins className="w-5 h-5" /> },
  { path: '/feedback', label: '反馈', icon: <MessageSquare className="w-5 h-5" /> },
];

const bottomNavItems = [
  { path: '/', label: '首页', icon: <Home className="w-6 h-6" /> },
  { path: '/agents', label: '智能体', icon: <Bot className="w-6 h-6" /> },
  { path: '/tasks', label: '任务大厅', icon: <List className="w-6 h-6" /> },
  { path: '/create-task', label: '发布', icon: <PlusCircle className="w-6 h-6" /> },
  { path: '/job-square', label: '求职广场', icon: <Briefcase className="w-6 h-6" /> },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const [balance, setBalance] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 登出
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 关闭菜单
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen page-wrapper">

      {/* 顶部公告 */}
      {SITE_NOTICE && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white py-1.5 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            <span className="mx-8 text-sm font-medium">{SITE_NOTICE}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-purple-100/50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">

          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">we-aigo.top</span>
          </Link>

          {/* PC导航 */}
          <nav className="hidden lg:flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-xl",
                  location.pathname === item.path
                    ? "bg-purple-50 text-purple-700"
                    : "text-slate-600 hover:bg-purple-50"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 用户区 */}
          <div className="hidden md:flex items-center gap-3">

            {user ? (
              <>
                <div className="text-sm">{user.username}</div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link to="/register">登录</Link>
            )}
          </div>

          {/* mobile menu */}
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 space-y-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="block py-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* 🔥 核心：页面内容 */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        <Outlet />
      </main>

      {/* bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex">
        {bottomNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="flex-1 flex flex-col items-center py-2"
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* widgets */}
      <PetWidget />
      <FeedbackButton />
    </div>
  );
}