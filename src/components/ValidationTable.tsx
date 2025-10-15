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
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  
  const rowsPerPage = 5;

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
      const matchesStatus = !statusFilter || item.validation_status === statusFilter;
      const matchesMonth = !monthFilter || (item.rev_month && item.rev_month.includes(monthFilter));
      
      return matchesCustomer && matchesProject && matchesStatus && matchesMonth;
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
  }, [data, sortField, sortOrder, customerFilter, projectFilter, statusFilter, monthFilter]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'Approved': 'default',
      'Pending': 'secondary',
      'Rejected': 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  // ✅ Format Revenue Month from YYYY-MM to MMM YYYY
  const formatRevenueMonth = (revenueMonth: string) => {
    if (!revenueMonth || revenueMonth.trim() === '') {
      return '—';
    }
    
    try {
      // Convert YYYY-MM format to Date object (add day 01 for valid date)
      const date = new Date(`${revenueMonth}-01`);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '—';
      }
      
      // Format to MMM YYYY (e.g., "Jan 2025", "Sep 2024")
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return '—';
    }
  };

  const clearFilters = () => {
    setCustomerFilter('');
    setProjectFilter('');
    setStatusFilter('');
    setMonthFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <Input
            placeholder="Filter by customer..."
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="max-w-[200px]"
          />
          <Input
            placeholder="Filter by project..."
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
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
          <Input
            placeholder="Month (YYYY-MM)"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="max-w-[150px]"
          />
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="flex items-center gap-2"
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
              <TableHead className="w-[50px]">Sl No</TableHead>
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
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('validation_approval_at')} className="h-8 px-2">
                  Approval Date <SortIcon field="validation_approval_at" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={row.validation_file_id}>
                <TableCell>{row.sl_no}</TableCell>
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
                <TableCell>{formatDate(row.validation_approval_at)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => navigate(`/leads?customer_id=${row.customer_id}&project_id=${row.project_id}`)}
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
        </p>
        
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
    </div>
  );
};

export default ValidationTable;
