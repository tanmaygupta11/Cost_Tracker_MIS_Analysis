// ✅ New Lead Schema Page - Using new 11-column structure
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { fetchLeads, formatCurrency, formatDate, getStatusBadge } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import { Download, ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LeadsSchema = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState(' ');
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
  
  console.log('LeadsSchema - URL params:', { customerId, projectId });
  
  // Fetch leads data from Supabase
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        console.log('LeadsSchema - Loading leads with projectId:', projectId);
        const { data, error } = await fetchLeads(projectId || undefined);
        
        console.log('LeadsSchema - Fetch result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('Error fetching leads:', error);
          setError('Failed to load leads data');
          return;
        }
        
        setLeads(data || []);
      } catch (err) {
        console.error('Error loading leads:', err);
        setError('Failed to load leads data');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeads();
  }, [projectId]);
  
  const rowsPerPage = 20;

  // ✅ Filter leads based on query parameters and manual filters
  const filteredData = useMemo(() => {
    
    return leads.filter(lead => {
      // ✅ Apply query parameter filters first
      // Since we're already filtering by project_id in the database query, we can skip that check here
      const matchesQueryCustomer = true; // Customer ID not in leads table
      const matchesQueryProject = true; // Already filtered in database query
      
      // ✅ Apply remaining manual filters
      const matchesStatus = !statusFilter || statusFilter.trim() === '' || statusFilter === ' ' || (lead as any).client_incharge_approval === statusFilter;
      
      
      // ✅ Apply Work Completion Date Range filter (using available date fields)
      let matchesWorkDate = true;
      if (workDateFrom || workDateTo) {
        // Try to use final_work_completion_date or fallback to other date fields
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
      
      const finalMatch = matchesQueryCustomer && matchesQueryProject && matchesStatus && matchesWorkDate && matchesClientDate;
      
      
      return finalMatch;
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

  const handleBulkDownload = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to download",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Download started",
      description: `Downloading ${selectedLeads.length} lead file(s)...`,
    });
  };



  // NEW: Check if any filters are active
  const hasActiveFilters = statusFilter !== ' ' || 
                          workDateFrom || 
                          workDateTo || 
                          clientDateFrom || 
                          clientDateTo;

  const clearFilters = () => {
    setStatusFilter(' ');
    setWorkDateFrom('');
    setWorkDateTo('');
    setClientDateFrom('');
    setClientDateTo('');
    setSelectedLeads([]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="finance" />
      
      <main className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-20 pb-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/finance-dashboard')}
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
            <p className="text-muted-foreground">Manage and track all leads</p>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="max-w-[150px]">
                  <SelectValue placeholder="Client Approval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Work Completion Date Range Filter */}
              <div className="flex items-center gap-2 min-w-[280px]">
                <label className="text-sm font-medium whitespace-nowrap">Work Completion Date:</label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={workDateFrom}
                    onChange={(e) => setWorkDateFrom(e.target.value)}
                    className="px-2 py-1 text-sm border border-border rounded-md bg-background"
                    placeholder="From"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={workDateTo}
                    onChange={(e) => setWorkDateTo(e.target.value)}
                    className="px-2 py-1 text-sm border border-border rounded-md bg-background"
                    placeholder="To"
                  />
                </div>
              </div>
              
              {/* Client Approval Date Range Filter */}
              <div className="flex items-center gap-2 min-w-[280px]">
                <label className="text-sm font-medium whitespace-nowrap">Client Approval Date:</label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={clientDateFrom}
                    onChange={(e) => setClientDateFrom(e.target.value)}
                    className="px-2 py-1 text-sm border border-border rounded-md bg-background"
                    placeholder="From"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={clientDateTo}
                    onChange={(e) => setClientDateTo(e.target.value)}
                    className="px-2 py-1 text-sm border border-border rounded-md bg-background"
                    placeholder="To"
                  />
                </div>
              </div>
              
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
            
            {selectedLeads.length > 0 && (
              <Button
                onClick={handleBulkDownload}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Selected ({selectedLeads.length})
              </Button>
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
              {shouldPaginate 
                ? `Showing ${startIndex + 1} to ${Math.min(startIndex + rowsPerPage, filteredData.length)} of ${filteredData.length} leads`
                : `Showing ${filteredData.length} of ${filteredData.length} leads`
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

export default LeadsSchema;