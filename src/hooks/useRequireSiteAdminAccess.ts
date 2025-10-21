import { useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUserInfo, useUserRole } from '@/api';

export const useRequireSiteAdminAccess = () => {
  const navigate = useNavigate();
  const { data: userInfo, isLoading: isUserInfoLoading } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;

  const {
    data: userRole,
    isLoading: isUserRoleLoading,
  } = useUserRole({ enabled: isUserLoggedIn });

  const canAccessSiteAdminPages = useMemo(
    () => isUserLoggedIn && Boolean(userRole?.isSiteAdmin),
    [isUserLoggedIn, userRole?.isSiteAdmin],
  );

  const isCheckingAccess = isUserInfoLoading || (isUserLoggedIn && isUserRoleLoading);

  useEffect(() => {
    if (!isCheckingAccess && !canAccessSiteAdminPages) {
      void navigate({ to: '/' });
    }
  }, [canAccessSiteAdminPages, isCheckingAccess, navigate]);

  return { canAccessSiteAdminPages, isCheckingAccess };
};
