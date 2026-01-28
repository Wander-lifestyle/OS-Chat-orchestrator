export function canManageOrganization(role?: string | null) {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return (
    normalized.includes('admin') ||
    normalized.includes('owner') ||
    normalized.includes('editor')
  );
}

export function canViewOrganization(role?: string | null) {
  return Boolean(role);
}
