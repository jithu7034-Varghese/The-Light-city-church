import type { Metadata } from "next";
import { GlobalEditorSection, PageHeader } from "../global-page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsAdminPage() {
  return (
    <div className="space-y-10">
      <PageHeader title="Settings" description="Church details used across the website, and the announcement bar." />
      <GlobalEditorSection globalKey="site" path="/admin/settings" intro="Name, service times, contact details, giving and social media." />
      <GlobalEditorSection globalKey="announcement" path="/admin/settings" intro="A thin bar above the header on every page, e.g. for a special service." />
    </div>
  );
}
