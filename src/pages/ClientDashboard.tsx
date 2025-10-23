import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AnalyticsCard from "@/components/AnalyticsCard";
import { fetchValidations, formatCurrency, formatRevenueMonth, getStatusBadge, formatDate } from "@/lib/supabase";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, CheckCircle, DollarSign, Eye, FolderOpen, Clock } from "lucide-react";
import type { Validation } from "@/lib/supabase";
import { useClient } from "@/contexts/ClientContext";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

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

const generateProjectCountByMonth = (validations: Validation[]) => {
  const monthMap = new Map<string, Set<string>>();
  
  validations.forEach(validation => {
    if (validation.rev_month && validation.project_id) {
      const monthKey = extractYearMonth(validation.rev_month);
      
      if (monthKey) {
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, new Set());
        }
        
        // Add project_id to Set (automatically handles uniqueness)
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

const generateRevenueTrends = (validations: Validation[]) => {
  const monthMap = new Map<string, number>();
  
  validations.forEach(validation => {
    if (validation.rev_month && validation.revenue) {
      const monthKey = extractYearMonth(validation.rev_month);
      if (monthKey) {
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + validation.revenue);
      }
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, revenue]) => ({
      month: formatMonthForChart(month),
      revenue: revenue
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

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { customerId, customerName } = useClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state for month dropdown
  const [dropdownMode, setDropdownMode] = useState<'years' | 'months'>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  // Pagination setup
  const recordsPerPage = 5;
  
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
        setDropdownOpen(false); // Close dropdown
      } else {
        // Year selected, switch to months but keep dropdown open
        setSelectedYear(value);
        setDropdownMode('months');
        // Force dropdown to stay open by using requestAnimationFrame
        requestAnimationFrame(() => {
          setDropdownOpen(true);
        });
      }
    } else {
      // In months mode
      if (value === 'BACK') {
        setDropdownMode('years');
        // Keep dropdown open when going back
        requestAnimationFrame(() => {
          setDropdownOpen(true);
        });
      } else {
        // Month selected
        setSelectedMonth(value);
        setDropdownOpen(false); // Close dropdown
      }
    }
  };

  // Handle dropdown open/close events
  const handleOpenChange = (open: boolean) => {
    // Prevent closing if we just selected a year and haven't selected a month yet
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
        
        // Filter by customer_id for all clients
        if (customerId) {
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
  
  // Calculate filtered card data from real validations data
  const filteredCardData = useMemo(() => {
    let filteredValidations = validations;
    
    // Apply month filter if selected
    if (selectedYear && selectedMonth) {
      const monthFilter = `${selectedYear}-${selectedMonth}`;
      filteredValidations = validations.filter(validation => 
        validation.rev_month && validation.rev_month.startsWith(monthFilter)
      );
    }
    
    // Calculate metrics from filtered validations
    const uniqueProjects = new Set(
      filteredValidations
        .map(v => v.project_id)
        .filter(Boolean) // Remove null/undefined values
    );
    
    const totalRevenue = filteredValidations.reduce(
      (sum, validation) => sum + (validation.revenue || 0), 
      0
    );
    
    const approvedValidations = filteredValidations.filter(
      v => v.validation_status === 'Approved'
    ).length;
    
    const pendingValidations = filteredValidations.filter(
      v => v.validation_status === 'Pending'
    ).length;
    
    return {
      totalProjects: uniqueProjects.size,
      totalRevenue,
      approvedValidations,
      pendingValidations,
    };
  }, [validations, selectedYear, selectedMonth]);

  // Create filtered validations for charts (applies month filter)
  const filteredValidationsForCharts = useMemo(() => {
    if (!selectedYear || !selectedMonth) {
      return validations; // Show all data when no filter
    }
    
    const monthFilter = `${selectedYear}-${selectedMonth}`;
    return validations.filter(validation => 
      validation.rev_month && validation.rev_month.startsWith(monthFilter)
    );
  }, [validations, selectedYear, selectedMonth]);

  // Keep original calculations for charts and validation table (unchanged)
  const totalProjects = validations.length;
  const totalRevenue = validations.reduce((sum, validation) => sum + (validation.revenue || 0), 0);
  const approvedValidations = validations.filter(v => v.validation_status === 'Approved').length;
  const pendingValidations = validations.filter(v => v.validation_status === 'Pending').length;
  
  // Generate chart data from filtered validations (applies month filter to graphs)
  const monthlyRevenue = generateMonthlyRevenue(filteredValidationsForCharts);
  const projectCountByMonth = generateProjectCountByMonth(filteredValidationsForCharts);
  const revenueTrends = generateRevenueTrends(filteredValidationsForCharts);
  const totalPages = Math.ceil(validations.length / recordsPerPage);
  
  // Calculate paginated validations
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const recentValidations = validations.slice(startIndex, endIndex);

  // Helper function for sliding window pagination
  const getVisiblePages = (current: number, total: number): number[] => {
    // If total pages <= 3, show all pages
    if (total <= 3) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    // Calculate window: keep current page in middle
    let start = Math.max(1, current - 1);
    let end = Math.min(total, current + 1);
    
    // Adjust for boundaries
    if (current === 1) {
      start = 1;
      end = 3;
    } else if (current === total) {
      start = total - 2;
      end = total;
    }
    
    // Generate page array
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

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

        {/* Month Filter Section */}
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Filter by Month:</label>
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
          </div>
        </div>

        {/* Summary Analytics Section - Top 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-foreground">{filteredCardData.totalProjects}</p>
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
                  ₹{(filteredCardData.totalRevenue / 10000000).toFixed(1)}Cr
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
                <p className="text-3xl font-bold text-foreground">{filteredCardData.approvedValidations}</p>
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
                <p className="text-3xl font-bold text-foreground">{filteredCardData.pendingValidations}</p>
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
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
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

          {/* Chart 2: Number of Projects */}
          <AnalyticsCard title="Number of Projects">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={projectCountByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
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
                  fill="#f97316"
                  name="Projects"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
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
                  <TableHead>Validation File ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Revenue Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Revenue (₹)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentValidations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <p className="text-muted-foreground text-lg">No validations found for your account.</p>
                      <p className="text-sm text-muted-foreground mt-2">Check back later for updates.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentValidations.map((validation, index) => (
                    <TableRow key={validation.validation_file_id}>
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
                      <TableCell className="text-center">
                        <Button
                          onClick={() => {
                            console.log('=== DEBUG: View Details Clicked ===');
                            console.log('Full validation object:', validation);
                            console.log('rev_month value:', validation.rev_month);
                            console.log('rev_month type:', typeof validation.rev_month);
                            console.log('validation_status:', validation.validation_status);
                            console.log('validation_file_id:', validation.validation_file_id);
                            console.log('formatted display:', formatRevenueMonth(validation.rev_month));
                            console.log('URL will be:', `/client-leads?customer_id=${validation.customer_id}&project_id=${validation.project_id}&rev_month=${validation.rev_month}&validation_status=${validation.validation_status}&validation_file_id=${validation.validation_file_id}`);
                            console.log('=====================================');
                            
                            navigate(`/client-leads?customer_id=${validation.customer_id}&project_id=${validation.project_id}&rev_month=${validation.rev_month}&validation_status=${validation.validation_status}&validation_file_id=${validation.validation_file_id}`);
                          }}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-end mt-6">
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
                  {getVisiblePages(currentPage, totalPages).map(page => (
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
