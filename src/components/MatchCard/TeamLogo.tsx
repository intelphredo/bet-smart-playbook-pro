// src/components/MatchCard/TeamLogo.tsx
// Re-exports the unified TeamLogoImage component for backward compatibility

import { TeamLogoImage } from "@/components/ui/TeamLogoImage";

interface Props {
  team: string;
  logo?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const TeamLogo: React.FC<Props> = ({ team, logo, size = "sm" }) => {
  return <TeamLogoImage teamName={team} logoUrl={logo} size={size} showFallback />;
};

export default TeamLogo;
