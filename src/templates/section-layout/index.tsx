'use client';

import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const defaultDataForSectionLayout = [
  {
    id: 'about-the-project-0',
    name: 'About The Project',
    value: (
      <>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vel
        ultrices sapien. Maecenas lobortis elementum sapien, sed volutpat lacus.
        Vivamus vitae erat mi. Suspendisse vestibulum turpis libero. Donec
        facilisis quam in magna tempus, quis bibendum diam blandit. Nulla eget
        sem gravida, hendrerit tortor sed, laoreet tortor. Donec vitae nibh
        erat. Proin faucibus vulputate nunc, id feugiat justo volutpat quis.
        Aliquam erat volutpat.Aliquam faucibus, turpis in rhoncus tincidunt,
        quam nisi rutrum metus, ac gravida erat nulla suscipit elit. Donec
        vehicula dolor ut metus semper, et cursus dui eleifend. Duis vitae sem
        condimentum, placerat turpis eget, mollis quam. Morbi convallis sodales
        leo, a porta leo sagittis in. Curabitur dignissim vehicula faucibus. Nam
        fringilla velit a lectus accumsan laoreet. Donec sit amet porttitor
        nibh.Donec pretium placerat ipsum, eget tempor tellus. In pulvinar id
        lacus sit amet molestie. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Suspendisse bibendum orci et erat volutpat facilisis.
        Cras fringilla elementum ipsum sed tristique. Donec elementum libero a
        purus laoreet, viverra rutrum dolor pellentesque. Duis varius et neque
        sit amet feugiat. Vivamus ac ante ligula. Phasellus suscipit mollis elit
        et aliquet. Curabitur elit velit, gravida non odio eu, elementum
        facilisis purus. Vestibulum accumsan risus eget neque blandit sodales.
        Praesent velit urna, faucibus id lacus non, gravida finibus sapien.
        Curabitur pretium orci vitae commodo convallis. Sed non lacus bibendum,
        gravida neque sit amet, scelerisque ante. Cras velit massa, venenatis eu
        tortor et, lacinia consequat elit.Praesent sit amet quam et dolor
        dapibus rhoncus. Ut vel purus nec velit gravida dapibus. Vestibulum ante
        ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;
        Donec viverra velit odio, vel efficitur lorem pharetra vel. Mauris
        lacinia libero risus, posuere vehicula dui venenatis eget. Quisque ut
        pulvinar ligula, id dignissim ipsum. Vivamus arcu erat, consectetur id
        laoreet sit amet, pharetra eget ligula. Morbi fringilla orci et ante
        molestie, quis fermentum turpis posuere. Nam hendrerit eleifend dolor ut
        tempor. Integer dictum faucibus elementum. Praesent tristique lorem a
        massa dignissim, vitae rutrum nunc porta. Integer elementum lacus ac
        porttitor posuere. Donec auctor in massa et gravida. Phasellus vitae
        vehicula nibh. Ut elit mauris, volutpat hendrerit ex at, maximus feugiat
        velit.Phasellus ultrices, lorem et malesuada lobortis, lacus erat
        iaculis nunc, eu ultricies eros urna vitae lorem. Pellentesque tristique
        malesuada lobortis. Nam eget consequat risus, sed viverra quam.
        Curabitur rutrum nibh nec magna eleifend, ut pellentesque tellus luctus.
        Donec porta eget felis ac faucibus. Fusce vel laoreet mi. Integer
        lacinia vehicula lorem. Sed nec efficitur dui. Quisque vehicula
        tincidunt tempus. Praesent elementum enim euismod ex gravida feugiat.
        Proin ullamcorper eu neque eu vulputate. Praesent hendrerit posuere
        eros, vitae porta est dictum condimentum.
      </>
    ),
  },
  {
    id: 'documents-1',
    name: 'Documents',
    value: (
      <>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vel
        ultrices sapien. Maecenas lobortis elementum sapien, sed volutpat lacus.
        Vivamus vitae erat mi. Suspendisse vestibulum turpis libero. Donec
        facilisis quam in magna tempus, quis bibendum diam blandit. Nulla eget
        sem gravida, hendrerit tortor sed, laoreet tortor. Donec vitae nibh
        erat. Proin faucibus vulputate nunc, id feugiat justo volutpat quis.
        Aliquam erat volutpat.Aliquam faucibus, turpis in rhoncus tincidunt,
        quam nisi rutrum metus, ac gravida erat nulla suscipit elit. Donec
        vehicula dolor ut metus semper, et cursus dui eleifend. Duis vitae sem
        condimentum, placerat turpis eget, mollis quam. Morbi convallis sodales
        leo, a porta leo sagittis in. Curabitur dignissim vehicula faucibus. Nam
        fringilla velit a lectus accumsan laoreet. Donec sit amet porttitor
        nibh.Donec pretium placerat ipsum, eget tempor tellus. In pulvinar id
        lacus sit amet molestie. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Suspendisse bibendum orci et erat volutpat facilisis.
        Cras fringilla elementum ipsum sed tristique. Donec elementum libero a
        purus laoreet, viverra rutrum dolor pellentesque. Duis varius et neque
        sit amet feugiat. Vivamus ac ante ligula. Phasellus suscipit mollis elit
        et aliquet. Curabitur elit velit, gravida non odio eu, elementum
        facilisis purus. Vestibulum accumsan risus eget neque blandit sodales.
        Praesent velit urna, faucibus id lacus non, gravida finibus sapien.
        Curabitur pretium orci vitae commodo convallis. Sed non lacus bibendum,
        gravida neque sit amet, scelerisque ante. Cras velit massa, venenatis eu
        tortor et, lacinia consequat elit.Praesent sit amet quam et dolor
        dapibus rhoncus. Ut vel purus nec velit gravida dapibus. Vestibulum ante
        ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;
        Donec viverra velit odio, vel efficitur lorem pharetra vel. Mauris
        lacinia libero risus, posuere vehicula dui venenatis eget. Quisque ut
        pulvinar ligula, id dignissim ipsum. Vivamus arcu erat, consectetur id
        laoreet sit amet, pharetra eget ligula. Morbi fringilla orci et ante
        molestie, quis fermentum turpis posuere. Nam hendrerit eleifend dolor ut
        tempor. Integer dictum faucibus elementum. Praesent tristique lorem a
        massa dignissim, vitae rutrum nunc porta. Integer elementum lacus ac
        porttitor posuere. Donec auctor in massa et gravida. Phasellus vitae
        vehicula nibh. Ut elit mauris, volutpat hendrerit ex at, maximus feugiat
        velit.Phasellus ultrices, lorem et malesuada lobortis, lacus erat
        iaculis nunc, eu ultricies eros urna vitae lorem. Pellentesque tristique
        malesuada lobortis. Nam eget consequat risus, sed viverra quam.
        Curabitur rutrum nibh nec magna eleifend, ut pellentesque tellus luctus.
        Donec porta eget felis ac faucibus. Fusce vel laoreet mi. Integer
        lacinia vehicula lorem. Sed nec efficitur dui. Quisque vehicula
        tincidunt tempus. Praesent elementum enim euismod ex gravida feugiat.
        Proin ullamcorper eu neque eu vulputate. Praesent hendrerit posuere
        eros, vitae porta est dictum condimentum.
      </>
    ),
  },
  {
    id: 'team-2',
    name: 'Team',
    value: (
      <>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vel
        ultrices sapien. Maecenas lobortis elementum sapien, sed volutpat lacus.
        Vivamus vitae erat mi. Suspendisse vestibulum turpis libero. Donec
        facilisis quam in magna tempus, quis bibendum diam blandit. Nulla eget
        sem gravida, hendrerit tortor sed, laoreet tortor. Donec vitae nibh
        erat. Proin faucibus vulputate nunc, id feugiat justo volutpat quis.
        Aliquam erat volutpat.Aliquam faucibus, turpis in rhoncus tincidunt,
        quam nisi rutrum metus, ac gravida erat nulla suscipit elit. Donec
        vehicula dolor ut metus semper, et cursus dui eleifend. Duis vitae sem
        condimentum, placerat turpis eget, mollis quam. Morbi convallis sodales
        leo, a porta leo sagittis in. Curabitur dignissim vehicula faucibus. Nam
        fringilla velit a lectus accumsan laoreet. Donec sit amet porttitor
        nibh.Donec pretium placerat ipsum, eget tempor tellus. In pulvinar id
        lacus sit amet molestie. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Suspendisse bibendum orci et erat volutpat facilisis.
        Cras fringilla elementum ipsum sed tristique. Donec elementum libero a
        purus laoreet, viverra rutrum dolor pellentesque. Duis varius et neque
        sit amet feugiat. Vivamus ac ante ligula. Phasellus suscipit mollis elit
        et aliquet. Curabitur elit velit, gravida non odio eu, elementum
        facilisis purus. Vestibulum accumsan risus eget neque blandit sodales.
        Praesent velit urna, faucibus id lacus non, gravida finibus sapien.
        Curabitur pretium orci vitae commodo convallis. Sed non lacus bibendum,
        gravida neque sit amet, scelerisque ante. Cras velit massa, venenatis eu
        tortor et, lacinia consequat elit.Praesent sit amet quam et dolor
        dapibus rhoncus. Ut vel purus nec velit gravida dapibus. Vestibulum ante
        ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;
        Donec viverra velit odio, vel efficitur lorem pharetra vel. Mauris
        lacinia libero risus, posuere vehicula dui venenatis eget. Quisque ut
        pulvinar ligula, id dignissim ipsum. Vivamus arcu erat, consectetur id
        laoreet sit amet, pharetra eget ligula. Morbi fringilla orci et ante
        molestie, quis fermentum turpis posuere. Nam hendrerit eleifend dolor ut
        tempor. Integer dictum faucibus elementum. Praesent tristique lorem a
        massa dignissim, vitae rutrum nunc porta. Integer elementum lacus ac
        porttitor posuere. Donec auctor in massa et gravida. Phasellus vitae
        vehicula nibh. Ut elit mauris, volutpat hendrerit ex at, maximus feugiat
        velit.Phasellus ultrices, lorem et malesuada lobortis, lacus erat
        iaculis nunc, eu ultricies eros urna vitae lorem. Pellentesque tristique
        malesuada lobortis. Nam eget consequat risus, sed viverra quam.
        Curabitur rutrum nibh nec magna eleifend, ut pellentesque tellus luctus.
        Donec porta eget felis ac faucibus. Fusce vel laoreet mi. Integer
        lacinia vehicula lorem. Sed nec efficitur dui. Quisque vehicula
        tincidunt tempus. Praesent elementum enim euismod ex gravida feugiat.
        Proin ullamcorper eu neque eu vulputate. Praesent hendrerit posuere
        eros, vitae porta est dictum condimentum.
      </>
    ),
  },
];
export const defaultProps: ISectionLayoutProps = {
  sections: defaultDataForSectionLayout,
  defaultActiveSectionId: 'about-the-project-0',
};

interface ISection {
  id: string;
  link?: string;
  name: string;
  value?: JSX.Element;
}
interface ISectionNavbarBase {
  activeSectionId: string;
  openOnNewPage?: boolean;
  sections: Array<ISection>;
  vertical?: boolean;
}
interface ISectionContentBase {
  className?: string;
  sectionContent?: JSX.Element;
  sectionId: string;
  setActiveSectionId: React.Dispatch<React.SetStateAction<string>>;
}
interface ISectionContent {
  children?: JSX.Element;
  className?: string;
  sectionId?: string;
  setActiveSectionId?: React.Dispatch<React.SetStateAction<string>>;
}
interface ISectionLayoutProps {
  className?: string;
  content?: JSX.Element;
  contentClassName?: string;
  defaultActiveSectionId: string;
  openOnNewPage?: boolean;
  sections: Array<ISection>;
  vertical?: boolean;
}

const SectionNavbarBase = ({
  sections,
  activeSectionId,
  openOnNewPage,
  vertical,
}: ISectionNavbarBase) => (
  <div
    className={`sticky z-10 ${
      vertical
        ? 'top-5 basis-1/4 md:basis-2/12'
        : 'top-0 w-full bg-white shadow-sm'
    }`}
  >
    <nav
      className={`gap-4 text-sm text-muted-foreground pb-5 border-b md:border-0 text-center md:text-left ${
        vertical ? 'grid' : 'flex flex-row justify-center pt-5'
      }`}
    >
      {sections.map((section) => (
        <Link
          href={openOnNewPage ? section?.link ?? section.id : `#${section.id}`}
          className={
            section.id === activeSectionId ? 'font-semibold text-primary' : ''
          }
          key={section.id}
        >
          {section.name}
        </Link>
      ))}
    </nav>
  </div>
);
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
        if (entry.isIntersecting) {
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
    <div id={sectionId} ref={divRef} className={cn('', className)}>
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
}: ISectionLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState(
    defaultActiveSectionId
  );
  const activeSection = sections.find(
    (section) => section.id === activeSectionId
  );
  useEffect(() => {
    if (openOnNewPage) {
      setActiveSectionId(defaultActiveSectionId);
    }
  }, [defaultActiveSectionId]);
  return (
    <div
      className={cn(
        `mx-auto w-full flex flex-col items-center gap-6 md:gap-3 ${
          vertical ? 'md:flex-row md:items-start' : ''
        }`,
        className
      )}
    >
      <SectionNavbarBase
        sections={sections}
        activeSectionId={activeSectionId}
        openOnNewPage={openOnNewPage}
        vertical={vertical}
      />
      <div className="basis-3/4 ">
        {openOnNewPage ? (
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
      </div>
    </div>
  );
}
