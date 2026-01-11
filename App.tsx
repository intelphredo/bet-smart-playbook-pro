import React from "react";
import AppRouter from "@/router/AppRouter";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { QueryPersistence } from "@/providers/QueryPersistence";

const App = () => {
  return (
    <ReactQueryProvider>
      <QueryPersistence>
        <AppRouter />
      </QueryPersistence>
    </ReactQueryProvider>
  );
};

export default App;
