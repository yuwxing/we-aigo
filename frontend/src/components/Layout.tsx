import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Bot, List, PlusCircle, Menu, X, Home,
  Sparkles, Gift, Briefcase, Coins, ShieldCheck,
  LogOut, Palette, MessageSquare, GraduationCap
} from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '../contexts/UserContext';
import PetWidget from './PetWidget';
import { FeedbackButton } from './FeedbackButton';
import SakuraDecorations from './SakuraDecorations';

const SITE_NOTICE = '';

const navItems = [
  { path: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
  { path: '/agents', label: '数字分身', icon: <Bot className="w-5 h-5" /> },
  { path: '/jinghua', label: '菁华大学', icon: <GraduationCap className="w-5 h-5" /> },
  { path: '/tasks', label: '火星基地', icon: <List className="w-5 h-5" /> },
  { path: '/job-square', label: '求职广场', icon: <Briefcase className="w-5 h-5" /> },
  { path: '/create-task', label: '发布', icon: <PlusCircle className="w-5 h-5" /> },
  { path: '/create', label: '时空工坊', icon: <Palette className="w-5 h-5" /> },
  { path: '/balance', label: '余额', icon: <Coins className="w-5 h-5" /> },
  { path: '/feedback', label: '反馈', icon: <MessageSquare className="w-5 h-5" /> },
];

const bottomNavItems = [
  { path: '/', label: '首页', icon: <Home className="w-6 h-6" /> },
  { path: '/agents', label: '数字分身', icon: <Bot className="w-6 h-6" /> },
  { path: '/tasks', label: '火星基地', icon: <List className="w-6 h-6" /> },
  { path: '/create-task', label: '发布', icon: <PlusCircle className="w-6 h-6" /> },
  { path: '/job-square', label: '求职广场', icon: <Briefcase className="w-6 h-6" /> },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen page-wrapper">
      <SakuraDecorations />

      {SITE_NOTICE && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-violet-500/90 via-fuchsia-500/90 to-violet-500/90 text-white py-1.5 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            <span className="mx-8 text-sm font-medium">{SITE_NOTICE}</span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-pink-100/30">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">

          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500">
              we-aigo.top
            </span>
          </Link>

          <nav className="hidden lg:flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-pink-50 text-pink-700"
                    : "text-slate-500 hover:text-pink-600 hover:bg-pink-50"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="text-sm text-slate-600">{user.username}</div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-400 hover:text-rose-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/register"
                className="text-sm font-medium text-pink-600 hover:text-rose-600 transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          <button
            className="lg:hidden text-slate-500 hover:text-pink-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <div className="absolute left-0 right-0 top-16 bg-white/90 backdrop-blur-xl border-b border-pink-100/30 shadow-xl overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
              <div className="p-4 space-y-1" onClick={e => e.stopPropagation()}>
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      "flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-colors",
                      location.pathname === item.path
                        ? "text-pink-700 bg-pink-50"
                        : "text-slate-600 hover:text-pink-600 hover:bg-pink-50"
                    )}
                  >
                    <span className="text-[1.1rem]">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    to="/register"
                    className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50"
                  >
                    {'登录 / 注册'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-8 relative z-10 page-enter">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-pink-100/30 flex z-50 safe-area-inset-bottom">
        {bottomNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              "flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs transition-colors",
              location.pathname === item.path
                ? "text-pink-600"
                : "text-slate-400 hover:text-pink-500"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <PetWidget />
      <FeedbackButton />
    </div>
  );
}
