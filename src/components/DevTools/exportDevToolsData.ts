export interface DevToolsExportData {
  exportedAt: string;
  logs: any[];
  networkRequests: any[];
  performanceMetrics: {
    currentMetrics: {
      memory: number;
      memoryLimit: number;
      fps: number;
      domNodes: number;
      jsHeapSize: number;
      loadTime: number;
    };
    performanceHistory: any[];
    renderTimes: any[];
  };
  state: {
    globalState: Record<string, any>;
    localStorage: Record<string, any>;
  };
  environment: {
    userAgent: string;
    language: string;
    platform: string;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
    url: string;
  };
}

export const collectDevToolsData = (): DevToolsExportData => {
  // Collect logs from global state
  const logs = (window as any).__EdgeIQ?.logs || [];

  // Mock network requests (in production, these would be intercepted)
  const networkRequests = [
    {
      url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
      method: "GET",
      status: 200,
      duration: 245,
      timestamp: new Date().toISOString(),
      type: "fetch",
      size: "12.4 KB"
    },
    {
      url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
      method: "GET",
      status: 200,
      duration: 189,
      timestamp: new Date().toISOString(),
      type: "fetch",
      size: "8.2 KB"
    },
  ];

  // Collect performance metrics
  const performance = window.performance;
  const memory = (performance as any).memory;

  const memoryUsed = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
  const memoryLimit = memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : 512;

  const performanceMetrics = {
    currentMetrics: {
      memory: memoryUsed,
      memoryLimit: memoryLimit,
      fps: 60,
      domNodes: document.querySelectorAll("*").length,
      jsHeapSize: memoryUsed,
      loadTime: Math.round((performance.timing?.domContentLoadedEventEnd || 0) - (performance.timing?.navigationStart || 0)) || 0,
    },
    performanceHistory: [],
    renderTimes: [
      { component: "LiveESPNSection", time: 45 },
      { component: "MatchCard", time: 12 },
      { component: "AlgorithmsSection", time: 28 },
      { component: "ArbitrageCard", time: 15 },
      { component: "QuickStatsDashboard", time: 22 },
      { component: "FilterSection", time: 8 },
    ],
  };

  // Collect state
  const edgeIQState = (window as any).__EdgeIQ;
  const globalState = {
    upcomingMatches: edgeIQState?.upcomingMatches || [],
    liveMatches: edgeIQState?.liveMatches || [],
    finishedMatches: edgeIQState?.finishedMatches || [],
    algorithmPerformance: edgeIQState?.algorithmPerformance || null,
    logsCount: edgeIQState?.logs?.length || 0,
  };

  // Collect localStorage
  const localStorageData: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        localStorageData[key] = JSON.parse(localStorage.getItem(key) || "");
      } catch {
        localStorageData[key] = localStorage.getItem(key);
      }
    }
  }

  // Environment info
  const environment = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    url: window.location.href,
  };

  return {
    exportedAt: new Date().toISOString(),
    logs,
    networkRequests,
    performanceMetrics,
    state: {
      globalState,
      localStorage: localStorageData,
    },
    environment,
  };
};

export const downloadAsJson = (data: DevToolsExportData, filename?: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `devtools-export-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportDevToolsData = () => {
  const data = collectDevToolsData();
  downloadAsJson(data);
  return data;
};
