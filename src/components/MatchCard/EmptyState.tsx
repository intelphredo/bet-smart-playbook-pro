// src/components/match/EmptyState.tsx

import React from "react";

interface Props {
  message: string;
}

export const EmptyState: React.FC<Props> = ({ message }) => {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
