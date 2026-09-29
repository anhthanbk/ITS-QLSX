import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/feedback/error-boundary';

const ProblemChild: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test crash error');
  }
  return <div>Component loaded successfully</div>;
};

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Component loaded successfully')).toBeInTheDocument();
  });

  it('renders fallback error message when child throws', () => {
    // Suppress console.error in test output for intentional error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Đã xảy ra sự cố không mong muốn')).toBeInTheDocument();
    expect(screen.getByText('Test crash error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('supports custom fallback render prop', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <div>
            <span>Custom Fallback: {error.message}</span>
            <button onClick={reset}>Reset Me</button>
          </div>
        )}
      >
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom Fallback: Test crash error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Me' })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('allows retrying after error state is reset', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const TestWrapper = () => {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <ErrorBoundary onReset={() => setShouldThrow(false)}>
          <ProblemChild shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestWrapper />);
    expect(screen.getByText('Đã xảy ra sự cố không mong muốn')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    await user.click(retryBtn);

    expect(screen.getByText('Component loaded successfully')).toBeInTheDocument();

    spy.mockRestore();
  });
});
