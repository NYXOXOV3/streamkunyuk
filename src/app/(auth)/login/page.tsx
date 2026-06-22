import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In — StreamVault",
  description: "Sign in to your StreamVault account to continue watching.",
};

export default function LoginPage() {
  return <LoginForm />;
}