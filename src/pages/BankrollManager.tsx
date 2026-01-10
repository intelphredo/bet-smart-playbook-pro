
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { BankrollDashboard } from "@/components/Bankroll/BankrollDashboard";
import { Wallet } from "lucide-react";

export default function BankrollManager() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bankroll Manager</h1>
            <p className="text-muted-foreground">
              Professional bankroll management with Monte Carlo simulations
            </p>
          </div>
        </div>
        
        <BankrollDashboard />
      </main>
      
      <PageFooter />
    </div>
  );
}
