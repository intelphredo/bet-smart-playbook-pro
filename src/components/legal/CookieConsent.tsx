import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings, Check, X, Shield, BarChart3, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "edgeiq_cookie_consent";
const COOKIE_PREFERENCES_KEY = "edgeiq_cookie_preferences";

export interface CookiePreferences {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch {
          // Invalid preferences, use defaults
        }
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const updatedPrefs = { ...prefs, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedPrefs));
    setPreferences(updatedPrefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const handleAcceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const togglePreference = (key: keyof Omit<CookiePreferences, "necessary" | "timestamp">) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] p-4 md:p-6"
      >
        <div className="container max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 shadow-2xl bg-card/95 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {!showSettings ? (
                <motion.div
                  key="banner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Icon and Text */}
                      <div className="flex gap-4 flex-1">
                        <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                          <Cookie className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">We Value Your Privacy</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            We use cookies to enhance your browsing experience, analyze site traffic, 
                            and personalize content. By clicking "Accept All", you consent to our use 
                            of cookies. You can customize your preferences or read our{" "}
                            <Link to="/privacy" className="text-primary hover:underline">
                              Privacy Policy
                            </Link>{" "}
                            for more information.
                          </p>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSettings(true)}
                          className="gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Customize
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAcceptNecessary}
                        >
                          Necessary Only
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAcceptAll}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Accept All
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Cookie Preferences
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettings(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-6">
                    {/* Necessary Cookies */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Shield className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <Label className="font-semibold">Necessary Cookies</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Essential for the website to function properly. These cannot be disabled.
                          </p>
                        </div>
                      </div>
                      <Switch checked={true} disabled />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <Label className="font-semibold">Analytics Cookies</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Help us understand how visitors interact with our website to improve user experience.
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={preferences.analytics} 
                        onCheckedChange={() => togglePreference("analytics")}
                      />
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Megaphone className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <Label className="font-semibold">Marketing Cookies</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Used to track visitors across websites to display relevant advertisements.
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={preferences.marketing} 
                        onCheckedChange={() => togglePreference("marketing")}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={handleAcceptNecessary}
                        className="flex-1"
                      >
                        Necessary Only
                      </Button>
                      <Button
                        onClick={handleSavePreferences}
                        className="flex-1 gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save Preferences
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      You can change your preferences at any time.{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Learn more
                      </Link>
                    </p>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to access cookie preferences throughout the app
export function useCookiePreferences(): CookiePreferences {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch {
        // Invalid preferences
      }
    }
  }, []);

  return preferences;
}
