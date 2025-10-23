import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Type definitions for our data structures
export type Validation = Tables<'validations'>;
export type Lead = Tables<'leads'>;
export type Project = Tables<'projects'>;
export type Client = Tables<'clients'>;

// Validation table queries
export const fetchValidations = async (filters?: {
  customerName?: string;
  projectName?: string;
  status?: string;
  revMonth?: string;
  customerId?: string;
}) => {
  const PAGE_SIZE = 1000;
  let allValidations: any[] = [];
  let from = 0;
  let to = PAGE_SIZE - 1;
  let fetchMore = true;

  console.log('fetchValidations - Starting batch fetch');

  while (fetchMore) {
    let query = supabase.from('validations').select('*');

    if (filters?.customerName) {
      query = query.ilike('customer_name', `%${filters.customerName}%`);
    }
    if (filters?.projectName) {
      query = query.ilike('project_name', `%${filters.projectName}%`);
    }
    if (filters?.status) {
      query = query.eq('validation_status', filters.status as 'Pending' | 'Approved' | 'Rejected');
    }
    if (filters?.revMonth) {
      query = query.eq('rev_month', filters.revMonth);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    const { data, error } = await query
      .order('sl_no', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching validations batch:', error);
      return { data: allValidations, error };
    }

    if (data && data.length > 0) {
      allValidations = [...allValidations, ...data];
      console.log(`fetchValidations - Fetched batch ${from}-${to}, total so far: ${allValidations.length}`);
      from += PAGE_SIZE;
      to += PAGE_SIZE;
    } else {
      fetchMore = false;
    }

    // If we got less than PAGE_SIZE records, we've reached the end
    if (data && data.length < PAGE_SIZE) {
      fetchMore = false;
    }
  }

  console.log('fetchValidations - Final result count:', allValidations.length);
  return { data: allValidations, error: null };
};

// Leads table queries - with pagination support and performance optimization
export const fetchLeads = async (projectId?: string, filters?: {
  projectInchargeApproval?: string;
  clientInchargeApproval?: string;
  workDateFrom?: string;
  workDateTo?: string;
  clientDateFrom?: string;
  clientDateTo?: string;
  revMonth?: string;
  zone?: string;
  city?: string;
  state?: string;
  role?: string;
  shift?: string;
  status?: string;
}, page: number = 0) => {
  const PAGE_SIZE = 1000; // Load 1000 records per batch
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  console.log(`fetchLeads - Fetching page ${page}, range ${from}-${to}, projectId:`, projectId);

  let query = supabase.from('leads').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Add additional filters if provided
  if (filters?.projectInchargeApproval) {
    query = query.eq('project_incharge_approval', filters.projectInchargeApproval);
  }
  if (filters?.clientInchargeApproval) {
    query = query.eq('client_incharge_approval', filters.clientInchargeApproval);
  }
  if (filters?.zone) {
    query = query.eq('Zone', filters.zone);
  }
  if (filters?.city) {
    query = query.eq('City', filters.city);
  }
  if (filters?.state) {
    query = query.eq('State', filters.state);
  }
  if (filters?.role) {
    query = query.eq('Role', filters.role);
  }
  if (filters?.shift) {
    query = query.eq('Shift', filters.shift);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  // Date range filters
  if (filters?.workDateFrom) {
    query = query.gte('final_work_completion_date', filters.workDateFrom);
  }
  if (filters?.workDateTo) {
    query = query.lte('final_work_completion_date', filters.workDateTo);
  }
  if (filters?.clientDateFrom) {
    query = query.gte('client_incharge_approval_date', filters.clientDateFrom);
  }
  if (filters?.clientDateTo) {
    query = query.lte('client_incharge_approval_date', filters.clientDateTo);
  }
  
  // If revMonth is provided, filter by matching month and year
  if (filters?.revMonth) {
    // Extract YYYY-MM from the date (e.g., "2024-11-15" -> "2024-11")
    const yearMonth = filters.revMonth.substring(0, 7); // Gets "2024-11"
    
    // Calculate the last day of the month
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(5, 7));
    const lastDay = new Date(year, month, 0).getDate(); // Gets 30 for November, 31 for January, etc.
    
    // Filter leads where final_work_completion_date matches the same month/year
    query = query.gte('final_work_completion_date', `${yearMonth}-01`)
                 .lte('final_work_completion_date', `${yearMonth}-${lastDay.toString().padStart(2, '0')}`);
  }

  const { data, error } = await query
    .order('lead_id', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('Error fetching leads:', error);
    return { data: null, error };
  }

  console.log(`fetchLeads - Fetched ${data?.length || 0} records for page ${page}`);
  return { data, error: null };
};

// Fetch all leads without pagination limits - for download functionality
export const fetchAllLeads = async (projectId?: string, filters?: {
  projectInchargeApproval?: string;
  clientInchargeApproval?: string;
  workDateFrom?: string;
  workDateTo?: string;
  clientDateFrom?: string;
  clientDateTo?: string;
  revMonth?: string;
  zone?: string;
  city?: string;
  state?: string;
  role?: string;
  shift?: string;
  status?: string;
}) => {
  console.log('fetchAllLeads - Fetching all leads with filters:', { projectId, filters });

  let query = supabase.from('leads').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Add additional filters if provided
  if (filters?.projectInchargeApproval) {
    query = query.eq('project_incharge_approval', filters.projectInchargeApproval);
  }
  if (filters?.clientInchargeApproval) {
    query = query.eq('client_incharge_approval', filters.clientInchargeApproval);
  }
  if (filters?.zone) {
    query = query.eq('Zone', filters.zone);
  }
  if (filters?.city) {
    query = query.eq('City', filters.city);
  }
  if (filters?.state) {
    query = query.eq('State', filters.state);
  }
  if (filters?.role) {
    query = query.eq('Role', filters.role);
  }
  if (filters?.shift) {
    query = query.eq('Shift', filters.shift);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  // Date range filters
  if (filters?.workDateFrom) {
    query = query.gte('final_work_completion_date', filters.workDateFrom);
  }
  if (filters?.workDateTo) {
    query = query.lte('final_work_completion_date', filters.workDateTo);
  }
  if (filters?.clientDateFrom) {
    query = query.gte('client_incharge_approval_date', filters.clientDateFrom);
  }
  if (filters?.clientDateTo) {
    query = query.lte('client_incharge_approval_date', filters.clientDateTo);
  }
  
  // If revMonth is provided, filter by matching month and year
  if (filters?.revMonth) {
    const yearMonth = filters.revMonth.substring(0, 7);
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(5, 7));
    const lastDay = new Date(year, month, 0).getDate();
    
    query = query.gte('final_work_completion_date', `${yearMonth}-01`)
                 .lte('final_work_completion_date', `${yearMonth}-${lastDay.toString().padStart(2, '0')}`);
  }

  const { data, error } = await query
    .order('lead_id', { ascending: true });

  if (error) {
    console.error('Error fetching all leads:', error);
    return { data: null, error };
  }

  console.log(`fetchAllLeads - Fetched ${data?.length || 0} total records`);
  return { data, error: null };
};

// Export leads to CSV
export const exportLeadsToCSV = (leads: any[], filename: string = 'leads.csv') => {
  if (!leads || leads.length === 0) {
    console.warn('No leads data to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Lead ID',
    'Project ID', 
    'Project Name',
    'Final Work Completion Date',
    'Revised Work Completion Date',
    'Unit Basis Commercial',
    'Project Incharge Approval',
    'Project Incharge Approval Date',
    'Client Incharge Approval',
    'Client Incharge Approval Date',
    'Original Work Completion Date',
    'Project ID (Alt)',
    'Zone',
    'City',
    'State',
    'TC Code',
    'Role',
    'Shift',
    'Status'
  ];

  // Convert leads data to CSV format
  const csvData = leads.map(lead => [
    lead.lead_id || '',
    lead.project_id || '',
    lead.project_name || '',
    lead.final_work_completion_date || '',
    lead.revisied_work_completion_date || '',
    lead.unit_basis_commercial || '',
    lead.project_incharge_approval || '',
    lead.project_incharge_approval_date || '',
    lead.client_incharge_approval || '',
    lead.client_incharge_approval_date || '',
    lead['Original_Work_Completion_Date'] || '',
    lead.projectid || '',
    lead.Zone || '',
    lead.City || '',
    lead.State || '',
    lead['TC Code'] || '',
    lead.Role || '',
    lead.Shift || '',
    lead.status || ''
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`Exported ${leads.length} leads to ${filename}`);
};

// Update lead approval status
export const updateLeadApproval = async (
  leadId: string,
  approval: 'Approved' | 'Rejected' | 'Pending',
  approvalType: 'client_incharge_approval' | 'project_incharge_approval'
) => {
  const updateData: any = {
    [approvalType]: approval,
  };

  // Set approval date if approved, clear if rejected/pending
  if (approvalType === 'client_incharge_approval') {
    updateData.client_incharge_approval_date = approval === 'Approved' ? new Date().toISOString() : null;
  } else if (approvalType === 'project_incharge_approval') {
    updateData.project_incharge_approval_date = approval === 'Approved' ? new Date().toISOString() : null;
  }

  return supabase
    .from('leads')
    .update(updateData)
    .eq('lead_id', leadId);
};

// Bulk approve leads - update both approval status and date
export const bulkApproveLeads = async (leadIds: string[], approvalType: 'client_incharge_approval' | 'project_incharge_approval' = 'client_incharge_approval') => {
  const updateData: any = {
    [approvalType]: 'Approved',
  };
  
  if (approvalType === 'client_incharge_approval') {
    updateData.client_incharge_approval_date = new Date().toISOString();
  } else {
    updateData.project_incharge_approval_date = new Date().toISOString();
  }

  return supabase
    .from('leads')
    .update(updateData)
    .in('lead_id', leadIds);
};

// Bulk reject leads - set approval status to rejected and clear date
export const bulkRejectLeads = async (leadIds: string[], approvalType: 'client_incharge_approval' | 'project_incharge_approval' = 'client_incharge_approval') => {
  const updateData: any = {
    [approvalType]: 'Rejected',
  };
  
  if (approvalType === 'client_incharge_approval') {
    updateData.client_incharge_approval_date = null;
  } else {
    updateData.project_incharge_approval_date = null;
  }

  return supabase
    .from('leads')
    .update(updateData)
    .in('lead_id', leadIds);
};

// Format revenue month for display
export const formatRevenueMonth = (revMonth: string | null) => {
  if (!revMonth || revMonth.trim() === '') {
    return '—';
  }
  try {
    // Handle both YYYY-MM-DD and YYYY-MM formats
    let dateStr = revMonth;
    
    // If it's in YYYY-MM format, add -01 to make it a valid date
    if (revMonth.match(/^\d{4}-\d{2}$/)) {
      dateStr = `${revMonth}-01`;
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (error) {
    return '—';
  }
};

// Format currency
export const formatCurrency = (amount: number | null) => {
  if (!amount) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Format date for display
export const formatDate = (dateString: string | null) => {
  if (!dateString || dateString.trim() === '') return '—';
  
  try {
    let date: Date;
    
    // Handle dd-mm-yyyy format (common in mock data)
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateString.split('-');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Handle standard date formats (ISO, etc.)
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return '—';
  }
};

// Get status badge color
export const getStatusBadge = (status: string | null): { variant: "default" | "secondary" | "destructive"; className: string } => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return { variant: 'default', className: 'bg-green-100 text-green-800' };
    case 'pending':
      return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' };
    case 'rejected':
      return { variant: 'destructive', className: 'bg-red-100 text-red-800' };
    default:
      return { variant: 'secondary', className: 'bg-gray-100 text-gray-800' };
  }
};

// Update revised work completion date for a single lead
export const updateLeadRevisedDate = async (leadId: string, revisedDate: string | null) => {
  const { data, error } = await supabase
    .from('leads')
    .update({ revisied_work_completion_date: revisedDate })
    .eq('lead_id', leadId)
    .select();

  if (error) {
    throw new Error(`Failed to update revised work completion date: ${error.message}`);
  }

  return data;
};
