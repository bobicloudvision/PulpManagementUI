"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { extractRpmPackageContentId } from "@/lib/extract-rpm-package-content-id";

function ContentPreviewRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const idParam = searchParams.get("id")?.trim();
    const hrefParam = searchParams.get("href")?.trim();

    let packageId: string | null = idParam && idParam.length > 0 ? idParam : null;
    if (!packageId && hrefParam) {
      try {
        packageId = extractRpmPackageContentId(decodeURIComponent(hrefParam));
      } catch {
        packageId = extractRpmPackageContentId(hrefParam);
      }
    }

    if (packageId) {
      router.replace(`/content/packages/${packageId}`);
      return;
    }

    router.replace("/content/list");
  }, [router, searchParams]);

  return (
    <Card className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
      Opening RPM package review…
    </Card>
  );
}

export default function ContentPreviewPage() {
  return (
    <Suspense fallback={<Card className="p-6 text-sm">Loading…</Card>}>
      <ContentPreviewRedirect />
    </Suspense>
  );
}
