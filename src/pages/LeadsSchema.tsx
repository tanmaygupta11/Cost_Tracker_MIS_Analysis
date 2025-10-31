// ✅ New Lead Schema Page - Using new 11-column structure
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchLeads, fetchAllLeads, exportLeadsToCSV, formatCurrency, formatDate } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import { Download, ArrowLeft, X, Loader2, Plus } from "lucide-react";
import UploadLeadsCSVModal from "@/components/UploadLeadsCSVModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const LeadsSchema = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);
  const [workDateFrom, setWorkDateFrom] = useState('');
  const [workDateTo, setWorkDateTo] = useState('');
  const [clientDateFrom, setClientDateFrom] = useState('');
  const [clientDateTo, setClientDateTo] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [simulatingEmptyLoad, setSimulatingEmptyLoad] = useState(false);
  const [emptyLoadError, setEmptyLoadError] = useState<string | null>(null);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { role } = useAuth();
  
  // ✅ Get query parameters for filtering
  const customerId = searchParams.get('customer_id');
  const projectId = searchParams.get('project_id');
  const revMonth = searchParams.get('rev_month');
  // Note: validation_status and validation_file_id removed as they don't exist in new schema
  // const validationStatus = searchParams.get('validation_status');
  // const validationFileId = searchParams.get('validation_file_id');
  
  console.log('LeadsSchema - URL params:', { customerId, projectId, revMonth });
  
  // Calculate min/max dates for date pickers based on rev_month
  let minDate = '';
  let maxDate = '';
  if (revMonth) {
    const yearMonth = revMonth.substring(0, 7); // "2024-11"
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(5, 7));
    const lastDay = new Date(year, month, 0).getDate();
    
    minDate = `${yearMonth}-01`;
    maxDate = `${yearMonth}-${lastDay.toString().padStart(2, '0')}`;
  }
  
  // Fetch leads data from Supabase (initial load - first 100 records)
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        setCurrentBatch(0);
        setEmptyLoadError(null);
        setSimulatingEmptyLoad(false);
        console.log('LeadsSchema - Loading initial batch (page 0) with projectId:', projectId, 'revMonth:', revMonth);

        // Apply only revMonth filter as status-based filters are removed in new schema
        const filters: any = { revMonth: revMonth || undefined };

        const { data, error } = await fetchLeads(projectId || undefined, filters, 0, 100);
        
        console.log('LeadsSchema - Fetch result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('Error fetching leads:', error);
          setError('Failed to load leads data');
          setLoading(false);
          return;
        }
        
        // If no error but data length is 0, simulate 5s loading then show error
        if (data && data.length === 0) {
          setSimulatingEmptyLoad(true);
          // Wait 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5000));
          setSimulatingEmptyLoad(false);
          setEmptyLoadError('Failed to load data. Please retry after sometime');
          setLeads([]);
          setHasMoreData(false);
        } else {
          // Normal case: we have data
        setLeads(data || []);
          // If we got exactly 100 records, there might be more
          setHasMoreData((data?.length || 0) === 100);
        }
      } catch (err) {
        console.error('Error loading leads:', err);
        setError('Failed to load leads data');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeads();
  }, [projectId]);

  // Load more leads (next batch of 1000 records)
  const loadMoreLeads = async () => {
    try {
      const nextBatch = currentBatch + 1;
      console.log('LeadsSchema - Loading more leads, batch:', nextBatch);
      
      // Apply only revMonth filter as status-based filters are removed in new schema
      const filters: any = { revMonth: revMonth || undefined };

      const { data, error } = await fetchLeads(projectId || undefined, filters, nextBatch, 100);
      
      if (error) {
        console.error('Error fetching more leads:', error);
        toast({
          title: "Error loading more data",
          description: "Failed to load additional records. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (data && data.length > 0) {
        // Use concat instead of spread for better performance with large arrays
        setLeads(prevLeads => prevLeads.concat(data));
        setCurrentBatch(nextBatch);
        // If we got less than 100 records, there's no more data
        setHasMoreData(data.length === 100);
        
        toast({
          title: "✅ More records loaded",
          description: `Loaded ${data.length} additional records.`,
        });
      } else {
        setHasMoreData(false);
        toast({
          title: "No more records",
          description: "All available records have been loaded.",
        });
      }
    } catch (err) {
      console.error('Error loading more leads:', err);
      toast({
        title: "Error",
        description: "Failed to load more records.",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Download all leads handler
  const handleDownloadAll = async () => {
    try {
      setDownloading(true);
      
      // Apply only revMonth filter as status-based filters are removed in new schema
      const filters: any = { revMonth: revMonth || undefined };

      console.log('Downloading all leads with filters:', { projectId, filters });
      
      const { data, error } = await fetchAllLeads(projectId || undefined, filters);
      
      if (error) {
        console.error('Error fetching all leads:', error);
        toast({
          title: "Error",
          description: "Failed to fetch leads for download. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (!data || data.length === 0) {
        toast({
          title: "No data",
          description: "No leads found matching the current filters.",
          variant: "destructive"
        });
        return;
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `leads_${projectId || 'all'}_${timestamp}.csv`;
      
      // Export to CSV
      exportLeadsToCSV(data, filename);
      
      toast({
        title: "Download Complete",
        description: `Successfully downloaded ${data.length} leads to ${filename}`,
      });
      
    } catch (err) {
      console.error('Error downloading leads:', err);
      toast({
        title: "Error",
        description: "Failed to download leads. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  // Retry handler for empty load error
  const handleRetry = () => {
    setEmptyLoadError(null);
    setError(null);
    setLoading(true);
    setCurrentBatch(0);
    setLeads([]);
    
    // Trigger reload by calling the same fetch logic
    const loadLeads = async () => {
      try {
        const filters: any = { revMonth: revMonth || undefined };
        
        const { data, error } = await fetchLeads(projectId || undefined, filters, 0, 100);
        
        if (error) {
          console.error('Error fetching leads:', error);
          setError('Failed to load leads data');
          setLoading(false);
          return;
        }
        
        // If no error but data length is 0, simulate 5s loading then show error
        if (data && data.length === 0) {
          setSimulatingEmptyLoad(true);
          await new Promise(resolve => setTimeout(resolve, 5000));
          setSimulatingEmptyLoad(false);
          setEmptyLoadError('Failed to load data. Please retry after sometime');
          setLeads([]);
          setHasMoreData(false);
        } else {
          setLeads(data || []);
          setHasMoreData((data?.length || 0) === 100);
          setEmptyLoadError(null);
        }
      } catch (err) {
        console.error('Error loading leads:', err);
        setError('Failed to load leads data');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeads();
  };

  // Handler for Load More button - sets loading state immediately
  const handleLoadMore = () => {
    // IMMEDIATELY update the button's disabled state (bypassing React)
    if (loadMoreButtonRef.current) {
      loadMoreButtonRef.current.disabled = true;
    }
    
    // Set loading state (React will re-render, but button is already disabled)
    setLoadingMore(true);
    
    // Use requestAnimationFrame to ensure DOM has updated before starting async work
    requestAnimationFrame(() => {
      loadMoreLeads();
    });
  };

  // ✅ Filter leads based on query parameters and manual filters
  const filteredData = useMemo(() => {
    const filtered = leads.filter(lead => {
      // ✅ Apply query parameter filters first
      // Since we're already filtering by project_id in the database query, we can skip that check here
      const matchesQueryCustomer = true; // Customer ID not in leads table
      const matchesQueryProject = true; // Already filtered in database query
      
      // ✅ Apply remaining manual filters
      // Status filter removed - no longer filtering by approval status
      
      
      // ✅ Apply Work Completion Date Range filter (using available date fields)
      let matchesWorkDate = true;
      if (workDateFrom || workDateTo) {
        // Use original_work_completion_date primarily, fallback to created_at
        const dateField = (lead as any).original_work_completion_date || (lead as any).created_at;
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
        const dateField = (lead as any).client_incharge_approval_date || (lead as any).original_work_completion_date || (lead as any).created_at;
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
      
      const finalMatch = matchesQueryProject && 
                         matchesWorkDate && 
                         matchesClientDate;
      
      return finalMatch;
    });
    
    console.log(`LeadsSchema - Filtered: ${filtered.length} leads out of ${leads.length} total loaded`);
    return filtered;
  }, [leads, projectId, workDateFrom, workDateTo, clientDateFrom, clientDateTo]);

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredData.map(lead => lead.lead_id));
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

    // Get selected leads data from filteredData
    const selectedLeadsData = filteredData.filter(lead => selectedLeads.includes(lead.lead_id));
    
    // CSV headers matching all visible table columns
      const headers = [
      'User ID',
      'Cost',
      'Lead ID',
      'Project ID',
      'Project Name',
        'Lead Type',
        'Original Work Completion Date',
        'Revised Work Completion Date',
        'Final Work Completion Date',
      'Unit Basis Commercial',
      'Project Incharge Approval',
      'Project Incharge Approval Date',
      'Client Incharge Approval',
              'Client Incharge Approval Date',
              'Zone',
              'City',
              'State',
              ...(showAdditionalColumns ? ['TC Code', 'Role', 'Shift'] : [])
    ];

    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...selectedLeadsData.map(lead => [
        (lead as any).user_id || '',
        (lead as any).cost || '',
        lead.lead_id,
        lead.project_id || '',
        lead.project_name || '',
        (lead as any).lead_type || '',
        formatDate((lead as any).original_work_completion_date),
        formatDate((lead as any).revisied_work_completion_date),
        formatDate((lead as any).final_work_completion_date),
        lead.unit_basis_commercial || '',
        lead.project_incharge_approval || '',
        formatDate(lead.project_incharge_approval_date),
        lead.client_incharge_approval || '',
        formatDate(lead.client_incharge_approval_date),
        (lead as any).zone || '',
        (lead as any).city || '',
        (lead as any).state || '',
        ...(showAdditionalColumns ? [
          (lead as any).tc_code || '',
          (lead as any).role || '',
          (lead as any).shift || ''
        ] : [])
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `finance_leads_export_${timestamp}.csv`;
    
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
  const hasActiveFilters = workDateFrom || 
                          workDateTo || 
                          clientDateFrom || 
                          clientDateTo;

  const clearFilters = () => {
    setWorkDateFrom('');
    setWorkDateTo('');
    setClientDateFrom('');
    setClientDateTo('');
    setSelectedLeads([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole={role || 'finance'} />
      
      <main className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-20 pb-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/mis-dashboard')}
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

        <div className="mb-4 flex gap-3">
          <Button
            onClick={() => setShowAdditionalColumns(!showAdditionalColumns)}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showAdditionalColumns ? 'Hide Additional Columns' : 'Show Additional Columns'}
          </Button>
          
          <Button
            onClick={handleDownloadAll}
            disabled={downloading}
            variant="default"
            className="flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download All Leads
              </>
            )}
          </Button>

          {role === 'admin' && (
            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="default"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add via CSV
            </Button>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          {loading || simulatingEmptyLoad ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading leads data...</p>
              </div>
            </div>
          ) : emptyLoadError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-red-500 text-lg font-medium">{emptyLoadError}</p>
              <Button
                onClick={handleRetry}
                variant="default"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                Retry
              </Button>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
          <div className="flex flex-wrap gap-3 items-end justify-between mb-6">
            <div className="flex flex-wrap gap-3 flex-1">
              {/* Work Completion Date Range Filter */}
              <div className="flex-1 min-w-[280px]">
                <label className="text-sm font-medium mb-2 block">Work Completion Date</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={workDateFrom}
                    onChange={(e) => setWorkDateFrom(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background"
                    placeholder="From"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={workDateTo}
                    onChange={(e) => setWorkDateTo(e.target.value)}
                    min={minDate}
                    max={maxDate}
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
                    min={minDate}
                    max={maxDate}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background"
                    placeholder="From"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={clientDateTo}
                    onChange={(e) => setClientDateTo(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background"
                    placeholder="To"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
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
            <Table className="w-full" style={{ minWidth: showAdditionalColumns ? '2000px' : '1600px' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={filteredData.length > 0 && filteredData.every(l => selectedLeads.includes(l.lead_id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">User ID</TableHead>
                  <TableHead className="w-32 text-center whitespace-normal break-words">Cost</TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">Lead ID</TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">Project ID</TableHead>
                  <TableHead className="w-48 text-center whitespace-normal break-words">Project Name</TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">Lead Type</TableHead>
                  {/* <TableHead className="w-44 text-center whitespace-normal break-words">Final Work Completion Date</TableHead> */}
                  <TableHead className="w-44 text-center whitespace-normal break-words">
                    <div>
                      <div>Work</div>
                      <div>Completion Date</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-32 text-center whitespace-normal break-words">
                    <div>
                      <div>Unit Basis</div>
                      <div>Commercial</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">
                    <div>
                      <div>Project Incharge</div>
                      <div>Approval</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-48 text-center whitespace-normal break-words">
                    <div>
                      <div>Project Incharge</div>
                      <div>Approval Date</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">
                    <div>
                      <div>Revised Work</div>
                      <div>Completion Date</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">
                    <div>
                      <div>Final Work</div>
                      <div>Completion Date</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">
                    <div>
                      <div>Client Incharge</div>
                      <div>Approval</div>
                    </div>
                  </TableHead>
                  <TableHead className="w-48 text-center whitespace-normal break-words">
                    <div>
                      <div>Client Incharge</div>
                      <div>Approval Date</div>
                    </div>
                  </TableHead>
                  {/* Always visible location columns */}
                  <TableHead className="w-32 text-center whitespace-normal break-words">Zone</TableHead>
                  <TableHead className="w-32 text-center whitespace-normal break-words">City</TableHead>
                  <TableHead className="w-32 text-center whitespace-normal break-words">State</TableHead>
                  {/* Additional optional columns */}
                  {showAdditionalColumns && (
                    <>
                      <TableHead className="w-32 text-center whitespace-normal break-words">TC Code</TableHead>
                      <TableHead className="w-32 text-center whitespace-normal break-words">Role</TableHead>
                      <TableHead className="w-32 text-center whitespace-normal break-words">Shift</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showAdditionalColumns ? 20 : 14} className="text-center py-12">
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
                  filteredData.map((lead) => {
                    return (
                      <TableRow key={lead.lead_id}>
                        <TableCell className="w-12 text-center">
                          <Checkbox
                            checked={selectedLeads.includes(lead.lead_id)}
                            onCheckedChange={(checked) => handleSelectLead(lead.lead_id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="w-28 font-mono text-sm text-center">{(lead as any).user_id || '—'}</TableCell>
                        <TableCell className="w-32 text-center">{formatCurrency((lead as any).cost)}</TableCell>
                        <TableCell className="w-28 font-mono text-sm text-center">{lead.lead_id}</TableCell>
                        <TableCell className="w-28 font-mono text-sm text-center">{lead.project_id || '—'}</TableCell>
                        <TableCell className="w-48 font-medium text-center whitespace-normal break-words">{lead.project_name || '—'}</TableCell>
                        <TableCell className="w-28 text-center">{(lead as any).lead_type || '—'}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).original_work_completion_date)}</TableCell>
                        <TableCell className="w-32 text-center">{formatCurrency(lead.unit_basis_commercial)}</TableCell>
                        <TableCell className="w-44 text-center">{lead.project_incharge_approval || '—'}</TableCell>
                        <TableCell className="w-48 text-center">{formatDate(lead.project_incharge_approval_date)}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).revisied_work_completion_date)}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).final_work_completion_date)}</TableCell>
                        <TableCell className="w-44 text-center">{lead.client_incharge_approval || '—'}</TableCell>
                        <TableCell className="w-48 text-center">{formatDate(lead.client_incharge_approval_date)}</TableCell>
                        {/* Always visible location cells */}
                        <TableCell className="w-32 text-center">{(lead as any).zone || '—'}</TableCell>
                        <TableCell className="w-32 text-center">{(lead as any).city || '—'}</TableCell>
                        <TableCell className="w-32 text-center">{(lead as any).state || '—'}</TableCell>
                        {/* Optional columns */}
                        {showAdditionalColumns && (
                          <>
                            <TableCell className="w-32 text-center">{(lead as any).tc_code || '—'}</TableCell>
                            <TableCell className="w-32 text-center">{(lead as any).role || '—'}</TableCell>
                            <TableCell className="w-32 text-center">{(lead as any).shift || '—'}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredData.length} lead{filteredData.length !== 1 ? 's' : ''} (Loaded {leads.length} total records)
            </p>
          </div>

          {/* Load More Button */}
          {!loading && hasMoreData && (
            <div className="flex justify-center mt-6">
              <Button
                ref={loadMoreButtonRef}
                onClick={handleLoadMore}
                disabled={loadingMore}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more records...</span>
                  </div>
                ) : (
                  <>
                    Load More Records
                    <span className="ml-2 text-sm opacity-80">(Next 100)</span>
                  </>
                )}
              </Button>
            </div>
          )}
            </>
          )}
        </div>
      </main>

      {/* CSV Upload Modal for Leads */}
      <UploadLeadsCSVModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          setIsUploadOpen(false);
          // Reload first page to reflect new data
          const reload = async () => {
            const { data } = await fetchLeads(projectId || undefined, { revMonth: revMonth || undefined }, 0, 100);
            setLeads(data || []);
          };
          reload();
        }}
      />
    </div>
  );
};

export default LeadsSchema;