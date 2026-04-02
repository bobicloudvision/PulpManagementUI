import { ReactNode } from "react";
import { PulpAuthProvider } from "@/components/pulp/auth-context";

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return <PulpAuthProvider>{children}</PulpAuthProvider>;
}
