import { ReactNode } from "react";
import { PulpManagementProvider } from "@/components/pulp/use-pulp-management";

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <PulpManagementProvider>{children}</PulpManagementProvider>;
}
