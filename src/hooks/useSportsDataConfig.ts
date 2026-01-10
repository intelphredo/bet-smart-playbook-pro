
import { useState } from "react";
import LeagueRegistry, { LeagueConfig } from "@/types/LeagueRegistry";
import { DataSourceConfig } from "./useDataSourceStrategy";

export interface SportDataConfiguration {
  // Data sources
  availableDataSources: DataSourceConfig[];
  enabledDataSources: string[];
  toggleDataSource: (sourceId: string, enabled: boolean) => void;
  
  // League configuration
  registeredLeagues: LeagueConfig[];
  enabledLeagues: string[];
  toggleLeague: (leagueId: string, enabled: boolean) => void;
  registerLeague: (config: LeagueConfig) => void;
  
  // API configuration
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;
  hasValidApiKey: (provider: string) => boolean;
  
  // Display preferences
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  defaultDateRange: number; // days
  setDefaultDateRange: (days: number) => void;
}

export function useSportsDataConfig(): SportDataConfiguration {
  const [availableDataSources, setAvailableDataSources] = useState<DataSourceConfig[]>([
    { 
      id: "ESPN", 
      name: "ESPN", 
      priority: 1, 
      enabled: true,
      supportedLeagues: ["NBA", "NFL", "MLB", "NHL", "SOCCER", "NCAAF", "NCAAB"]
    },
    { 
      id: "ACTION", 
      name: "Action Network", 
      priority: 2, 
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
      id: "API", 
      name: "Sports API", 
      priority: 3, 
      enabled: false,
      requiresApiKey: true,
      apiKeyConfigured: false,
      supportedLeagues: ["NBA", "NFL", "MLB", "NHL", "SOCCER", "NCAAF", "NCAAB"]
    }
  ]);
  
  const [enabledDataSources, setEnabledDataSources] = useState<string[]>(["ESPN", "MLB", "ACTION"]);
  const [enabledLeagues, setEnabledLeagues] = useState<string[]>(["NBA", "NFL", "MLB", "NHL", "SOCCER", "NCAAF", "NCAAB"]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [refreshInterval, setRefreshInterval] = useState<number>(60000);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [defaultDateRange, setDefaultDateRange] = useState<number>(7);
  
  // Data source functions
  const toggleDataSource = (sourceId: string, enabled: boolean) => {
    if (enabled) {
      setEnabledDataSources(prev => [...prev, sourceId]);
      setAvailableDataSources(prev => 
        prev.map(source => source.id === sourceId ? {...source, enabled: true} : source)
      );
    } else {
      setEnabledDataSources(prev => prev.filter(id => id !== sourceId));
      setAvailableDataSources(prev => 
        prev.map(source => source.id === sourceId ? {...source, enabled: false} : source)
      );
    }
  };
  
  // League functions
  const toggleLeague = (leagueId: string, enabled: boolean) => {
    if (enabled) {
      setEnabledLeagues(prev => [...prev, leagueId]);
    } else {
      setEnabledLeagues(prev => prev.filter(id => id !== leagueId));
    }
  };
  
  const registerLeague = (config: LeagueConfig) => {
    LeagueRegistry.registerLeague(config);
    // Auto-enable newly registered leagues
    setEnabledLeagues(prev => [...prev, config.id]);
  };
  
  // API key management
  const setApiKey = (provider: string, key: string) => {
    setApiKeys(prev => ({...prev, [provider]: key}));
    
    // Update API key configuration status
    setAvailableDataSources(prev => 
      prev.map(source => 
        source.id === provider ? {...source, apiKeyConfigured: !!key} : source
      )
    );
  };
  
  const hasValidApiKey = (provider: string) => {
    return !!apiKeys[provider];
  };
  
  return {
    availableDataSources,
    enabledDataSources,
    toggleDataSource,
    
    registeredLeagues: LeagueRegistry.getActiveLeagues(),
    enabledLeagues,
    toggleLeague,
    registerLeague,
    
    apiKeys,
    setApiKey,
    hasValidApiKey,
    
    refreshInterval, 
    setRefreshInterval,
    autoRefresh,
    setAutoRefresh,
    defaultDateRange,
    setDefaultDateRange
  };
}
