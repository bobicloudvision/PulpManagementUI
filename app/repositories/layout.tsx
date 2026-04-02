import { ReactNode, Suspense } from "react";
import { PulpAuthProvider } from "@/components/pulp/auth-context";

export default function RepositoriesLayout({ children }: { children: ReactNode }) {
  return (
    <PulpAuthProvider>
      <Suspense fallback={null}>{children}</Suspense>
    </PulpAuthProvider>
  );
}
