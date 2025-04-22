
import { useState } from "react";
import { DataSource } from "@/types/sports";

export function useDataSourceManager(defaultSource: DataSource = "ESPN") {
  const [dataSource, setDataSource] = useState<DataSource | "ALL">(defaultSource);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toISOString());

  const getAvailableDataSources = (useExternalApis: boolean) => {
    let sources = ['ESPN', 'ACTION', 'MLB'];
    if (useExternalApis) {
      sources.push('API');
    }
    return sources;
  };

  const updateLastRefreshTime = () => {
    setLastRefreshTime(new Date().toISOString());
  };

  return {
    dataSource,
    setDataSource,
    lastRefreshTime,
    updateLastRefreshTime,
    getAvailableDataSources
  };
}
