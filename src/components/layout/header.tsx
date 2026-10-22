import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/components/feedback/use-toast';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { info } = useToast();
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
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-md shadow-2xs">
      {/* Left section: Brand logo + Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Brand ITS Production (1-click to Home) */}
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xl hover:opacity-90 transition-opacity shrink-0"
          title="Về Trang chủ điều hành ITS CHANNEL"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white font-black text-xs shadow-xs ring-1 ring-emerald-700/50">
            ITS
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-black tracking-tight text-foreground block leading-tight">
              ITS CHANNEL
            </span>
            <span className="text-[10px] text-muted-foreground block font-medium">
              ERP system
            </span>
          </div>
        </Link>
      </div>

      {/* Right section: Theme, Notifications, User menu */}
      <div className="flex items-center gap-2 sm:gap-3">

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
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
        </Button>

        {/* User profile dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            id="user-menu-button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white font-bold text-xs ring-2 ring-emerald-600/30 shadow-xs">
              {initial}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
                {fullName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {roleName}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Profile dropdown menu */}
          {isProfileMenuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
              className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-border bg-card p-1.5 text-card-foreground shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* User summary */}
              <div className="border-b border-border/80 px-3 py-2.5">
                <p className="text-xs font-bold text-foreground truncate">{fullName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{roleName}</span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  role="menuitem"
                >
                  <LayoutGrid className="h-4 w-4 text-emerald-600" />
                  <span>Cổng phòng ban</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  role="menuitem"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Hồ sơ cá nhân</span>
                </Link>
              </div>

              {/* Sign out */}
              <div className="border-t border-border/80 pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
