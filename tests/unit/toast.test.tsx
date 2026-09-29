import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/components/feedback';

const TestToastTrigger: React.FC = () => {
  const { success, error, warning, info, dismiss } = useToast();

  return (
    <div>
      <button onClick={() => success('Cập nhật thành công', 'Thành công')}>Bật Success</button>
      <button onClick={() => error('Lỗi kết nối máy chủ', 'Lỗi')}>Bật Error</button>
      <button onClick={() => warning('Cảnh báo nhiệt độ', 'Cảnh báo')}>Bật Warning</button>
      <button onClick={() => info('Thông tin phiên bản', 'Thông tin')}>Bật Info</button>
      <button onClick={() => dismiss('dummy-id')}>Dismiss</button>
    </div>
  );
};

describe('Toast Notification System', () => {
  it('renders success toast when triggered', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>,
    );

    const btn = screen.getByRole('button', { name: 'Bật Success' });
    await user.click(btn);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Thành công')).toBeInTheDocument();
    expect(screen.getByText('Cập nhật thành công')).toBeInTheDocument();
  });

  it('renders error toast with proper message', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>,
    );

    const btn = screen.getByRole('button', { name: 'Bật Error' });
    await user.click(btn);

    expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument();
  });

  it('can dismiss toast using close button', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>,
    );

    const btn = screen.getByRole('button', { name: 'Bật Warning' });
    await user.click(btn);

    expect(screen.getByText('Cảnh báo nhiệt độ')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    await user.click(closeBtn);

    expect(screen.queryByText('Cảnh báo nhiệt độ')).not.toBeInTheDocument();
  });
});
