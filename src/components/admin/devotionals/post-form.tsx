"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import { ExternalLink, ImageIcon, Trash2, X } from "lucide-react";
import { Alert, Button, buttonStyles, Card, ConfirmDialog, Field, Input, Select, Textarea, toast } from "../ui";
import { RichTextEditor } from "../editors/rich-text-editor";
import { MediaPicker } from "../media/media-picker";
import { slugify } from "@/lib/slug";
import { deletePost, savePost } from "@/cms/actions/posts";
import type { MediaItem } from "@/cms/actions/media";

export type PostFormValue = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: JSONContent;
  featured: { id: string; url: string; alt: string } | null;
  categoryId: string | null;
  status: "draft" | "published";
  publishedAt: string | null; // ISO
};

/** ISO → value for <input type="datetime-local"> in the browser's time zone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostForm({
  initial,
  categories,
  permissions,
}: {
  initial: PostFormValue;
  categories: { id: string; name: string }[];
  permissions: { publish: boolean; remove: boolean; upload: boolean };
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof PostFormValue>(key: K, value: PostFormValue[K]) => setV((s) => ({ ...s, [key]: value }));

  function save(status: "draft" | "published") {
    setErrors({});
    startTransition(async () => {
      const r = await savePost({
        id: v.id,
        title: v.title,
        slug: v.slug,
        excerpt: v.excerpt,
        content: v.content as { type: "doc"; content: unknown[] },
        featuredMediaId: v.featured?.id ?? null,
        categoryId: v.categoryId,
        status,
        publishedAt: v.publishedAt,
      });
      if (!r.ok) {
        if (r.field) setErrors({ [r.field]: r.error });
        toast.error(r.error);
        return;
      }
      toast.success(r.message);
      setV((s) => ({ ...s, id: r.id, status }));
      if (!v.id) router.replace(`/admin/devotionals/${r.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Field label="Title" error={errors.title}>
          <Input
            value={v.title}
            maxLength={300}
            onChange={(e) => {
              const title = e.target.value;
              setV((s) => ({ ...s, title, slug: slugTouched ? s.slug : slugify(title) }));
            }}
            placeholder="e.g. Known as Father"
          />
        </Field>
        <Field label="URL slug" hint={`thelightcitychurch.org/devotionals/${v.slug || "…"}`} error={errors.slug}>
          <Input
            value={v.slug}
            maxLength={120}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
            onBlur={() => set("slug", slugify(v.slug))}
          />
        </Field>
        <Field label="Excerpt" hint="One or two sentences shown on the devotionals page and in search results." error={errors.excerpt}>
          <Textarea value={v.excerpt} maxLength={500} onChange={(e) => set("excerpt", e.target.value)} />
        </Field>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Content</span>
          <RichTextEditor label="Devotional content" value={v.content} onChange={(doc) => set("content", doc)} />
          {errors.content && <p className="text-xs font-medium text-danger">{errors.content}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <Card className="space-y-4 p-4">
          <Field label="Status">
            <Select value={v.status} disabled>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Field label="Publish date" hint="Shown on the devotional. Defaults to now when you publish.">
            <Input
              type="datetime-local"
              value={toLocalInput(v.publishedAt)}
              onChange={(e) => set("publishedAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </Field>
          <Field label="Category">
            <Select value={v.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          {!permissions.publish && <Alert tone="info">You can save drafts. An Editor or Admin publishes them.</Alert>}
          <div className="flex flex-col gap-2">
            {permissions.publish && (
              <Button onClick={() => save("published")} loading={pending}>
                {v.status === "published" ? "Update published devotional" : "Publish"}
              </Button>
            )}
            {(v.status === "draft" || permissions.publish) && (
              <Button variant="secondary" onClick={() => save("draft")} loading={pending}>
                {v.status === "published" ? "Unpublish (back to draft)" : "Save draft"}
              </Button>
            )}
            {v.id && v.status === "published" && (
              <a href={`/devotionals/${v.slug}`} target="_blank" rel="noopener" className={buttonStyles("ghost", "sm")}>
                View on site <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <p className="text-sm font-medium">Featured image</p>
          {v.featured ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.featured.url} alt={v.featured.alt} className="aspect-video w-full rounded-md object-cover" />
              <p className="text-xs text-muted">Alt text: {v.featured.alt}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>Change</Button>
                <Button size="sm" variant="ghost" onClick={() => set("featured", null)}><X className="size-4" aria-hidden /> Remove</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setPickerOpen(true)}>
              <ImageIcon className="size-4" aria-hidden /> Choose image
            </Button>
          )}
        </Card>

        {v.id && permissions.remove && (
          <Button variant="ghost" className="w-full text-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden /> Delete devotional
          </Button>
        )}
        <Link href="/admin/devotionals" className="block text-center text-sm text-muted hover:text-fg">← All devotionals</Link>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        canUpload={permissions.upload}
        onSelect={(m: MediaItem) => {
          set("featured", { id: m.id, url: m.url, alt: m.alt });
          setPickerOpen(false);
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={pending}
        title="Delete this devotional?"
        description="It will be removed from the website straight away. This can't be undone."
        onConfirm={() =>
          startTransition(async () => {
            const r = await deletePost({ id: v.id! });
            if (!r.ok) return void toast.error(r.error);
            toast.success(r.message);
            router.replace("/admin/devotionals");
          })
        }
      />
    </div>
  );
}
