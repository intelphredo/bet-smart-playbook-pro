import { useLocation, Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route configuration with labels and icons
const ROUTE_CONFIG: Record<string, { label: string; parent?: string }> = {
  "/": { label: "Dashboard" },
  "/standings": { label: "Standings", parent: "/" },
  "/injuries": { label: "Injuries", parent: "/" },
  "/algorithms": { label: "Algorithms", parent: "/" },
  "/creator": { label: "Creator Dashboard", parent: "/" },
  "/scenarios": { label: "Scenario Guide", parent: "/" },
  "/bankroll": { label: "Bankroll Manager", parent: "/" },
  "/bet-history": { label: "Bet History", parent: "/" },
  "/settings": { label: "Settings", parent: "/" },
  "/auth": { label: "Sign In" },
};

interface BreadcrumbItem {
  path: string;
  label: string;
  isCurrentPage: boolean;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  
  // Get current route config
  const currentConfig = ROUTE_CONFIG[pathname];
  
  if (!currentConfig) {
    // Unknown route - just show home and current path
    items.push({ path: "/", label: "Dashboard", isCurrentPage: false });
    items.push({ 
      path: pathname, 
      label: pathname.slice(1).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Page", 
      isCurrentPage: true 
    });
    return items;
  }
  
  // Build breadcrumb chain from parent references
  const chain: { path: string; label: string }[] = [];
  let currentPath = pathname;
  
  while (currentPath) {
    const config = ROUTE_CONFIG[currentPath];
    if (config) {
      chain.unshift({ path: currentPath, label: config.label });
      currentPath = config.parent || "";
    } else {
      break;
    }
  }
  
  // Convert to breadcrumb items
  return chain.map((item, index) => ({
    ...item,
    isCurrentPage: index === chain.length - 1,
  }));
}

interface AppBreadcrumbProps {
  /** Additional context to append (e.g., match name, team name) */
  additionalItems?: { label: string; path?: string }[];
  /** Custom class name */
  className?: string;
}

export default function AppBreadcrumb({ additionalItems, className }: AppBreadcrumbProps) {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);
  
  // Don't show breadcrumbs on home page unless there are additional items
  if (location.pathname === "/" && (!additionalItems || additionalItems.length === 0)) {
    return null;
  }
  
  // Combine generated breadcrumbs with additional items
  const allItems = [
    ...breadcrumbs,
    ...(additionalItems?.map((item, index) => ({
      path: item.path || "",
      label: item.label,
      isCurrentPage: index === (additionalItems.length - 1),
    })) || []),
  ];
  
  // Mark the last item as current page
  if (allItems.length > 0) {
    allItems.forEach((item, index) => {
      item.isCurrentPage = index === allItems.length - 1;
    });
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {allItems.map((item, index) => (
          <BreadcrumbItem key={`${item.path}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            
            {item.isCurrentPage ? (
              <BreadcrumbPage className="flex items-center gap-1.5">
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={item.path} className="flex items-center gap-1.5">
                  {index === 0 && <Home className="h-3.5 w-3.5" />}
                  {item.label}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
