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
  status?: string;
  workDateFrom?: string;
  workDateTo?: string;
  clientDateFrom?: string;
  clientDateTo?: string;
  customerId?: string;
  revMonth?: string;
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
  if (filters?.status) {
    query = query.eq('lead_status', filters.status);
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
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


// Update lead approval status
export const updateLeadApproval = async (
  leadId: string,
  approval: 'Approved' | 'Rejected',
  approvalType: 'client_incharge_approval' | 'project_incharge_approval'
) => {
  const updateData: any = {
    [approvalType]: approval,
  };

  // Set approval date if it's not already set
  if (approvalType === 'client_incharge_approval') {
    updateData.client_incharge_approval_date = new Date().toISOString();
  } else if (approvalType === 'project_incharge_approval') {
    updateData.project_incharge_approval_date = new Date().toISOString();
  }

  return supabase
    .from('leads')
    .update(updateData)
    .eq('lead_id', leadId);
};

// Bulk update lead approvals
export const bulkUpdateLeadApprovals = async (
  leadIds: string[],
  approval: 'Approved' | 'Rejected',
  approvalType: 'client_incharge_approval' | 'project_incharge_approval'
) => {
  const updateData: any = {
    [approvalType]: approval,
  };

  // Set approval date
  if (approvalType === 'client_incharge_approval') {
    updateData.client_incharge_approval_date = new Date().toISOString();
  } else if (approvalType === 'project_incharge_approval') {
    updateData.project_incharge_approval_date = new Date().toISOString();
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
