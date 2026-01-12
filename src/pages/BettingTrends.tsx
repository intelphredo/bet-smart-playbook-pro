import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import { BettingTrendsSection } from '@/components/BettingTrends';

export default function BettingTrends() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-8">
        <AppBreadcrumb className="mb-4" />
        
        <BettingTrendsSection />
      </main>
      
      <PageFooter />
    </div>
  );
}
