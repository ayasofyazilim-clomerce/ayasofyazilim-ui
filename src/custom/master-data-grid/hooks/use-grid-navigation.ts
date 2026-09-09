"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

export interface UseGridNavigationReturn {
  navigate: (url: string, options?: { replace?: boolean }) => void;
  isNavigating: boolean;
}

export function useGridNavigation(): UseGridNavigationReturn {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const navigate = useCallback(
    (url: string, options?: { replace?: boolean }) => {
      startTransition(() => {
        if (options?.replace) {
          router.replace(url, { scroll: false });
        } else {
          router.push(url, { scroll: false });
        }
      });
    },
    [router]
  );

  return { navigate, isNavigating };
}
