import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Navigation from "@/components/Navigation";
import AnalyticsCard from "@/components/AnalyticsCard";
import ValidationTable from "@/components/ValidationTable";
import { fetchValidations, formatCurrency } from "@/lib/supabase";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from "lucide-react";
import type { Validation } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

// Helper functions to generate chart data from validations
const generateProjectTrends = (validations: Validation[]) => {
  const monthMap = new Map<string, Set<string>>();
  
  validations.forEach(validation => {
    if (validation.rev_month && validation.project_name) {
      // Extract YYYY-MM from YYYY-MM-DD format
      const monthKey = validation.rev_month.substring(0, 7); // Gets "2024-04" from "2024-04-15"
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Set());
      }
      monthMap.get(monthKey)!.add(validation.project_name);
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5) // Last 5 months
    .map(([month, projectSet]) => ({
      month: formatMonthForChart(month),
      projects: projectSet.size
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
  
  // Filter state for Revenue Share chart
  const [dropdownMode, setDropdownMode] = useState<'years' | 'months'>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  // Generate months array for the selected year
  const getMonthsForYear = (year: string) => {
    const months = [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ];
    return months;
  };

  // Dynamic dropdown options based on mode
  const getDropdownOptions = () => {
    if (dropdownMode === 'years') {
      return [
        { value: 'ALL', label: 'All Dates' },
        { value: '2024', label: '2024' },
        { value: '2025', label: '2025' }
      ];
    } else {
      return [
        { value: 'BACK', label: '← Back' },
        ...getMonthsForYear(selectedYear).map(month => ({
          value: month.value,
          label: `${month.label} ${selectedYear}`
        }))
      ];
    }
  };

  // Handle dropdown selection
  const handleDropdownChange = (value: string) => {
    if (dropdownMode === 'years') {
      if (value === 'ALL') {
        // Reset everything
        setSelectedYear('');
        setSelectedMonth('');
        setDropdownMode('years');
        setDropdownOpen(false);
      } else {
        // Year selected, switch to months
        setSelectedYear(value);
        setDropdownMode('months');
        requestAnimationFrame(() => {
          setDropdownOpen(true);
        });
      }
    } else {
      // In months mode
      if (value === 'BACK') {
        setDropdownMode('years');
        requestAnimationFrame(() => {
          setDropdownOpen(true);
        });
      } else {
        // Month selected
        setSelectedMonth(value);
        setDropdownOpen(false);
      }
    }
  };

  // Handle dropdown open/close events
  const handleOpenChange = (open: boolean) => {
    if (!open && dropdownMode === 'months' && selectedYear && !selectedMonth) {
      return; // Don't close
    }
    setDropdownOpen(open);
  };

  // Display text for dropdown trigger
  const getDisplayText = () => {
    if (!selectedYear) return 'All Dates';
    if (!selectedMonth) return selectedYear;
    const monthName = getMonthsForYear(selectedYear).find(m => m.value === selectedMonth)?.label;
    return `${monthName} ${selectedYear}`;
  };
  
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
  
  // Filtered revenue share based on selected month
  const revenueShare = useMemo(() => {
    if (!selectedYear || !selectedMonth) {
      // Show all data when no filter applied
      return generateRevenueShare(validations);
    } else {
      // Filter validations by selected month
      // Database stores rev_month as YYYY-MM-DD, so we need to check if it starts with YYYY-MM
      const selectedMonthPrefix = `${selectedYear}-${selectedMonth}`;
      const filteredValidations = validations.filter(v => 
        v.rev_month && v.rev_month.startsWith(selectedMonthPrefix)
      );
      
      return generateRevenueShare(filteredValidations);
    }
  }, [validations, selectedYear, selectedMonth]);

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
              <ResponsiveContainer width="100%" height={350}>
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

          <AnalyticsCard 
            title="Revenue Share (Project-wise)"
            headerAction={
              <Select 
                value={dropdownMode === 'years' ? selectedYear || 'ALL' : selectedMonth || 'BACK'} 
                onValueChange={handleDropdownChange}
                open={dropdownOpen}
                onOpenChange={handleOpenChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Dates">
                    {getDisplayText()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {getDropdownOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {revenueShare.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-[320px]">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg">No data available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedYear && selectedMonth ? 
                      `No revenue data found for ${getDisplayText()}` : 
                      'No revenue data available'
                    }
                  </p>
                </div>
              </div>
            )}
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
