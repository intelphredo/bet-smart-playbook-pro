import React from "react";
import AppRouter from "@/router/AppRouter";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

const App = () => {
  return (
    <ReactQueryProvider>
      <AppRouter />
    </ReactQueryProvider>
  );
};

export default App;
