import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, X } from "lucide-react";
import type { Validation } from "@/lib/supabase";
import { formatRevenueMonth, formatCurrency, formatDate, getStatusBadge } from "@/lib/supabase";

interface ValidationTableProps {
  data: Validation[];
  onViewLeads?: () => void;
}

type SortField = keyof Validation;
type SortOrder = 'asc' | 'desc';

const ValidationTable = ({ data, onViewLeads }: ValidationTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('sl_no');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(' ');
  // NEW: Dynamic dropdown state management
  const [dropdownMode, setDropdownMode] = useState<'years' | 'months'>('years');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  const rowsPerPage = 5;

  // NEW: Generate months array for the selected year
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

  // NEW: Dynamic dropdown options based on mode
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

  // NEW: Handle dropdown selection
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

  // NEW: Handle dropdown open/close events
  const handleOpenChange = (open: boolean) => {
    // Prevent closing if we just selected a year and haven't selected a month yet
    if (!open && dropdownMode === 'months' && selectedYear && !selectedMonth) {
      return; // Don't close
    }
    setDropdownOpen(open);
  };

  // NEW: Display text for dropdown trigger
  const getDisplayText = () => {
    if (!selectedYear) return 'All Dates';
    if (!selectedMonth) return selectedYear;
    const monthName = getMonthsForYear(selectedYear).find(m => m.value === selectedMonth)?.label;
    return `${monthName} ${selectedYear}`;
  };

  // NEW: Check if any filters are active
  const hasActiveFilters = customerFilter || 
                          projectFilter || 
                          projectIdFilter || 
                          statusFilter !== ' ' || 
                          selectedYear || 
                          selectedMonth;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const matchesCustomer = !customerFilter || (item.customer_name && item.customer_name.toLowerCase().includes(customerFilter.toLowerCase()));
      const matchesProject = !projectFilter || (item.project_name && item.project_name.toLowerCase().includes(projectFilter.toLowerCase()));
      const matchesProjectId = !projectIdFilter || (item.project_id && item.project_id.toLowerCase().includes(projectIdFilter.toLowerCase()));
      const matchesStatus = !statusFilter || statusFilter === ' ' || item.validation_status === statusFilter;
      
      // NEW: Updated month filtering logic for dynamic dropdown
      let matchesMonth = true;
      if (selectedYear && selectedMonth) {
        // Both year and month selected - show specific month-year
        if (item.rev_month) {
          const [itemYear, itemMonth] = item.rev_month.split('-');
          matchesMonth = itemYear === selectedYear && itemMonth === selectedMonth;
        } else {
          matchesMonth = false;
        }
      } else if (selectedYear && !selectedMonth) {
        // Only year selected - show all months from that year
        if (item.rev_month) {
          const [itemYear] = item.rev_month.split('-');
          matchesMonth = itemYear === selectedYear;
        } else {
          matchesMonth = false;
        }
      }
      // If neither selected, show all records (matchesMonth remains true)
      
      return matchesCustomer && matchesProject && matchesProjectId && matchesStatus && matchesMonth;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [data, sortField, sortOrder, customerFilter, projectFilter, projectIdFilter, statusFilter, selectedYear, selectedMonth]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };


  const clearFilters = () => {
    setCustomerFilter('');
    setProjectFilter('');
    setProjectIdFilter('');
    setStatusFilter(' ');
    setSelectedYear('');
    setSelectedMonth('');
    setDropdownMode('years');
    setDropdownOpen(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <Input
            placeholder="Filter by customer name"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="max-w-[200px]"
          />
          <Input
            placeholder="Filter by project name"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="max-w-[200px]"
          />
          <Input
            placeholder="Filter by project ID"
            value={projectIdFilter}
            onChange={(e) => setProjectIdFilter(e.target.value)}
            className="max-w-[200px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Status</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {/* NEW: Dynamic Single Dropdown */}
          <Select 
            value={dropdownMode === 'years' ? selectedYear || 'ALL' : selectedMonth || 'BACK'} 
            onValueChange={handleDropdownChange}
            open={dropdownOpen}
            onOpenChange={handleOpenChange}
          >
            <SelectTrigger className="max-w-[150px]">
              <SelectValue placeholder="Date Filter">
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
          <Button 
            variant="outline" 
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-2 ${!hasActiveFilters ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Click "View Leads" on any row to see project-specific leads
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('validation_file_id')} className="h-8 px-2">
                  Validation File ID <SortIcon field="validation_file_id" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('customer_name')} className="h-8 px-2">
                  Customer Name <SortIcon field="customer_name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('customer_id')} className="h-8 px-2">
                  Customer ID <SortIcon field="customer_id" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('project_name')} className="h-8 px-2">
                  Project Name <SortIcon field="project_name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('project_id')} className="h-8 px-2">
                  Project ID <SortIcon field="project_id" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('rev_month')} className="h-8 px-2">
                  Revenue Month <SortIcon field="rev_month" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('validation_status')} className="h-8 px-2">
                  Status <SortIcon field="validation_status" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('revenue')} className="h-8 px-2">
                  Revenue (₹) <SortIcon field="revenue" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={row.validation_file_id}>
                <TableCell className="font-medium">{row.validation_file_id}</TableCell>
                <TableCell>{row.customer_name || '—'}</TableCell>
                <TableCell>{row.customer_id || '—'}</TableCell>
                <TableCell>{row.project_name || '—'}</TableCell>
                <TableCell>{row.project_id || '—'}</TableCell>
                <TableCell>{formatRevenueMonth(row.rev_month)}</TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusBadge(row.validation_status).variant}
                    className={getStatusBadge(row.validation_status).className}
                  >
                    {row.validation_status || '—'}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(row.revenue)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => {
                      console.log('=== DEBUG: View Leads Clicked (ValidationTable) ===');
                      console.log('Full validation object:', row);
                      console.log('rev_month value:', row.rev_month);
                      console.log('validation_status:', row.validation_status);
                      console.log('URL will be:', `/leads?customer_id=${row.customer_id}&project_id=${row.project_id}&rev_month=${row.rev_month}&validation_status=${row.validation_status}`);
                      console.log('=====================================');
                      navigate(`/leads?customer_id=${row.customer_id}&project_id=${row.project_id}&rev_month=${row.rev_month}&validation_status=${row.validation_status}`);
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
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end">
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {getVisiblePages(currentPage, totalPages).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationTable;
