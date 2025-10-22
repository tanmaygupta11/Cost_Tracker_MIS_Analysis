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

// Custom label renderer with callout arrow for Pie slices
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 8) * cos;
  const sy = cy + (outerRadius + 8) * sin;
  const mx = cx + (outerRadius + 18) * cos;
  const my = cy + (outerRadius + 18) * sin;
  const ex = mx + (cos >= 0 ? 12 : -12);
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const label = `${name}: ${(percent * 100).toFixed(0)}%`;
  
  // Arrow head points
  const arrowHeadSize = 4;
  const arrowHead1x = ex + (cos >= 0 ? -arrowHeadSize : arrowHeadSize);
  const arrowHead1y = ey - arrowHeadSize;
  const arrowHead2x = ex + (cos >= 0 ? -arrowHeadSize : arrowHeadSize);
  const arrowHead2y = ey + arrowHeadSize;
  
  return (
    <g>
      {/* Main arrow line */}
      <polyline 
        points={`${sx},${sy} ${mx},${my} ${ex},${ey}`} 
        stroke="#374151" 
        strokeWidth="2"
        fill="none" 
      />
      {/* Arrow head */}
      <polygon 
        points={`${ex},${ey} ${arrowHead1x},${arrowHead1y} ${arrowHead2x},${arrowHead2y}`}
        fill="#374151"
      />
      {/* Label text */}
      <text 
        x={ex + (cos >= 0 ? 8 : -8)} 
        y={ey} 
        textAnchor={textAnchor} 
        dominantBaseline="central" 
        className="text-sm font-medium fill-gray-700"
      >
        {label}
      </text>
    </g>
  );
};

// Helper function to extract YYYY-MM format from date string
const extractYearMonth = (dateString: string | null): string | null => {
  if (!dateString) return null;
  
  try {
    // Parse the date and extract YYYY-MM with leading zeros
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    return null;
  }
};

// Helper functions to generate chart data from validations
const generateMonthlyRevenue = (validations: Validation[]) => {
  const monthMap = new Map<string, number>();
  
  validations.forEach(validation => {
    if (validation.rev_month && validation.revenue) {
      // Extract YYYY-MM format consistently
      const monthKey = extractYearMonth(validation.rev_month);
      if (monthKey) {
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + validation.revenue);
      }
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, totalRevenue]) => ({
      month: formatMonthForChart(month),
      revenue: totalRevenue
    }));
};

const generateRevenueShare = (validations: Validation[]) => {
  const lobMap = new Map<string, number>();
  
  validations.forEach(validation => {
    // Ignore NULL or empty LOB values
    if (validation.LOB && validation.LOB.trim() !== '' && validation.revenue) {
      const lob = validation.LOB;
      lobMap.set(lob, (lobMap.get(lob) || 0) + validation.revenue);
    }
  });
  
  return Array.from(lobMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 LOBs
};

const generateCustomerCountByMonth = (validations: Validation[]) => {
  const monthMap = new Map<string, Set<string>>();
  
  validations.forEach(validation => {
    if (validation.rev_month && validation.customer_id) {
      const monthKey = extractYearMonth(validation.rev_month);
      
      if (monthKey) {
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, new Set());
        }
        
        // Add customer_id to the Set (automatically handles uniqueness)
        monthMap.get(monthKey)!.add(validation.customer_id);
      }
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, customerSet]) => ({
      month: formatMonthForChart(month),
      customers: customerSet.size
    }));
};

const generateProjectCountByMonth = (validations: Validation[]) => {
  const monthMap = new Map<string, Set<string>>();
  
  validations.forEach(validation => {
    if (validation.rev_month && validation.project_id) {
      const monthKey = extractYearMonth(validation.rev_month);
      
      if (monthKey) {
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, new Set());
        }
        
        // Add project_id to the Set (automatically handles uniqueness)
        monthMap.get(monthKey)!.add(validation.project_id);
      }
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, projectSet]) => ({
      month: formatMonthForChart(month),
      projects: projectSet.size
    }));
};

const generateIncompleteFilesByMonth = (validations: Validation[]) => {
  const monthMap = new Map<string, number>();
  
  validations.forEach(validation => {
    if (validation.rev_month) {
      const monthKey = extractYearMonth(validation.rev_month);
      
      // Count as incomplete if Validation_completed is "Incomplete"
      const isIncomplete = validation.Validation_completed === 'Incomplete';
      
      if (monthKey && isIncomplete) {
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      }
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, count]) => ({
      month: formatMonthForChart(month),
      incomplete: count
    }));
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
          const shortMonth = fallbackDate.toLocaleDateString('en-US', { month: 'short' });
          const shortYear = fallbackDate.getFullYear().toString().slice(-2);
          return `${shortMonth} ${shortYear}`;
        }
      }
      return 'Unknown';
    }
    
    const shortMonth = date.toLocaleDateString('en-US', { month: 'short' });
    const shortYear = date.getFullYear().toString().slice(-2);
    return `${shortMonth} ${shortYear}`;
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
  const monthlyRevenue = generateMonthlyRevenue(validations);
  const customerCountByMonth = generateCustomerCountByMonth(validations);
  const projectCountByMonth = generateProjectCountByMonth(validations);
  const incompleteFilesByMonth = generateIncompleteFilesByMonth(validations);
  
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
          <AnalyticsCard title="Month on Month Revenue">
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => {
                      // Convert to Crores (1 Cr = 10,000,000)
                      if (value >= 10000000) {
                        return `${(value / 10000000).toFixed(1)} Cr`;
                      } else if (value >= 100000) {
                        // Show Lakhs for mid-range values
                        return `${(value / 100000).toFixed(1)} L`;
                      }
                      return value.toString();
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    name="Revenue"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>

          <AnalyticsCard 
            title="Revenue Share (LOB-wise)"
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
                  label={renderPieLabel}
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

        {/* Second Row - Customer Count and Future Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsCard title="Customer Count by Month">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerCountByMonth}>
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
                  dataKey="customers" 
                  fill="#06b6d4"
                  name="Customers"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsCard>

          <AnalyticsCard title="Project Count by Month">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectCountByMonth}>
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
                  fill="#6366f1"
                  name="Projects"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        </div>

        {/* Third Row - Incomplete Files and Empty Space */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Only show incomplete files chart if there are incomplete validations */}
          {incompleteFilesByMonth.some(item => item.incomplete > 0) && (
            <AnalyticsCard title="Incomplete Validation Files by Month">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incompleteFilesByMonth}>
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
                    dataKey="incomplete" 
                    fill="#f59e0b"
                    name="Incomplete Files"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          )}

          {/* Empty space */}
          <div></div>
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
