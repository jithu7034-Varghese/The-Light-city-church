import type { Metadata } from "next";
import { GlobalEditorSection, PageHeader } from "../global-page";

export const metadata: Metadata = { title: "Footer" };

export default function FooterAdminPage() {
  return (
    <>
      <PageHeader title="Footer" description="The call to action, link columns and copyright at the bottom of every page." />
      <GlobalEditorSection globalKey="footer" path="/admin/footer" />
    </>
  );
}
