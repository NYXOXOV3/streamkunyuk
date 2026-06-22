import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tmdbId = "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945";

async function main() {
  // The \\x prefix in JS literal = \x in actual string
  // Insert using \\x hex (PostgreSQL bytea hex format)
  const testBase64 = "/Np3oL15KqeSnpZP";
  const hexStr = Buffer.from(testBase64, "base64").toString("hex");
  
  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);
  
  // Store with \\x prefix
  const byteaHex = "\\x" + hexStr;
  const { data, error } = await supabase.from("api_credentials").insert({
    provider_id: tmdbId, credential_type: "api_key",
    encrypted_value: byteaHex, iv: byteaHex,
  }).select().single();
  
  console.log("Stored OK:", !error);
  console.log("Raw iv from DB:", JSON.stringify(data.iv));
  
  // The value from DB starts with literal backslash-x
  const rawIv = data.iv;
  console.log("Starts with backslash-x:", rawIv.startsWith("\\x"));
  
  // Strip the \\x prefix (2 chars: backslash and x)
  const hexOnly = rawIv.substring(2);
  console.log("Hex only:", hexOnly);
  console.log("Hex length:", hexOnly.length, "(expected 24 for 12 bytes)");
  
  const decoded = Buffer.from(hexOnly, "hex");
  console.log("Decoded length:", decoded.length, "(expected 12)");
  console.log("Decoded base64:", decoded.toString("base64"));
  console.log("Match:", decoded.toString("base64") === testBase64 ? "YES ✓" : "NO ✗");

  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);
}
main().catch(console.error);
