import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowUpRight } from 'lucide-react';
import type { PortalDepartmentGroup, PortalFunctionItem } from '../portal-data';
import { cn } from '@/lib/utils';

export interface DepartmentActionsModalProps {
  isOpen: boolean;
  department: PortalDepartmentGroup | null;
  allDepartments?: PortalDepartmentGroup[];
  onClose: () => void;
  onSelectDepartment?: (dept: PortalDepartmentGroup) => void;
}

export const DepartmentActionsModal: React.FC<DepartmentActionsModalProps> = ({
  isOpen,
  department,
  onClose,
}) => {
  const navigate = useNavigate();

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ngăn chặn cuộn trang phía dưới khi modal mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !department) return null;

  const DeptIcon = department.deptIcon;

  const handleActionClick = (fn: PortalFunctionItem) => {
    onClose();
    navigate(fn.path);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop mờ tối */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Hộp thoại Modal chính */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl transition-all z-10 my-auto">
        {/* Top Header Phòng Ban */}
        <div className="border-b border-border/80 bg-muted/30 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ring-1 ring-border',
                  department.iconBg
                )}
              >
                <DeptIcon className={cn('h-6 w-6', department.iconColor)} />
              </div>

              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', department.bulletColor)} />
                <h2 id="dept-modal-title" className="text-base font-extrabold uppercase tracking-tight text-foreground sm:text-lg">
                  {department.indexCode}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Danh sách các Button Icon Thao Tác Cụ Thể */}
        <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            NGHIỆP VỤ
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {department.functions.map((fn) => {
              const IconComponent = fn.icon;

              return (
                <button
                  key={fn.id}
                  type="button"
                  onClick={() => handleActionClick(fn)}
                  className={cn(
                    'group relative flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none',
                    fn.isDashboard
                      ? 'border-primary/50 bg-gradient-to-br from-card via-card to-primary/10 ring-1 ring-primary/20 hover:border-primary'
                      : 'border-border/80 bg-card hover:border-primary/60 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icon Thao Tác */}
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 shadow-2xs ring-1 ring-border/50',
                        fn.iconBg
                      )}
                    >
                      <IconComponent className={cn('h-5 w-5', fn.iconColor)} />
                    </div>

                    {/* Chi tiết thao tác: Tiêu đề hiện đủ chữ */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {fn.title}
                      </h3>
                    </div>
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Đóng */}
        <div className="border-t border-border/80 bg-muted/20 px-5 py-3 sm:px-6 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Hệ thống quản lý sản xuất ITS Production • {department.shortName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-1.5 font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
