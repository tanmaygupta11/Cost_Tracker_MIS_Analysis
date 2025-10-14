import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BarChart3, User } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const handleFinanceLogin = () => {
    navigate('/finance-dashboard');
  };

  const handleClientLogin = () => {
    navigate('/client-dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
              <BarChart3 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Revenue Tracker</CardTitle>
          <CardDescription>Select your role to continue</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={handleFinanceLogin}
            className="w-full h-12 text-base gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            size="lg"
          >
            <BarChart3 className="h-5 w-5" />
            Login as Finance Team
          </Button>
          
          <Button 
            onClick={handleClientLogin}
            className="w-full h-12 text-base gap-2"
            variant="outline"
            size="lg"
          >
            <User className="h-5 w-5" />
            Login as Client
          </Button>

          <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">Use sample credentials for now:</p>
            <p>Finance → finance@demo.com / demo123</p>
            <p>Client → client@demo.com / demo123</p>
            <p className="mt-2 text-xs italic">I'll integrate real Supabase Auth later.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
