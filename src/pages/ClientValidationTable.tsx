import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import { ArrowLeft, ArrowUpDown, Check, X, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ValidationStatus = 'Pending' | 'Approved' | 'Rejected';

interface Validation {
  sl_no: number;
  validation_file_id: string;
  customer_name: string;
  customer_id: string;
  project_name: string;
  project_id: string;
  rev_month: string;
  validation_status: ValidationStatus;
  revenue: number;
  validation_approval_at: string | null;
}

type SortField = 'sl_no' | 'validation_file_id' | 'project_name' | 'rev_month' | 'validation_status' | 'revenue';

const ClientValidationTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>('sl_no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);
  const rowsPerPage = 5;

  useEffect(() => {
    fetchValidations();
  }, []);

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const { data: validations, error } = await supabase
        .from('validations')
        .select('*')
        .order('sl_no', { ascending: true });

      if (error) throw error;

      if (validations && validations.length > 0) {
        setCustomerName(validations[0].customer_name || "");
      }

      setData(validations || []);
    } catch (error) {
      console.error('Error fetching validations:', error);
      toast({
        title: "Error",
        description: "Failed to load validations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) => {
      const matchesProject = !projectFilter || item.project_name?.toLowerCase().includes(projectFilter.toLowerCase());
      const matchesStatus = !statusFilter || item.validation_status === statusFilter;
      const matchesMonth = !monthFilter || item.rev_month?.includes(monthFilter);
      return matchesProject && matchesStatus && matchesMonth;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, projectFilter, statusFilter, monthFilter, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const clearFilters = () => {
    setProjectFilter("");
    setStatusFilter("");
    setMonthFilter("");
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(v => v.validation_file_id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleBulkUpdate = async (status: ValidationStatus) => {
    if (selectedRows.size === 0) return;

    setUpdating(true);
    try {
      const updates = Array.from(selectedRows).map(id => 
        supabase
          .from('validations')
          .update({ validation_status: status })
          .eq('validation_file_id', id)
      );

      await Promise.all(updates);

      toast({
        title: "Success",
        description: `${selectedRows.size} validation(s) ${status.toLowerCase()}.`,
      });

      setSelectedRows(new Set());
      await fetchValidations();
    } catch (error) {
      console.error('Error updating validations:', error);
      toast({
        title: "Error",
        description: "Failed to update validations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkDownload = () => {
    toast({
      title: "Download Started",
      description: `Downloading ${selectedRows.size} file(s)...`,
    });
  };

  const getStatusBadge = (status: ValidationStatus) => {
    const variants: Record<ValidationStatus, "default" | "secondary" | "destructive"> = {
      Approved: "default",
      Pending: "secondary",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortField === field ? 'text-primary' : ''}`} />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/client-dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">My Validations</h1>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No validations found for your account.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              <Input
                placeholder="Customer Name"
                value={customerName}
                disabled
                className="w-64 bg-muted"
              />
              <Input
                placeholder="Project Name"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-64"
              />
              <Input
                placeholder="Revenue Month (YYYY-MM)"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            {selectedRows.size > 0 && (
              <div className="flex gap-4 mb-4 p-4 bg-muted rounded-lg">
                <span className="font-medium">{selectedRows.size} selected</span>
                <Button
                  size="sm"
                  onClick={() => handleBulkUpdate('Approved')}
                  disabled={updating}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkUpdate('Rejected')}
                  disabled={updating}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Reject Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Selected
                </Button>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={paginatedData.length > 0 && paginatedData.every(v => selectedRows.has(v.validation_file_id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead onClick={() => handleSort('sl_no')} className="cursor-pointer">
                      Sl No <SortIcon field="sl_no" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('validation_file_id')} className="cursor-pointer">
                      Validation File ID <SortIcon field="validation_file_id" />
                    </TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead onClick={() => handleSort('project_name')} className="cursor-pointer">
                      Project Name <SortIcon field="project_name" />
                    </TableHead>
                    <TableHead>Project ID</TableHead>
                    <TableHead onClick={() => handleSort('rev_month')} className="cursor-pointer">
                      Revenue Month <SortIcon field="rev_month" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('validation_status')} className="cursor-pointer">
                      Status <SortIcon field="validation_status" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('revenue')} className="cursor-pointer">
                      Revenue (₹) <SortIcon field="revenue" />
                    </TableHead>
                    <TableHead>Approval Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((validation) => (
                    <TableRow key={validation.validation_file_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(validation.validation_file_id)}
                          onCheckedChange={(checked) => handleSelectRow(validation.validation_file_id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>{validation.sl_no}</TableCell>
                      <TableCell className="font-mono text-sm">{validation.validation_file_id}</TableCell>
                      <TableCell>{validation.customer_name}</TableCell>
                      <TableCell className="font-mono text-sm">{validation.customer_id}</TableCell>
                      <TableCell>{validation.project_name}</TableCell>
                      <TableCell className="font-mono text-sm">{validation.project_id}</TableCell>
                      <TableCell>{validation.rev_month}</TableCell>
                      <TableCell>{getStatusBadge(validation.validation_status)}</TableCell>
                      <TableCell>₹{validation.revenue?.toLocaleString()}</TableCell>
                      <TableCell>
                        {validation.validation_approval_at
                          ? new Date(validation.validation_approval_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientValidationTable;
