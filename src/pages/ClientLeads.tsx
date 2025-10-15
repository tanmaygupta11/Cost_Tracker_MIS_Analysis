// ✅ Lead Schema Page - Using mock data for now
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { leads as initialLeads, type Lead } from "@/lib/clientMockData";

const ClientLeads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ✅ Local state management for mock leads data
  const [leads] = useState<Lead[]>(initialLeads);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const rowsPerPage = 5;

  // ✅ Filter leads based on status
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = !statusFilter || statusFilter === "ALL" || lead.status === statusFilter;
      return matchesStatus;
    });
  }, [leads, statusFilter]);

  // ✅ Paginate filtered leads
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredLeads.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);

  // ✅ Clear filters
  const clearFilters = () => {
    setStatusFilter("ALL");
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  // ✅ Handle select all on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedLeads.map(l => l.lead_id)));
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

  // ✅ Handle bulk download (mock action)
  const handleBulkDownload = () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to download",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "🗂 Download Started",
      description: `Downloading ${selectedRows.size} lead file(s)...`,
    });
  };

  const getStatusBadge = (status: Lead['status']) => {
    const variants: Record<Lead['status'], "default" | "secondary" | "destructive"> = {
      Approved: "default",
      Pending: "secondary",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="client" />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/client-dashboard")}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Lead Schema</h1>
            <p className="text-muted-foreground">View and manage all your leads</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="rounded-xl"
              >
                Clear Filters
              </Button>
              
              <Button
                onClick={handleBulkDownload}
                disabled={selectedRows.size === 0}
                className="gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download ({selectedRows.size})
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="text-sm text-muted-foreground mt-4">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedRows.has(l.lead_id))}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Lead ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No leads found.</p>
                    <p className="text-sm text-muted-foreground mt-2">Adjust your filters or check back later.</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLeads.map((lead) => (
                  <TableRow key={lead.lead_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(lead.lead_id)}
                        onCheckedChange={(checked) => handleSelectRow(lead.lead_id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">{lead.lead_id}</TableCell>
                    <TableCell>{lead.customer_name}</TableCell>
                    <TableCell className="font-medium">{lead.project_name}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>{lead.date_created}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredLeads.length)} of {filteredLeads.length} entries
            </div>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
    </div>
  );
};

export default ClientLeads;

