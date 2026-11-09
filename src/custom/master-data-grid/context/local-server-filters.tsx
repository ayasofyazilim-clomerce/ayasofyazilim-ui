"use client";

import { createContext, useContext } from "react";

/**
 * The applied server filters of a grid with `urlState: "none"`, held by the
 * grid itself so they survive its loading and empty states, and shared by
 * every filter UI it renders (the chip bar, the side panel and the toolbar's
 * filter popover or drawer).
 */
export interface LocalServerFilters {
  /** The applied filters, as the query string a URL-mode grid would hold. */
  query: string;
  /** Applies a new set of filters: reports them and returns to page one. */
  commit: (next: URLSearchParams) => void;
}

export const LocalServerFiltersContext =
  createContext<LocalServerFilters | null>(null);

/** The grid's "none"-mode filter store; null in the URL modes. */
export function useLocalServerFilters(): LocalServerFilters | null {
  return useContext(LocalServerFiltersContext);
}
