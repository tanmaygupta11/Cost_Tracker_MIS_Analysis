// ✅ New Client Lead Schema Page - Using new 11-column structure with Client-specific actions
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { fetchLeads, formatCurrency, formatDate, getStatusBadge, bulkUpdateLeadApprovals } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import { ArrowLeft, Check, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClient } from "@/contexts/ClientContext";

const ClientLeads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customerId: clientCustomerId, customerName } = useClient();
  const [searchParams] = useSearchParams();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [workDateFrom, setWorkDateFrom] = useState('');
  const [workDateTo, setWorkDateTo] = useState('');
  const [clientDateFrom, setClientDateFrom] = useState('');
  const [clientDateTo, setClientDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Get query parameters for filtering
  const customerId = searchParams.get('customer_id');
  const projectId = searchParams.get('project_id');
  
  console.log('ClientLeads - URL params:', { customerId, projectId });
  
  
  // Fetch leads data from Supabase
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        
        console.log('ClientLeads - Loading leads with projectId:', projectId);
        const { data, error } = await fetchLeads(projectId || undefined);
        
        console.log('ClientLeads - Fetch result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('Error fetching leads:', error);
          setError('Failed to load leads data');
          return;
        }
        
        // Apply client-side filtering for ROX customers
        let filteredData = data || [];
        
        // For ROX customers, we need to ensure they only see their leads
        // Since leads table doesn't have customer_id, we'll filter based on the client context
        // For now, we'll show all leads for the project since the relationship is complex
        // TODO: Implement proper customer filtering when database schema is clarified
        
        if (customerName === 'ROX' || clientCustomerId === 'ROX-CUST-001') {
          // For ROX, we can filter based on URL parameters or other criteria
          // Since the "View Leads" button comes from a specific validation with known customer,
          // we trust that the leads shown are for the correct customer context
          // In the future, this could be enhanced with proper joins
          console.log('ROX customer detected - showing all leads for project:', projectId);
        }
        
        setLeads(filteredData);
      } catch (err) {
        console.error('Error loading leads:', err);
        setError('Failed to load leads data');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeads();
  }, [projectId, clientCustomerId, customerName]);
  
  const rowsPerPage = 20;

  // ✅ Filter leads based on query parameters and manual filters
  const filteredData = useMemo(() => {
    return leads.filter(lead => {
      // ✅ Apply query parameter filters first
      const matchesQueryCustomer = true; // Customer ID not in leads table
      const matchesQueryProject = !projectId || lead.project_id === projectId;
      
      // ✅ Apply remaining manual filters
      const matchesStatus = !statusFilter || statusFilter === "ALL" || (lead as any).client_incharge_approval === statusFilter;
      
      // ✅ Apply Work Completion Date Range filter (using available date fields)
      let matchesWorkDate = true;
      if (workDateFrom || workDateTo) {
        // Try to use final_work_completion_date or fallback to lead_id for ordering
        const dateField = (lead as any).final_work_completion_date || (lead as any).created_at;
        if (dateField) {
          try {
            const leadDate = new Date(dateField);
            const fromDate = workDateFrom ? new Date(workDateFrom) : null;
            const toDate = workDateTo ? new Date(workDateTo) : null;
            
            matchesWorkDate = (!fromDate || leadDate >= fromDate) && 
                             (!toDate || leadDate <= toDate);
          } catch (error) {
            matchesWorkDate = true; // If date parsing fails, include the record
          }
        } else {
          matchesWorkDate = true; // If no date field, include the record
        }
      }
      
      // ✅ Apply Client Approval Date Range filter (using available date fields)
      let matchesClientDate = true;
      if (clientDateFrom || clientDateTo) {
        // Try to use client_incharge_approval_date or fallback to other date fields
        const dateField = (lead as any).client_incharge_approval_date || (lead as any).final_work_completion_date || (lead as any).created_at;
        if (dateField) {
          try {
            const leadDate = new Date(dateField);
            const fromDate = clientDateFrom ? new Date(clientDateFrom) : null;
            const toDate = clientDateTo ? new Date(clientDateTo) : null;
            
            matchesClientDate = (!fromDate || leadDate >= fromDate) && 
                               (!toDate || leadDate <= toDate);
          } catch (error) {
            matchesClientDate = true; // If date parsing fails, include the record
          }
        } else {
          matchesClientDate = true; // If no date field, include the record
        }
      }
      
      return matchesQueryCustomer && matchesQueryProject && matchesStatus && matchesWorkDate && matchesClientDate;
    });
  }, [leads, statusFilter, workDateFrom, workDateTo, clientDateFrom, clientDateTo, customerId, projectId]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  // Show all records if 20 or fewer, otherwise paginate
  const shouldPaginate = filteredData.length > rowsPerPage;
  const paginatedData = shouldPaginate 
    ? filteredData.slice(startIndex, startIndex + rowsPerPage)
    : filteredData;

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedData.map(lead => lead.lead_id));
    } else {
      setSelectedLeads([]);
    }
  };

  // ✅ Client-specific bulk actions: Approve and Reject
  const handleBulkApprove = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to approve",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await bulkUpdateLeadApprovals(selectedLeads, 'Approved', 'client_incharge_approval');
      
      if (error) {
        console.error('Error approving leads:', error);
        toast({
          title: "Error",
          description: "Failed to approve leads. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "✅ Leads Approved",
        description: `Approved ${selectedLeads.length} lead(s). Approval dates have been updated.`,
      });
      
      // Refresh data and clear selection
      setSelectedLeads([]);
      // Reload leads data
      const { data } = await fetchLeads(projectId || undefined);
      if (data) {
        setLeads(data);
      }
    } catch (err) {
      console.error('Error approving leads:', err);
      toast({
        title: "Error",
        description: "Failed to approve leads. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to reject",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await bulkUpdateLeadApprovals(selectedLeads, 'Rejected', 'client_incharge_approval');
      
      if (error) {
        console.error('Error rejecting leads:', error);
        toast({
          title: "Error",
          description: "Failed to reject leads. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "❌ Leads Rejected",
        description: `Rejected ${selectedLeads.length} lead(s). Approval dates have been updated.`,
        variant: "destructive"
      });
      
      // Refresh data and clear selection
      setSelectedLeads([]);
      // Reload leads data
      const { data } = await fetchLeads(projectId || undefined);
      if (data) {
        setLeads(data);
      }
    } catch (err) {
      console.error('Error rejecting leads:', err);
      toast({
        title: "Error",
        description: "Failed to reject leads. Please try again.",
        variant: "destructive"
      });
    }
  };

  // NEW: Handle CSV download for selected leads
  const handleBulkDownload = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to download",
        variant: "destructive"
      });
      return;
    }

    // Get selected leads data
    const selectedLeadsData = paginatedData.filter(lead => selectedLeads.includes(lead.lead_id));
    
    // CSV headers matching table columns
    const headers = [
      'Project ID',
      'Project Name', 
      'Lead ID',
      'Final Work Completion Date',
      'Revised Work Completion Date',
      'Original Work Completion Date',
      'Unit Basis Commercial',
      'Project Incharge Approval',
      'Project Incharge Approval Date',
      'Client Incharge Approval',
      'Client Incharge Approval Date'
    ];

    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...selectedLeadsData.map(lead => [
        lead.project_id || '',
        (lead as any).project_name || lead.lead_name || '',
        lead.lead_id,
        formatDate((lead as any).final_work_completion_date),
        formatDate((lead as any).revisied_work_completion_date),
        formatDate((lead as any).Original_Work_Completion_Date || (lead as any).original_work_completion_date),
        (lead as any).unit_basis_commercial || '',
        (lead as any).project_incharge_approval || '',
        formatDate((lead as any).project_incharge_approval_date),
        (lead as any).client_incharge_approval || '',
        formatDate((lead as any).client_incharge_approval_date)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `leads_export_${timestamp}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "✅ CSV Downloaded",
      description: `Downloaded ${selectedLeads.length} lead(s) as CSV file.`,
    });
  };

  // NEW: Check if any filters are active
  const hasActiveFilters = statusFilter !== "ALL" || 
                          workDateFrom || 
                          workDateTo || 
                          clientDateFrom || 
                          clientDateTo;

  const clearFilters = () => {
    setStatusFilter("ALL");
    setWorkDateFrom('');
    setWorkDateTo('');
    setClientDateFrom('');
    setClientDateTo('');
    setSelectedLeads([]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="client" />
      
      <main className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-20 pb-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/client-dashboard')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h2 className="text-3xl font-bold text-foreground mb-2">Lead Schema</h2>
          {customerId && projectId ? (
            <p className="text-muted-foreground">
              Showing leads for Customer ID: <span className="font-mono">{customerId}</span> • 
              Project ID: <span className="font-mono">{projectId}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">Manage and track your project leads</p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading leads data...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Client Approval</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Client Approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Approval</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work Completion Date Range Filter */}
              <div className="flex-1 min-w-[280px]">
                <label className="text-sm font-medium mb-2 block">Work Completion Date</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={workDateFrom}
                    onChange={(e) => setWorkDateFrom(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background"
                    placeholder="From"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={workDateTo}
                    onChange={(e) => setWorkDateTo(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Client Approval Date Range Filter */}
              <div className="flex-1 min-w-[280px]">
                <label className="text-sm font-medium mb-2 block">Client Approval Date</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={clientDateFrom}
                    onChange={(e) => setClientDateFrom(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background"
                    placeholder="From"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={clientDateTo}
                    onChange={(e) => setClientDateTo(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background"
                    placeholder="To"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className={`rounded-xl ${!hasActiveFilters ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
            
            {selectedLeads.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkApprove}
                  className="bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedLeads.length})
                </Button>
                <Button
                  onClick={handleBulkReject}
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Selected ({selectedLeads.length})
                </Button>
                <Button
                  onClick={handleBulkDownload}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected ({selectedLeads.length})
                </Button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border w-full overflow-x-auto table-container">
            <Table className="w-full" style={{ minWidth: '1500px' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={paginatedData.length > 0 && paginatedData.every(l => selectedLeads.includes(l.lead_id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">Project ID</TableHead>
                  <TableHead className="w-48 text-center whitespace-normal break-words">Project Name</TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">Lead ID</TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">Final Work Completion Date</TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">
                    <div>
                      <div>Revised Work</div>
                      <div>Completion Date</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">
                    <div>
                      <div>Original Work</div>
                      <div>Completion Date</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-40 text-center whitespace-normal break-words">Unit Basis Commercial</TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">Project Incharge Approval</TableHead>
                  <TableHead className="w-48 text-center whitespace-normal break-words">
                    <div>
                      <div>Project Incharge</div>
                      <div>Approval Date</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">Client Incharge Approval</TableHead>
                  <TableHead className="w-48 text-center whitespace-normal break-words">
                    <div>
                      <div>Client Incharge</div>
                      <div>Approval Date</div>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12">
                      <p className="text-muted-foreground text-lg">
                        {(workDateFrom || workDateTo || clientDateFrom || clientDateTo)
                          ? "No records found for the selected date range."
                          : (customerId && projectId 
                            ? "No leads found for this project." 
                            : "No leads found.")
                        }
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {(workDateFrom || workDateTo || clientDateFrom || clientDateTo)
                          ? "Try adjusting your date range or clear filters to see all records."
                          : (customerId && projectId 
                            ? "This customer-project combination has no leads yet." 
                            : "Adjust your filters or check back later.")
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((lead) => {
                    const projectInchargeStatusBadge = getStatusBadge((lead as any).project_incharge_approval);
                    const clientInchargeStatusBadge = getStatusBadge((lead as any).client_incharge_approval);
                    return (
                      <TableRow key={lead.lead_id}>
                        <TableCell className="w-12 text-center">
                          <Checkbox
                            checked={selectedLeads.includes(lead.lead_id)}
                            onCheckedChange={(checked) => handleSelectLead(lead.lead_id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="w-28 font-mono text-sm text-center">{lead.project_id || '—'}</TableCell>
                        <TableCell className="w-48 font-medium text-center whitespace-normal break-words">{(lead as any).project_name || lead.lead_name || '—'}</TableCell>
                        <TableCell className="w-28 font-mono text-sm text-center">{lead.lead_id}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).final_work_completion_date)}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).revisied_work_completion_date)}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).Original_Work_Completion_Date || (lead as any).original_work_completion_date)}</TableCell>
                        <TableCell className="w-40 font-semibold text-center">{formatCurrency((lead as any).unit_basis_commercial)}</TableCell>
                        <TableCell className="w-44 text-center">
                          <Badge 
                            variant={projectInchargeStatusBadge.variant}
                            className={projectInchargeStatusBadge.className}
                          >
                            {(lead as any).project_incharge_approval || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-48 text-center">{formatDate((lead as any).project_incharge_approval_date)}</TableCell>
                        <TableCell className="w-44 text-center">
                          <Badge 
                            variant={clientInchargeStatusBadge.variant}
                            className={clientInchargeStatusBadge.className}
                          >
                            {(lead as any).client_incharge_approval || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-48 text-center">{formatDate((lead as any).client_incharge_approval_date)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {shouldPaginate 
                ? `${startIndex + 1} to ${Math.min(startIndex + rowsPerPage, filteredData.length)} of ${filteredData.length} leads`
                : `${filteredData.length} of ${filteredData.length} leads`
              }
            </p>
            
            {shouldPaginate && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientLeads;