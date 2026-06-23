import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: providers, error: pErr } = await supabase
    .from("api_providers").select("*");
  console.log("=== Providers ===");
  console.log(JSON.stringify(providers, null, 2));
  if (pErr) console.log("Provider error:", pErr);

  const { data: creds, error: cErr } = await supabase
    .from("api_credentials").select("*");
  console.log("\n=== Credentials ===");
  console.log(JSON.stringify(creds, null, 2));
  if (cErr) console.log("Cred error:", cErr);

  if (creds && creds.length > 0) {
    const first = creds[0];
    console.log("\n=== Type checks ===");
    console.log("iv type:", typeof first.iv);
    console.log("iv value (first 100):", typeof first.iv === 'string' ? first.iv.substring(0, 100) : "NOT STRING");
    console.log("encrypted_value type:", typeof first.encrypted_value);
    console.log("ev value (first 100):", typeof first.encrypted_value === 'string' ? first.encrypted_value.substring(0, 100) : "NOT STRING");
    console.log("provider_id type:", typeof first.provider_id, first.provider_id);
    console.log("credential_type:", first.credential_type);
  }
}

main().catch(console.error);
