"use client";
// Generic editor for CMS field specs (src/cms/fields.ts). Renders every field kind, including
// nested groups and lists (add / remove / move up / move down; no drag and drop yet).
import { useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { Button, Checkbox, Field, Input, Label, Select, Textarea } from "../ui";
import { RichTextEditor } from "../editors/rich-text-editor";
import { MediaPicker } from "../media/media-picker";
import { newListItem, type FieldSpec } from "@/cms/fields";

export type MediaMap = Record<string, { url: string; alt: string }>;
type Value = Record<string, unknown>;

export function FieldsEditor({
  specs,
  value,
  onChange,
  media,
  onMedia,
  canUpload,
  idPrefix,
}: {
  specs: Record<string, FieldSpec>;
  value: Value;
  onChange: (next: Value) => void;
  media: MediaMap;
  onMedia: (id: string, item: { url: string; alt: string }) => void;
  canUpload: boolean;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(specs).map(([key, spec]) => (
        <FieldControl
          key={key}
          id={`${idPrefix}-${key}`}
          spec={spec}
          value={value[key]}
          onChange={(v) => onChange({ ...value, [key]: v })}
          media={media}
          onMedia={onMedia}
          canUpload={canUpload}
        />
      ))}
    </div>
  );
}

function FieldControl({
  id,
  spec,
  value,
  onChange,
  media,
  onMedia,
  canUpload,
}: {
  id: string;
  spec: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  media: MediaMap;
  onMedia: (id: string, item: { url: string; alt: string }) => void;
  canUpload: boolean;
}) {
  switch (spec.kind) {
    case "text":
      return (
        <Field label={spec.label} hint={spec.help}>
          <Input value={String(value ?? "")} maxLength={spec.max} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "textarea":
      return (
        <Field label={spec.label} hint={spec.help}>
          <Textarea value={String(value ?? "")} maxLength={spec.max} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "richtext":
      return (
        <div className="space-y-1.5">
          <Label>{spec.label}</Label>
          <RichTextEditor label={spec.label} value={(value as JSONContent) ?? { type: "doc", content: [] }} onChange={onChange} />
          {spec.help && <p className="text-xs text-muted">{spec.help}</p>}
        </div>
      );
    case "link": {
      const v = (value as { label?: string; href?: string }) ?? {};
      return (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{spec.label}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label={`${spec.label}: text`} placeholder="Text" value={v.label ?? ""} maxLength={80} onChange={(e) => onChange({ label: e.target.value, href: v.href ?? "" })} />
            <Input aria-label={`${spec.label}: link`} placeholder="/contact or https://…" value={v.href ?? ""} maxLength={500} onChange={(e) => onChange({ label: v.label ?? "", href: e.target.value })} />
          </div>
          {spec.help && <p className="text-xs text-muted">{spec.help}</p>}
        </fieldset>
      );
    }
    case "image":
      return <ImageControl spec={spec} value={value as { mediaId: string } | null} onChange={onChange} media={media} onMedia={onMedia} canUpload={canUpload} />;
    case "select":
      return (
        <Field label={spec.label} hint={spec.help}>
          <Select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {spec.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
      );
    case "boolean":
      return (
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
          <span>{spec.label}{spec.help && <span className="block text-xs text-muted">{spec.help}</span>}</span>
        </label>
      );
    case "group":
      return (
        <fieldset className="space-y-3 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">{spec.label}</legend>
          {spec.help && <p className="text-xs text-muted">{spec.help}</p>}
          <FieldsEditor specs={spec.fields} value={(value as Value) ?? {}} onChange={onChange} media={media} onMedia={onMedia} canUpload={canUpload} idPrefix={id} />
        </fieldset>
      );
    case "list":
      return <ListControl id={id} spec={spec} value={(value as Value[]) ?? []} onChange={onChange} media={media} onMedia={onMedia} canUpload={canUpload} />;
  }
}

function ImageControl({
  spec,
  value,
  onChange,
  media,
  onMedia,
  canUpload,
}: {
  spec: Extract<FieldSpec, { kind: "image" }>;
  value: { mediaId: string } | null;
  onChange: (v: unknown) => void;
  media: MediaMap;
  onMedia: (id: string, item: { url: string; alt: string }) => void;
  canUpload: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = value?.mediaId ? media[value.mediaId] : null;
  return (
    <div className="space-y-2">
      <Label>{spec.label}</Label>
      <div className="flex items-center gap-3">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.alt} className="size-20 rounded-md border border-border object-cover" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-md border border-dashed border-border text-muted">
            <ImageIcon className="size-6" aria-hidden />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>{current ? "Change image" : "Choose image"}</Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              <X className="size-3.5" aria-hidden /> Remove
            </Button>
          )}
        </div>
        {current && <p className="min-w-0 flex-1 truncate text-xs text-muted">Alt text: {current.alt}</p>}
      </div>
      {value?.mediaId && !current && <p className="text-xs text-warning">This image was deleted from the library. Choose another.</p>}
      {spec.help && <p className="text-xs text-muted">{spec.help}</p>}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        canUpload={canUpload}
        onSelect={(m) => {
          onMedia(m.id, { url: m.url, alt: m.alt });
          onChange({ mediaId: m.id });
          setOpen(false);
        }}
      />
    </div>
  );
}

function ListControl({
  id,
  spec,
  value,
  onChange,
  media,
  onMedia,
  canUpload,
}: {
  id: string;
  spec: Extract<FieldSpec, { kind: "list" }>;
  value: Value[];
  onChange: (v: unknown) => void;
  media: MediaMap;
  onMedia: (id: string, item: { url: string; alt: string }) => void;
  canUpload: boolean;
}) {
  const move = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const titleOf = (item: Value, i: number) => {
    const t = spec.titleKey ? item[spec.titleKey] : undefined;
    return (typeof t === "string" && t.trim()) || `${spec.itemLabel} ${i + 1}`;
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {spec.label} <span className="font-normal text-muted">({value.length})</span>
      </legend>
      {spec.help && <p className="text-xs text-muted">{spec.help}</p>}
      <ol className="space-y-2">
        {value.map((item, i) => (
          <li key={String(item.id ?? i)} className="rounded-lg border border-border bg-subtle/40">
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 truncate font-medium">{titleOf(item, i)}</span>
                <span className="flex gap-0.5" onClick={(e) => e.preventDefault()}>
                  <IconButton label={`Move ${titleOf(item, i)} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp className="size-4" /></IconButton>
                  <IconButton label={`Move ${titleOf(item, i)} down`} disabled={i === value.length - 1} onClick={() => move(i, i + 1)}><ArrowDown className="size-4" /></IconButton>
                  <IconButton label={`Remove ${titleOf(item, i)}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="size-4 text-danger" /></IconButton>
                </span>
              </summary>
              <div className="border-t border-border bg-surface p-3">
                <FieldsEditor
                  specs={spec.fields}
                  value={item}
                  onChange={(next) => onChange(value.map((v, j) => (j === i ? next : v)))}
                  media={media}
                  onMedia={onMedia}
                  canUpload={canUpload}
                  idPrefix={`${id}-${i}`}
                />
              </div>
            </details>
          </li>
        ))}
      </ol>
      {value.length < spec.max && (
        <Button size="sm" variant="secondary" onClick={() => onChange([...value, newListItem(spec)])}>
          <Plus className="size-4" aria-hidden /> Add {spec.itemLabel.toLowerCase()}
        </Button>
      )}
    </fieldset>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg disabled:opacity-30">
      {children}
    </button>
  );
}
