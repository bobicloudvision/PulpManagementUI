import { ChangelogPageClient } from "@/components/pulp/changelog-page-client";
import { getChangelogReleases } from "@/lib/get-changelog-releases";

export default async function ChangelogPage() {
  const releases = await getChangelogReleases();
  return <ChangelogPageClient releases={releases} />;
}
