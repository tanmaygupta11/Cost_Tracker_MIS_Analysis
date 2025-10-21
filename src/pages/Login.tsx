import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BarChart3, User, ArrowLeft } from "lucide-react";
import { useClient } from "@/contexts/ClientContext";

type Role = 'finance' | 'client' | null;

const Login = () => {
  const navigate = useNavigate();
  const { setClient } = useClient();
  
  // State management
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handle role selection - show login form
  const handleRoleSelection = (role: 'finance' | 'client') => {
    setSelectedRole(role);
    setShowLoginForm(true);
    setEmail('');
    setPassword('');
    setError('');
  };

  // Handle back button - return to role selection
  const handleBack = () => {
    setShowLoginForm(false);
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  // Handle login form submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    // Validate credentials based on selected role
    if (selectedRole === 'finance') {
      if (email === 'finance@demo.com' && password === 'demo123') {
        navigate('/finance-dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } else if (selectedRole === 'client') {
      if (email === 'client@demo.com' && password === 'demo123') {
        // Client login: Show BlackBuck customer data (C137)
        setClient('C137', 'BlackBuck');
        navigate('/client-dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img 
              src="/images/tablogo.png" 
              alt="Revenue Tracker Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Revenue Tracker</CardTitle>
          <CardDescription>
            {!showLoginForm 
              ? 'Select your role to continue' 
              : `Login as ${selectedRole === 'finance' ? 'Finance Team' : 'Client'}`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!showLoginForm ? (
            // ROLE SELECTION BUTTONS
            <>
              <Button 
                onClick={() => handleRoleSelection('finance')}
                className="w-full h-12 text-base gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                size="lg"
              >
                <BarChart3 className="h-5 w-5" />
                Login as Finance Team
              </Button>
              
              <Button 
                onClick={() => handleRoleSelection('client')}
                className="w-full h-12 text-base gap-2"
                variant="outline"
                size="lg"
              >
                <User className="h-5 w-5" />
                Login as Client
              </Button>
            </>
          ) : (
            // LOGIN FORM
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-11"
                />
              </div>
              
              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  className="flex-1 h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  Login
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  className="h-11"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </form>
          )}

          {/* Sample Credentials - Always Visible */}
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
