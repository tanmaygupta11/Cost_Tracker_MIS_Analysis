import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import Login from "./pages/Login";
import FinanceDashboard from "./pages/FinanceDashboard";
import LeadsSchema from "./pages/LeadsSchema";
import ClientDashboard from "./pages/ClientDashboard";
import ClientValidationTable from "./pages/ClientValidationTable";
import ClientLeads from "./pages/ClientLeads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ClientProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/finance-dashboard" element={<FinanceDashboard />} />
            <Route path="/leads" element={<LeadsSchema />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/client-validations" element={<ClientValidationTable />} />
            <Route path="/client-leads" element={<ClientLeads />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ClientProvider>
  </QueryClientProvider>
);

export default App;
