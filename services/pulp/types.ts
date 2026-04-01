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

export type PulpUploadItem = {
  pulp_href: string;
  pulp_created: string;
  size: number;
};

export type PulpUploadCreateResult = {
  filename: string;
  size: number;
  sha256: string;
  upload: string | null;
  artifact?: string | null;
  task: string | null;
};

export type PulpRpmPackage = {
  pulp_href: string;
  pulp_created: string;
  md5: string | null;
  sha1: string | null;
  sha224: string | null;
  sha256: string | null;
  sha384: string | null;
  sha512: string | null;
  artifact: string | null;
  name: string;
  epoch: string | null;
  version: string;
  release: string;
  arch: string;
  pkgId: string;
  checksum_type: string;
  summary: string | null;
  description: string | null;
  url: string | null;
  changelogs: PulpRpmChangelogEntry[];
  files: PulpRpmFileEntry[];
  requires: PulpRpmDependencyEntry[];
  provides: PulpRpmDependencyEntry[];
  conflicts: PulpRpmDependencyEntry[];
  obsoletes: PulpRpmDependencyEntry[];
  suggests: PulpRpmDependencyEntry[];
  enhances: PulpRpmDependencyEntry[];
  recommends: PulpRpmDependencyEntry[];
  supplements: PulpRpmDependencyEntry[];
  location_base: string;
  location_href: string;
  rpm_buildhost: string | null;
  rpm_group: string | null;
  rpm_license: string | null;
  rpm_packager: string | null;
  rpm_sourcerpm: string | null;
  rpm_vendor: string | null;
  rpm_header_start: number | null;
  rpm_header_end: number | null;
  is_modular: boolean;
  size_archive: number | null;
  size_installed: number | null;
  size_package: number | null;
  time_build: number | null;
  time_file: number | null;
  [key: string]: unknown;
};

export type PulpRpmChangelogEntry = [author: string, timestamp: number, text: string];
export type PulpRpmFileEntry = [
  type: string,
  directory: string,
  filename: string,
  checksum: string
];
export type PulpRpmDependencyEntry = [
  name: string,
  relation: string | null,
  epoch: string | null,
  version: string | null,
  release: string | null,
  pre: boolean
];

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
