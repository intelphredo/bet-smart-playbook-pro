
export const measurePerformance = (fn: (...args: any[]) => any, label?: string) => {
  return (...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (typeof window !== 'undefined') {
      const performanceLog = `[Performance] ${label || fn.name}: ${(end - start).toFixed(2)}ms`;
      console.log(performanceLog);
      
      // Add to global logger if available
      if (window.__BetSmart?.addLog) {
        window.__BetSmart.addLog(performanceLog);
      }
    }
    
    return result;
  };
};

// Decorator for method performance tracking
export function TrackPerformance(label?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const end = performance.now();
      
      const performanceLog = `[Performance] ${target.constructor.name}.${propertyKey}: ${(end - start).toFixed(2)}ms`;
      console.log(performanceLog);
      
      if (typeof window !== 'undefined' && window.__BetSmart?.addLog) {
        window.__BetSmart.addLog(performanceLog);
      }
      
      return result;
    };
    
    return descriptor;
  };
}
