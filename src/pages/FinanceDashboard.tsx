import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import AnalyticsCard from "@/components/AnalyticsCard";
import ValidationTable from "@/components/ValidationTable";
import UploadCSVModal from "@/components/UploadCSVModal";
import { fetchValidations, formatCurrency } from "@/lib/supabase";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from "lucide-react";
import type { MISRecord } from "@/lib/supabase";
import { fetchActiveWorkers } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

// Helper functions to generate chart data from MIS records
const generateMonthlyRevenue = (misRecords: MISRecord[]) => {
  const revenueMap = new Map<string, number>();
  const costMap = new Map<string, number>();

  misRecords.forEach(record => {
    if (record.rev_month) {
      const monthKey = extractYearMonth(record.rev_month);
      if (monthKey) {
        if (record.revenue) {
          revenueMap.set(monthKey, (revenueMap.get(monthKey) || 0) + record.revenue);
        }
        if (record.approved_cost) {
          costMap.set(monthKey, (costMap.get(monthKey) || 0) + record.approved_cost);
        }
      }
    }
  });

  const allMonths = Array.from(new Set([...revenueMap.keys(), ...costMap.keys()])).sort((a, b) => a.localeCompare(b));
  if (allMonths.length === 0) return [];

  // Determine the latest month present and build a contiguous last-6-month window
  const latest = allMonths[allMonths.length - 1]; // YYYY-MM
  const window: string[] = [];
  const [latestYear, latestMonth] = latest.split('-').map(Number);
  for (let i = 5; i >= 0; i--) {
    const date = new Date(latestYear, latestMonth - 1, 1);
    date.setMonth(date.getMonth() - i);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    window.push(`${y}-${m}`);
  }

  return window.map(month => ({
    month: formatMonthForChart(month),
    revenue: revenueMap.get(month) || 0,
    cost: costMap.get(month) || 0
  }));
};

const generateLobShare = (misRecords: MISRecord[], metric: 'revenue' | 'approved_cost') => {
  const lobMap = new Map<string, number>();

  misRecords.forEach(record => {
    // Ignore NULL or empty LOB values - now using lowercase 'lob'
    const value = (record as any)[metric] as number | null | undefined;
    if (record.lob && record.lob.trim() !== '' && value) {
      const lob = record.lob;
      lobMap.set(lob, (lobMap.get(lob) || 0) + Number(value));
    }
  });

  return Array.from(lobMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 LOBs
};

const generateCustomerCountByMonth = (misRecords: MISRecord[]) => {
  const monthMap = new Map<string, Set<string>>();
  
  misRecords.forEach(record => {
    if (record.rev_month && record.customer_id) {
      const monthKey = extractYearMonth(record.rev_month);
      
      if (monthKey) {
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, new Set());
        }
        
        // Add customer_id to the Set (automatically handles uniqueness)
        monthMap.get(monthKey)!.add(record.customer_id);
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

const generateProjectCountByMonth = (misRecords: MISRecord[]) => {
  const monthMap = new Map<string, Set<string>>();
  
  misRecords.forEach(record => {
    if (record.rev_month && record.project_id) {
      const monthKey = extractYearMonth(record.rev_month);
      
      if (monthKey) {
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, new Set());
        }
        
        // Add project_id to the Set (automatically handles uniqueness)
        monthMap.get(monthKey)!.add(record.project_id);
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

// Generate Margin by Month from MIS records
const generateMarginByMonth = (misRecords: MISRecord[]) => {
  const monthMap = new Map<string, number[]>();

  misRecords.forEach(record => {
    if (record.rev_month && record.margin !== null && record.margin !== undefined) {
      const monthKey = extractYearMonth(record.rev_month);
      if (monthKey) {
        const arr = monthMap.get(monthKey) || [];
        arr.push(Number(record.margin));
        monthMap.set(monthKey, arr);
      }
    }
  });

  const months = Array.from(monthMap.keys()).sort((a, b) => a.localeCompare(b));
  if (months.length === 0) return [];

  // Latest month and contiguous 6-month window
  const latest = months[months.length - 1];
  const window: string[] = [];
  const [latestYear, latestMonth] = latest.split('-').map(Number);
  for (let i = 5; i >= 0; i--) {
    const date = new Date(latestYear, latestMonth - 1, 1);
    date.setMonth(date.getMonth() - i);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    window.push(`${y}-${m}`);
  }

  return window.map(month => {
    const values = monthMap.get(month) || [];
    // Use average if multiple values exist for the month; default 0
    const margin = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    const rounded = Number(margin.toFixed(2));
    return {
      month: formatMonthForChart(month),
      margin: rounded
    };
  });
};

// Generate Active Workers by Month from active_workers table
// This function will be called with activeWorkers data separately
const generateActiveWorkersByMonth = (activeWorkers: Array<{ record_date: string | null; active_workers: number | null }>) => {
  const monthMap = new Map<string, number>();
  
  activeWorkers.forEach(worker => {
    if (worker.record_date && worker.active_workers !== null) {
      const monthKey = extractYearMonth(worker.record_date);
      if (monthKey) {
        // Sum up workers for the same month if multiple records exist
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + worker.active_workers);
      }
    }
  });
  
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, workers]) => ({
      month: formatMonthForChart(month),
      workers: workers
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
  const { role } = useAuth();
  const [misRecords, setMisRecords] = useState<MISRecord[]>([]);
  const [activeWorkers, setActiveWorkers] = useState<Array<{ record_date: string | null; active_workers: number | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Filter state for Revenue Share chart
  const [lobChartType, setLobChartType] = useState<'Revenue' | 'Cost'>('Revenue');
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
  
  // Fetch MIS records and active workers data from Supabase
  const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch MIS records
        const { data: misData, error: misError } = await fetchValidations();
        
        if (misError) {
          console.error('Error fetching MIS records:', misError);
          // If table is missing, show helpful message
          if (misError.isTableMissing || misError.code === 'PGRST205') {
            setError('MIS records table not found. Please create the mis_records table in Supabase using create_mis_tables.sql');
          } else {
            setError('Failed to load MIS data');
          }
          return;
        }
        
        setMisRecords(misData || []);
        
        // Fetch active workers
        const { data: workersData, error: workersError } = await fetchActiveWorkers();
        
        if (workersError) {
          console.error('Error fetching active workers:', workersError);
          // Don't fail completely if workers fetch fails, just log it
        } else {
          setActiveWorkers(workersData || []);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  // Calculate analytics from real data
  const totalProjects = misRecords.length;
  const totalRevenue = misRecords.reduce((sum, record) => sum + (record.revenue || 0), 0);
  // Note: validation_status doesn't exist in mis_records, so we can't calculate approved/pending counts
  
  // Generate chart data from MIS records
  const monthlyRevenue = generateMonthlyRevenue(misRecords);
  const customerCountByMonth = generateCustomerCountByMonth(misRecords);
  const projectCountByMonth = generateProjectCountByMonth(misRecords);
  // Note: generateIncompleteFilesByMonth removed as Validation_completed doesn't exist in mis_records
  const marginByMonth = generateMarginByMonth(misRecords);
  const activeWorkersByMonth = generateActiveWorkersByMonth(activeWorkers);

  // Generate y-axis ticks for margin chart at 0.02 intervals
  const marginTicks = useMemo(() => {
    if (!marginByMonth || marginByMonth.length === 0) return [] as number[];
    const values = marginByMonth.map((d: any) => Number(d.margin) || 0);
    let min = Math.min(...values);
    let max = Math.max(...values);
    const step = 0.02;
    // Expand a tiny bit to ensure at least one tick if min==max
    if (min === max) {
      min -= step;
      max += step;
    }
    // Snap to step boundaries
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = min; v <= max + 1e-9; v += step) {
      ticks.push(Number(v.toFixed(2)));
    }
    return ticks;
  }, [marginByMonth]);
  
  // Filtered revenue share based on selected month and chart type
  const revenueShare = useMemo(() => {
    const metric: 'revenue' | 'approved_cost' = lobChartType === 'Cost' ? 'approved_cost' : 'revenue';

    if (!selectedYear || !selectedMonth) {
      // Show all data when no filter applied
      return generateLobShare(misRecords, metric);
    } else {
      // Filter MIS records by selected month
      // Database stores rev_month as DATE, so we need to check if it starts with YYYY-MM
      const selectedMonthPrefix = `${selectedYear}-${selectedMonth}`;
      const filteredRecords = misRecords.filter(v => 
        v.rev_month && String(v.rev_month).startsWith(selectedMonthPrefix)
      );

      return generateLobShare(filteredRecords, metric);
    }
  }, [misRecords, selectedYear, selectedMonth, lobChartType]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole={role || "finance"} />
      
      <main className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-20 pb-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">MIS Dashboard</h2>
          <p className="text-muted-foreground">Track and analyze revenue and cost performance</p>
        </div>

        {/* Analytics Section - Side by Side with Equal Sizes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsCard title="Month on Month Revenue & Cost">
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
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="cost" 
                    fill="#f97316" 
                    name="Cost"
                    radius={[8, 8, 0, 0]}
                  />
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
            title="LOB - Wise Share"
            headerAction={
              <div className="flex items-center gap-4">
                <RadioGroup 
                  value={lobChartType} 
                  onValueChange={(value) => setLobChartType(value as 'Revenue' | 'Cost')}
                  className="flex flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Revenue" id="revenue" />
                    <Label htmlFor="revenue" className="cursor-pointer">Revenue</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Cost" id="cost" />
                    <Label htmlFor="cost" className="cursor-pointer">Cost</Label>
                  </div>
                </RadioGroup>
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
                    {lobChartType === 'Cost' 
                      ? (selectedYear && selectedMonth 
                          ? `No cost data found for ${getDisplayText()}` 
                          : 'Cost data will be available soon')
                      : (selectedYear && selectedMonth 
                          ? `No revenue data found for ${getDisplayText()}` 
                          : 'No revenue data available')
                    }
                  </p>
                </div>
              </div>
            )}
          </AnalyticsCard>
        </div>

        {/* Second Row - Margin Trend and Active Workers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Margin Trend by Month - Line Chart */}
          <AnalyticsCard title="Margin Trend by Month">
            {marginByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={marginByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    allowDecimals
                    ticks={marginTicks}
                    domain={[
                      marginTicks.length ? marginTicks[0] : 'auto',
                      marginTicks.length ? marginTicks[marginTicks.length - 1] : 'auto'
                    ]}
                    tickFormatter={(v: number) => v.toFixed(2)}
                    label={{ value: 'Margin', angle: -90, position: 'insideLeft' }}
                  />
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
                    dataKey="margin" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Margin"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg">No data available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Data will be available soon
                  </p>
                </div>
              </div>
            )}
          </AnalyticsCard>

          {/* Active Workers by Month - Bar Chart */}
          <AnalyticsCard title="Active Workers by Month">
            {activeWorkersByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={activeWorkersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    allowDecimals={false}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
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
                    dataKey="workers" 
                    fill="#8b5cf6"
                    name="Active Workers"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg">No data available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Data will be available soon
                  </p>
                </div>
              </div>
            )}
          </AnalyticsCard>
        </div>

        {/* MIS Reports Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">MIS Reports</h3>
            {role === 'admin' && (
              <Button onClick={() => setIsUploadOpen(true)} variant="default" className="rounded-xl">
                Add via CSV
              </Button>
            )}
          </div>
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
            data={misRecords} 
          />
        )}
        </div>

        {/* CSV Upload Modal */}
        <UploadCSVModal 
          open={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          onSuccess={() => { setIsUploadOpen(false); loadData(); }}
        />
      </main>
    </div>
  );
};

export default FinanceDashboard;
