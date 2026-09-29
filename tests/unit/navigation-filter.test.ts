import { describe, it, expect } from 'vitest';
import { navigationItems, filterNavItems } from '@/components/layout/nav-items';

describe('Navigation Filtering Based on Roles & Permissions', () => {
  it('allows full navigation access for admin user', () => {
    const hasRole = (role: string) => role === 'admin';
    const hasPermission = () => true;

    const filtered = filterNavItems(navigationItems, hasPermission, hasRole);

    const ids = filtered.map((item) => item.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('production');
    expect(ids).toContain('warehouse');
    expect(ids).toContain('admin');
  });

  it('hides admin navigation from operators without admin role', () => {
    const hasRole = (role: string) => role === 'operator';
    const hasPermission = (perm: string) =>
      ['production.shift.view', 'production.plan.view'].includes(perm);

    const filtered = filterNavItems(navigationItems, hasPermission, hasRole);

    const ids = filtered.map((item) => item.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('production');
    expect(ids).not.toContain('admin');
  });

  it('filters child submenu items according to granular permissions', () => {
    const hasRole = () => false;
    // Operator only has shift.view, but not plan.view
    const hasPermission = (perm: string) => perm === 'production.shift.view';

    const filtered = filterNavItems(navigationItems, hasPermission, hasRole);

    const productionNav = filtered.find((item) => item.id === 'production');
    expect(productionNav).toBeDefined();

    const childIds = productionNav?.children?.map((c) => c.id);
    expect(childIds).toContain('production-shifts');
    expect(childIds).not.toContain('production-plans');
  });

  it('excludes parent category if user has none of the required permissions or children', () => {
    const hasRole = () => false;
    const hasPermission = () => false; // no permissions

    const filtered = filterNavItems(navigationItems, hasPermission, hasRole);

    const ids = filtered.map((item) => item.id);
    // Dashboard has no permissions required, so it stays
    expect(ids).toContain('dashboard');
    // All protected sections are hidden
    expect(ids).not.toContain('production');
    expect(ids).not.toContain('warehouse');
    expect(ids).not.toContain('admin');
  });
});
