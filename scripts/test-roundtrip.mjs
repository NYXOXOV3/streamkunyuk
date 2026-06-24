import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Insert with plain base64 string (no Buffer)
  const testBase64 = "SGVsbG8gV29ybGQ="; // "Hello World" in base64
  const { data: inserted, error: iErr } = await supabase
    .from("api_credentials")
    .insert({
      provider_id: "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945",
      credential_type: "api_key",
      encrypted_value: testBase64,
      iv: testBase64,
    })
    .select()
    .single();

  console.log("Inserted:", JSON.stringify(inserted, null, 2));
  console.log("iv type:", typeof inserted?.iv);
  console.log("iv value:", inserted?.iv);
  console.log("encrypted_value type:", typeof inserted?.encrypted_value);
  console.log("encrypted_value value:", inserted?.encrypted_value);

  // Now read it back
  const { data: readBack, error: rErr } = await supabase
    .from("api_credentials")
    .select("*")
    .eq("provider_id", "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945")
    .eq("credential_type", "api_key")
    .single();

  console.log("\nRead back:", JSON.stringify(readBack, null, 2));
  console.log("iv type:", typeof readBack?.iv);
  console.log("iv value:", readBack?.iv);

  // Cleanup
  await supabase.from("api_credentials").delete().eq("provider_id", "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945");
}
main().catch(console.error);
