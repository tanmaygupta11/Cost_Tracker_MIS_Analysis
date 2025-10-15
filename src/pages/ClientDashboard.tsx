import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AnalyticsCard from "@/components/AnalyticsCard";
import { mockValidationFiles, mockProjectData } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp, CheckCircle, DollarSign, Eye } from "lucide-react";

const ClientDashboard = () => {
  const navigate = useNavigate();
  // Filter data for a specific client (e.g., 'Tech Solutions Inc')
  const clientData = mockValidationFiles.filter(v => v.customerName === 'Tech Solutions Inc');
  
  const activeProjects = new Set(clientData.map(v => v.projectId)).size;
  const totalRevenue = clientData.reduce((sum, v) => v.validationStatus === 'Approved' ? sum + v.revenue : sum, 0);
  const approvedValidations = clientData.filter(v => v.validationStatus === 'Approved').length;

  // Monthly revenue trend for this client
  const clientMonthlyData = mockProjectData.map(month => ({
    month: month.month,
    revenue: Math.floor(month.revenue * 0.3) // Simulating client's portion
  }));

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'Approved': 'default',
      'Pending': 'secondary',
      'Rejected': 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="client" />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Client Dashboard</h2>
          <p className="text-muted-foreground">Track your projects and revenue</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-foreground">{activeProjects}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-primary">₹{(totalRevenue / 100000).toFixed(1)}L</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
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
        </div>

        {/* Monthly Revenue Trend */}
        <div className="mb-8">
          <AnalyticsCard title="Monthly Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={clientMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        </div>

        {/* Validation Files Table */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Your Validation Files</h3>
            <Button onClick={() => navigate("/client-validations")} className="gap-2">
              <Eye className="h-4 w-4" />
              View All Leads
            </Button>
          </div>
          
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Revenue Month</TableHead>
                  <TableHead>Validation Status</TableHead>
                  <TableHead>Revenue (₹)</TableHead>
                  <TableHead>Approval Date</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientData.map((validation) => (
                  <TableRow key={validation.id}>
                    <TableCell className="font-medium">{validation.projectName}</TableCell>
                    <TableCell>{validation.revenueMonth}</TableCell>
                    <TableCell>{getStatusBadge(validation.validationStatus)}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{validation.revenue.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{validation.validationApprovalAt}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
