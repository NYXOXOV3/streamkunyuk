"use server";

/**
 * Auth Server Actions
 *
 * Server-side functions for authentication operations.
 * These run on the server with access to the Supabase server client
 * and can safely interact with the database.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Sign Up (Email/Password)
// ---------------------------------------------------------------------------

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || null },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // After signup, also insert the profile row (Supabase Auth trigger may handle this,
  // but we ensure it exists with is_admin = false)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").upsert(
      { id: user.id, display_name: displayName || null, is_admin: false },
      { onConflict: "id" },
    );
  }

  return { success: true, message: "Check your email to verify your account." };
}

// ---------------------------------------------------------------------------
// Sign In (Email/Password)
// ---------------------------------------------------------------------------

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

export async function signInWithGoogle() {
  const supabase = await createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  // Server action can't redirect to external URLs, return the URL
  // The client component will handle the redirect
  return { url: data.url };
}