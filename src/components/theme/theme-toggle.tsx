import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from './use-theme';
import type { Theme } from './theme-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, variant = 'dropdown' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        className={cn('relative rounded-lg text-muted-foreground hover:text-foreground', className)}
        aria-label={`Chuyển giao diện (Hiện tại: ${theme})`}
        title={`Chuyển giao diện (Hiện tại: ${theme})`}
      >
        {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>
    );
  }

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Sáng', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Tối', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'Hệ thống', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        id="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg text-muted-foreground hover:text-foreground"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Tùy chọn giao diện"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-4.5 w-4.5 transition-transform" />
        ) : (
          <Sun className="h-4.5 w-4.5 transition-transform" />
        )}
      </Button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 z-50"
        >
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
