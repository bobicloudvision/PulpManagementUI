import { ReactNode } from "react";
import { PulpAuthProvider } from "@/components/pulp/auth-context";

export default function WorkersLayout({ children }: { children: ReactNode }) {
  return <PulpAuthProvider>{children}</PulpAuthProvider>;
}
