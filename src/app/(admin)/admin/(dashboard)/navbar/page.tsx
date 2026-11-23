import type { Metadata } from "next";
import { GlobalEditorSection, PageHeader } from "../global-page";

export const metadata: Metadata = { title: "Navbar" };

export default function NavbarAdminPage() {
  return (
    <>
      <PageHeader title="Navbar" description="Logo, menu items and the button at the top of every page." />
      <GlobalEditorSection globalKey="navbar" path="/admin/navbar" />
    </>
  );
}
