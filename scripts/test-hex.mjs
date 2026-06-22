import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tmdbId = "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945";

async function main() {
  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);

  const testBase64 = "/Np3oL15KqeSnpZP"; // 12 bytes
  const hexStr = Buffer.from(testBase64, "base64").toString("hex");
  console.log("hex:", hexStr);
  console.log("hex length:", hexStr.length);

  // Try 1: raw hex string
  const { data: d1, error: e1 } = await supabase.from("api_credentials").insert({
    provider_id: tmdbId, credential_type: "api_key",
    encrypted_value: hexStr, iv: hexStr,
  }).select().single();
  console.log("\nRaw hex string:");
  console.log("  iv:", d1?.iv);
  console.log("  ev:", d1?.encrypted_value?.substring(0, 80));
  if (d1) {
    const decoded = Buffer.from(String(d1.iv).replace(/^\x/, ""), "hex");
    console.log("  decoded length:", decoded.length);
  }

  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);

  // Try 2: use the Supabase RPC to do a raw insert
  // Actually let me just check if passing a properly formatted bytea escape works
  // PostgreSQL bytea escape format: \x followed by hex
  const byteaHex = "\\x" + hexStr;
  console.log("\n\nTrying bytea hex:", byteaHex.substring(0, 30));
  const { data: d2, error: e2 } = await supabase.from("api_credentials").insert({
    provider_id: tmdbId, credential_type: "api_key",
    encrypted_value: byteaHex, iv: byteaHex,
  }).select().single();
  console.log("Bytea hex:");
  console.log("  iv:", d2?.iv);
  console.log("  ev:", d2?.encrypted_value?.substring(0, 80));
  if (d2) {
    const raw = String(d2.iv).replace(/^\x/, "");
    console.log("  after strip:", raw.substring(0, 40));
    const decoded = Buffer.from(raw, "hex");
    console.log("  decoded length:", decoded.length);
    console.log("  decoded base64:", decoded.toString("base64"));
    console.log("  match:", decoded.toString("base64") === testBase64 ? "YES ✓" : "NO ✗");
  }

  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);
}
main().catch(console.error);
