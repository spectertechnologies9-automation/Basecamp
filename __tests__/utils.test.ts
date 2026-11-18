import { getInitials, slugify, truncate, pluralize, formatFileSize, hexToHsl } from '@/lib/utils';
import { hasMinimumRole, canManageOrganization, canCreateTasks } from '@/lib/permissions';

describe('Utility functions', () => {
  test('getInitials extracts up to 2 uppercase letters', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Jane')).toBe('J');
    expect(getInitials('Alice Bob Charlie')).toBe('AB');
  });

  test('slugify cleans and formats text properly', () => {
    expect(slugify('NexaFlow Project 2026!')).toBe('nexaflow-project-2026');
    expect(slugify('  Spaced  Out  ')).toBe('spaced-out');
  });

  test('truncate limits length with ellipsis', () => {
    expect(truncate('Hello world', 5)).toBe('Hello...');
    expect(truncate('Short', 10)).toBe('Short');
  });

  test('pluralize formats counts correctly', () => {
    expect(pluralize(1, 'task')).toBe('1 task');
    expect(pluralize(5, 'task')).toBe('5 tasks');
    expect(pluralize(2, 'person', 'people')).toBe('2 people');
  });

  test('formatFileSize formats byte amounts', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });

  test('hexToHsl converts valid hex colors', () => {
    expect(hexToHsl('#39C6AE')).toMatch(/\d+ \d+% \d+%/);
  });
});

describe('Permission checks', () => {
  test('role hierarchy checks', () => {
    expect(hasMinimumRole('owner', 'admin')).toBe(true);
    expect(hasMinimumRole('admin', 'admin')).toBe(true);
    expect(hasMinimumRole('member', 'admin')).toBe(false);
    expect(hasMinimumRole('observer', 'member')).toBe(false);
  });

  test('canManageOrganization requires admin', () => {
    expect(canManageOrganization('owner')).toBe(true);
    expect(canManageOrganization('admin')).toBe(true);
    expect(canManageOrganization('project_manager')).toBe(false);
    expect(canManageOrganization('member')).toBe(false);
  });

  test('canCreateTasks requires member', () => {
    expect(canCreateTasks('member')).toBe(true);
    expect(canCreateTasks('client')).toBe(false);
    expect(canCreateTasks('observer')).toBe(false);
  });
});
