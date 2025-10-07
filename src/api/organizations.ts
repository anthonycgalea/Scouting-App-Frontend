import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface Organization {
  id: number;
  name: string;
  team_number: number;
  role: string;
  user_organization_id: number;
}

export const organizationsQueryKey = ['organizations'] as const;
export const allOrganizationsQueryKey = ['all-organizations'] as const;
export const organizationApplicationsQueryKey = ['organization', 'applications'] as const;
export const organizationMembersQueryKey = ['organization', 'members'] as const;
export const organizationCollaborationsQueryKey = ['organization', 'collaborations'] as const;

export interface OrganizationApplication {
  displayName: string;
  email: string;
  role: string;
  joined: string;
  userId: string;
}

export type OrganizationMemberRole = 'ADMIN' | 'LEAD' | 'MEMBER' | 'GUEST';

export interface OrganizationMember {
  userId: string;
  displayName: string;
  email: string;
  role: OrganizationMemberRole;
}

export interface OrganizationCollaboration {
  organizationEventId: string;
  organizationId: number;
  status: string;
  organizationName: string;
  teamNumber?: number | null;
  eventName: string;
  eventWeek?: number | null;
  eventYear?: number | null;
}

export interface InviteOrganizationCollaborationRequest {
  organizationid: number;
}

export interface UpdateOrganizationCollaborationRequest {
  organizationEventId: string;
}

export interface UpdateOrganizationMemberInput {
  userId: string;
  role: OrganizationMemberRole;
}

export const fetchOrganizations = () => apiFetch<Organization[]>('user/organizations');
export const fetchAllOrganizations = () => apiFetch<Organization[]>('organizations');
export const fetchOrganizationApplications = () =>
  apiFetch<OrganizationApplication[]>('organization/applications');

export const fetchOrganizationCollaborations = () =>
  apiFetch<OrganizationCollaboration[]>('organization/collab');

export const fetchOrganizationMembers = () =>
  apiFetch<OrganizationMember[]>('organization/members');

export const updateOrganizationMember = ({ userId, role }: UpdateOrganizationMemberInput) =>
  apiFetch<void>('organization/members', {
    method: 'PATCH',
    json: { userId, role },
  });

export const deleteOrganizationMember = ({ userId }: { userId: string }) =>
  apiFetch<void>('organization/members', {
    method: 'DELETE',
    json: { userId },
  });

export const deleteOrganizationApplication = ({ userId }: { userId: string }) =>
  apiFetch<void>('organization/applications', {
    method: 'DELETE',
    json: { userId },
  });

export const applyToOrganization = (organizationId: number) =>
  apiFetch<void>('user/organization/apply', {
    method: 'POST',
    json: { organization_id: organizationId },
  });

export const useOrganizations = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<Organization[]>({
    queryKey: organizationsQueryKey,
    queryFn: fetchOrganizations,
    enabled,
  });

export const useAllOrganizations = () =>
  useQuery<Organization[]>({
    queryKey: allOrganizationsQueryKey,
    queryFn: fetchAllOrganizations,
  });

export const useOrganizationCollaborations = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<OrganizationCollaboration[]>({
    queryKey: organizationCollaborationsQueryKey,
    queryFn: fetchOrganizationCollaborations,
    enabled,
  });

export const useOrganizationApplications = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<OrganizationApplication[]>({
    queryKey: organizationApplicationsQueryKey,
    queryFn: fetchOrganizationApplications,
    enabled,
  });

export const useOrganizationMembers = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<OrganizationMember[]>({
    queryKey: organizationMembersQueryKey,
    queryFn: fetchOrganizationMembers,
    enabled,
  });

export const useApplyToOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyToOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationsQueryKey });
      void queryClient.invalidateQueries({ queryKey: allOrganizationsQueryKey });
    },
  });
};

export const useUpdateOrganizationMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganizationMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationApplicationsQueryKey });
      void queryClient.invalidateQueries({ queryKey: organizationMembersQueryKey });
    },
  });
};

export const useDeleteOrganizationApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganizationApplication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationApplicationsQueryKey });
    },
  });
};

export const useDeleteOrganizationMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganizationMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationMembersQueryKey });
    },
  });
};

export const inviteOrganizationCollaboration = ({
  organizationid,
}: InviteOrganizationCollaborationRequest) =>
  apiFetch<void>('organization/collab', {
    method: 'POST',
    json: { organizationid },
  });

export const useInviteOrganizationCollaboration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteOrganizationCollaboration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationCollaborationsQueryKey });
    },
  });
};

export const acceptOrganizationCollaboration = ({
  organizationEventId,
}: UpdateOrganizationCollaborationRequest) =>
  apiFetch<void>('organization/collab', {
    method: 'PATCH',
    json: { organizationEventId },
  });

export const declineOrganizationCollaboration = ({
  organizationEventId,
}: UpdateOrganizationCollaborationRequest) =>
  apiFetch<void>('organization/collab', {
    method: 'DELETE',
    json: { organizationEventId },
  });

export const useAcceptOrganizationCollaboration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptOrganizationCollaboration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationCollaborationsQueryKey });
    },
  });
};

export const useDeclineOrganizationCollaboration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineOrganizationCollaboration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationCollaborationsQueryKey });
    },
  });
};
