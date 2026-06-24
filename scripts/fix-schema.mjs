import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try adding unique constraint via rpc
  const { data, error } = await supabase.rpc('exec_sql', { 
    query_string: `ALTER TABLE api_credentials ADD CONSTRAINT api_credentials_provider_credential_key UNIQUE (provider_id, credential_type);` 
  });
  console.log("Result:", data);
  console.log("Error:", error);
}
main().catch(console.error);
