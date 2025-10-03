'use client';

import { cva, VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ComponentType, ReactNode, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
const defaultClassNames = {
  vertical: {
    tabs: 'flex h-full ',
    tabList: 'flex flex-col h-full justify-start max-w-sm overflow-hidden',
    tabTrigger: 'justify-start md:max-w-lg overflow-hidden w-full',
    tabContent: 'mx-2 my-0 w-full h-full overflow-auto flex-1',
  },
  horizontal: {
    tabs: 'flex h-full overflow-hidden flex-col',
    tabList: 'w-full mx:w-max overflow-x-auto overflow-y-hidden min-h-max',
    tabTrigger: 'min-w-max',
    tabContent: 'h-full my-2 overflow-auto',
  },
};

const tabsVariants = cva('', {
  variants: {
    variant: {
      default: '',
      simple: '',
    },
    orientation: {
      horizontal: 'md:flex md:h-full md:overflow-hidden flex-col',
      vertical: 'md:flex md:h-full',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
});

const tabListVariants = cva('', {
  variants: {
    variant: {
      default:
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      simple: '',
    },
    orientation: {
      horizontal: 'w-max mx:w-max overflow-x-auto overflow-y-hidden min-h-max',
      vertical:
        'flex flex-col md:h-full justify-start md:max-w-[220px] w-full md:overflow-hidden md:pr-3 md:border-r border-muted',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
});

const tabTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'px-3 py-1 ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
        simple:
          'px-3 py-2 ring-offset-background transition-all rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=active]:bg-muted data-[state=active]:text-foreground',
      },
      orientation: {
        horizontal: '',
        vertical: 'justify-start md:max-w-lg overflow-hidden w-full',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default',
    },
  }
);

const tabContentVariants = cva('', {
  variants: {
    variant: {
      default:
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      simple: '',
    },
    orientation: {
      horizontal: 'h-full my-2 overflow-auto',
      vertical: 'mx-2 my-0 w-full h-full overflow-auto flex-1',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
});

function findActiveTab(tabList: { href: string }[], path: string) {
  const indexOfActiveTab = path
    .split('/')
    .reverse()
    .findIndex((_, index) => {
      if (index === 0) {
        return tabList.find((i) => i.href === path);
      }
      const link = path.split('/').slice(0, -index).join('/');
      return tabList.find((i) => i.href === link);
    });
  if (indexOfActiveTab === -1) {
    return undefined;
  }
  if (indexOfActiveTab === 0) {
    return tabList.find((i) => i.href === path)?.href;
  }
  return tabList.find(
    (i) => i.href === path.split('/').slice(0, -indexOfActiveTab).join('/')
  )?.href;
}

export function TabLayout({
  tabList,
  children,
  orientation = 'horizontal',
  classNames,
  variant = 'default',
}: {
  tabList: {
    label: string;
    href: string;
    icon?: ComponentType<{ className?: string }>;
    fallback?: ReactNode;
    disabled?: boolean;
  }[];
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  classNames?: DeepPartial<typeof defaultClassNames>;
  variant?: VariantProps<typeof tabsVariants>['variant'];
}) {
  const tabsClassNames = tabsVariants({ orientation, variant });
  const tabListClassNames = tabListVariants({ orientation, variant });
  const tabTriggerClassNames = tabTriggerVariants({ orientation, variant });
  const tabContentClassNames = tabContentVariants({ orientation, variant });
  const path = usePathname();

  const searchParams = `?${useSearchParams().toString()}`;
  const active =
    findActiveTab(tabList, path + searchParams) ||
    findActiveTab(tabList, path) ||
    tabList[0].href;

  return (
    <div
      className={cn(
        tabsClassNames,
        classNames?.[orientation]?.tabs,
        'overflow-clip md:overflow-hidden block'
      )}
      role="tabpanel"
    >
      <div
        role="tablist"
        className={cn(
          tabListClassNames,
          classNames?.[orientation]?.tabList,
          'border-b-2 pb-2 md:pb-0 mb-2 md:mb-0 mb:border-b-0'
        )}
        style={{
          scrollbarWidth: 'thin',
        }}
      >
        {tabList.map((tab) => (
          <span
            role="tab"
            key={tab.href}
            data-state={tab.href === active ? 'active' : 'inactive'}
            className={cn(
              tabTriggerClassNames,
              classNames?.[orientation]?.tabTrigger,
              tab.disabled && 'text-muted-foreground cursor-not-allowed'
            )}
          >
            {tab.disabled ? (
              <span className="w-full overflow-hidden text-elipsis data-[state=active]:sticky data-[state=active]:left-0 data-[state=active]:right-0">
                {tab.icon && <tab.icon className="block md:hidden" />}
                {tab.label}
              </span>
            ) : (
              <Link
                href={tab.href}
                className="w-full overflow-hidden text-elipsis data-[state=active]:sticky data-[state=active]:left-0 data-[state=active]:right-0"
              >
                {tab.icon && <tab.icon className="block md:hidden" />}
                {tab.label}
              </Link>
            )}
          </span>
        ))}
      </div>
      <div
        className={cn(
          tabContentClassNames,
          classNames?.[orientation]?.tabContent
        )}
      >
        <Suspense fallback={<Skeleton className="flex-1 size-full" />}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
