"use client";
import { useState, useTransition } from "react";
import { Button, Card, toast } from "../ui";
import { FieldsEditor, type MediaMap } from "./fields-editor";
import { saveGlobal } from "@/cms/actions/globals";
import type { FieldSpec } from "@/cms/fields";

export function GlobalEditor({
  globalKey,
  label,
  specs,
  initial,
  initialMedia,
  canEdit,
  canUpload,
}: {
  globalKey: "navbar" | "footer" | "site" | "announcement";
  label: string;
  specs: Record<string, FieldSpec>;
  initial: Record<string, unknown>;
  initialMedia: MediaMap;
  canEdit: boolean;
  canUpload: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [media, setMedia] = useState(initialMedia);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="space-y-5 p-5">
      <fieldset disabled={!canEdit} className="space-y-4">
        <FieldsEditor
          specs={specs}
          value={value}
          onChange={(v) => {
            setDirty(true);
            setValue(v);
          }}
          media={media}
          onMedia={(id, item) => setMedia((m) => ({ ...m, [id]: item }))}
          canUpload={canUpload}
          idPrefix={globalKey}
        />
      </fieldset>
      {canEdit && (
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <span className="text-sm text-muted">{dirty ? "Unsaved changes" : "Published"}</span>
          <Button
            loading={pending}
            disabled={!dirty}
            onClick={() =>
              startTransition(async () => {
                const r = await saveGlobal({ key: globalKey, data: value });
                if (!r.ok) return void toast.error(r.error);
                setDirty(false);
                toast.success(r.message);
              })
            }
          >
            Save &amp; publish {label.toLowerCase()}
          </Button>
        </div>
      )}
    </Card>
  );
}
