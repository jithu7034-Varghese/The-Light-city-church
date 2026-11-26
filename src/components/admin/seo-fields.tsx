"use client";
// Search & sharing fields for a devotional or a CMS page (seo_title, seo_description,
// seo_keywords, seo_image_url). Empty fields fall back to the item's title/excerpt/image.
import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button, Field, Input, Textarea } from "./ui";
import { MediaPicker } from "./media/media-picker";
import type { SeoValue } from "@/cms/seo";

export function SeoFields({
  value,
  onChange,
  canUpload,
  fallbackTitle,
  errors = {},
}: {
  value: SeoValue;
  onChange: (next: SeoValue) => void;
  canUpload: boolean;
  fallbackTitle: string;
  errors?: Record<string, string>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const set = (patch: Partial<SeoValue>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      <Field label="Search title" hint={`${value.title.length}/70. Leave empty to use "${fallbackTitle}".`} error={errors["seo.title"]}>
        <Input value={value.title} maxLength={70} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label="Search description" hint={`${value.description.length}/170. Leave empty to use the excerpt or page summary.`} error={errors["seo.description"]}>
        <Textarea value={value.description} maxLength={170} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <Field label="Keywords" hint="Optional, separated by commas (e.g. grace, faith, prayer)." error={errors["seo.keywords"]}>
        <Input value={value.keywords} maxLength={300} onChange={(e) => set({ keywords: e.target.value })} />
      </Field>
      <div className="space-y-2">
        <span className="text-sm font-medium">Share image</span>
        <p className="text-xs text-muted">Shown when the link is shared on social media. Leave empty to use the main image.</p>
        {value.imageUrl ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.imageUrl} alt="" className="aspect-[1.91/1] w-full max-w-sm rounded-md object-cover" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>Change</Button>
              <Button size="sm" variant="ghost" onClick={() => set({ imageUrl: "" })}><X className="size-4" aria-hidden /> Remove</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
            <ImageIcon className="size-4" aria-hidden /> Choose share image
          </Button>
        )}
        {errors["seo.imageUrl"] && <p className="text-xs font-medium text-danger">{errors["seo.imageUrl"]}</p>}
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        canUpload={canUpload}
        onSelect={(m) => {
          set({ imageUrl: m.url });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
