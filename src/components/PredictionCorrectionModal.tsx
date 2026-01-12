import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlgorithmPrediction } from '@/hooks/useAlgorithmAccuracy';
import { useCorrectPrediction } from '@/hooks/useCorrectPrediction';
import { Loader2, Save, AlertTriangle } from 'lucide-react';

interface PredictionCorrectionModalProps {
  prediction: AlgorithmPrediction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PredictionCorrectionModal({
  prediction,
  open,
  onOpenChange,
}: PredictionCorrectionModalProps) {
  const { mutate: correctPrediction, isPending } = useCorrectPrediction();

  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [status, setStatus] = useState<'pending' | 'win' | 'loss'>('pending');
  const [confidence, setConfidence] = useState('');

  // Reset form when prediction changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && prediction) {
      setHomeScore(prediction.actualScoreHome?.toString() || '');
      setAwayScore(prediction.actualScoreAway?.toString() || '');
      setStatus(prediction.status === 'won' ? 'win' : prediction.status === 'lost' ? 'loss' : 'pending');
      setConfidence(prediction.confidence?.toString() || '');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!prediction) return;

    const updates: Record<string, unknown> = { id: prediction.id };

    if (homeScore !== '' && awayScore !== '') {
      updates.actual_score_home = parseInt(homeScore, 10);
      updates.actual_score_away = parseInt(awayScore, 10);
    }

    if (status !== 'pending') {
      updates.status = status;
    }

    if (confidence !== '' && parseInt(confidence, 10) !== prediction.confidence) {
      updates.confidence = parseInt(confidence, 10);
    }

    correctPrediction(updates as any, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!prediction) return null;

  const hasChanges =
    (homeScore !== '' && homeScore !== prediction.actualScoreHome?.toString()) ||
    (awayScore !== '' && awayScore !== prediction.actualScoreAway?.toString()) ||
    (status !== 'pending' && status !== (prediction.status === 'won' ? 'win' : prediction.status === 'lost' ? 'loss' : 'pending')) ||
    (confidence !== '' && parseInt(confidence, 10) !== prediction.confidence);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Correct Prediction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prediction Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{prediction.league}</Badge>
              <Badge
                className={
                  prediction.status === 'won'
                    ? 'bg-green-500/20 text-green-600'
                    : prediction.status === 'lost'
                    ? 'bg-red-500/20 text-red-600'
                    : ''
                }
                variant={prediction.status === 'pending' ? 'outline' : 'default'}
              >
                {prediction.status}
              </Badge>
            </div>
            <p className="text-sm font-medium">{prediction.prediction}</p>
            <p className="text-xs text-muted-foreground">
              Match ID: {prediction.matchId}
            </p>
            {prediction.projectedScoreHome !== null && prediction.projectedScoreAway !== null && (
              <p className="text-xs text-muted-foreground">
                Projected: {prediction.projectedScoreHome} - {prediction.projectedScoreAway}
              </p>
            )}
          </div>

          {/* Actual Scores */}
          <div className="space-y-2">
            <Label>Actual Scores</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Home</Label>
                <Input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  placeholder="Home score"
                />
              </div>
              <span className="text-lg font-bold mt-5">-</span>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Away</Label>
                <Input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  placeholder="Away score"
                />
              </div>
            </div>
          </div>

          {/* Manual Status Override */}
          <div className="space-y-2">
            <Label>Status Override (optional)</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-calculate from scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending (auto-calculate)</SelectItem>
                <SelectItem value="win">Win</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Leave as "Pending" to auto-calculate from scores
            </p>
          </div>

          {/* Confidence Adjustment */}
          <div className="space-y-2">
            <Label>Confidence (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              placeholder={prediction.confidence?.toString() || 'Enter confidence'}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !hasChanges}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
