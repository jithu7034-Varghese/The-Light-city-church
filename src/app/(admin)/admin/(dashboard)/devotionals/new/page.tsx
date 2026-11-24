import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { PostForm } from "@/components/admin/devotionals/post-form";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { emptySeo } from "@/cms/seo";
import { loadAuthors, loadCategories } from "../load";

export const metadata: Metadata = { title: "New devotional" };

export default async function NewDevotionalPage() {
  const user = await requireStaff("/admin/devotionals/new");
  if (!can(user, "posts", "edit")) return <NoAccess what="writing devotionals" />;
  const [categories, authors] = await Promise.all([loadCategories(), loadAuthors()]);
  return (
    <>
      <PageHeader title="New devotional" />
      <PostForm
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          content: { type: "doc", content: [] },
          featured: null,
          categoryIds: categories[0] ? [categories[0].id] : [],
          authorId: authors.length === 1 ? authors[0].id : null,
          status: "draft",
          publishedAt: null,
          updatedDisplayAt: null,
          seo: emptySeo,
        }}
        categories={categories}
        authors={authors}
        permissions={{ publish: can(user, "posts", "publish"), remove: false, upload: can(user, "media", "edit") }}
      />
    </>
  );
}
