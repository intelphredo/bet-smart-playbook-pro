import {
  Home,
  Trophy,
  AlertTriangle,
  BarChart2,
  BookOpen,
  Wallet,
  History,
  Settings,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Activity,
  Zap,
  Bell,
  Crown,
  Medal,
  Star,
  Sparkles,
  Check,
  CheckCheck,
  X,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Menu,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  User,
  Users,
  Heart,
  Share2,
  Trash2,
  Edit,
  Save,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Standardized icon sizes
export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// Icon with standardized sizing
interface StyledIconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

export function StyledIcon({ icon: Icon, size = "md", className }: StyledIconProps) {
  const sizeValue = ICON_SIZES[size];
  return <Icon size={sizeValue} className={className} />;
}

// Navigation icons
export const NavIcons = {
  home: Home,
  standings: Trophy,
  injuries: AlertTriangle,
  algorithms: BarChart2,
  scenarios: BookOpen,
  bankroll: Wallet,
  history: History,
  settings: Settings,
} as const;

// Status icons
export const StatusIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
} as const;

// Action icons
export const ActionIcons = {
  save: Save,
  delete: Trash2,
  edit: Edit,
  refresh: RefreshCw,
  reset: RotateCcw,
  add: Plus,
  remove: Minus,
  close: X,
  copy: Copy,
  download: Download,
  upload: Upload,
  share: Share2,
} as const;

// Trend icons
export const TrendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Activity,
} as const;

// Betting-specific icons
export const BettingIcons = {
  target: Target,
  money: DollarSign,
  streak: Zap,
  activity: Activity,
  crown: Crown,
  medal: Medal,
  trophy: Trophy,
  star: Star,
  sparkles: Sparkles,
} as const;

// Notification icons
export const NotificationIcons = {
  bell: Bell,
  check: Check,
  checkDouble: CheckCheck,
  clock: Clock,
} as const;

// Icon color presets based on semantic meaning
export const ICON_COLORS = {
  success: "text-emerald-500",
  error: "text-destructive",
  warning: "text-orange-500",
  info: "text-primary",
  muted: "text-muted-foreground",
  gold: "text-yellow-500",
  purple: "text-purple-500",
  blue: "text-blue-500",
} as const;

// Combined icon + color helper
export function getStatusIcon(status: "success" | "error" | "warning" | "info") {
  const iconMap = {
    success: { icon: CheckCircle, color: ICON_COLORS.success },
    error: { icon: AlertCircle, color: ICON_COLORS.error },
    warning: { icon: AlertTriangle, color: ICON_COLORS.warning },
    info: { icon: Info, color: ICON_COLORS.info },
  };
  return iconMap[status];
}

// Animated icon wrapper
interface AnimatedIconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  animation?: "pulse" | "spin" | "bounce" | "float";
}

export function AnimatedIcon({ 
  icon: Icon, 
  size = "md", 
  className,
  animation 
}: AnimatedIconProps) {
  const sizeValue = ICON_SIZES[size];
  const animationClass = animation ? {
    pulse: "animate-pulse",
    spin: "animate-spin",
    bounce: "animate-bounce",
    float: "animate-float",
  }[animation] : "";
  
  return <Icon size={sizeValue} className={cn(animationClass, className)} />;
}
