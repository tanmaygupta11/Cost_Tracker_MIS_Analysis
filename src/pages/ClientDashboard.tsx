// ✅ Using mock data for now — Supabase integration to be added later
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AnalyticsCard from "@/components/AnalyticsCard";
import { dashboardSummary, projectTrends, revenueData, validationFiles } from "@/lib/clientMockData";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, DollarSign, Eye, FolderOpen, Clock } from "lucide-react";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Pagination setup
  const recordsPerPage = 5;
  const totalPages = Math.ceil(validationFiles.length / recordsPerPage);
  
  // Calculate paginated validations
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const recentValidations = validationFiles.slice(startIndex, endIndex);

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
      
      <main className="container mx-auto px-4 pt-20 pb-8">
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
                <p className="text-3xl font-bold text-foreground">{dashboardSummary.totalProjects}</p>
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
                  ₹{(dashboardSummary.totalRevenue / 100000).toFixed(1)}L
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
                <p className="text-3xl font-bold text-foreground">{dashboardSummary.approvedValidations}</p>
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
                <p className="text-3xl font-bold text-foreground">{dashboardSummary.pendingValidations}</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Side by Side */}
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
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Your Validation Files</h3>
            <Button 
              onClick={() => navigate("/client-validations")} 
              className="gap-2 rounded-xl hover:opacity-90 transition-opacity bg-gradient-to-r from-primary to-accent"
            >
              <Eye className="h-4 w-4" />
              View All Leads
            </Button>
          </div>
          
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentValidations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
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
                      <TableCell>{validation.revenue_month}</TableCell>
                      <TableCell>{getStatusBadge(validation.validation_status)}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{validation.revenue.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {validation.validation_approval_at || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {validationFiles.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, validationFiles.length)} of {validationFiles.length} validations
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
      </main>
    </div>
  );
};

export default ClientDashboard;
