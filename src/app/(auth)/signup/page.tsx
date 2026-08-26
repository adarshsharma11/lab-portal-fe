"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center text-sm text-[color:var(--muted)]">
      Redirecting to login…
    </div>
  );
}
