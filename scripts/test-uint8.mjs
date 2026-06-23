import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tmdbId = "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945";

async function main() {
  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);

  const testBase64 = "/Np3oL15KqeSnpZP"; // 12 bytes IV
  const buf = Buffer.from(testBase64, "base64");
  
  // Try with Uint8Array
  const { data, error } = await supabase.from("api_credentials").insert({
    provider_id: tmdbId,
    credential_type: "api_key",
    encrypted_value: new Uint8Array(buf),
    iv: new Uint8Array(buf),
  }).select().single();

  console.log("Uint8Array result:");
  console.log("  iv:", data?.iv);
  console.log("  ev:", data?.encrypted_value?.substring(0, 60) + "...");
  console.log("  error:", error);

  // Decode back
  if (data) {
    const decoded = Buffer.from(String(data.iv).replace(/^\x/, ""), "hex");
    console.log("  decoded iv length:", decoded.length, "(expected 12)");
    console.log("  decoded iv base64:", decoded.toString("base64"));
    console.log("  match:", decoded.toString("base64") === testBase64 ? "YES ✓" : "NO ✗");
  }

  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);
}
main().catch(console.error);
