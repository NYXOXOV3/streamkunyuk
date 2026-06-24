/**
 * Admin API Config — Shared Logic
 *
 * All mutations for the API provider/credentials system.
 * Credentials are encrypted with AES-256-GCM before storage
 * and decrypted only when needed (test connection, proxy calls).
 *
 * Called by API route handlers (NOT server actions).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto/encryption";
import { apiProviderSchema } from "@/lib/validations/adminSchemas";
import type { ApiProvider, ApiTestStatus } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Helper: get encryption key
// ---------------------------------------------------------------------------

function getEncryptionKey(): string {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key || key.includes("placeholder")) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY is not configured. Set it in .env.local.",
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// List all API providers (with masked credential status)
// ---------------------------------------------------------------------------

export async function getApiProviders(): Promise<{
  data: (ApiProvider & { has_api_key: boolean; has_secret_key: boolean })[];
  error: string | null;
}> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("api_providers")
      .select("*")
      .order("provider_type", { ascending: true });

    if (error) throw error;

    // Check which credentials exist (without decrypting)
    const enriched = await Promise.all(
      (data ?? []).map(async (provider) => {
        const { count: apiKeyCount } = await supabase
          .from("api_credentials")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("credential_type", "api_key");

        const { count: secretKeyCount } = await supabase
          .from("api_credentials")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("credential_type", "secret_key");

        return {
          ...provider,
          has_api_key: (apiKeyCount ?? 0) > 0,
          has_secret_key: (secretKeyCount ?? 0) > 0,
        };
      }),
    );

    return { data: enriched, error: null };
  } catch (e) {
    return { data: [], error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Save / Update API Provider and its Credentials
// ---------------------------------------------------------------------------

export async function saveApiConfig(formData: {
  provider_name: string;
  provider_type: "metadata" | "microdrama" | "video_source";
  base_url: string;
  description?: string;
  api_key: string;
  secret_key?: string;
  is_active: boolean;
  skip_key_update?: boolean;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const parsed = apiProviderSchema.safeParse({
      provider_name: formData.provider_name,
      provider_type: formData.provider_type,
      base_url: formData.base_url,
      description: formData.description,
      is_active: formData.is_active,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Only require API key when creating new or explicitly updating
    if (!formData.skip_key_update && !formData.api_key.trim()) {
      return { success: false, error: "API Key is required" };
    }

    const supabase = await createAdminClient();
    const encryptionKey = getEncryptionKey();

    // Upsert the provider
    const { data: provider, error: providerError } = await supabase
      .from("api_providers")
      .upsert(
        {
          provider_name: parsed.data.provider_name,
          provider_type: parsed.data.provider_type,
          base_url: parsed.data.base_url,
          description: parsed.data.description,
          is_active: parsed.data.is_active,
        },
        { onConflict: "provider_name" },
      )
      .select()
      .single();

    if (providerError) throw providerError;

    // Encrypt and save API key (skip if admin left blank to keep existing)
    if (!formData.skip_key_update && formData.api_key.trim()) {
      // Use delete+insert because api_credentials lacks a unique constraint for upsert
      const encryptedApiKey = await encrypt(formData.api_key, encryptionKey);
      await supabase
        .from("api_credentials")
        .delete()
        .eq("provider_id", provider.id)
        .eq("credential_type", "api_key");
      // bytea columns: use PostgreSQL hex format (\x + hex bytes)
      // Supabase JS serializes Buffer/Uint8Array as JSON, so we pass hex strings
      const apiKeyHex = Buffer.from(encryptedApiKey.encrypted, "base64").toString("hex");
      const apiIvHex = Buffer.from(encryptedApiKey.iv, "base64").toString("hex");
      const { error: credError } = await supabase
        .from("api_credentials")
        .insert({
          provider_id: provider.id,
          credential_type: "api_key",
          encrypted_value: "\\x" + apiKeyHex,
          iv: "\\x" + apiIvHex,
        });
      if (credError) throw credError;
    }

    // Encrypt and save secret key (if provided)
    if (formData.secret_key?.trim()) {
      const encryptedSecret = await encrypt(
        formData.secret_key,
        encryptionKey,
      );
      await supabase
        .from("api_credentials")
        .delete()
        .eq("provider_id", provider.id)
        .eq("credential_type", "secret_key");
      const secretHex = Buffer.from(encryptedSecret.encrypted, "base64").toString("hex");
      const secretIvHex = Buffer.from(encryptedSecret.iv, "base64").toString("hex");
      const { error: secretError } = await supabase
        .from("api_credentials")
        .insert({
          provider_id: provider.id,
          credential_type: "secret_key",
          encrypted_value: "\\x" + secretHex,
          iv: "\\x" + secretIvHex,
        });
      if (secretError) throw secretError;
    }

    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Decrypt a credential for use (server-side only)
// ---------------------------------------------------------------------------

export async function getCredential(
  providerName: string,
  credentialType: "api_key" | "secret_key" = "api_key",
): Promise<{ value: string; error: string | null }> {
  try {
    const supabase = await createAdminClient();
    const encryptionKey = getEncryptionKey();

    const { data: provider } = await supabase
      .from("api_providers")
      .select("id")
      .eq("provider_name", providerName)
      .single();

    if (!provider) {
      return { value: "", error: `Provider "${providerName}" not found` };
    }

    const { data: cred } = await supabase
      .from("api_credentials")
      .select("encrypted_value, iv")
      .eq("provider_id", provider.id)
      .eq("credential_type", credentialType)
      .single();

    if (!cred) {
      return {
        value: "",
        error: `No ${credentialType} found for "${providerName}"`,
      };
    }

    // Supabase JS returns bytea columns as '\\x...' hex strings
    // Strip the 2-char prefix and convert hex back to base64 for decryption
    const ivBase64 = Buffer.from(
      String(cred.iv).substring(2),
      "hex",
    ).toString("base64");
    const encryptedBase64 = Buffer.from(
      String(cred.encrypted_value).substring(2),
      "hex",
    ).toString("base64");

    const value = await decrypt(encryptedBase64, ivBase64, encryptionKey);
    return { value, error: null };
  } catch (e) {
    return { value: "", error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Test Connection — Ping an API using decrypted credentials
// ---------------------------------------------------------------------------

export async function testApiConnection(
  providerName: string,
): Promise<{ success: boolean; status: ApiTestStatus; message: string }> {
  try {
    const supabase = await createAdminClient();

    const { data: provider } = await supabase
      .from("api_providers")
      .select("*")
      .eq("provider_name", providerName)
      .single();

    if (!provider) {
      return {
        success: false,
        status: "fail",
        message: `Provider "${providerName}" not found`,
      };
    }

    const { value: apiKey, error: keyError } = await getCredential(
      providerName,
    );
    if (keyError || !apiKey) {
      return { success: false, status: "fail", message: keyError || "No API key configured" };
    }

    const baseUrl = provider.base_url?.replace(/\/$/, "") || "";
    let testUrl = "";
    let headers: Record<string, string> = {};

    // Provider-specific test logic
    if (providerName === "tmdb") {
      // TMDB v3 uses ?api_key= or Bearer token (v4)
      testUrl = `${baseUrl}/configuration?api_key=${apiKey}`;
    } else {
      // Generic: try GET base URL with Bearer auth
      testUrl = baseUrl;
      headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(testUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const status: ApiTestStatus = res.ok ? "success" : "fail";

    // Update test status in DB
    await supabase
      .from("api_providers")
      .update({
        test_status: status,
        last_tested_at: new Date().toISOString(),
      })
      .eq("id", provider.id);

    if (res.ok) {
      return {
        success: true,
        status: "success",
        message: `Connection successful (${res.status})`,
      };
    } else {
      return {
        success: false,
        status: "fail",
        message: `API returned ${res.status} ${res.statusText}`,
      };
    }
  } catch (e) {
    const message =
      e instanceof DOMException && e.name === "AbortError"
        ? "Connection timed out (10s)"
        : (e as Error).message;

    // Update test status in DB
    try {
      const supabase = await createAdminClient();
      await supabase
        .from("api_providers")
        .update({ test_status: "fail", last_tested_at: new Date().toISOString() })
        .eq("provider_name", providerName);
    } catch { /* ignore */ }

    return { success: false, status: "fail", message };
  }
}