import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, AlertTriangle, ExternalLink, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Countries/regions where online gambling-related content may be restricted
// This is a simplified list - consult legal counsel for comprehensive coverage
const RESTRICTED_REGIONS = [
  // Countries with strict gambling restrictions
  { code: "CN", name: "China" },
  { code: "KP", name: "North Korea" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "BN", name: "Brunei" },
  { code: "ID", name: "Indonesia" },
  // US States with strict regulations (would need IP geolocation service for accuracy)
];

const RESTRICTED_COUNTRY_CODES = RESTRICTED_REGIONS.map(r => r.code);

const GEO_BLOCKED_KEY = "edgeiq_geo_status";
const GEO_CHECK_EXPIRY_HOURS = 24;

interface GeoBlockerProps {
  children: React.ReactNode;
}

interface GeoStatus {
  checked: boolean;
  blocked: boolean;
  country?: string;
  countryCode?: string;
  timestamp: number;
}

export function GeoBlocker({ children }: GeoBlockerProps) {
  const [geoStatus, setGeoStatus] = useState<GeoStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkGeoLocation();
  }, []);

  const checkGeoLocation = async () => {
    // Check cache first
    const cached = localStorage.getItem(GEO_BLOCKED_KEY);
    if (cached) {
      try {
        const cachedStatus: GeoStatus = JSON.parse(cached);
        const hoursSinceCheck = (Date.now() - cachedStatus.timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceCheck < GEO_CHECK_EXPIRY_HOURS) {
          setGeoStatus(cachedStatus);
          setIsLoading(false);
          return;
        }
      } catch {
        // Invalid cache, continue with fresh check
      }
    }

    try {
      // Use a free geolocation API
      // In production, consider using a more reliable paid service
      const response = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error("Failed to determine location");
      }

      const data = await response.json();
      const countryCode = data.country_code;
      const country = data.country_name;
      
      const isBlocked = RESTRICTED_COUNTRY_CODES.includes(countryCode);
      
      const status: GeoStatus = {
        checked: true,
        blocked: isBlocked,
        country,
        countryCode,
        timestamp: Date.now()
      };

      localStorage.setItem(GEO_BLOCKED_KEY, JSON.stringify(status));
      setGeoStatus(status);
    } catch (err) {
      // If geolocation fails, allow access but log the error
      console.warn("Geolocation check failed:", err);
      setError("Unable to verify location");
      
      const status: GeoStatus = {
        checked: true,
        blocked: false,
        timestamp: Date.now()
      };
      setGeoStatus(status);
    } finally {
      setIsLoading(false);
    }
  };

  // Still loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Globe className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  // User is blocked
  if (geoStatus?.blocked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-destructive/30">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-destructive/10 rounded-full w-fit mb-4">
                <MapPin className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">Service Not Available</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-3 text-left">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Access Restricted</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      EdgeIQ is not available in{" "}
                      <strong>{geoStatus.country || "your region"}</strong> due to local 
                      regulations regarding gambling-related content.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                We apologize for any inconvenience. This restriction is in place to comply 
                with local laws and regulations in your jurisdiction.
              </p>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">
                  If you believe this is an error, please contact support.
                </p>
                <Button variant="outline" asChild>
                  <a 
                    href="mailto:support@edgeiq.app"
                    className="inline-flex items-center gap-2"
                  >
                    Contact Support
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // User is allowed
  return <>{children}</>;
}
