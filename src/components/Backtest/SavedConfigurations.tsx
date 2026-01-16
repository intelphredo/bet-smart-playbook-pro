import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, FolderOpen, Trash2, Plus } from "lucide-react";
import type { BacktestStrategy } from "@/hooks/useBacktestSimulator";
import { getStrategyDisplayName } from "@/hooks/useBacktestSimulator";

export interface BacktestConfiguration {
  id: string;
  name: string;
  createdAt: string;
  strategy: BacktestStrategy;
  startingBankroll: number;
  stakeType: 'flat' | 'percentage' | 'kelly';
  stakeAmount: number;
  minConfidence: number;
  league: string;
}

interface SavedConfigurationsProps {
  currentConfig: Omit<BacktestConfiguration, 'id' | 'name' | 'createdAt'>;
  onLoadConfig: (config: BacktestConfiguration) => void;
}

const STORAGE_KEY = 'backtest-saved-configs';

export function SavedConfigurations({ currentConfig, onLoadConfig }: SavedConfigurationsProps) {
  const [savedConfigs, setSavedConfigs] = useState<BacktestConfiguration[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');

  // Load saved configs on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedConfigs(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved configs:', e);
    }
  }, []);

  // Save to localStorage when configs change
  const saveToStorage = (configs: BacktestConfiguration[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      setSavedConfigs(configs);
    } catch (e) {
      console.error('Failed to save configs:', e);
    }
  };

  const handleSave = () => {
    if (!configName.trim()) return;

    const newConfig: BacktestConfiguration = {
      id: Date.now().toString(),
      name: configName.trim(),
      createdAt: new Date().toISOString(),
      ...currentConfig,
    };

    saveToStorage([...savedConfigs, newConfig]);
    setConfigName('');
    setShowSaveDialog(false);
  };

  const handleDelete = (id: string) => {
    saveToStorage(savedConfigs.filter(c => c.id !== id));
  };

  const handleLoad = (config: BacktestConfiguration) => {
    onLoadConfig(config);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={savedConfigs.length === 0}>
              <FolderOpen className="h-4 w-4 mr-1" />
              Load
              {savedConfigs.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {savedConfigs.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {savedConfigs.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No saved configurations
              </div>
            ) : (
              savedConfigs.map((config, idx) => (
                <div key={config.id}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => handleLoad(config)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{config.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getStrategyDisplayName(config.strategy)} • {config.minConfidence}% conf
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(config.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </DropdownMenuItem>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Configuration</DialogTitle>
            <DialogDescription>
              Save your current backtest settings for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="config-name">Configuration Name</Label>
              <Input
                id="config-name"
                placeholder="e.g., Conservative NBA Strategy"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Strategy:</span> {getStrategyDisplayName(currentConfig.strategy)}</p>
              <p><span className="text-muted-foreground">Bankroll:</span> ${currentConfig.startingBankroll}</p>
              <p><span className="text-muted-foreground">Stake:</span> {currentConfig.stakeType} ({currentConfig.stakeAmount})</p>
              <p><span className="text-muted-foreground">Min Confidence:</span> {currentConfig.minConfidence}%</p>
              <p><span className="text-muted-foreground">League:</span> {currentConfig.league || 'All'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!configName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
