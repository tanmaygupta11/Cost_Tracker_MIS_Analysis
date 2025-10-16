// ✅ Filter, paginate, and update mock dataset in React state
// ✅ Handle bulk approve/reject and download actions locally
// ✅ Reuse Finance Team table styles and components
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Check, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validationFiles as initialData, type ValidationFile } from "@/lib/clientMockData";
import { useClient } from "@/contexts/ClientContext";
import { formatDate } from "@/lib/supabase";

const ClientValidationTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customerId, customerName } = useClient();
  
  // ✅ Filter initial data based on client context
  const getFilteredInitialData = () => {
    let filtered = initialData;
    
    // If logged in with client@demo.com, filter to show only ROX customer data
    if (customerName === 'ROX') {
      filtered = initialData.filter(item => 
        item.customer_name && item.customer_name.toLowerCase().includes('rox')
      );
    } else if (customerId) {
      // For other clients, filter by customer_id
      filtered = initialData.filter(item => item.customer_id === customerId);
    }
    
    return filtered;
  };
  
  // ✅ Local state management for mock data with client filtering
  const [data, setData] = useState<ValidationFile[]>(getFilteredInitialData());
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Update data when client context changes
  useEffect(() => {
    setData(getFilteredInitialData());
  }, [customerId, customerName]);

  // Get unique project names for filter dropdown
  const uniqueProjects = useMemo(() => {
    const projects = new Set(data.map(v => v.project_name));
    return Array.from(projects).sort();
  }, [data]);

  // Get unique months for filter dropdown
  const uniqueMonths = useMemo(() => {
    const months = new Set(data.map(v => v.revenue_month));
    return Array.from(months).sort().reverse();
  }, [data]);

  // ✅ Filter data based on selected filters - Show ALL matching records (no pagination)
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesProject = !projectFilter || projectFilter === "ALL" || item.project_name === projectFilter;
      const matchesStatus = !statusFilter || statusFilter === "ALL" || item.validation_status === statusFilter;
      const matchesMonth = !monthFilter || monthFilter === "ALL" || item.revenue_month === monthFilter;
      return matchesProject && matchesStatus && matchesMonth;
    });
  }, [data, projectFilter, statusFilter, monthFilter]);

  // ✅ Clear all filters
  const clearFilters = () => {
    setProjectFilter("ALL");
    setStatusFilter("ALL");
    setMonthFilter("ALL");
    setSelectedRows(new Set());
  };

  // ✅ Handle select all (all filtered records)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map(v => v.validation_file_id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // ✅ Handle individual row selection
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  // ✅ Handle bulk approve action (local state update)
  const handleBulkApprove = () => {
    if (selectedRows.size === 0) return;

    const updatedData = data.map(item => {
      if (selectedRows.has(item.validation_file_id)) {
        return {
          ...item,
          validation_status: 'Approved' as const,
          validation_approval_at: item.validation_approval_at || new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });

    setData(updatedData);
    setSelectedRows(new Set());
    
    toast({
      title: "✅ Approved Successfully",
      description: `${selectedRows.size} validation(s) have been approved.`,
    });
  };

  // ✅ Handle bulk reject action (local state update)
  const handleBulkReject = () => {
    if (selectedRows.size === 0) return;

    const updatedData = data.map(item => {
      if (selectedRows.has(item.validation_file_id)) {
        return {
          ...item,
          validation_status: 'Rejected' as const,
          validation_approval_at: item.validation_approval_at || new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });

    setData(updatedData);
    setSelectedRows(new Set());
    
    toast({
      title: "❌ Rejected Successfully",
      description: `${selectedRows.size} validation(s) have been rejected.`,
      variant: "destructive",
    });
  };

  // ✅ Handle bulk download (mock action)
  const handleBulkDownload = () => {
    if (selectedRows.size === 0) return;

    toast({
      title: "🗂 Download Started",
      description: `Downloading ${selectedRows.size} validation file(s)...`,
    });
  };

  const getStatusBadge = (status: ValidationFile['validation_status']) => {
    const variants: Record<ValidationFile['validation_status'], "default" | "secondary" | "destructive"> = {
      Approved: "default",
      Pending: "secondary",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="client" />
      
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-20 pb-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/client-dashboard")}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Validation Files</h1>
            <p className="text-muted-foreground">Manage and track all your validations</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Project Name</label>
              <Select value={projectFilter || "ALL"} onValueChange={setProjectFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Projects</SelectItem>
                  {uniqueProjects.map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter || "ALL"} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={monthFilter || "ALL"} onValueChange={setMonthFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Months</SelectItem>
                  {uniqueMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {data.length} validations
          </div>
        </div>

        {/* Bulk Actions Bar (appears when rows are selected) */}
        {selectedRows.size > 0 && (
          <div className="bg-primary/10 rounded-xl border border-primary/20 p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary">{selectedRows.size} validation(s) selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  className="gap-2 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkReject}
                  className="gap-2 rounded-xl"
                >
                  <X className="h-4 w-4" />
                  Reject Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDownload}
                  className="gap-2 rounded-xl"
                >
                  <Download className="h-4 w-4" />
                  Download Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Table */}
        <div className="bg-card rounded-xl border border-border w-full overflow-x-auto lg:overflow-x-visible table-container">
          <Table className="w-full min-w-max table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredData.length > 0 && filteredData.every(v => selectedRows.has(v.validation_file_id))}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Sl No</TableHead>
                <TableHead>Validation File ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Customer ID</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Project ID</TableHead>
                <TableHead>Revenue Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revenue (₹)</TableHead>
                <TableHead>Approval Date</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <p className="text-muted-foreground text-lg">No validations found for your account.</p>
                      <p className="text-sm text-muted-foreground mt-2">Check back later for updates.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((validation) => (
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
                    <TableCell className="font-medium">{validation.project_name}</TableCell>
                    <TableCell className="font-mono text-sm">{validation.project_id}</TableCell>
                    <TableCell>{validation.revenue_month}</TableCell>
                    <TableCell>{getStatusBadge(validation.validation_status)}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{validation.revenue.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      {formatDate(validation.validation_approval_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary - No pagination, show all records */}
        {filteredData.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-6">
            Showing {filteredData.length} of {data.length} validations
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientValidationTable;
