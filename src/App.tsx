import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import FinanceDashboard from "./pages/FinanceDashboard";
import LeadsSchema from "./pages/LeadsSchema";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { role } = useAuth();
  // If no role, redirect to login
  if (!role) {
    return <Login />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ClientProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/mis-dashboard" element={<RequireAuth><FinanceDashboard /></RequireAuth>} />
              <Route path="/admin-dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
              <Route path="/leads" element={<RequireAuth><LeadsSchema /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </ClientProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
