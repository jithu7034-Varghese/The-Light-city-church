import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { PostForm } from "@/components/admin/devotionals/post-form";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { loadAuthors, loadCategories, loadPostForEditor } from "../load";

export const metadata: Metadata = { title: "Edit devotional" };

export default async function EditDevotionalPage({ params }: PageProps<"/admin/devotionals/[id]">) {
  const { id } = await params;
  const user = await requireStaff(`/admin/devotionals/${id}`);
  if (!can(user, "posts", "edit")) return <NoAccess what="editing devotionals" />;
  if (!z.uuid().safeParse(id).success) notFound();

  const [post, categories, authors] = await Promise.all([loadPostForEditor(id), loadCategories(), loadAuthors()]);
  if (!post) notFound();
  return (
    <>
      <PageHeader title="Edit devotional" description={post.title} />
      <PostForm
        key={post.id}
        initial={post}
        categories={categories}
        authors={authors}
        permissions={{ publish: can(user, "posts", "publish"), remove: can(user, "posts", "delete"), upload: can(user, "media", "edit") }}
      />
    </>
  );
}
