import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutContext } from './layout-context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ErrorBoundary } from '@/components/feedback/error-boundary';

export const AppShell: React.FC = () => {
  const location = useLocation();

  // Desktop sidebar collapsed state (persisted)
  const [isSidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('its_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Auto-close mobile sidebar whenever pathname changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem('its_sidebar_collapsed', String(collapsed));
    } catch {
      // localStorage error handling
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('its_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const layoutValue = useMemo(
    () => ({
      isSidebarCollapsed,
      isMobileSidebarOpen,
      toggleSidebar,
      setSidebarCollapsed,
      toggleMobileSidebar,
      closeMobileSidebar,
    }),
    [
      isSidebarCollapsed,
      isMobileSidebarOpen,
      toggleSidebar,
      setSidebarCollapsed,
      toggleMobileSidebar,
      closeMobileSidebar,
    ],
  );

  return (
    <LayoutContext.Provider value={layoutValue}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Main Sidebar (Desktop fixed + Mobile off-canvas drawer) */}
        <Sidebar />

        {/* Content area: Header + Main scroll area */}
        <div className="flex flex-1 flex-col min-w-0">
          <Header />

          {/* Main page content wrapped in ErrorBoundary */}
          <main className="flex-1 overflow-x-hidden">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};
