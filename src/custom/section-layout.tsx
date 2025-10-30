'use client';

import React, { JSX, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { Button } from '@repo/ayasofyazilim-ui/components/button';
import { ScrollBar, ScrollArea } from '@repo/ayasofyazilim-ui/components/scroll-area';

export interface ISection {
  id: string;
  link?: string;
  name: string;
  value?: JSX.Element;
}
export interface ISectionNavbarBase {
  activeSectionId: string;
  navAlignment?: 'start' | 'center' | 'end';
  navClassName?: string;
  navContainerClassName?: string;
  onSectionChange?: (sectionId: string) => void;
  openOnNewPage?: boolean;
  sections: Array<ISection>;
  showContentInSamePage?: boolean;
  showScrollArea?: boolean;
  vertical?: boolean;
}
export interface ISectionContentBase {
  className?: string;
  sectionContent?: JSX.Element;
  sectionId: string;
  setActiveSectionId: React.Dispatch<React.SetStateAction<string>>;
}
export interface ISectionContent {
  children?: JSX.Element;
  className?: string;
  sectionId?: string;
  setActiveSectionId?: React.Dispatch<React.SetStateAction<string>>;
}
export interface ISectionLayoutProps {
  className?: string;
  content?: JSX.Element;
  contentClassName?: string;
  defaultActiveSectionId: string;
  isScrollArea?: boolean;
  navAlignment?: 'start' | 'center' | 'end';
  navClassName?: string;
  onSectionChange?: (sectionId: string) => void;
  openOnNewPage?: boolean;
  sections: Array<ISection>;
  showContentInSamePage?: boolean;
  vertical?: boolean;
}

function WrapperElement({
  children,
  className,
  isScrollArea,
}: {
  children: JSX.Element | JSX.Element[];
  className: string;
  isScrollArea: boolean;
}) {
  if (isScrollArea) {
    return <ScrollArea className={className}>{children}</ScrollArea>;
  }

  return <div className={className}>{children}</div>;
}

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // only execute all the code below in client side
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}
export const SectionNavbarBase = ({
  sections,
  activeSectionId,
  openOnNewPage,
  vertical,
  navAlignment,
  navClassName,
  onSectionChange,
  showContentInSamePage,
  navContainerClassName,
  showScrollArea = true,
}: ISectionNavbarBase) => {
  const windowSize = useWindowSize()
  function onClick(e: string) {
    if (onSectionChange) onSectionChange(e);
  }
  if (showScrollArea) {
    return (
      <ScrollArea
        className={cn(
          `bg-white w-full shadow-sm ${vertical ? 'h-16 max-w-full md:h-full md:max-w-72' : 'h-16 max-w-full overflow-visible'}`,
          navContainerClassName
        )}
      >
        <ScrollBar
          orientation={
            vertical && windowSize.width > 768 ? 'vertical' : 'horizontal'
          }
          className="z-10"
        />
        <div>
          <nav
            className={cn(
              `flex gap-4 text-sm text-muted-foreground md:border-0 border-b text-center md:text-left ${vertical
                ? `flex-row justify-start p-0 h-16 items-center md:items-start md:flex-col md:gap-0 md:h-full`
                : `flex-row justify-${navAlignment}  h-16 items-center p-5`
              }     `,
              navClassName
            )}
          >
            {sections.map((section) => {
              const className = `
            hover:no-underline rounded-none bg-white ${section.id === activeSectionId ? `font-semibold text-primary sticky left-0 right-0` : 'text-muted-foreground hover:text-black'} ${vertical
                  ? 'block overflow-hidden text-ellipsis text-left max-w-72 h-10 px-4 py-0'
                  : ''
                } `;

              if (!openOnNewPage && showContentInSamePage) {
                return (
                  <Button
                    key={section.id}
                    variant="link"
                    onClick={() => onClick(section.id)}
                    className={className}
                  >
                    {section.name}
                  </Button>
                );
              }
              return (
                <Link
                  href={
                    openOnNewPage
                      ? section?.link ?? section.id
                      : `#${section.id}`
                  }
                  className={className}
                  key={section.id}
                >
                  {section.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>
    );
  }
  return (
    <nav
      className={cn(
        `flex gap-4 text-sm text-muted-foreground md:border-0 border-b text-center md:text-left ${vertical
          ? `flex-row justify-start p-0 h-16 items-center md:items-start md:flex-col md:gap-0 md:h-full`
          : `flex-row justify-${navAlignment}  h-16 items-center p-5`
        }     `,
        navClassName
      )}
    >
      {sections.map((section) => {
        const className = `
        hover:no-underline rounded-none bg-white ${section.id === activeSectionId ? `font-semibold text-primary sticky left-0 right-0` : 'text-muted-foreground hover:text-black'} ${vertical
            ? 'block overflow-hidden text-ellipsis text-left max-w-72 h-10 px-4 py-0'
            : ''
          } `;

        if (!openOnNewPage && showContentInSamePage) {
          return (
            <Button
              key={section.id}
              variant="link"
              onClick={() => onClick(section.id)}
              className={className}
            >
              {section.name}
            </Button>
          );
        }
        return (
          <Link
            href={
              openOnNewPage ? section?.link ?? section.id : `#${section.id}`
            }
            className={className}
            key={section.id}
          >
            {section.name}
          </Link>
        );
      })}
    </nav>
  );
};
const SectionContentBase = ({
  setActiveSectionId,
  sectionId,
  sectionContent,
  className,
}: ISectionContentBase) => {
  const divRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActiveSectionId(sectionId);
        }
      },
      { threshold: 0.5 }
    );
    if (divRef.current) {
      observer.observe(divRef.current);
    }
    return () => {
      if (divRef.current) {
        observer.unobserve(divRef.current);
      }
    };
  }, []);

  return (
    <div
      id={`${sectionId}testTable`}
      ref={divRef}
      className={cn('w-full ', className)}
    >
      {sectionContent}
    </div>
  );
};

export function SectionContent({
  children,
  className,
  sectionId,
  setActiveSectionId,
}: ISectionContent) {
  if (setActiveSectionId && sectionId) {
    return (
      <SectionContentBase
        key={sectionId}
        setActiveSectionId={setActiveSectionId}
        sectionId={sectionId}
        sectionContent={children}
        className={className}
      />
    );
  }
  return (
    <div className={cn('flex flex-1 justify-center', className)}>
      {children}
    </div>
  );
}

export function SectionLayout({
  className,
  sections,
  content,
  contentClassName,
  openOnNewPage,
  vertical,
  defaultActiveSectionId,
  navAlignment = 'start',
  navClassName,
  onSectionChange,
  showContentInSamePage,
  isScrollArea = true,
}: ISectionLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState(
    defaultActiveSectionId
  );
  const activeSection = sections.find(
    (section) => section.id === activeSectionId
  );
  useEffect(() => {
    if (openOnNewPage || showContentInSamePage) {
      setActiveSectionId(defaultActiveSectionId);
      // if (onSectionChange) onSectionChange(defaultActiveSectionId);
    }
  }, [defaultActiveSectionId]);

  function onChange(e: string) {
    if (!openOnNewPage && showContentInSamePage && onSectionChange) {
      onSectionChange(e);
    }
  }

  return (
    <div
      className={cn(
        `flex overflow-hidden h-full ${vertical ? 'flex-col md:flex-row' : 'flex-col'}`,
        className
      )}
    >
      <SectionNavbarBase
        sections={sections}
        activeSectionId={activeSectionId}
        openOnNewPage={openOnNewPage}
        onSectionChange={(e) => onChange(e)}
        showContentInSamePage={showContentInSamePage}
        vertical={vertical}
        navAlignment={navAlignment}
        navClassName={navClassName}
      />
      <WrapperElement isScrollArea={isScrollArea} className="w-full flex">
        {openOnNewPage || showContentInSamePage ? (
          <SectionContent
            key={activeSection?.id}
            sectionId={activeSection?.id}
            setActiveSectionId={setActiveSectionId}
            className={contentClassName}
          >
            {openOnNewPage ? content : activeSection?.value}
          </SectionContent>
        ) : (
          sections.map((section) => (
            <SectionContent
              key={section.id}
              sectionId={section.id}
              setActiveSectionId={setActiveSectionId}
              className={contentClassName}
            >
              {section?.value}
            </SectionContent>
          ))
        )}
      </WrapperElement>
    </div>
  );
}
