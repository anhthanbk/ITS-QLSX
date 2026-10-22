import React, { useState, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutContext } from './layout-context';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { DepartmentViewTabBar } from './department-view-tab-bar';
import { ErrorBoundary } from '@/components/feedback/error-boundary';

export const AppShell: React.FC = () => {

  // Desktop sidebar collapsed state
  const [isSidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('its_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem('its_sidebar_collapsed', String(collapsed));
    } catch {
      // ignore
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
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        {/* Top Header Điều Hành & Breadcrumbs */}
        <Header />

        {/* Khung thân ứng dụng: Sidebar cố định bên trái + Vùng nội dung cuộn bên phải */}
        <div className="flex flex-1 min-h-[calc(100vh-64px)] w-full overflow-hidden">
          {/* Main Sidebar: Luôn hiện diện mượt mà cả ở trang chủ lẫn các trang phòng ban */}
          <Sidebar />

          {/* Vùng nội dung trang */}
          <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
            {/* Thanh các nút thao tác tương ứng của phòng ban khi ở trong các view */}
            <DepartmentViewTabBar />

            {/* Khung nội dung chính */}
            <main className="flex-1 w-full pb-20 md:pb-8">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};
