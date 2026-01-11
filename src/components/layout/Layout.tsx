import React from "react";
import Navigation from "./Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="max-w-4xl mx-auto py-6 px-4">{children}</main>
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
