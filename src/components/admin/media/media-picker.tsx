"use client";
// Small media picker: grid of uploaded images, search, and an upload form where alt text
// is required before the upload can start.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Search, Upload, X } from "lucide-react";
import { Alert, Button, Dialog, Field, Input, Spinner, toast } from "../ui";
import { cn } from "../ui/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createMediaUpload, listMedia, saveUploadedMedia, type MediaItem } from "@/cms/actions/media";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_BYTES = 10 * 1024 * 1024;

export function MediaPicker({
  open,
  onClose,
  onSelect,
  canUpload,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  canUpload: boolean;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, startLoading] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((query: string) => {
    startLoading(async () => {
      const r = await listMedia({ q: query || undefined });
      if (r.ok) {
        setItems(r.data.items);
        setError(null);
      } else setError(r.error);
    });
  }, []);

  useEffect(() => {
    if (open) load("");
  }, [open, load]);

  return (
    <Dialog open={open} onClose={onClose} title="Choose an image" className="max-w-3xl">
      <div className="space-y-4 pb-5">
        {canUpload && (
          <UploadForm
            onUploaded={(item) => {
              setItems((list) => [item, ...list]);
              onSelect(item);
            }}
          />
        )}
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by description or file name…" aria-label="Search images" className="pl-9" />
        </form>
        {error && <Alert tone="danger">{error}</Alert>}
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No images yet.{canUpload ? " Upload one above." : ""}</p>
        ) : (
          <ul className="grid max-h-[50dvh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSelect(m)}
                  className="group block w-full overflow-hidden rounded-lg border border-border text-left hover:border-primary focus-visible:border-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.alt} loading="lazy" className="aspect-square w-full bg-subtle object-cover" />
                  <span className="block truncate px-2 py-1.5 text-xs text-muted group-hover:text-fg">{m.title || m.alt}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

function UploadForm({ onUploaded }: { onUploaded: (item: MediaItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setAlt("");
    setTitle("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) return setError("Use a JPG, PNG, WebP, GIF or AVIF image.");
    if (f.size > MAX_BYTES) return setError("Images must be 10 MB or smaller.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) return;
    if (!alt.trim()) return setError("Alt text is required: describe the image for people who can't see it.");
    setBusy(true);
    setError(null);
    try {
      const signed = await createMediaUpload({ mime: file.type, size: file.size });
      if (!signed.ok) throw new Error(signed.error);
      const { error: upErr } = await createSupabaseBrowserClient()
        .storage.from("media")
        .uploadToSignedUrl(signed.data.path, signed.data.token, file, { contentType: file.type });
      if (upErr) throw new Error("The upload failed. Check your connection and try again.");
      const saved = await saveUploadedMedia({
        path: signed.data.path,
        fileName: file.name.slice(0, 200),
        alt: alt.trim(),
        title: title.trim() || undefined,
        width: imgRef.current?.naturalWidth || null,
        height: imgRef.current?.naturalHeight || null,
      });
      if (!saved.ok) throw new Error(saved.error);
      toast.success("Image uploaded");
      reset();
      onUploaded(saved.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (!file) {
    return (
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted hover:border-primary hover:text-fg">
          <ImagePlus className="size-5" aria-hidden />
          Upload a new image (max 10 MB)
          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-3 sm:flex-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={preview ?? ""} alt="" className="h-32 w-full rounded-md bg-subtle object-cover sm:w-40" />
      <div className="flex-1 space-y-3">
        <Field label="Alt text (required)" hint="What's in the picture, for screen readers and search engines. E.g. “Pastor Ronnie preaching at the Motorpoint Arena”.">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={250} required autoFocus aria-required />
        </Field>
        <Field label="Title (optional)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2">
          <Button onClick={upload} loading={busy} disabled={!alt.trim()} className={cn(!alt.trim() && "opacity-60")}>
            <Upload className="size-4" aria-hidden /> Upload
          </Button>
          <Button variant="ghost" onClick={reset} disabled={busy}>
            <X className="size-4" aria-hidden /> Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
