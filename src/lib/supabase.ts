import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Type definitions for our data structures
export type MISRecord = Tables<'mis_records'>;
export type Lead = Tables<'leads'>;
export type ActiveWorker = Tables<'active_workers'>;

// MIS Records table queries (replaces validations)
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
    let query = supabase.from('mis_records').select('*');

    if (filters?.customerName) {
      query = query.ilike('customer_name', `%${filters.customerName}%`);
    }
    if (filters?.projectName) {
      query = query.ilike('project_name', `%${filters.projectName}%`);
    }
    // Note: status filter removed as mis_records doesn't have validation_status
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
      console.error('Error fetching mis_records batch:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If table doesn't exist (PGRST205), return empty array with helpful message
      if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Table mis_records does not exist in your database!');
        console.warn('Please run the SQL script create_mis_tables.sql in your Supabase SQL editor to create the table.');
        console.warn('Or verify the table name and that RLS policies allow access.');
        // Return empty array instead of error to prevent app crash
        return { data: [], error: { ...error, isTableMissing: true } };
      }
      
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
  validation_file_id?: string;
}, page: number = 0, pageSize: number = 1000) => {
  const PAGE_SIZE = pageSize; // Customizable page size (default: 1000 for backward compatibility)
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  console.log(`fetchLeads - Fetching page ${page}, range ${from}-${to}, projectId:`, projectId);

  let query = supabase.from('leads').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Add additional filters if provided
  // Approvals are TEXT now: use canonical values 'Approved' | 'Rejected' | 'Pending'
  const normalizeApproval = (v: string | undefined) => {
    if (!v) return undefined;
    const s = v.toLowerCase();
    if (['true', 'approved', 'approve'].includes(s)) return 'Approved';
    if (['false', 'rejected', 'reject'].includes(s)) return 'Rejected';
    if (['pending'].includes(s)) return 'Pending';
    return v; // use as provided
  };
  if (filters?.projectInchargeApproval !== undefined) {
    const val = normalizeApproval(filters.projectInchargeApproval);
    if (val) query = query.eq('project_incharge_approval', val);
  }
  if (filters?.clientInchargeApproval !== undefined) {
    const val = normalizeApproval(filters.clientInchargeApproval);
    if (val) query = query.eq('client_incharge_approval', val);
  }
  // Column names are now lowercase in new schema
  if (filters?.zone) {
    query = query.eq('zone', filters.zone);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }
  if (filters?.state) {
    query = query.eq('state', filters.state);
  }
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  if (filters?.shift) {
    query = query.eq('shift', filters.shift);
  }
  // Note: status and validation_file_id columns don't exist in new schema
  
  // Date range filters - now using original_work_completion_date
  if (filters?.workDateFrom) {
    query = query.gte('original_work_completion_date', filters.workDateFrom);
  }
  if (filters?.workDateTo) {
    query = query.lte('original_work_completion_date', filters.workDateTo);
  }
  if (filters?.clientDateFrom) {
    query = query.gte('client_incharge_approval_date', filters.clientDateFrom);
  }
  if (filters?.clientDateTo) {
    query = query.lte('client_incharge_approval_date', filters.clientDateTo);
  }
  
  // If revMonth is provided, filter by matching month and year using original_work_completion_date
  if (filters?.revMonth) {
    // Extract YYYY-MM from the date (e.g., "2024-11-15" -> "2024-11")
    const yearMonth = filters.revMonth.substring(0, 7); // Gets "2024-11"
    
    // Calculate the last day of the month
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(5, 7));
    const lastDay = new Date(year, month, 0).getDate(); // Gets 30 for November, 31 for January, etc.
    
    // Filter leads where original_work_completion_date matches the same month/year
    query = query.gte('original_work_completion_date', `${yearMonth}-01`)
                 .lte('original_work_completion_date', `${yearMonth}-${lastDay.toString().padStart(2, '0')}`);
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
  validation_file_id?: string;
}) => {
  console.log('fetchAllLeads - Fetching all leads with filters:', { projectId, filters });

  let query = supabase.from('leads').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Add additional filters if provided (TEXT approvals)
  const normalizeApproval2 = (v: string | undefined) => {
    if (!v) return undefined;
    const s = v.toLowerCase();
    if (['true', 'approved', 'approve'].includes(s)) return 'Approved';
    if (['false', 'rejected', 'reject'].includes(s)) return 'Rejected';
    if (['pending'].includes(s)) return 'Pending';
    return v;
  };
  if (filters?.projectInchargeApproval !== undefined) {
    const val = normalizeApproval2(filters.projectInchargeApproval);
    if (val) query = query.eq('project_incharge_approval', val);
  }
  if (filters?.clientInchargeApproval !== undefined) {
    const val = normalizeApproval2(filters.clientInchargeApproval);
    if (val) query = query.eq('client_incharge_approval', val);
  }
  // Column names are now lowercase in new schema
  if (filters?.zone) {
    query = query.eq('zone', filters.zone);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }
  if (filters?.state) {
    query = query.eq('state', filters.state);
  }
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  if (filters?.shift) {
    query = query.eq('shift', filters.shift);
  }
  // Note: status and validation_file_id columns don't exist in new schema
  
  // Date range filters - now using original_work_completion_date
  if (filters?.workDateFrom) {
    query = query.gte('original_work_completion_date', filters.workDateFrom);
  }
  if (filters?.workDateTo) {
    query = query.lte('original_work_completion_date', filters.workDateTo);
  }
  if (filters?.clientDateFrom) {
    query = query.gte('client_incharge_approval_date', filters.clientDateFrom);
  }
  if (filters?.clientDateTo) {
    query = query.lte('client_incharge_approval_date', filters.clientDateTo);
  }
  
  // If revMonth is provided, filter by matching month and year using original_work_completion_date
  if (filters?.revMonth) {
    const yearMonth = filters.revMonth.substring(0, 7);
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(5, 7));
    const lastDay = new Date(year, month, 0).getDate();
    
    query = query.gte('original_work_completion_date', `${yearMonth}-01`)
                 .lte('original_work_completion_date', `${yearMonth}-${lastDay.toString().padStart(2, '0')}`);
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

  // Define CSV headers - updated for new schema
  const headers = [
    'User ID',
    'Cost',
    'Lead Type',
    'Lead ID',
    'Project ID', 
    'Project ID (Alt)',
    'Project Name',
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
    'TC Code',
    'Role',
    'Shift'
  ];

  // Convert leads data to CSV format - updated for new schema
  const csvData = leads.map(lead => [
    lead.user_id || '',
    lead.cost || '',
    lead.lead_type || '',
    lead.lead_id || '',
    lead.project_id || '',
    lead.projectid || '',
    lead.project_name || '',
    (lead as any).original_work_completion_date || '',
    lead.revised_work_completion_date || '',
    lead.final_work_completion_date || '',
    lead.unit_basis_commercial || '',
    lead.project_incharge_approval || 'Pending',
    lead.project_incharge_approval_date || '',
    lead.client_incharge_approval || 'Pending',
    lead.client_incharge_approval_date || '',
    lead.zone || '',
    lead.city || '',
    lead.state || '',
    lead.tc_code || '',
    lead.role || '',
    lead.shift || ''
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

// Export MIS records to CSV
export const exportMisRecordsToCSV = (records: MISRecord[], filename: string = 'mis_records.csv') => {
  if (!records || records.length === 0) {
    console.warn('No MIS records to export');
    return;
  }

  const headers = [
    'SL No',
    'Rev Month',
    'Customer Name',
    // 'Customer ID', // COMMENTED OUT
    'Project ID',
    'Project Name',
    'Revenue',
    'Approved Cost',
    'Unapproved Lead Count',
    'Unapproved Lead Cost',
    'LOB',
    'Margin'
  ];

  const csvData = records.map(r => [
    r.sl_no ?? '',
    formatRevenueMonth(r.rev_month as any),
    r.customer_name ?? '',
    // r.customer_id ?? '', // COMMENTED OUT
    r.project_id ?? '',
    r.project_name ?? '',
    (r.revenue ?? '') as any,
    (r.approved_cost ?? '') as any,
    (r.unapproved_lead_count ?? '') as any,
    (r.unapproved_lead_cost ?? '') as any,
    (r as any).lob ?? '',
    (r.margin ?? '') as any,
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`Exported ${records.length} MIS records to ${filename}`);
};

// Update lead approval status - approvals are TEXT values now
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

  return supabase.from('leads').update(updateData).eq('lead_id', leadId);
};

// Bulk approve leads - set TEXT approvals and date
export const bulkApproveLeads = async (leadIds: string[], approvalType: 'client_incharge_approval' | 'project_incharge_approval' = 'client_incharge_approval') => {
  const updateData: any = {
    [approvalType]: 'Approved',
  };
  
  if (approvalType === 'client_incharge_approval') {
    updateData.client_incharge_approval_date = new Date().toISOString();
  } else {
    updateData.project_incharge_approval_date = new Date().toISOString();
  }

  // Try to match by lead_id if it's not numeric, otherwise use id
  // For bulk operations, we'll need to determine if we're using lead_id or id
  // For now, assume lead_ids can be either
  return supabase
    .from('leads')
    .update(updateData)
    .in('lead_id', leadIds);
};

// Bulk reject leads - set TEXT approvals and clear date
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

// Format revenue month for display - now handles DATE type from mis_records
export const formatRevenueMonth = (revMonth: string | null | Date) => {
  if (!revMonth) {
    return '—';
  }
  try {
    // Handle Date object, string, or ISO date string
    let date: Date;
    if (revMonth instanceof Date) {
      date = revMonth;
    } else if (typeof revMonth === 'string') {
      // Handle both YYYY-MM-DD and YYYY-MM formats
      let dateStr = revMonth.trim();
      if (dateStr === '') {
        return '—';
      }
      
      // If it's in YYYY-MM format, add -01 to make it a valid date
      if (dateStr.match(/^\d{4}-\d{2}$/)) {
        dateStr = `${dateStr}-01`;
      }
      
      date = new Date(dateStr);
    } else {
      return '—';
    }
    
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

// Fetch active workers data for charts
export const fetchActiveWorkers = async () => {
  const { data, error } = await supabase
    .from('active_workers')
    .select('*')
    .order('record_date', { ascending: true });

  if (error) {
    console.error('Error fetching active workers:', error);
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.code === '42P01') {
      console.warn('⚠️ Table active_workers does not exist. Please create it using create_mis_tables.sql');
      return { data: [], error: null }; // Return empty array to prevent app crash
    }
    return { data: null, error };
  }

  return { data: data || [], error: null };
};

// List CSV files for a given project from the public `csvs` bucket (prefix match)
// Helper function to convert revMonth (YYYY-MM-DD or YYYY-MM) to MMYY format for CSV matching
const convertRevMonthToMMYY = (revMonth: string | null | undefined): string | null => {
  if (!revMonth) return null;
  
  try {
    // Extract YYYY-MM from revMonth (handle both YYYY-MM-DD and YYYY-MM formats)
    const yearMonth = revMonth.substring(0, 7); // Gets "2025-04"
    const parts = yearMonth.split('-');
    
    if (parts.length < 2) return null;
    
    const year = parts[0]; // "2025"
    const month = parts[1]; // "04"
    
    // Extract last 2 digits of year (YY) and combine with month (MM)
    const yy = year.substring(year.length - 2); // "25"
    const mmyy = `${month}${yy}`; // "0425"
    
    console.log('convertRevMonthToMMYY:', { revMonth, yearMonth, month, year, yy, mmyy });
    return mmyy;
  } catch (error) {
    console.error('Error converting revMonth to MMYY:', error);
    return null;
  }
};

export const listCsvFilesForProject = async (projectId: string, revMonth?: string | null) => {
  try {
    const pid = (projectId || '').toString().trim().toUpperCase();
    if (!pid) {
      return { files: [], error: new Error('Missing projectId') };
    }
    
    // Convert revMonth to MMYY format if provided
    const mmyy = convertRevMonthToMMYY(revMonth);
    const expectedPrefix = mmyy ? `${pid} M${mmyy}` : pid;
    
    console.log('listCsvFilesForProject:', { projectId, pid, revMonth, mmyy, expectedPrefix });
    
    // List root of bucket; filter client-side by prefix
    const { data, error } = await supabase.storage
      .from('csvs')
      .list('', { limit: 1000, sortBy: { column: 'updated_at', order: 'desc' } });

    if (error) {
      console.error('Error listing csvs bucket:', error);
      return { files: [], error };
    }

    console.log('Total files in bucket:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Sample filenames:', data.slice(0, 5).map(f => f.name));
    }

    const matches = (data || [])
      .filter(f => {
        if (!f || typeof f.name !== 'string') return false;
        const fname = f.name.trim().toUpperCase();
        const prefixUpper = expectedPrefix.toUpperCase();
        
        // If revMonth provided, match both project ID and month/year
        if (mmyy) {
          return fname.startsWith(prefixUpper);
        }
        // If revMonth not provided, fall back to project ID-only matching
        return fname.startsWith(pid);
      })
      .map(f => ({ name: f.name, path: f.name, updatedAt: (f as any).updated_at })) as Array<{ name: string; path: string; updatedAt?: string }>;

    console.log('Matched files:', matches.length, matches.map(f => f.name));
    return { files: matches, error: null };
  } catch (e: any) {
    return { files: [], error: e };
  }
};

// Build a public download URL for a file in the public `csvs` bucket
export const getCsvPublicUrl = (path: string) => {
  const { data } = supabase.storage.from('csvs').getPublicUrl(path);
  return data.publicUrl;
};

// Update revised work completion date for a lead - align with schema
export const updateLeadRevisedDate = async (leadId: string, revisedDate: string | null) => {
  // Try to match by lead_id if it's not numeric, otherwise use id
  let query = supabase.from('leads').update({ revised_work_completion_date: revisedDate });
  
  // If leadId is numeric, it's likely the id field, otherwise it's lead_id
  if (leadId && leadId.match(/^\d+$/)) {
    query = query.eq('id', parseInt(leadId));
  } else {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query.select();

  if (error) {
    throw new Error(`Failed to update work completion date: ${error.message}`);
  }

  return data;
};
