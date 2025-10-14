import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AnalyticsCard from "@/components/AnalyticsCard";
import ValidationTable from "@/components/ValidationTable";
import { mockValidationFiles, mockProjectData, mockRevenueShare } from "@/lib/mockData";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from "lucide-react";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

const FinanceDashboard = () => {
  const navigate = useNavigate();
  
  const totalProjects = mockProjectData.reduce((sum, item) => sum + item.projects, 0);
  const totalRevenue = mockProjectData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="finance" />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Finance Dashboard</h2>
          <p className="text-muted-foreground">Track and analyze revenue performance</p>
        </div>

        {/* Analytics Section */}
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
                <LineChart data={mockProjectData}>
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
                  data={mockRevenueShare}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockRevenueShare.map((entry, index) => (
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
          <ValidationTable 
            data={mockValidationFiles} 
            onViewLeads={() => navigate('/leads')}
          />
        </div>
      </main>
    </div>
  );
};

export default FinanceDashboard;
