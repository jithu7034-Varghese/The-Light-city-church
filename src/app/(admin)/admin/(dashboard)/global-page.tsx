import "server-only";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { GlobalEditor } from "@/components/admin/cms/global-editor";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GLOBALS, type GlobalKey } from "@/cms/globals";
import { loadMediaMap } from "./cms-media";

/** Shared body for /admin/navbar, /admin/footer and /admin/settings. Edits the draft, shows the published value if no draft. */
export async function GlobalEditorSection({ globalKey, path, intro }: { globalKey: GlobalKey; path: string; intro?: string }) {
  const def = GLOBALS[globalKey];
  const user = await requireStaff(path);
  if (!can(user, def.module, "view")) return <NoAccess what={def.label.toLowerCase()} />;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("globals").select("draft, published").eq("key", globalKey).maybeSingle();
  const raw = data?.draft && Object.keys(data.draft as object).length ? data.draft : data?.published;
  const value = def.parse(raw) as Record<string, unknown>;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{def.label}</h2>
        {intro && <p className="text-sm text-muted">{intro}</p>}
      </div>
      <GlobalEditor
        globalKey={globalKey}
        label={def.label}
        specs={def.specs}
        initial={value}
        initialMedia={await loadMediaMap(value)}
        canEdit={can(user, def.module, "edit") && can(user, def.module, "publish")}
        canUpload={can(user, "media", "edit")}
      />
    </section>
  );
}

export { PageHeader };
