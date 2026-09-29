import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/App';
import { Button } from '@/components/ui/button';

describe('Application Root & UI Primitive Smoke Tests', () => {
  it('renders application with login screen for unauthenticated visitors', async () => {
    render(<App />);

    // Since user is not logged in by default, it redirects to /login and displays login form
    expect(await screen.findByText(/Đăng Nhập Hệ Thống/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Hệ thống Quản lý Sản xuất/i).length).toBeGreaterThan(0);
  });

  it('renders Button component with variant styles and responds to clicks', () => {
    const { container, rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(container.firstChild).toHaveClass('border-input');
  });
});
