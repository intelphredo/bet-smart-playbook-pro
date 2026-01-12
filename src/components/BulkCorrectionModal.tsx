import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBulkCorrectPredictions } from '@/hooks/useCorrectPrediction';
import { 
  Loader2, 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react';

interface BulkCorrectionEntry {
  match_id: string;
  actual_score_home: number;
  actual_score_away: number;
  isValid: boolean;
  error?: string;
}

interface BulkCorrectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkCorrectionModal({ open, onOpenChange }: BulkCorrectionModalProps) {
  const { mutate: bulkCorrect, isPending } = useBulkCorrectPredictions();
  
  const [entries, setEntries] = useState<BulkCorrectionEntry[]>([
    { match_id: '', actual_score_home: 0, actual_score_away: 0, isValid: false }
  ]);
  const [csvText, setCsvText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [results, setResults] = useState<{ updated: number; failed: number; errors: string[] } | null>(null);

  const validateEntry = (entry: Partial<BulkCorrectionEntry>): BulkCorrectionEntry => {
    const matchId = entry.match_id?.trim() || '';
    const homeScore = Number(entry.actual_score_home);
    const awayScore = Number(entry.actual_score_away);
    
    let error: string | undefined;
    if (!matchId) {
      error = 'Match ID required';
    } else if (isNaN(homeScore) || homeScore < 0) {
      error = 'Invalid home score';
    } else if (isNaN(awayScore) || awayScore < 0) {
      error = 'Invalid away score';
    }

    return {
      match_id: matchId,
      actual_score_home: isNaN(homeScore) ? 0 : homeScore,
      actual_score_away: isNaN(awayScore) ? 0 : awayScore,
      isValid: !error,
      error
    };
  };

  const updateEntry = (index: number, field: keyof BulkCorrectionEntry, value: string | number) => {
    setEntries(prev => {
      const updated = [...prev];
      const entry = { ...updated[index], [field]: value };
      updated[index] = validateEntry(entry);
      return updated;
    });
  };

  const addEntry = () => {
    setEntries(prev => [...prev, { match_id: '', actual_score_home: 0, actual_score_away: 0, isValid: false }]);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    const errors: string[] = [];
    const parsed: BulkCorrectionEntry[] = [];

    lines.forEach((line, index) => {
      // Skip header row if present
      if (index === 0 && line.toLowerCase().includes('match_id')) {
        return;
      }

      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length < 3) {
        errors.push(`Line ${index + 1}: Not enough columns (need match_id, home_score, away_score)`);
        return;
      }

      const entry = validateEntry({
        match_id: parts[0],
        actual_score_home: parseInt(parts[1], 10),
        actual_score_away: parseInt(parts[2], 10)
      });

      if (!entry.isValid) {
        errors.push(`Line ${index + 1}: ${entry.error}`);
      }
      
      parsed.push(entry);
    });

    setParseErrors(errors);
    if (parsed.length > 0) {
      setEntries(parsed);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    const validEntries = entries.filter(e => e.isValid);
    if (validEntries.length === 0) return;

    bulkCorrect(
      validEntries.map(e => ({
        match_id: e.match_id,
        actual_score_home: e.actual_score_home,
        actual_score_away: e.actual_score_away
      })),
      {
        onSuccess: (data) => {
          setResults(data);
          if (data.updated > 0 && data.failed === 0) {
            setTimeout(() => {
              onOpenChange(false);
              resetForm();
            }, 2000);
          }
        }
      }
    );
  };

  const resetForm = () => {
    setEntries([{ match_id: '', actual_score_home: 0, actual_score_away: 0, isValid: false }]);
    setCsvText('');
    setParseErrors([]);
    setResults(null);
  };

  const downloadTemplate = () => {
    const csv = 'match_id,home_score,away_score\nexample-match-id-123,3,2\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prediction_corrections_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = entries.filter(e => e.isValid).length;
  const invalidCount = entries.filter(e => !e.isValid && e.match_id).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Prediction Correction
          </DialogTitle>
          <DialogDescription>
            Update multiple prediction results at once via CSV upload or manual entry.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              {results.updated > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">{results.updated} updated</span>
                </div>
              )}
              {results.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">{results.failed} failed</span>
                </div>
              )}
            </div>
            {results.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                <ul className="text-xs text-red-500 space-y-1">
                  {results.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {results.errors.length > 5 && (
                    <li>...and {results.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            <Button className="w-full" onClick={resetForm}>
              Correct More Predictions
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg border bg-card">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="col-span-3 sm:col-span-1">
                          <Label className="text-xs">Match ID</Label>
                          <Input
                            value={entry.match_id}
                            onChange={(e) => updateEntry(index, 'match_id', e.target.value)}
                            placeholder="Match ID"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Home Score</Label>
                          <Input
                            type="number"
                            min="0"
                            value={entry.actual_score_home}
                            onChange={(e) => updateEntry(index, 'actual_score_home', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Away Score</Label>
                          <Input
                            type="number"
                            min="0"
                            value={entry.actual_score_away}
                            onChange={(e) => updateEntry(index, 'actual_score_away', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 pt-5">
                        {entry.match_id && (
                          entry.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )
                        )}
                        {entries.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeEntry(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Button variant="outline" className="w-full" onClick={addEntry}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Upload CSV File</Label>
                  <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Or Paste CSV Data</Label>
                <Textarea
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    if (e.target.value.trim()) {
                      parseCSV(e.target.value);
                    }
                  }}
                  placeholder="match_id,home_score,away_score&#10;example-id-1,3,2&#10;example-id-2,1,1"
                  className="h-[150px] font-mono text-sm"
                />
              </div>

              {parseErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-600 mb-2">Parse Warnings:</p>
                  <ul className="text-xs text-amber-500 space-y-1">
                    {parseErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parseErrors.length > 5 && (
                      <li>...and {parseErrors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {entries.length > 0 && entries[0].match_id && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Parsed Entries Preview:</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">{validCount} valid</span>
                    {invalidCount > 0 && <span className="text-amber-600">{invalidCount} invalid</span>}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!results && (
          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validCount > 0 && (
                <Badge variant="outline" className="text-green-600">
                  {validCount} ready to update
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending || validCount === 0}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Update {validCount} Prediction{validCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
