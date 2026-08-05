"use client";

import { createContext, useContext } from "react";
import type { MasterDataGridResources } from "../types";

const MasterDataGridResourcesContext = createContext<
  MasterDataGridResources | undefined
>(undefined);

export function MasterDataGridResourcesProvider({
  resources,
  children,
}: {
  resources: MasterDataGridResources;
  children: React.ReactNode;
}) {
  return (
    <MasterDataGridResourcesContext.Provider value={resources}>
      {children}
    </MasterDataGridResourcesContext.Provider>
  );
}

/** Undefined when no provider is mounted, so the `t` prop stays optional. */
export function useMasterDataGridResources() {
  return useContext(MasterDataGridResourcesContext);
}
