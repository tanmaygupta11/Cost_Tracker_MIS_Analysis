import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BarChart3, User, ArrowLeft } from "lucide-react";
// Removed client login; client context not needed here anymore
// import { useClient } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";

type Role = 'finance' | 'admin' | null;

const Login = () => {
  const navigate = useNavigate();
  // const { setClient } = useClient();
  const { login } = useAuth();
  
  // State management
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handle role selection - show login form
  const handleRoleSelection = (role: 'finance' | 'admin') => {
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
      if (email === 'finance.team@awign.com' && password === 'finance@303') {
        login('finance');
        navigate('/mis-dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } else if (selectedRole === 'admin') {
      // Demo admin creds
      if (email === 'awign.admin@awign.com' && password === 'admin@303') {
        login('admin');
        navigate('/admin-dashboard');
      } else {
        setError('Invalid admin credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/BG.png')`,
        }}
      ></div>
      
      {/* Overlay for better card visibility */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-md relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img 
              src="/images/tablogo.png" 
              alt="Revenue Tracker Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">MIS Analytics</CardTitle>
          <CardDescription>
            {!showLoginForm 
              ? 'Select your role to continue' 
              : `Login as ${selectedRole === 'finance' ? 'Finance Team' : selectedRole === 'admin' ? 'Admin' : 'Client'}`
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
                onClick={() => handleRoleSelection('admin')}
                className="w-full h-12 text-base gap-2"
                variant="outline"
                size="lg"
              >
                <User className="h-5 w-5" />
                Login as Admin
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
                  placeholder={selectedRole === 'admin' ? 'Enter admin email' : 'Enter your email'}
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

          {/* Removed sample credentials block as per requirement */}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
