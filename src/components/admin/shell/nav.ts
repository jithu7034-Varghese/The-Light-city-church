import {
  Activity, FileText, Image as ImageIcon, Inbox, LayoutDashboard, Menu as MenuIcon,
  PanelBottom, Search, Settings, BookOpen, Users, type LucideIcon,
} from "lucide-react";
import type { PermissionAction, PermissionModule } from "@/lib/auth/permissions";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Needs `action` (default `view`) on this module. Undefined = every active staff member. */
  module?: PermissionModule;
  action?: PermissionAction;
  /** Phase the screen is built in. Items not built yet show as "Soon" and aren't links. */
  ready: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

// R1 navigation (docs/ARCHITECTURE.md §6). Flip `ready` as each phase lands.
export const NAV: NavGroup[] = [
  {
    label: "General",
    items: [
      { key: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard, ready: true },
      { key: "enquiries", label: "Enquiries", href: "/admin/enquiries", icon: Inbox, module: "enquiries", ready: true },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "pages", label: "Pages", href: "/admin/pages", icon: FileText, module: "pages", ready: false },
      { key: "navbar", label: "Navbar", href: "/admin/navbar", icon: MenuIcon, module: "globals", ready: false },
      { key: "footer", label: "Footer", href: "/admin/footer", icon: PanelBottom, module: "globals", ready: false },
      { key: "devotionals", label: "Devotionals", href: "/admin/devotionals", icon: BookOpen, module: "posts", ready: false },
      { key: "media", label: "Media", href: "/admin/media", icon: ImageIcon, module: "media", ready: false },
    ],
  },
  {
    label: "Site",
    items: [
      { key: "seo", label: "SEO", href: "/admin/seo", icon: Search, module: "seo", ready: false },
      { key: "settings", label: "Settings", href: "/admin/settings", icon: Settings, module: "settings", ready: false },
    ],
  },
  {
    label: "Administration",
    items: [
      // Super Admin only: the default matrix gives nobody else users.edit
      { key: "users", label: "Users", href: "/admin/users", icon: Users, module: "users", action: "edit", ready: true },
      { key: "activity", label: "Activity", href: "/admin/activity", icon: Activity, module: "activity", ready: false },
    ],
  },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
}
