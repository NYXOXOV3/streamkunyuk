import { createClient } from "@supabase/supabase-js";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  // Check with admin
  const { data: adminData, count: adminCount } = await admin
    .from("contents").select("*", { count: "exact" });
  console.log("Admin (service_role):", adminCount, "rows");
  if (adminData?.length) console.log("  First:", adminData[0].title, "| status:", adminData[0].status);

  // Check with anon
  const { data: anonData, count: anonCount, error: anonErr } = await anon
    .from("contents").select("*", { count: "exact" });
  console.log("\nAnon:", anonCount, "rows");
  if (anonErr) console.log("  Error:", anonErr.message, "| code:", anonErr.code);
  if (anonData?.length) console.log("  First:", anonData[0].title);
  else console.log("  No data returned (RLS blocking)");
}
main().catch(console.error);
