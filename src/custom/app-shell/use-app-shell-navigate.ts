"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** Client-side navigation for the ⌘K menu: `router.push(href)`. */
export function useAppShellNavigate(): (href: string) => void {
  const router = useRouter();
  return useCallback((href: string) => router.push(href), [router]);
}
