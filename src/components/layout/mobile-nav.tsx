import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Landmark,
  LayoutGrid,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
  Pin,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { PORTAL_DEPARTMENT_GROUPS } from '@/features/portal/portal-data';
import { cn } from '@/lib/utils';

export interface MobileNavItem {
  id: string;
  name: string;
  shortName: string;
  path: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

export const STORAGE_KEY_MOBILE_PINNED_IDS = 'its_mobile_nav_pinned_ids';
export const DEFAULT_PINNED_DEPT_IDS = ['executive', 'production', 'warehouse', 'maintenance'];

export const MobileNav: React.FC = () => {
  const { hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Danh sách các phòng ban được phép truy cập
  const allNavItems: MobileNavItem[] = useMemo(() => {
    const list: MobileNavItem[] = [];

    // 1. Điều hành
    list.push({
      id: 'executive',
      name: 'Tổng Hợp & Điều Hành',
      shortName: 'Điều hành',
      path: '/',
      icon: Landmark,
      iconBg: 'bg-indigo-500/15',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    });

    // 2. Các phòng ban khác từ PORTAL_DEPARTMENT_GROUPS
    PORTAL_DEPARTMENT_GROUPS.filter((g) => g.id !== 'executive').forEach((group) => {
      const allowedFunctions = group.functions.filter((fn) => {
        if (fn.requiredRole) {
          const roles = Array.isArray(fn.requiredRole) ? fn.requiredRole : [fn.requiredRole];
          if (!roles.some((r) => hasRole(r))) return false;
        }
        if (fn.requiredPermission) {
          const perms = Array.isArray(fn.requiredPermission)
            ? fn.requiredPermission
            : [fn.requiredPermission];
          if (!perms.some((p) => hasPermission(p))) return false;
        }
        return true;
      });

      if (allowedFunctions.length > 0) {
        list.push({
          id: group.id,
          name: group.name,
          shortName: group.shortName,
          path: `/${group.id}`,
          icon: group.deptIcon,
          iconBg: group.iconBg,
          iconColor: group.iconColor,
        });
      }
    });

    return list;
  }, [hasPermission, hasRole]);

  // Load pinned IDs from localStorage
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOBILE_PINNED_IDS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_PINNED_DEPT_IDS;
  });

  // State tạm thời khi đang tùy chỉnh
  const [editingPinnedIds, setEditingPinnedIds] = useState<string[]>(pinnedIds);

  useEffect(() => {
    if (isOpen) {
      setEditingPinnedIds(pinnedIds);
      setIsCustomizing(false);
    }
  }, [isOpen, pinnedIds]);

  // Đóng drawer khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 4 items pinned to bottom bar
  const pinnedItems = useMemo(() => {
    const items: MobileNavItem[] = [];
    for (const id of pinnedIds) {
      const found = allNavItems.find((item) => item.id === id);
      if (found) items.push(found);
    }
    // Nếu có ít hơn 4 do quyền hoặc thiết lập cũ, điền thêm các mục còn lại
    if (items.length < 4) {
      for (const item of allNavItems) {
        if (!items.some((i) => i.id === item.id)) {
          items.push(item);
          if (items.length === 4) break;
        }
      }
    }
    return items.slice(0, 4);
  }, [allNavItems, pinnedIds]);

  // Kiểm tra trạng thái active của một mục
  const isItemActive = useCallback(
    (item: MobileNavItem) => {
      if (item.id === 'executive') {
        return location.pathname === '/' || location.pathname.startsWith('/executive');
      }
      const deptPath = `/${item.id}`;
      if (location.pathname === deptPath || location.pathname.startsWith(`${deptPath}/`)) {
        return true;
      }
      const group = PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === item.id);
      if (group) {
        return group.functions.some((fn) => {
          const basePath = fn.path.split('?')[0] || fn.path;
          return location.pathname === fn.path || location.pathname.startsWith(basePath);
        });
      }
      return false;
    },
    [location.pathname],
  );

  // Các mục không được ghim trên thanh đáy
  const unpinnedItems = useMemo(() => {
    const pinnedSet = new Set(pinnedItems.map((i) => i.id));
    return allNavItems.filter((i) => !pinnedSet.has(i.id));
  }, [allNavItems, pinnedItems]);

  // Nút "Thêm" sáng lên nếu trang hiện tại thuộc về một mục không ghim
  const isMoreButtonActive = useMemo(() => {
    return unpinnedItems.some((item) => isItemActive(item));
  }, [unpinnedItems, isItemActive]);

  // Toggled item khi đang ở chế độ tùy chỉnh 4 nút
  const handleToggleSelectPinned = (id: string) => {
    if (editingPinnedIds.includes(id)) {
      if (editingPinnedIds.length <= 1) return; // Giữ ít nhất 1 nút
      setEditingPinnedIds(editingPinnedIds.filter((item) => item !== id));
    } else {
      if (editingPinnedIds.length >= 4) {
        // Nếu đã đủ 4, thay thế phần tử cuối cùng hoặc phần tử đầu tiên
        setEditingPinnedIds([...editingPinnedIds.slice(1), id]);
      } else {
        setEditingPinnedIds([...editingPinnedIds, id]);
      }
    }
  };

  const handleSaveCustomization = () => {
    // Đảm bảo có đúng 4 nút
    let finalIds = [...editingPinnedIds];
    if (finalIds.length < 4) {
      for (const item of allNavItems) {
        if (!finalIds.includes(item.id)) {
          finalIds.push(item.id);
          if (finalIds.length === 4) break;
        }
      }
    }
    finalIds = finalIds.slice(0, 4);

    setPinnedIds(finalIds);
    try {
      localStorage.setItem(STORAGE_KEY_MOBILE_PINNED_IDS, JSON.stringify(finalIds));
    } catch {
      // ignore
    }
    setIsCustomizing(false);
    setIsOpen(false);
  };

  const handleResetToDefault = () => {
    setEditingPinnedIds(DEFAULT_PINNED_DEPT_IDS);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* THANH ĐIỀU HƯỚNG ĐÁY MOBILE: ĐÚNG 5 NÚT CÂN ĐỐI          */}
      {/* ======================================================== */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md shadow-lg px-1 py-1.5 grid grid-cols-5 items-center select-none"
      >
        {/* 4 Nút chính đã được cấu hình */}
        {pinnedItems.map((item) => {
          const ItemIcon = item.icon;
          const active = isItemActive(item);

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer',
                active
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-transform',
                  active ? 'bg-primary/15 scale-105' : 'bg-transparent',
                )}
              >
                <ItemIcon
                  className={cn(
                    'h-4 w-4',
                    active ? 'text-primary' : item.iconColor,
                  )}
                />
              </div>
              <span className="text-[10px] font-medium truncate max-w-[58px] mt-0.5 leading-none">
                {item.shortName}
              </span>
            </NavLink>
          );
        })}

        {/* Nút Thứ 5: NÚT "THÊM" ĐỂ MỞ CÁC VIEW CÒN LẠI */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Xem thêm các phòng ban khác"
          className={cn(
            'flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer relative',
            isMoreButtonActive || isOpen
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-transform',
              isMoreButtonActive || isOpen ? 'bg-primary/15 scale-105' : 'bg-transparent',
            )}
          >
            <LayoutGrid
              className={cn(
                'h-4 w-4',
                isMoreButtonActive || isOpen ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </div>
          <span className="text-[10px] font-medium truncate max-w-[58px] mt-0.5 leading-none">
            Thêm
          </span>

          {/* Dấu chấm báo hiệu đang ở một view thuộc nút Thêm */}
          {isMoreButtonActive && !isOpen && (
            <span className="absolute top-1 right-2.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-card" />
          )}
        </button>
      </nav>

      {/* ======================================================== */}
      {/* BOTTOM SHEET / DRAWER: MỞ CÁC VIEW CÒN LẠI & TÙY CHỈNH    */}
      {/* ======================================================== */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay làm mờ nền */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Nội dung Sheet trượt từ đáy lên */}
          <div className="relative z-10 w-full rounded-t-3xl border-t border-border bg-card p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
            {/* Thanh gạt nhỏ đầu sheet */}
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />

            {/* Header Sheet */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {isCustomizing ? 'Tùy chỉnh 4 nút chính' : 'Tất cả phòng ban'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isCustomizing
                    ? `Chọn 4 nút ghim dưới đáy (${editingPinnedIds.length}/4)`
                    : 'Chạm để truy cập nhanh view phòng ban'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {!isCustomizing ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomizing(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                    <span>Tùy chỉnh</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    title="Khôi phục mặc định"
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Mặc định</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body Sheet */}
            <div className="flex-1 overflow-y-auto py-4">
              {!isCustomizing ? (
                /* CHẾ ĐỘ 1: XEM & TRUY CẬP TẤT CẢ CÁC VIEW */
                <div className="grid grid-cols-2 gap-2.5">
                  {allNavItems.map((item) => {
                    const ItemIcon = item.icon;
                    const active = isItemActive(item);
                    const isPinned = pinnedItems.some((p) => p.id === item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          navigate(item.path);
                          setIsOpen(false);
                        }}
                        className={cn(
                          'flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer',
                          active
                            ? 'border-primary/60 bg-primary/10 shadow-xs'
                            : 'border-border/80 bg-card hover:bg-muted/50',
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            item.iconBg,
                          )}
                        >
                          <ItemIcon className={cn('h-5 w-5', item.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                'text-xs font-bold truncate',
                                active ? 'text-primary' : 'text-foreground',
                              )}
                            >
                              {item.shortName}
                            </span>
                            {isPinned && (
                              <span title="Đã ghim thanh đáy" className="inline-flex">
                                <Pin className="h-2.5 w-2.5 text-muted-foreground/70 shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* CHẾ ĐỘ 2: TÙY CHỈNH CHỌN 4 NÚT HIỂN THỊ DƯỚI ĐÁY */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {allNavItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isSelected = editingPinnedIds.includes(item.id);
                      const selectedIndex = editingPinnedIds.indexOf(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleSelectPinned(item.id)}
                          className={cn(
                            'relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer',
                            isSelected
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                              : 'border-border/80 bg-card hover:bg-muted/50 opacity-70',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              item.iconBg,
                            )}
                          >
                            <ItemIcon className={cn('h-4.5 w-4.5', item.iconColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-foreground truncate block">
                              {item.shortName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {isSelected ? `Vị trí #${selectedIndex + 1}` : 'Chạm để ghim'}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Nút lưu thiết lập */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomizing(false)}
                      className="flex-1 py-2 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomization}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                      Lưu & Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
