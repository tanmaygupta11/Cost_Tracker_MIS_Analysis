// ✅ New Client Lead Schema Page - Using new 11-column structure with Client-specific actions
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchLeads, fetchAllLeads, exportLeadsToCSV, formatCurrency, formatDate, bulkApproveLeads, bulkRejectLeads, updateLeadRevisedDate } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import { ArrowLeft, Check, X, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClient } from "@/contexts/ClientContext";

const ClientLeads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customerId: clientCustomerId, customerName } = useClient();
  const [searchParams] = useSearchParams();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);
  const [workDateFrom, setWorkDateFrom] = useState('');
  const [workDateTo, setWorkDateTo] = useState('');
  const [clientDateFrom, setClientDateFrom] = useState('');
  const [clientDateTo, setClientDateTo] = useState('');
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  
  // ✅ Get query parameters for filtering
  const customerId = searchParams.get('customer_id');
  const projectId = searchParams.get('project_id');
  const revMonth = searchParams.get('rev_month');
  const validationStatus = searchParams.get('validation_status');
  const validationFileId = searchParams.get('validation_file_id');
  
  console.log('ClientLeads - URL params:', { customerId, projectId, revMonth, validationStatus, validationFileId });
  
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
  
  
  // Fetch leads data from Supabase
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        
        console.log('ClientLeads - Loading leads with projectId:', projectId, 'revMonth:', revMonth, 'validationStatus:', validationStatus);
        
        // Apply status filter based on validation status
        const filters: any = { revMonth: revMonth || undefined };
        if (validationStatus === 'Approved') {
          filters.status = 'Completed';
        } else if (validationStatus === 'Rejected') {
          filters.status = 'Incomplete';
          if (validationFileId) {
            filters.validation_file_id = validationFileId;
          }
        }
        // If validationStatus is any other status, don't add status filter
        
        const { data, error } = await fetchLeads(projectId || undefined, filters, 0);
        
        console.log('ClientLeads - Fetch result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('Error fetching leads:', error);
          setError('Failed to load leads data');
          return;
        }
        
        setLeads(data || []);
        setCurrentBatch(0);
        setHasMoreData((data?.length || 0) === 1000);
      } catch (err) {
        console.error('Error loading leads:', err);
        setError('Failed to load leads data');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeads();
  }, [projectId, clientCustomerId, customerName, revMonth]);
  
  // Load more leads (next batch of 1000)
  const loadMoreLeads = async () => {
    try {
      const nextBatch = currentBatch + 1;
      console.log(`ClientLeads - Loading more leads, batch ${nextBatch}`);
      
      // Apply status filter based on validation status
      const filters: any = { revMonth: revMonth || undefined };
      if (validationStatus === 'Approved') {
        filters.status = 'Completed';
      }
      // If validationStatus is 'Rejected' or any other status, don't add status filter
      
      const { data, error } = await fetchLeads(projectId || undefined, filters, nextBatch);
      
      if (error) {
        console.error('Error loading more leads:', error);
        toast({
          title: "Error loading more records",
          description: "Failed to fetch additional leads",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`ClientLeads - Loaded ${data?.length || 0} more records`);
      
      // Append new data to existing leads
      setLeads(prevLeads => prevLeads.concat(data || []));
      setCurrentBatch(nextBatch);
      setHasMoreData((data?.length || 0) === 1000);
    } catch (err) {
      console.error('Error in loadMoreLeads:', err);
      toast({
        title: "Error",
        description: "Failed to load more records",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };
  
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
    return leads.filter(lead => {
      // ✅ Apply query parameter filters first
      const matchesQueryCustomer = true; // Customer ID not in leads table
      const matchesQueryProject = !projectId || lead.project_id === projectId;
      
      // ✅ Apply Work Completion Date Range filter (using available date fields)
      let matchesWorkDate = true;
      if (workDateFrom || workDateTo) {
        // Use original_work_completion_date primarily, fallback to lead_id for ordering
        const dateField = (lead as any).original_work_completion_date || (lead as any).lead_id;
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
        const dateField = (lead as any).client_incharge_approval_date || (lead as any).original_work_completion_date || (lead as any).lead_id;
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
      
      return matchesQueryProject && matchesWorkDate && matchesClientDate;
    });
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
      const { error } = await bulkApproveLeads(selectedLeads);
      
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
        title: "Success",
        description: `${selectedLeads.length} lead(s) approved successfully`,
      });
      
      // Clear selection
      setSelectedLeads([]);
      
      // Reload leads data
      const filters: any = { revMonth: revMonth || undefined };
      if (validationStatus === 'Approved') {
        filters.status = 'Completed';
      } else if (validationStatus === 'Rejected') {
        filters.status = 'Incomplete';
        if (validationFileId) {
          filters.validation_file_id = validationFileId;
        }
      }
      const { data } = await fetchLeads(projectId || undefined, filters, currentBatch);
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
      const { error } = await bulkRejectLeads(selectedLeads);
      
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
        title: "Success",
        description: `${selectedLeads.length} lead(s) rejected successfully`,
      });
      
      // Clear selection
      setSelectedLeads([]);
      
      // Reload leads data
      const filters: any = { revMonth: revMonth || undefined };
      if (validationStatus === 'Approved') {
        filters.status = 'Completed';
      } else if (validationStatus === 'Rejected') {
        filters.status = 'Incomplete';
        if (validationFileId) {
          filters.validation_file_id = validationFileId;
        }
      }
      const { data } = await fetchLeads(projectId || undefined, filters, currentBatch);
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
    const selectedLeadsData = filteredData.filter(lead => selectedLeads.includes(lead.lead_id));
    
    // CSV headers matching table columns
      const headers = [
      'Lead ID',
      'Project ID',
      'Project Name',
      'Final Work Completion Date',
        'Original Work Completion Date',
      'Unit Basis Commercial',
      'Project Incharge Approval',
      'Project Incharge Approval Date',
      'Revised Work Completion Date',
      'Client Incharge Approval',
      'Client Incharge Approval Date',
      ...(showAdditionalColumns ? ['Zone', 'City', 'State', 'TC Code', 'Role', 'Shift'] : [])
    ];

    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...selectedLeadsData.map(lead => [
        lead.lead_id,
        lead.project_id || '',
        lead.project_name || '',
        formatDate((lead as any).final_work_completion_date),
        formatDate((lead as any).original_work_completion_date),
        lead.unit_basis_commercial || '',
        lead.project_incharge_approval || '',
        formatDate(lead.project_incharge_approval_date),
        formatDate((lead as any).revised_work_completion_date),
        lead.client_incharge_approval || '',
        formatDate(lead.client_incharge_approval_date),
        ...(showAdditionalColumns ? [
          lead["Zone"] || '',
          lead["City"] || '',
          lead["State"] || '',
          lead["TC Code"] || '',
          lead["Role"] || '',
          lead["Shift"] || ''
        ] : [])
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

  // Edit functionality for Revised Work Completion Date
  const handleEditDate = (leadId: string, currentDate: string | null) => {
    setEditingLeadId(leadId);
    // Convert date to YYYY-MM-DD format for input
    const formattedDate = currentDate ? new Date(currentDate).toISOString().split('T')[0] : '';
    setEditingDate(formattedDate);
  };

  const handleSaveDate = async (leadId: string) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Convert date back to the format expected by the database
      const dateToSave = editingDate ? new Date(editingDate).toISOString() : null;
      
      // Update local state immediately for better UX
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.lead_id === leadId 
            ? { ...lead, revised_work_completion_date: dateToSave } as any
            : lead
        )
      );

      // Update database
      await updateLeadRevisedDate(leadId, dateToSave);

      // Reset editing state
      setEditingLeadId(null);
      setEditingDate('');
      
      toast({
        title: "Success",
        description: "Revised work completion date updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update revised work completion date.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLeadId(null);
    setEditingDate('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, leadId: string) => {
    if (e.key === 'Enter') {
      handleSaveDate(leadId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Download all leads handler
  const handleDownloadAll = async () => {
    try {
      setDownloading(true);
      
      // Apply status filter based on validation status
      const filters: any = { revMonth: revMonth || undefined };
      if (validationStatus === 'Approved') {
        filters.status = 'Completed';
      } else if (validationStatus === 'Rejected') {
        filters.status = 'Incomplete';
        if (validationFileId) {
          filters.validation_file_id = validationFileId;
        }
      }
      
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
      const filename = `client_leads_${projectId || 'all'}_${timestamp}.csv`;
      
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

  // Get revenue month date range based on URL parameter
  const getRevenueMonthRange = () => {
    console.log('getRevenueMonthRange called with revMonth:', revMonth);
    if (!revMonth) {
      // If no revenue month parameter, allow all dates (fallback)
      return { min: '', max: '' };
    }

    try {
      // Parse revenue month (assuming format like "2024-01" or "2024-01-01")
      const year = revMonth.substring(0, 4);
      const month = revMonth.substring(5, 7);
      
      // First day of the month
      const firstDay = `${year}-${month}-01`;
      
      // Last day of the month
      const lastDay = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      console.log('Date range calculated:', { min: firstDay, max: lastDay });
      return { min: firstDay, max: lastDay };
    } catch (error) {
      console.error('Error parsing revenue month:', error);
      return { min: '', max: '' };
    }
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
              Showing leads for Project ID: <span className="font-mono">{projectId}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">Manage and track your project leads</p>
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
            <Table className="w-full" style={{ minWidth: showAdditionalColumns ? '2000px' : '1400px' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={filteredData.length > 0 && filteredData.every(l => selectedLeads.includes(l.lead_id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">Lead ID</TableHead>
                  <TableHead className="w-28 text-center whitespace-normal break-words">Project ID</TableHead>
                  <TableHead className="w-48 text-center whitespace-normal break-words">Project Name</TableHead>
                  <TableHead className="w-44 text-center whitespace-normal break-words">Final Work Completion Date</TableHead>
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
                  {showAdditionalColumns && (
                    <>
                      <TableHead className="w-32 text-center whitespace-normal break-words">Zone</TableHead>
                      <TableHead className="w-32 text-center whitespace-normal break-words">City</TableHead>
                      <TableHead className="w-32 text-center whitespace-normal break-words">State</TableHead>
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
                    <TableCell colSpan={showAdditionalColumns ? 18 : 12} className="text-center py-12">
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
                        <TableCell className="w-28 font-mono text-sm text-center">{lead.lead_id}</TableCell>
                        <TableCell className="w-28 font-mono text-sm text-center">{lead.project_id || '—'}</TableCell>
                        <TableCell className="w-48 font-medium text-center whitespace-normal break-words">{lead.project_name || '—'}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).final_work_completion_date)}</TableCell>
                        <TableCell className="w-44 text-center">{formatDate((lead as any).original_work_completion_date)}</TableCell>
                        <TableCell className="w-32 text-center">{formatCurrency(lead.unit_basis_commercial)}</TableCell>
                        <TableCell className="w-44 text-center">{lead.project_incharge_approval || '—'}</TableCell>
                        <TableCell className="w-48 text-center">{formatDate(lead.project_incharge_approval_date)}</TableCell>
                        <TableCell className="w-44 text-center">
                          {editingLeadId === lead.lead_id ? (
                            <div className="flex items-center justify-center gap-2">
                              {(() => {
                                const dateRange = getRevenueMonthRange();
                                return (
                                  <input
                                    type="date"
                                    value={editingDate}
                                    onChange={(e) => setEditingDate(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, lead.lead_id)}
                                    onBlur={() => handleSaveDate(lead.lead_id)}
                                    className="px-2 py-1 text-sm border border-border rounded bg-background"
                                    autoFocus
                                    disabled={isSaving}
                                    min={dateRange.min}
                                    max={dateRange.max}
                                    title={dateRange.min && dateRange.max ? `Select date between ${dateRange.min} and ${dateRange.max}` : 'Select date'}
                                  />
                                );
                              })()}
                              {isSaving && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                              onClick={() => handleEditDate(lead.lead_id, (lead as any).revised_work_completion_date)}
                              title="Click to edit"
                            >
                              {formatDate((lead as any).revised_work_completion_date)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-44 text-center">{lead.client_incharge_approval || '—'}</TableCell>
                        <TableCell className="w-48 text-center">{formatDate(lead.client_incharge_approval_date)}</TableCell>
                        {showAdditionalColumns && (
                          <>
                            <TableCell className="w-32 text-center">{lead["Zone"] || '—'}</TableCell>
                            <TableCell className="w-32 text-center">{lead["City"] || '—'}</TableCell>
                            <TableCell className="w-32 text-center">{lead["State"] || '—'}</TableCell>
                            <TableCell className="w-32 text-center">{lead["TC Code"] || '—'}</TableCell>
                            <TableCell className="w-32 text-center">{lead["Role"] || '—'}</TableCell>
                            <TableCell className="w-32 text-center">{lead["Shift"] || '—'}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center gap-4 mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredData.length} of {leads.length} total loaded leads
            </p>
            
            {hasMoreData && (
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
                    <span className="ml-2 text-sm opacity-80">(Next 1000)</span>
                  </>
                )}
              </Button>
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