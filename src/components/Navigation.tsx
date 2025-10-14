import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NavigationProps {
  userRole?: 'finance' | 'client';
}

const Navigation = ({ userRole }: NavigationProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/f6c3dc2e-d8a5-43f0-9c0c-34da71be0ff2.png" 
            alt="Company Logo" 
            className="h-8 w-auto"
          />
        </div>
        
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold text-foreground">
          Revenue Tracker
        </h1>
        
        <div className="flex items-center gap-4">
          {userRole && (
            <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-muted rounded-md">
              {userRole === 'finance' ? 'Finance Team' : 'Client'}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
