import { createClient } from "@supabase/supabase-js";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(encryptionKey) {
  const keyBytes = new TextEncoder().encode(
    encryptionKey.padEnd(32, "0").slice(0, 32),
  );
  return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM }, false, [
    "encrypt", "decrypt",
  ]);
}

async function doEncrypt(plaintext, encryptionKey) {
  const key = await getKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key, encoded,
  );
  return {
    iv: Buffer.from(iv).toString("base64"),
    encrypted: Buffer.from(ciphertext).toString("base64"),
  };
}

async function doDecrypt(encryptedBase64, ivBase64, encryptionKey) {
  const key = await getKey(encryptionKey);
  const iv = Buffer.from(ivBase64, "base64");
  const ciphertext = Buffer.from(encryptedBase64, "base64");
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key, ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const encKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
const tmdbId = "cccfe11e-6a47-4de0-b8b0-a2d3f34c1945";

async function main() {
  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);

  const testKey = "my-tmdb-api-key-12345";
  const enc = await doEncrypt(testKey, encKey);
  console.log("Encrypted iv (base64):", enc.iv);
  console.log("Encrypted data (base64):", enc.encrypted.substring(0, 40) + "...");

  // Save with Buffer
  const { error: saveErr } = await supabase.from("api_credentials").insert({
    provider_id: tmdbId,
    credential_type: "api_key",
    encrypted_value: Buffer.from(enc.encrypted, "base64"),
    iv: Buffer.from(enc.iv, "base64"),
  });
  if (saveErr) { console.log("Save error:", saveErr); return; }
  console.log("Save: OK");

  // Read back
  const { data: cred, error: readErr } = await supabase
    .from("api_credentials")
    .select("encrypted_value, iv")
    .eq("provider_id", tmdbId)
    .eq("credential_type", "api_key")
    .single();
  if (readErr) { console.log("Read error:", readErr); return; }

  console.log("\nRaw iv from DB:", cred.iv);
  console.log("Raw ev from DB:", cred.encrypted_value.substring(0, 60) + "...");

  // Convert hex → base64
  const ivBase64 = Buffer.from(String(cred.iv).replace(/^\x/, ""), "hex").toString("base64");
  const encryptedBase64 = Buffer.from(String(cred.encrypted_value).replace(/^\x/, ""), "hex").toString("base64");

  console.log("\nDecoded iv (base64):", ivBase64);
  console.log("Decoded encrypted (base64):", encryptedBase64.substring(0, 40) + "...");

  // Decrypt
  const decrypted = await doDecrypt(encryptedBase64, ivBase64, encKey);
  console.log("\nDecrypted value:", decrypted);
  console.log("Match:", decrypted === testKey ? "YES ✓" : "NO ✗");

  await supabase.from("api_credentials").delete().eq("provider_id", tmdbId);
}
main().catch(console.error);
