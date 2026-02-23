import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Scan, CheckCircle, AlertCircle, Loader2,
  X, PiggyBank, Zap, Edit3, Trophy
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSavings } from '@/hooks/useSavings';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ExtractedBet {
  stake: number | null;
  odds: number | null;
  matchTitle: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  league: string | null;
  sportsbook: string | null;
  betType: string | null;
  selection: string | null;
  potentialPayout: number | null;
  confidence: 'high' | 'medium' | 'low';
}

interface BetSlipScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ScanStep = 'upload' | 'scanning' | 'confirm' | 'saving' | 'success';

const SPORTSBOOK_LOGOS: Record<string, string> = {
  fanduel: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/FanDuel_logo.svg/1200px-FanDuel_logo.svg.png',
  draftkings: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/DraftKings_logo.svg/1200px-DraftKings_logo.svg.png',
  betmgm: '',
  caesars: '',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

const LEAGUE_COLORS: Record<string, string> = {
  NBA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NFL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MLB: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  NHL: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  MLS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export function BetSlipScanner({ open, onOpenChange }: BetSlipScannerProps) {
  const { account, calculateSplit, recordContribution, refetch } = useSavings();

  const [step, setStep] = useState<ScanStep>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [extracted, setExtracted] = useState<ExtractedBet | null>(null);
  const [editedStake, setEditedStake] = useState<string>('');
  const [editedMatch, setEditedMatch] = useState<string>('');
  const [editedLeague, setEditedLeague] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setImagePreview(null);
    setImageBase64(null);
    setExtracted(null);
    setEditedStake('');
    setEditedMatch('');
    setEditedLeague('');
    setIsEditing(false);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(reset, 300);
  }, [onOpenChange, reset]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', { description: 'Please upload an image file.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', { description: 'Please upload an image under 10MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Extract base64 without the data URL prefix
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageMimeType(file.type);
      scanBetSlip(base64, file.type);
    };
    reader.readAsDataURL(file);
  }, []);

  const scanBetSlip = useCallback(async (base64: string, mimeType: string) => {
    setStep('scanning');
    try {
      const { data, error } = await supabase.functions.invoke('scan-bet-slip', {
        body: { imageBase64: base64, mimeType },
      });

      if (error) {
        throw new Error(error.message || 'Scan failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Could not read the bet slip');
      }

      const bet = data.data as ExtractedBet;
      setExtracted(bet);
      setEditedStake(bet.stake ? String(bet.stake) : '');
      setEditedMatch(bet.matchTitle || '');
      setEditedLeague(bet.league || '');
      setStep('confirm');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Scan failed', {
        description: msg.includes('Rate limit') ? msg : 'Could not read the bet slip. Please try a clearer image.',
      });
      setStep('upload');
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleConfirmAndSave = useCallback(async () => {
    const stake = parseFloat(editedStake);
    if (isNaN(stake) || stake <= 0) {
      toast.error('Invalid stake', { description: 'Please enter a valid stake amount.' });
      return;
    }

    setStep('saving');
    const split = calculateSplit(stake);
    const matchTitle = editedMatch || extracted?.matchTitle || undefined;
    const league = editedLeague || extracted?.league || undefined;

    const success = await recordContribution(split, undefined, matchTitle, league);

    if (success) {
      setStep('success');
      refetch();
    } else {
      toast.error('Error', { description: 'Could not save contribution.' });
      setStep('confirm');
    }
  }, [editedStake, editedMatch, editedLeague, extracted, calculateSplit, recordContribution, refetch]);

  const stake = parseFloat(editedStake) || 0;
  const split = stake > 0 ? calculateSplit(stake) : null;
  const savingsRate = account?.savings_rate ?? 10;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border border-border/60">
        {/* Header strip */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Scan className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Bet Slip Scanner</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Snap your sportsbook screenshot</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5 pt-4">
          <AnimatePresence mode="wait">

            {/* STEP: Upload */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div
                  className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop your bet slip here</p>
                      <p className="text-xs text-muted-foreground mt-0.5">or click to browse files</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Gallery
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </Button>
                </div>

                {/* How it works */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/20 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">How it works</p>
                  {[
                    'Upload a screenshot from FanDuel, DraftKings, BetMGM, etc.',
                    'AI reads your stake, match, and odds automatically',
                    'Confirm the details and your savings are logged instantly',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </motion.div>
            )}

            {/* STEP: Scanning */}
            {step === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {imagePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-border/40">
                    <img src={imagePreview} alt="Bet slip" className="w-full max-h-52 object-contain bg-muted/30" />
                    <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-3">
                      <div className="relative">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <Scan className="h-5 w-5 text-primary absolute inset-0 m-auto" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold">Scanning bet slip…</p>
                        <p className="text-xs text-muted-foreground mt-0.5">AI is reading your wager details</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Animated scan lines */}
                <div className="space-y-2">
                  {['Detecting sportsbook...', 'Reading stake amount...', 'Identifying match...'].map((label, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.3 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      {label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP: Confirm */}
            {step === 'confirm' && extracted && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Confidence badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {extracted.confidence === 'high' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium">
                      {extracted.confidence === 'high' ? 'Scan successful' : 'Verify the details'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      extracted.confidence === 'high'
                        ? 'border-emerald-500/40 text-emerald-500'
                        : 'border-amber-500/40 text-amber-500'
                    )}>
                      {extracted.confidence} confidence
                    </Badge>
                    {extracted.sportsbook && (
                      <Badge variant="outline" className="text-xs border-border/50">
                        {extracted.sportsbook}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Extracted fields */}
                <div className="rounded-xl border border-border/40 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-border/40">
                    {/* Stake field */}
                    <div className="p-3">
                      <Label className="text-xs text-muted-foreground">Stake Amount</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={editedStake}
                          onChange={(e) => setEditedStake(e.target.value)}
                          className="h-8 text-sm font-semibold border-0 p-0 focus-visible:ring-0 bg-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {/* Odds */}
                    <div className="p-3">
                      <Label className="text-xs text-muted-foreground">Odds</Label>
                      <p className="text-sm font-semibold mt-1">
                        {extracted.odds != null
                          ? (extracted.odds > 0 ? `+${extracted.odds}` : String(extracted.odds))
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-border/40 p-3 space-y-2.5">
                    {/* Match */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Match</Label>
                      <Input
                        value={editedMatch}
                        onChange={(e) => setEditedMatch(e.target.value)}
                        className="h-8 mt-1 text-sm"
                        placeholder="Team A vs Team B"
                      />
                    </div>
                    {/* League & selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">League</Label>
                        <Input
                          value={editedLeague}
                          onChange={(e) => setEditedLeague(e.target.value)}
                          className="h-8 mt-1 text-sm"
                          placeholder="NBA"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Bet Type</Label>
                        <p className="text-sm font-medium mt-2 capitalize">{extracted.betType || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Split Preview */}
                {split && split.savingsAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-xl bg-primary/8 border border-primary/25"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <PiggyBank className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">Savings Split ({savingsRate}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                        <div className="text-[10px] text-muted-foreground">🏦 Vault</div>
                        <div className="text-sm font-bold text-primary">{formatCurrency(split.savingsAmount)}</div>
                      </div>
                      <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 p-2 rounded-lg bg-background border border-border/40 text-center">
                        <div className="text-[10px] text-muted-foreground">🎲 Wagered</div>
                        <div className="text-sm font-bold">{formatCurrency(split.actualWager)}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {split && split.savingsAmount === 0 && (
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-600 dark:text-yellow-400">
                    Savings is currently paused or set to 0%. Enable it in the vault settings to start saving.
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
                    Rescan
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={handleConfirmAndSave}
                    disabled={!editedStake || parseFloat(editedStake) <= 0}
                  >
                    <PiggyBank className="h-3.5 w-3.5" />
                    Log & Save
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP: Saving */}
            {step === 'saving' && (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Logging contribution…</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Adding to your savings vault</p>
                </div>
              </motion.div>
            )}

            {/* STEP: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center"
                >
                  <CheckCircle className="h-9 w-9 text-primary" />
                </motion.div>
                <div>
                  <p className="text-base font-bold">Saved! 🎉</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {split ? formatCurrency(split.savingsAmount) : ''} added to your vault
                  </p>
                  {editedMatch && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px] mx-auto">
                      {editedMatch}
                    </p>
                  )}
                </div>
                {split && (
                  <div className="w-full p-3.5 rounded-xl bg-primary/8 border border-primary/25">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stake</span>
                      <span className="font-semibold">{formatCurrency(split.originalStake)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1.5">
                      <span className="text-muted-foreground">Vault contribution</span>
                      <span className="font-semibold text-primary">+{formatCurrency(split.savingsAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1.5">
                      <span className="text-muted-foreground">Amount wagered</span>
                      <span className="font-semibold">{formatCurrency(split.actualWager)}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
                    Scan Another
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
