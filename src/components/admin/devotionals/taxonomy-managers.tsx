"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { Button, Card, ConfirmDialog, Dialog, Field, Input, toast } from "../ui";
import { MediaPicker } from "../media/media-picker";
import { deleteAuthor, deleteCategory, saveAuthor, saveCategory, type TaxonomyResult } from "@/cms/actions/devotional-taxonomy";

type Permissions = { edit: boolean; remove: boolean; upload: boolean };
type Category = { id: string; name: string; slug: string; count: number };
type Author = { id: string; name: string; position: string | null; photo: { id: string; url: string; alt: string } | null; count: number };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<TaxonomyResult>, done?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message);
      done?.();
      router.refresh();
    });
  return { pending, run };
}

const plural = (n: number) => `${n} devotional${n === 1 ? "" : "s"}`;

export function CategoriesManager({ categories, permissions }: { categories: Category[]; permissions: Permissions }) {
  const { pending, run } = useRun();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  return (
    <Card className="space-y-4 p-4">
      <h2 className="font-semibold">Categories</h2>
      {permissions.edit && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveCategory({ name: newName }), () => setNewName(""));
          }}
        >
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} placeholder="New category name" aria-label="New category name" />
          <Button type="submit" loading={pending} disabled={!newName.trim()}><Plus className="size-4" aria-hidden /> Add</Button>
        </form>
      )}
      {categories.length === 0 ? (
        <p className="text-sm text-muted">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2">
              {editing?.id === c.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => saveCategory({ id: c.id, name: editing.name }), () => setEditing(null));
                  }}
                >
                  <Input autoFocus value={editing.name} maxLength={80} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} aria-label={`Rename ${c.name}`} />
                  <Button type="submit" size="sm" loading={pending}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block text-xs text-muted">/devotionals?category={c.slug} · {plural(c.count)}</span>
                  </span>
                  {permissions.edit && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ id: c.id, name: c.name })} aria-label={`Rename ${c.name}`}>
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                  )}
                  {permissions.remove && (
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`}>
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        loading={pending}
        title={`Delete "${deleting?.name}"?`}
        description={deleting?.count ? `It's used on ${plural(deleting.count)}. They stay published, just without this category.` : "It isn't used on any devotional."}
        onConfirm={() => deleting && run(() => deleteCategory({ id: deleting.id }), () => setDeleting(null))}
      />
    </Card>
  );
}

type AuthorDraft = { id?: string; name: string; position: string; photo: Author["photo"] };

export function AuthorsManager({ authors, permissions }: { authors: Author[]; permissions: Permissions }) {
  const { pending, run } = useRun();
  const [draft, setDraft] = useState<AuthorDraft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState<Author | null>(null);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Authors</h2>
        {permissions.edit && (
          <Button size="sm" onClick={() => setDraft({ name: "", position: "", photo: null })}><Plus className="size-4" aria-hidden /> Add author</Button>
        )}
      </div>
      {authors.length === 0 ? (
        <p className="text-sm text-muted">No authors yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {authors.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2">
              {a.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.photo.url} alt="" className="size-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-subtle text-muted"><UserRound className="size-5" aria-hidden /></span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.name}</span>
                <span className="block truncate text-xs text-muted">{[a.position, plural(a.count)].filter(Boolean).join(" · ")}</span>
              </span>
              {permissions.edit && (
                <Button size="sm" variant="ghost" onClick={() => setDraft({ id: a.id, name: a.name, position: a.position ?? "", photo: a.photo })} aria-label={`Edit ${a.name}`}>
                  <Pencil className="size-4" aria-hidden />
                </Button>
              )}
              {permissions.remove && (
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleting(a)} aria-label={`Delete ${a.name}`}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={draft !== null && !pickerOpen}
        // Hidden (not cleared) while the media picker is open on top of it.
        onClose={() => { if (!pickerOpen) setDraft(null); }}
        title={draft?.id ? "Edit author" : "Add author"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            <Button
              loading={pending}
              disabled={!draft?.name.trim()}
              onClick={() =>
                draft && run(() => saveAuthor({ id: draft.id, name: draft.name, position: draft.position, photoMediaId: draft.photo?.id ?? null }), () => setDraft(null))
              }
            >
              Save
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Name">
              <Input autoFocus value={draft.name} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Pastor Ronnie Dube" />
            </Field>
            <Field label="Position" hint="Optional, shown under the name (e.g. Senior Pastor).">
              <Input value={draft.position} maxLength={120} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
            </Field>
            <div className="space-y-2">
              <span className="text-sm font-medium">Photo</span>
              <div className="flex items-center gap-3">
                {draft.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.photo.url} alt={draft.photo.alt} className="size-16 rounded-full object-cover" />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-full bg-subtle text-muted"><UserRound className="size-7" aria-hidden /></span>
                )}
                <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
                  <ImageIcon className="size-4" aria-hidden /> {draft.photo ? "Change" : "Choose or upload"}
                </Button>
                {draft.photo && (
                  <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, photo: null })}><X className="size-4" aria-hidden /> Remove</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        canUpload={permissions.upload}
        onSelect={(m) => {
          setDraft((d) => (d ? { ...d, photo: { id: m.id, url: m.url, alt: m.alt } } : d));
          setPickerOpen(false);
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        loading={pending}
        title={`Delete ${deleting?.name}?`}
        description={deleting?.count ? `${plural(deleting.count)} keep their byline name but lose the author photo and position.` : "No devotionals use this author."}
        onConfirm={() => deleting && run(() => deleteAuthor({ id: deleting.id }), () => setDeleting(null))}
      />
    </Card>
  );
}
