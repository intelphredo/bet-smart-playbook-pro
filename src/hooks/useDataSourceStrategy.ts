
import { useState } from "react";
import { DataSource } from "@/types/sports";
import LeagueRegistry from "@/types/LeagueRegistry";

export interface DataSourceConfig {
  id: DataSource | string;
  name: string;
  priority: number;
  enabled: boolean;
  requiresApiKey?: boolean;
  apiKeyConfigured?: boolean;
  fallbackSource?: DataSource | string;
  supportedLeagues: string[];
}

export function useDataSourceStrategy(defaultSource: DataSource = "ESPN") {
  const [primaryDataSource, setPrimaryDataSource] = useState<DataSource | string>(defaultSource);
  const [fallbackSources, setFallbackSources] = useState<Array<DataSource | string>>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toISOString());
  const [dataSourceConfigs, setDataSourceConfigs] = useState<DataSourceConfig[]>([
    { 
      id: "ESPN", 
      name: "ESPN", 
      priority: 1, 
      enabled: true,
      supportedLeagues: ["NBA", "NFL", "MLB", "NHL", "SOCCER", "NCAAF", "NCAAB"] 
    },
    { 
      id: "MLB", 
      name: "MLB API", 
      priority: 1, 
      enabled: true,
      supportedLeagues: ["MLB"] 
    },
    { 
      id: "SPORTRADAR", 
      name: "Sportradar", 
      priority: 2, 
      enabled: true,
      requiresApiKey: true,
      apiKeyConfigured: true,
      fallbackSource: "ESPN",
      supportedLeagues: ["NBA", "NFL", "MLB", "NHL", "SOCCER"] 
    },
    { 
      id: "API", 
      name: "Sports API", 
      priority: 3, 
      enabled: false,
      requiresApiKey: true,
      apiKeyConfigured: false,
      supportedLeagues: ["NBA", "NFL", "MLB", "NHL", "SOCCER", "NCAAF", "NCAAB"] 
    }
  ]);

  // Get available data sources based on enabled status and external API configuration
  const getAvailableDataSources = (useExternalApis: boolean = false) => {
    return dataSourceConfigs
      .filter(source => source.enabled && (!source.requiresApiKey || useExternalApis))
      .sort((a, b) => a.priority - b.priority)
      .map(source => source.id);
  };

  // Get best data source for a specific league
  const getBestDataSourceForLeague = (leagueId: string): DataSource | string => {
    // Special case for MLB - always use MLB API
    if (leagueId === "MLB") {
      return "MLB";
    }

    // Find all enabled sources that support this league
    const supportingSources = dataSourceConfigs
      .filter(source => 
        source.enabled && 
        source.supportedLeagues.includes(leagueId)
      )
      .sort((a, b) => a.priority - b.priority);
      
    return supportingSources.length > 0 ? supportingSources[0].id : defaultSource;
  };

  const updateLastRefreshTime = () => {
    setLastRefreshTime(new Date().toISOString());
  };

  // Configure a new data source or update an existing one
  const configureDataSource = (config: Partial<DataSourceConfig> & { id: DataSource | string }) => {
    setDataSourceConfigs(current => 
      current.map(source => 
        source.id === config.id ? { ...source, ...config } : source
      )
    );
  };

  // Enable or disable a data source
  const toggleDataSource = (sourceId: DataSource | string, enabled: boolean) => {
    configureDataSource({ id: sourceId, enabled });
  };

  return {
    primaryDataSource,
    setPrimaryDataSource,
    fallbackSources,
    setFallbackSources,
    dataSourceConfigs,
    configureDataSource,
    toggleDataSource,
    lastRefreshTime,
    updateLastRefreshTime,
    getAvailableDataSources,
    getBestDataSourceForLeague
  };
}
