type Roles = readonly (string | null | undefined)[] | null | undefined;

function hasRole(roles: Roles, expectedRole: string): boolean {
  return roles?.some((role) => role?.toUpperCase() === expectedRole) ?? false;
}

export function canAccessTeamPage(roles: Roles): boolean {
  return hasRole(roles, "ATASAN");
}

export function canAccessAdminPage(roles: Roles): boolean {
  return hasRole(roles, "ADMIN");
}

export function canAccessReviewPage(roles: Roles): boolean {
  return canAccessTeamPage(roles) || hasRole(roles, "ADMIN");
}