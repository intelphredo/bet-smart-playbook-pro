import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// TopLoader component that shows a loading bar at the top of the page
export const TopLoader = ({ isLoading }: { isLoading: boolean }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(0);
      
      // Simulate progress
      const timer1 = setTimeout(() => setProgress(30), 100);
      const timer2 = setTimeout(() => setProgress(60), 300);
      const timer3 = setTimeout(() => setProgress(80), 600);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      
      return () => clearTimeout(hideTimer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/10 overflow-hidden">
      <div 
        className={cn(
          "h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-300 ease-out",
          progress === 100 && "opacity-0"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default TopLoader;
