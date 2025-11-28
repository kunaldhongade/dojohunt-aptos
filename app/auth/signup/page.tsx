"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signin page
    router.replace("/auth/signin");
  }, [router]);

  return null;
}
