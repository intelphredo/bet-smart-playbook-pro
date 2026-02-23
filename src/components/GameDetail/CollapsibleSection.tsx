import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** Hide the collapsible on desktop, always show content */
  desktopAlwaysOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
  desktopAlwaysOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      {/* Mobile: collapsible toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full py-3 px-1 text-left",
          desktopAlwaysOpen && "md:hidden"
        )}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Mobile: animated collapse */}
      <div className={cn(desktopAlwaysOpen && "md:block", !desktopAlwaysOpen && "")}>
        {desktopAlwaysOpen && (
          <div className="hidden md:block">{children}</div>
        )}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={cn("overflow-hidden", desktopAlwaysOpen && "md:hidden")}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
        {!desktopAlwaysOpen && !isOpen && (
          <div className="hidden" />
        )}
      </div>
    </div>
  );
};

export default CollapsibleSection;
