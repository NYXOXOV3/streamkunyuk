import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { error } = await supabase.from("api_credentials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
console.log("Cleanup:", error?.message || "OK");
