import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Protected CMS login for Prajjwol Bhandari's portfolio.",
};

interface AdminLoginPageProps {
  searchParams?: {
    error?: string;
    next?: string;
  };
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const nextPath = searchParams?.next?.startsWith("/admin")
    ? searchParams.next
    : "/admin/dashboard";
  const hasConfigError = searchParams?.error === "supabase-config";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-16 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="pointer-events-none absolute left-8 top-8 font-mono text-xs font-black uppercase text-white">
        PB / CMS
      </div>
      <div className="pointer-events-none absolute right-8 top-8 size-8 bg-[#ffd60a]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full opacity-35 [background-image:linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] [background-position:0_0,0_8px,8px_-8px,-8px_0] [background-size:16px_16px]" />

      <div className="relative z-10 w-full">
        <AdminLoginForm hasConfigError={hasConfigError} nextPath={nextPath} />
      </div>
    </main>
  );
}
