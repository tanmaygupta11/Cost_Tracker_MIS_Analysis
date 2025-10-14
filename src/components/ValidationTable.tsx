import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Eye, X } from "lucide-react";
import { ValidationFile } from "@/lib/mockData";

interface ValidationTableProps {
  data: ValidationFile[];
  onViewLeads?: () => void;
}

type SortField = keyof ValidationFile;
type SortOrder = 'asc' | 'desc';

const ValidationTable = ({ data, onViewLeads }: ValidationTableProps) => {
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
      const matchesCustomer = !customerFilter || item.customerName.toLowerCase().includes(customerFilter.toLowerCase());
      const matchesProject = !projectFilter || item.projectName.toLowerCase().includes(projectFilter.toLowerCase());
      const matchesStatus = !statusFilter || item.validationStatus === statusFilter;
      const matchesMonth = !monthFilter || item.revenueMonth.includes(monthFilter);
      
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
        
        {onViewLeads && (
          <Button 
            onClick={onViewLeads}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Eye className="h-4 w-4 mr-2" />
            View All Leads
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Sl No</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('validationFileId')} className="h-8 px-2">
                  Validation File ID <SortIcon field="validationFileId" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('customerName')} className="h-8 px-2">
                  Customer Name <SortIcon field="customerName" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('customerId')} className="h-8 px-2">
                  Customer ID <SortIcon field="customerId" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('projectName')} className="h-8 px-2">
                  Project Name <SortIcon field="projectName" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('projectId')} className="h-8 px-2">
                  Project ID <SortIcon field="projectId" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('revenueMonth')} className="h-8 px-2">
                  Revenue Month <SortIcon field="revenueMonth" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('validationStatus')} className="h-8 px-2">
                  Status <SortIcon field="validationStatus" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('revenue')} className="h-8 px-2">
                  Revenue (₹) <SortIcon field="revenue" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('validationApprovalAt')} className="h-8 px-2">
                  Approval Date <SortIcon field="validationApprovalAt" />
                </Button>
              </TableHead>
              <TableHead>File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell className="font-medium">{row.validationFileId}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.customerId}</TableCell>
                <TableCell>{row.projectName}</TableCell>
                <TableCell>{row.projectId}</TableCell>
                <TableCell>{row.revenueMonth}</TableCell>
                <TableCell>{getStatusBadge(row.validationStatus)}</TableCell>
                <TableCell className="font-semibold">₹{row.revenue.toLocaleString('en-IN')}</TableCell>
                <TableCell>{row.validationApprovalAt}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <FileText className="h-4 w-4" />
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
