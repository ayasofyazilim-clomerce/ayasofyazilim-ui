'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface ISection {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  id: string;
  link?: string;
  name: string;
}

export interface ISectionLayoutNavbarProps {
  activeSectionId: string;
  linkElement?: any;
  onSectionChange?: (sectionId: string) => void;
  sections: Array<ISection>;
  vertical?: boolean;
}

/**
 * Renders a navigation bar for a section layout.
 *
 * @param {Array<ISection>} props.sections - The sections to be rendered in the navigation bar.
 * @param {string} props.activeSectionId - The ID of the active section.
 * @param {(sectionId: string) => void} [props.onSectionChange] - The function to be called when a section is clicked.
 * @param {React.ElementType} [props.linkElement] - The element to be used for the section links. (default: Button)
 * @param {boolean} [props.vertical] - Whether the navigation bar should be rendered vertically.
 * @return {React.ReactNode} The rendered navigation bar.
 */
export function SectionLayoutNavbar({
  sections,
  activeSectionId,
  onSectionChange,
  linkElement,
  vertical,
}: ISectionLayoutNavbarProps) {
  const LinkElement = linkElement || Button;
  return (
    <nav
      className={cn(
        'flex gap-4 text-sm text-center md:text-left p-3 ',
        vertical
          ? 'flex-col border-b md:border-b-0 md:border-r overflow-auto min-w-full md:min-w-[240px] items-center md:items-start'
          : 'flex-col md:flex-row border-b'
      )}
    >
      {sections.map((section) => (
        <LinkElement
          className={cn(
            activeSectionId === section.id
              ? 'font-semibold text-primary hover:no-underline m-0 p-0 h-auto justify-start'
              : 'font-normal text-muted-foreground hover:no-underline m-0 p-0 h-auto justify-start',
            section.disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer',
            section.className
          )}
          data-active={activeSectionId === section.id}
          href={section.link || '#'}
          onClick={() => {
            if (section.disabled) return;
            if (!linkElement && onSectionChange) {
              onSectionChange(section.id);
            }
          }}
          key={section.id}
          tabIndex={section.disabled ? -1 : 0}
          variant="link"
        >
          {section.children && section.children}
          {!section.children && section.name}
        </LinkElement>
      ))}
    </nav>
  );
}

export interface ISectionContentProps {
  children: React.ReactNode;
  className?: string;
  sectionId: string;
}
/**
 * Renders the content of a section layout based on the active section ID. It must be inside of SectionLayout component.
 *
 * @param {string} sectionId - The ID of the section to render.
 * @param {React.ReactNode} children - The content to be rendered inside the section layout.
 * @param {string} className - Additional CSS classes for styling.
 * @return {JSX.Element | null} The rendered section layout content or null if the section is not active.
 */
export function SectionLayoutContent({
  sectionId,
  children,
  className,
}: ISectionContentProps) {
  const context = useContext(SectionLayoutContext);
  const { activeSectionId } = context;
  if (activeSectionId !== sectionId) return null;

  return (
    <div
      id={`section-${sectionId}`}
      className={cn('w-full p-5 overflow-auto h-full flex-1', className)}
    >
      {children}
    </div>
  );
}

const SectionLayoutContext = createContext({
  activeSectionId: '',
});
export interface ISectionLayoutProps {
  children: React.ReactNode;
  defaultActiveSectionId?: string;
  linkElement?: any;
  sections: Array<ISection>;
  vertical?: boolean;
}

/**
 * Renders a section layout component with a navigation bar and content area.
 *
 * @param {React.ReactNode} children - The content to be rendered inside the section layout.
 * @param {Array<ISection>} sections - The sections to be rendered in the navigation bar.
 * @param {string} [defaultActiveSectionId] - The ID of the section to be active by default.
 * @param {any} [linkElement] - The element to be used for the section links. (default: Button)
 * @param {boolean} [vertical] - Whether the layout should be rendered vertically.
 * @return {JSX.Element} The rendered section layout component.
 */
export function SectionLayout({
  children,
  sections,
  defaultActiveSectionId,
  linkElement,
  vertical,
}: ISectionLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState(
    defaultActiveSectionId || sections?.[0].id
  );
  useEffect(() => {
    if (linkElement && defaultActiveSectionId) {
      setActiveSectionId(defaultActiveSectionId);
    }
  }, [defaultActiveSectionId]);
  const contextValue = useMemo(() => ({ activeSectionId }), [activeSectionId]);
  return (
    <SectionLayoutContext.Provider value={contextValue}>
      <div
        className={
          vertical
            ? 'flex flex-wrap md:flex-nowrap rounded-lg h-full overflow-hidden mb-5'
            : 'rounded-lg h-full overflow-hidden flex flex-col'
        }
      >
        <SectionLayoutNavbar
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionChange={setActiveSectionId}
          linkElement={linkElement}
          vertical={vertical}
        />
        {children}
      </div>
    </SectionLayoutContext.Provider>
  );
}

export const SectionLayoutSkeleton = ({ vertical }: { vertical?: boolean }) => (
  <div
    className={
      vertical
        ? 'flex flex-wrap md:flex-nowrap rounded-lg h-full overflow-hidden'
        : 'rounded-lg h-full overflow-hidden flex flex-col'
    }
  >
    <nav
      className={cn(
        'flex gap-4 text-sm text-center md:text-left p-5 ',
        vertical
          ? 'flex-col border-b md:border-b-0 md:border-r min-w-full md:min-w-[240px] items-center md:items-start'
          : 'flex-col md:flex-row border-b'
      )}
    >
      <Skeleton className="h-6 w-full bg-gray-200" />
      <Skeleton className="h-6 w-full bg-gray-200" />
      <Skeleton className="h-6 w-full bg-gray-200" />
      <Skeleton className="h-6 w-full bg-gray-200" />
      <Skeleton className="h-6 w-full bg-gray-200" />
    </nav>
    <div className="w-full p-5 overflow-auto h-full flex-1">
      <Skeleton className="h-40 w-full bg-gray-200 mb-2" />
      <Skeleton className="h-40 w-full bg-gray-200 mb-2" />
      <Skeleton className="h-40 w-full bg-gray-200 mb-2" />
    </div>
  </div>
);
