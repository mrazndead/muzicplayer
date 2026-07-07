// Jamendo source — calls the jamendo-search edge function so the client_id stays server-side.
import type { AudiusTrack } from "@/lib/audius";
import { supabase } from "@/integrations/supabase/client";

export async function searchJamendo(query: string, limit = 20, offset = 0): Promise<AudiusTrack[]> {
  try {
    const { data, error } = await supabase.functions.invoke("jamendo-search", {
      body: { query, limit, offset },
    });
    if (error) return [];
    return (data?.data ?? []) as AudiusTrack[];
  } catch {
    return [];
  }
}
