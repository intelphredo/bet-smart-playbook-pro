import { useIsFetching } from "@tanstack/react-query";
import { TopLoader } from "@/components/ui/TopLoader";

const Layout = ({ children }) => {
  const isFetching = useIsFetching() > 0;

  return (
    <>
      <TopLoader isLoading={isFetching} />
      {/* existing layout */}
    </>
  );
};
