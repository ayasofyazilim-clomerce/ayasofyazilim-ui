'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface IPageBackButtonProps {
  LinkElement: any;
  description?: string;
  href: string;
  isLoading?: boolean;
  title?: string;
}
interface IPageHeaderProps {
  LinkElement?: undefined;
  description?: string;
  href?: undefined;
  isLoading?: boolean;
  title?: string;
}

export default function PageHeader({
  title,
  description,
  isLoading,
  LinkElement,
  href,
}: IPageHeaderProps | IPageBackButtonProps) {
  const hasReferer = useMemo(
    () => typeof window !== 'undefined' && !!document.referrer,
    [
      typeof window !== 'undefined' && window,
      typeof document !== 'undefined' && document,
    ]
  );
  const router = useRouter();
  const pathname = usePathname();
  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-4 px-2">
        {LinkElement && pathname !== href && (
          <Skeleton className="h-12 w-12 " />
        )}
        <div>
          <Skeleton className="h-6 w-80 " />
          <Skeleton className="h-6 w-120  mt-1" />
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-center gap-4 px-2">
      {hasReferer && LinkElement ? (
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            router.back();
          }}
        >
          <ArrowLeft />
        </Button>
      ) : LinkElement && pathname !== href ? (
        <LinkElement
          className="size-12 rounded-xl cursor-pointer border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground items-center justify-center flex"
          href={href}
        >
          <ArrowLeft />
        </LinkElement>
      ) : null}

      <div>
        <h1 className="text-2xl font-medium">{title}</h1>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
