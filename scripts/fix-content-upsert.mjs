import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Check if tmdb_id has a unique constraint
  const { data, error } = await supabase
    .from("contents")
    .select("tmdb_id")
    .limit(1);

  console.log("Sample content:", data);
  console.log("Error:", error);
}
main().catch(console.error);
