import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { Button } from '@/components/ui/button';

describe('Phase 1 Foundation Smoke Tests', () => {
  it('renders application title and bootstrap status badge', () => {
    render(<App />);

    expect(screen.getByText(/ITS QLSX/i)).toBeInTheDocument();
    expect(screen.getByText(/Bootstrap Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Enterprise Production System Foundation/i)).toBeInTheDocument();
  });

  it('increments test counter upon button interaction', async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole('button', { name: /Interactive State Check/i });
    expect(button).toHaveTextContent('Interactive State Check (0)');

    await user.click(button);
    expect(button).toHaveTextContent('Interactive State Check (1)');

    await user.click(button);
    expect(button).toHaveTextContent('Interactive State Check (2)');
  });

  it('renders Button component with variant styles', () => {
    const { container, rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(container.firstChild).toHaveClass('border-input');
  });
});
