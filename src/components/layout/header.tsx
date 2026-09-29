import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/components/feedback/use-toast';
import { useLayout } from './use-layout';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { info } = useToast();
  const { toggleMobileSidebar } = useLayout();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleNotificationClick = () => {
    info('Hệ thống hoạt động bình thường, không có cảnh báo mới.', 'Thông báo hệ thống');
  };

  const fullName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Người dùng';
  const roleName = user?.roles?.[0]?.name || 'Nhân viên';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/85 px-4 sm:px-6 backdrop-blur-md">
      {/* Left section: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          id="mobile-sidebar-toggle"
          onClick={toggleMobileSidebar}
          aria-label="Mở thanh điều hướng"
          className="lg:hidden rounded-lg text-muted-foreground hover:text-foreground shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:block truncate">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right section: System status, Theme, Notifications, User menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System online status badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Hệ thống trực tuyến</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Bell */}
        <Button
          variant="ghost"
          size="icon"
          id="notifications-btn"
          onClick={handleNotificationClick}
          aria-label="Thông báo"
          className="relative rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
        </Button>

        {/* User profile dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            id="user-profile-menu-button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
            aria-label="Menu tài khoản người dùng"
            className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* User Avatar Circle */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
              {initial}
            </div>

            {/* Name and role (desktop) */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
                {fullName}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-primary" />
                {roleName}
              </span>
            </div>

            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-popover p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 z-50"
            >
              {/* Profile summary header */}
              <div className="px-3 py-2 border-b border-border/60 mb-1">
                <p className="text-xs font-bold text-foreground truncate">{fullName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-semibold">
                  <CheckCircle className="h-3 w-3" />
                  <span>Vai trò: {roleName}</span>
                </div>
              </div>

              {/* Links */}
              <Link
                to="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Hồ sơ cá nhân</span>
              </Link>

              <div className="my-1 border-t border-border/60" />

              {/* Sign out */}
              <button
                type="button"
                onClick={handleSignOut}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
