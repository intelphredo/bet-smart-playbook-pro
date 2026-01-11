// src/components/match/OddsMovement.tsx

import React, { useEffect, useRef, useState } from "react";

interface Props {
  current: number;
}

export const OddsMovement: React.FC<Props> = ({ current }) => {
  const prev = useRef<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prev.current !== null) {
      if (current > prev.current) setDirection("up");
      else if (current < prev.current) setDirection("down");
    }
    prev.current = current;
  }, [current]);

  if (!direction) return null;

  return (
    <span
      className={`text-xs ml-2 ${
        direction === "up" ? "text-green-600" : "text-red-600"
      }`}
    >
      {direction === "up" ? "▲" : "▼"}
    </span>
  );
};

export default OddsMovement;
