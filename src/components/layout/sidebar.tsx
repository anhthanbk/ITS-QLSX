import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Factory,
  X,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { navigationItems, filterNavItems, type NavItem } from './nav-items';
import { useLayout } from './use-layout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Sidebar: React.FC = () => {
  const { hasPermission, hasRole } = useAuth();
  const {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    toggleSidebar,
    closeMobileSidebar,
  } = useLayout();
  const location = useLocation();

  // State to track which parent accordion item is open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Automatically open group if current route matches
    const initial: Record<string, boolean> = {};
    for (const item of navigationItems) {
      if (item.children) {
        const matchesChild = item.children.some((c) => location.pathname.startsWith(c.path));
        if (matchesChild) {
          initial[item.id] = true;
        }
      }
    }
    return initial;
  });

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = filterNavItems(navigationItems, hasPermission, hasRole);

  const renderNavList = (isMobile: boolean) => (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
      <ul className="space-y-1.5" role="menubar">
        {filteredItems.map((item: NavItem) => {
          const hasChildren = item.children && item.children.length > 0;
          const isGroupOpen = !!openGroups[item.id];
          const isParentActive =
            location.pathname === item.path ||
            (hasChildren && item.children?.some((c) => location.pathname.startsWith(c.path)));

          const IconComponent = item.icon;

          if (hasChildren && (!isSidebarCollapsed || isMobile)) {
            return (
              <li key={item.id} className="space-y-1" role="none">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  aria-expanded={isGroupOpen}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-colors',
                    isParentActive
                      ? 'bg-accent/70 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent
                      className={cn(
                        'h-4.5 w-4.5 shrink-0 transition-colors',
                        isParentActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {isGroupOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
                  )}
                </button>

                {/* Submenu */}
                {isGroupOpen && (
                  <ul className="mt-1 space-y-1 pl-7 pr-1" role="menu">
                    {item.children?.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <li key={child.id} role="none">
                          <NavLink
                            to={child.path}
                            onClick={() => {
                              if (isMobile) closeMobileSidebar();
                            }}
                            className={cn(
                              'block rounded-md px-2.5 py-1.5 text-xs transition-colors',
                              isChildActive
                                ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                            )}
                            role="menuitem"
                          >
                            <span className="truncate">{child.title}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          }

          // Single item or collapsed view
          return (
            <li key={item.id} role="none">
              <NavLink
                to={hasChildren && item.children?.[0] ? item.children[0].path : item.path}
                onClick={() => {
                  if (isMobile) closeMobileSidebar();
                }}
                title={isSidebarCollapsed && !isMobile ? item.title : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-colors',
                  isParentActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  isSidebarCollapsed && !isMobile && 'justify-center px-2',
                )}
                role="menuitem"
              >
                <IconComponent
                  className={cn(
                    'h-4.5 w-4.5 shrink-0 transition-colors',
                    isParentActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {(!isSidebarCollapsed || isMobile) && (
                  <span className="truncate">{item.title}</span>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        id="mobile-sidebar"
        role="navigation"
        aria-label="Thanh điều hướng di động"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card border-r border-border transition-transform duration-300 ease-in-out lg:hidden',
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-foreground">ITS-QLSX</span>
              <p className="text-[10px] text-muted-foreground font-medium">Sản Xuất & Vận Hành</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileSidebar}
            aria-label="Đóng thanh điều hướng"
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Nav Links */}
        {renderNavList(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        id="desktop-sidebar"
        role="navigation"
        aria-label="Thanh điều hướng chính"
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card shrink-0 transition-all duration-300 ease-in-out sticky top-0 h-screen',
          isSidebarCollapsed ? 'w-18' : 'w-64',
        )}
      >
        {/* Desktop Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Factory className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="text-sm font-bold tracking-tight text-foreground">ITS-QLSX</span>
                <p className="text-[10px] text-muted-foreground font-medium">Hệ Thống Quản Lý Sản Xuất</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            id="desktop-sidebar-toggle"
            aria-label={isSidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className="hidden lg:flex h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
          >
            {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Desktop Nav Links */}
        {renderNavList(false)}
      </aside>
    </>
  );
};
