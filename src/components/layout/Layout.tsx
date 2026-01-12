import React from "react";
import { useIsFetching } from "@tanstack/react-query";
import { TopLoader } from "@/components/ui/TopLoader";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isFetching = useIsFetching() > 0;

  return (
    <div className="min-h-screen bg-background">
      <TopLoader isLoading={isFetching} />
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
