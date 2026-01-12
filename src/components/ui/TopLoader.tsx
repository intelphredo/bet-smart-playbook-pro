import { useEffect } from "react";

// TopLoader component that shows a loading bar at the top of the page
export const TopLoader = ({ isLoading }: { isLoading: boolean }) => {
  useEffect(() => {
    // Simple implementation without NProgress for now
    if (isLoading) {
      document.body.style.cursor = "progress";
    } else {
      document.body.style.cursor = "default";
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
      <div className="h-full bg-primary animate-pulse" style={{ width: "30%" }} />
    </div>
  );
};

export default TopLoader;
