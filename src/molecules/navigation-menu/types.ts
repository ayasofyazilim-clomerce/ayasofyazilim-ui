export type submenuTypes = {
  description: string;
  href: string;
  title: string;
};

export type navigationLinkTypes = {
  href?: string;
  submenu?: submenuTypes[];
  text?: string;
  title?: string;
};

export type NavigationProps = {
  className?: string;
  navigationLinks?: navigationLinkTypes[];
};
