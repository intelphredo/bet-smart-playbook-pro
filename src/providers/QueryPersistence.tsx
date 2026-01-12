import React from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { queryClient } from "./ReactQueryProvider";

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

interface QueryPersistenceProps {
  children: React.ReactNode;
}

export const QueryPersistence: React.FC<QueryPersistenceProps> = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
