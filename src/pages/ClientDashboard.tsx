import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AnalyticsCard from "@/components/AnalyticsCard";
import { fetchValidations, formatCurrency, formatRevenueMonth, getStatusBadge } from "@/lib/supabase";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, DollarSign, Eye, FolderOpen, Clock } from "lucide-react";
import type { Validation } from "@/lib/supabase";
import { useClient } from "@/contexts/ClientContext";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

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

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { customerId, customerName } = useClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination setup
  const recordsPerPage = 5;
  
  // Fetch validations data from Supabase (filtered by client's customer)
  useEffect(() => {
    const loadValidations = async () => {
      try {
        setLoading(true);
        
        // Fetch all validations first
        const { data, error } = await fetchValidations();
        
        if (error) {
          console.error('Error fetching validations:', error);
          setError('Failed to load validation data');
          return;
        }
        
        // Filter data based on client context
        let filteredData = data || [];
        
        // If logged in with client@demo.com, filter to show only ROX customer data
        if (customerName === 'ROX') {
          filteredData = (data || []).filter(validation => 
            validation.customer_name && validation.customer_name.toLowerCase().includes('rox')
          );
        } else if (customerId) {
          // For other clients, filter by customer_id
          filteredData = (data || []).filter(validation => 
            validation.customer_id === customerId
          );
        }
        
        setValidations(filteredData);
      } catch (err) {
        console.error('Error loading validations:', err);
        setError('Failed to load validation data');
      } finally {
        setLoading(false);
      }
    };
    
    loadValidations();
  }, [customerId, customerName]);
  
  // Calculate analytics from real data
  const totalProjects = validations.length;
  const totalRevenue = validations.reduce((sum, validation) => sum + (validation.revenue || 0), 0);
  const approvedValidations = validations.filter(v => v.validation_status === 'Approved').length;
  const pendingValidations = validations.filter(v => v.validation_status === 'Pending').length;
  
  // Generate chart data from validations
  const projectTrends = generateProjectTrends(validations);
  const revenueShare = generateRevenueShare(validations);
  const totalPages = Math.ceil(validations.length / recordsPerPage);
  
  // Calculate paginated validations
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const recentValidations = validations.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'Approved': 'default',
      'Pending': 'secondary',
      'Rejected': 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="client" />
      
      <main className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-20 pb-8">
        {/* Main Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Client Dashboard</h2>
          <p className="text-muted-foreground">Track your projects and revenue</p>
        </div>

        {/* Summary Analytics Section - Top 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-foreground">{totalProjects}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{(totalRevenue / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved Validations</p>
                <p className="text-3xl font-bold text-foreground">{approvedValidations}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Validations</p>
                <p className="text-3xl font-bold text-foreground">{pendingValidations}</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Side by Side with Equal Sizes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Projects over last 5 months (Bar Chart) */}
          <AnalyticsCard title="Projects Over Last 5 Months">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {projectTrends.reduce((sum, item) => sum + item.projects, 0)}
                  </p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectTrends}>
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
                  <Bar 
                    dataKey="projects" 
                    fill="hsl(var(--primary))" 
                    name="Projects"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>

          {/* Chart 2: Revenue Share by Project (Pie Chart) */}
          <AnalyticsCard title="Revenue Share by Project">
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

        {/* Validation Files Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Your Validation Files</h3>
            <p className="text-sm text-muted-foreground mt-1">Click "View Leads" on any row to see project-specific leads</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading validation data...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card w-full overflow-x-auto lg:overflow-x-visible table-container">
            <Table className="w-full min-w-max table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Sl No</TableHead>
                  <TableHead>Validation File ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Revenue Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Revenue (₹)</TableHead>
                  <TableHead>Approval Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentValidations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <p className="text-muted-foreground text-lg">No validations found for your account.</p>
                      <p className="text-sm text-muted-foreground mt-2">Check back later for updates.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentValidations.map((validation) => (
                    <TableRow key={validation.validation_file_id}>
                      <TableCell>{validation.sl_no}</TableCell>
                      <TableCell className="font-mono text-sm">{validation.validation_file_id}</TableCell>
                      <TableCell>{validation.customer_name}</TableCell>
                      <TableCell className="font-mono text-sm">{validation.customer_id}</TableCell>
                      <TableCell className="font-medium">{validation.project_name}</TableCell>
                      <TableCell className="font-mono text-sm">{validation.project_id}</TableCell>
                      <TableCell>{formatRevenueMonth(validation.rev_month)}</TableCell>
                      <TableCell>
                        {getStatusBadge(validation.validation_status)}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(validation.revenue)}</TableCell>
                      <TableCell>{validation.validation_approval_at || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => navigate(`/client-leads?customer_id=${validation.customer_id}&project_id=${validation.project_id}`)}
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-xl hover:opacity-90 transition-opacity"
                        >
                          <Eye className="h-4 w-4" />
                          View Leads
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {validations.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, validations.length)} of {validations.length} validations
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="rounded-xl min-w-[40px]"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
