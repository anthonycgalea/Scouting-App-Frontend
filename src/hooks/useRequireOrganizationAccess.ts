import { useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUserInfo, useUserRole } from '@/api';

export const ALLOWED_ORGANIZATION_ROLES = ['ADMIN', 'LEAD'] as const;
const allowedOrganizationRoleSet = new Set<string>(ALLOWED_ORGANIZATION_ROLES);

export const isOrganizationRoleAllowed = (role: string | null | undefined) =>
  role !== null && role !== undefined && allowedOrganizationRoleSet.has(role);

export const useRequireOrganizationAccess = () => {
  const navigate = useNavigate();
  const { data: userInfo, isLoading: isUserInfoLoading } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;

  const {
    data: userRole,
    isLoading: isUserRoleLoading,
  } = useUserRole({ enabled: isUserLoggedIn });

  const canAccessOrganizationPages = useMemo(
    () => isUserLoggedIn && isOrganizationRoleAllowed(userRole?.role ?? null),
    [isUserLoggedIn, userRole?.role]
  );

  const isCheckingAccess = isUserInfoLoading || (isUserLoggedIn && isUserRoleLoading);

  useEffect(() => {
    if (!isCheckingAccess && !canAccessOrganizationPages) {
      void navigate({ to: '/' });
    }
  }, [canAccessOrganizationPages, isCheckingAccess, navigate]);

  return { canAccessOrganizationPages, isCheckingAccess };
};
