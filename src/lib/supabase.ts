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

  return query.order('created_at', { ascending: false });
};

// Leads table queries
export const fetchLeads = async (projectId?: string, filters?: {
  status?: string;
  workDateFrom?: string;
  workDateTo?: string;
  clientDateFrom?: string;
  clientDateTo?: string;
}) => {
  let query = supabase.from('leads').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Note: The current leads table schema doesn't match the requirements exactly
  // We'll need to adapt the filtering logic based on available columns
  
  // Order by lead_id since created_at column doesn't exist in the leads table
  return query.order('lead_id', { ascending: true });
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
    const date = new Date(`${revMonth}-01`);
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
