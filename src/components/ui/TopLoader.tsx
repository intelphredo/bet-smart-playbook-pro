import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

export const TopLoader = ({ isLoading }: { isLoading: boolean }) => {
  useEffect(() => {
    if (isLoading) NProgress.start();
    else NProgress.done();
  }, [isLoading]);

  return null;
};
