import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try direct insert with plain strings
  console.log("Trying direct insert with string values...");
  const { data: insertData, error: insertErr } = await supabase
    .from("api_credentials")
    .insert({
      provider_id: "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945",
      credential_type: "api_key",
      encrypted_value: "dGVzdA==",
      iv: "dGVzdA==",
    })
    .select();

  console.log("Insert data:", JSON.stringify(insertData, null, 2));
  console.log("Insert error:", JSON.stringify(insertErr, null, 2));

  // Now try the exact same way the save function does it (with Buffer)
  console.log("\nTrying insert with Buffer values...");
  const { data: insertData2, error: insertErr2 } = await supabase
    .from("api_credentials")
    .upsert({
      provider_id: "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945",
      credential_type: "api_key",
      encrypted_value: Buffer.from("dGVzdA==", "base64"),
      iv: Buffer.from("dGVzdA==", "base64"),
    }, { onConflict: "provider_id,credential_type" })
    .select();

  console.log("Upsert data:", JSON.stringify(insertData2, null, 2));
  console.log("Upsert error:", JSON.stringify(insertErr2, null, 2));

  // Check what's in the table now
  const { data: creds } = await supabase.from("api_credentials").select("*");
  console.log("\nAll credentials:", JSON.stringify(creds, null, 2));
}

main().catch(console.error);
