import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { PostForm } from "@/components/admin/devotionals/post-form";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { loadCategories } from "../load";

export const metadata: Metadata = { title: "New devotional" };

export default async function NewDevotionalPage() {
  const user = await requireStaff("/admin/devotionals/new");
  if (!can(user, "posts", "edit")) return <NoAccess what="writing devotionals" />;
  const categories = await loadCategories();
  return (
    <>
      <PageHeader title="New devotional" />
      <PostForm
        initial={{ title: "", slug: "", excerpt: "", content: { type: "doc", content: [] }, featured: null, categoryId: categories[0]?.id ?? null, status: "draft", publishedAt: null }}
        categories={categories}
        permissions={{ publish: can(user, "posts", "publish"), remove: false, upload: can(user, "media", "edit") }}
      />
    </>
  );
}
