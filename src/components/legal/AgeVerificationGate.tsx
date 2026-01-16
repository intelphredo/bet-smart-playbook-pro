import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, X, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const AGE_VERIFIED_KEY = "betsmart_age_verified";
const AGE_VERIFIED_TIMESTAMP_KEY = "betsmart_age_verified_at";
const VERIFICATION_EXPIRY_DAYS = 30;

interface AgeVerificationGateProps {
  children: React.ReactNode;
}

export function AgeVerificationGate({ children }: AgeVerificationGateProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if user has previously verified their age
    const verified = localStorage.getItem(AGE_VERIFIED_KEY);
    const verifiedAt = localStorage.getItem(AGE_VERIFIED_TIMESTAMP_KEY);
    
    if (verified === "true" && verifiedAt) {
      const timestamp = parseInt(verifiedAt, 10);
      const now = Date.now();
      const daysSinceVerification = (now - timestamp) / (1000 * 60 * 60 * 24);
      
      // Re-verify if it's been more than 30 days
      if (daysSinceVerification < VERIFICATION_EXPIRY_DAYS) {
        setIsVerified(true);
        return;
      }
    }
    
    setIsVerified(false);
  }, []);

  const handleVerify = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    localStorage.setItem(AGE_VERIFIED_TIMESTAMP_KEY, Date.now().toString());
    setIsVerified(true);
  };

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 500);
  };

  // Still loading verification status
  if (isVerified === null) {
    return null;
  }

  // User is verified, show the app
  if (isVerified) {
    return <>{children}</>;
  }

  const canVerify = hasAgreedToTerms && hasAcknowledgedDisclaimer;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-lg"
        >
          <Card className="border-2 border-primary/30 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Age Verification Required</CardTitle>
              <p className="text-muted-foreground mt-2">
                You must be 18 years or older to access this content
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Warning Banner */}
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-500 mb-1">Important Notice</p>
                    <p className="text-muted-foreground">
                      This is a sports analytics platform providing predictions for 
                      <strong> educational purposes only</strong>. We are not a gambling operator 
                      and do not accept bets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="age-confirm" 
                    checked={hasAgreedToTerms}
                    onCheckedChange={(checked) => setHasAgreedToTerms(checked === true)}
                  />
                  <Label htmlFor="age-confirm" className="text-sm leading-relaxed cursor-pointer">
                    I confirm that I am at least 18 years of age (or the legal age in my jurisdiction) 
                    and agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline" target="_blank">
                      Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="disclaimer-confirm" 
                    checked={hasAcknowledgedDisclaimer}
                    onCheckedChange={(checked) => setHasAcknowledgedDisclaimer(checked === true)}
                  />
                  <Label htmlFor="disclaimer-confirm" className="text-sm leading-relaxed cursor-pointer">
                    I understand that predictions are for entertainment only, no accuracy is guaranteed, 
                    and I am solely responsible for any betting decisions I make
                  </Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  size="lg" 
                  onClick={handleVerify}
                  disabled={!canVerify}
                  className="w-full"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  I Am 18+ - Enter Site
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleExit}
                  className="w-full"
                >
                  <X className="h-5 w-5 mr-2" />
                  I Am Under 18 - Exit
                </Button>
              </div>

              {/* Responsible Gambling Link */}
              <div className="text-center pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  If you or someone you know has a gambling problem, help is available.
                </p>
                <a 
                  href="https://www.ncpgambling.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  National Problem Gambling Helpline: 1-800-522-4700
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
