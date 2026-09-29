import { describe, it, expect } from 'vitest';
import { env } from '@/lib/env';

describe('Environment Configuration', () => {
  it('loads valid environment variables correctly', () => {
    expect(env.VITE_SUPABASE_URL).toBeDefined();
    expect(env.VITE_SUPABASE_URL).toMatch(/^https?:\/\//);
    expect(env.VITE_SUPABASE_ANON_KEY).toBeDefined();
    expect(env.VITE_SUPABASE_ANON_KEY.length).toBeGreaterThan(0);
    expect(env.VITE_APP_NAME).toBeDefined();
    expect(['development', 'test', 'production']).toContain(env.VITE_APP_ENV);
  });
});
