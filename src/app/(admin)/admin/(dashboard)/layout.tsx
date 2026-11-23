import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { NAV } from "@/components/admin/shell/nav";
import { THEME_COOKIE, parseTheme } from "@/components/admin/theme";
import { requireStaff } from "@/lib/auth/session";
import { can, ROLE_LABELS } from "@/lib/auth/permissions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Signed in + active + MFA passed, or redirected. (Every Server Action checks again.)
  const user = await requireStaff();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  const allowedNav = NAV.flatMap((g) => g.items)
    .filter((item) => !item.module || can(user, item.module, "view"))
    .map((item) => item.key);

  return (
    <AdminShell
      theme={theme}
      allowedNav={allowedNav}
      user={{
        name: user.fullName,
        email: user.email,
        roleLabel: ROLE_LABELS[user.role],
        mfaOn: user.currentLevel === "aal2",
      }}
    >
      {children}
    </AdminShell>
  );
}
