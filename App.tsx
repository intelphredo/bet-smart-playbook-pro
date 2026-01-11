import React from "react";
import AppRouter from "@/router/AppRouter";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { QueryPersistence } from "@/providers/QueryPersistence";
import { HelmetProvider } from "react-helmet-async";

const App = () => {
  return (
    <HelmetProvider>
      <ReactQueryProvider>
        <QueryPersistence>
          <AppRouter />
        </QueryPersistence>
      </ReactQueryProvider>
    </HelmetProvider>
  );
};

export default App;
