"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Browser client for client components in the admin (e.g. auth forms, realtime). */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
