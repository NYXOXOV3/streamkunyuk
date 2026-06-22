import { createClient } from "@supabase/supabase-js";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data } = await admin.from("contents").select("id, title, status, tmdb_id").order("created_at", { ascending: false });
  const anonRes = await anon.from("contents").select("id, title, status, tmdb_id").order("created_at", { ascending: false });
  const anonIds = new Set((anonRes.data ?? []).map(r => r.id));

  console.log("=== Missing from anon (RLS blocked) ===");
  data.filter(r => !anonIds.has(r.id)).forEach(r => {
    console.log(`  ${r.title} | status: ${r.status} | tmdb_id: ${r.tmdb_id}`);
  });

  console.log("\n=== All drafts ===");
  data.filter(r => r.status === "draft").forEach(r => {
    console.log(`  ${r.title} | visible to anon: ${anonIds.has(r.id)}`);
  });
}
main().catch(console.error);
