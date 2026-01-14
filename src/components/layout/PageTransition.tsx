import { motion, type Easing } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const easeOut: Easing = [0.25, 0.46, 0.45, 0.94];
const easeIn: Easing = [0.55, 0.055, 0.675, 0.19];

const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.3,
          ease: easeOut,
        }
      }}
      exit={{ 
        opacity: 0, 
        y: -8,
        transition: {
          duration: 0.2,
          ease: easeIn,
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedSection = ({ 
  children, 
  className,
  delay = 0 
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.4,
          delay,
          ease: easeOut,
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
