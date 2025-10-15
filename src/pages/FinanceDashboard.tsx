import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AnalyticsCard from "@/components/AnalyticsCard";
import ValidationTable from "@/components/ValidationTable";
import { fetchValidations, formatCurrency } from "@/lib/supabase";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from "lucide-react";
import type { Validation } from "@/lib/supabase";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

// Helper functions to generate chart data from validations
const generateProjectTrends = (validations: Validation[]) => {
  const monthMap = new Map<string, number>();
  
  validations.forEach(validation => {
    if (validation.rev_month) {
      const monthKey = validation.rev_month;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5) // Last 5 months
    .map(([month, count]) => ({
      month: formatMonthForChart(month),
      projects: count
    }));
};

const generateRevenueShare = (validations: Validation[]) => {
  const projectMap = new Map<string, number>();
  
  validations.forEach(validation => {
    if (validation.project_name && validation.revenue) {
      const projectName = validation.project_name;
      projectMap.set(projectName, (projectMap.get(projectName) || 0) + validation.revenue);
    }
  });
  
  return Array.from(projectMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 projects
};

const formatMonthForChart = (monthString: string) => {
  if (!monthString || monthString.trim() === '') {
    return 'Unknown';
  }
  try {
    // Handle both YYYY-MM-DD and YYYY-MM formats
    let dateStr = monthString;
    
    // If it's in YYYY-MM format, add -01 to make it a valid date
    if (monthString.match(/^\d{4}-\d{2}$/)) {
      dateStr = `${monthString}-01`;
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try to extract month from string if possible
      const monthMatch = monthString.match(/(\d{4})-(\d{2})/);
      if (monthMatch) {
        const [, year, month] = monthMatch;
        const fallbackDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        if (!isNaN(fallbackDate.getTime())) {
          return fallbackDate.toLocaleDateString('en-US', { month: 'short' });
        }
      }
      return 'Unknown';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short' });
  } catch (error) {
    return 'Unknown';
  }
};

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch validations data from Supabase
  useEffect(() => {
    const loadValidations = async () => {
      try {
        setLoading(true);
        const { data, error } = await fetchValidations();
        
        if (error) {
          console.error('Error fetching validations:', error);
          setError('Failed to load validation data');
          return;
        }
        
        setValidations(data || []);
      } catch (err) {
        console.error('Error loading validations:', err);
        setError('Failed to load validation data');
      } finally {
        setLoading(false);
      }
    };
    
    loadValidations();
  }, []);
  
  // Calculate analytics from real data
  const totalProjects = validations.length;
  const totalRevenue = validations.reduce((sum, validation) => sum + (validation.revenue || 0), 0);
  const approvedValidations = validations.filter(v => v.validation_status === 'Approved').length;
  const pendingValidations = validations.filter(v => v.validation_status === 'Pending').length;
  
  // Generate chart data from validations
  const projectTrends = generateProjectTrends(validations);
  const revenueShare = generateRevenueShare(validations);

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="finance" />
      
      <main className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-20 pb-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Finance Dashboard</h2>
          <p className="text-muted-foreground">Track and analyze revenue performance</p>
        </div>

        {/* Analytics Section - Side by Side with Equal Sizes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsCard title="Projects in Last 5 Months">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    {totalProjects}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    ₹{(totalRevenue / 10000000).toFixed(2)}Cr
                  </p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={projectTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="projects" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Projects"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Revenue (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Revenue Share (Project-wise)">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={revenueShare}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        </div>

        {/* Validation Files Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-xl font-semibold mb-4">Validation Files</h3>
        {loading ? (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading validation data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        ) : (
          <ValidationTable 
            data={validations} 
          />
        )}
        </div>
      </main>
    </div>
  );
};

export default FinanceDashboard;
