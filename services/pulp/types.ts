export type ApiErrorResponse = {
  detail?: string;
};

export type ServiceResult =
  | { ok: true }
  | {
      ok: false;
      detail: string;
    };

export type PulpUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
};

export type PulpGroup = {
  id: number;
  name: string;
};

export type PulpDistribution = {
  pulp_href: string;
  pulp_created: string;
  base_path: string;
  base_url: string;
  name: string;
  repository: string | null;
};

export type PulpContentItem = {
  pulp_href: string;
  pulp_created: string;
  artifacts: Record<string, string>;
};

export type PulpPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type UpdatePulpDistributionPayload = {
  name?: string;
  base_path?: string;
  repository?: string | null;
  publication?: string | null;
  content_guard?: string | null;
};

export type CreatePulpUserPayload = {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_staff?: boolean;
  is_active?: boolean;
};

export type UpdatePulpUserPayload = {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_staff?: boolean;
  is_active?: boolean;
};

export type CreatePulpGroupPayload = {
  name: string;
};

export type UpdatePulpGroupPayload = {
  name: string;
};
