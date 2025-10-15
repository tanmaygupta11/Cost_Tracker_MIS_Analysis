// ✅ Mock data for Client Dashboard - Supabase integration to be added later

export interface ValidationFile {
  sl_no: number;
  validation_file_id: string;
  customer_name: string;
  customer_id: string;
  project_name: string;
  project_id: string;
  revenue_month: string;
  validation_status: 'Approved' | 'Pending' | 'Rejected';
  revenue: number;
  validation_approval_at: string | null;
}

export interface Lead {
  lead_id: string;
  customer_name: string;
  project_name: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  date_created: string;
}

export interface ProjectTrend {
  month: string;
  projects: number;
}

export interface RevenueShare {
  name: string;
  value: number;
}

export const dashboardSummary = {
  totalProjects: 5,
  totalRevenue: 1870000,
  approvedValidations: 3,
  pendingValidations: 2,
};

export const projectTrends: ProjectTrend[] = [
  { month: "May", projects: 2 },
  { month: "Jun", projects: 3 },
  { month: "Jul", projects: 4 },
  { month: "Aug", projects: 3 },
  { month: "Sep", projects: 5 },
];

export const revenueData: RevenueShare[] = [
  { name: "Cloud Migration", value: 450000 },
  { name: "API Gateway", value: 340000 },
  { name: "ERP Implementation", value: 680000 },
  { name: "Data Analytics", value: 400000 },
];

export const validationFiles: ValidationFile[] = [
  {
    sl_no: 1,
    validation_file_id: "VAL-001",
    customer_name: "Tech Solutions Inc",
    customer_id: "CUST-001",
    project_name: "Cloud Migration",
    project_id: "PROJ-001",
    revenue_month: "2025-01",
    validation_status: "Approved",
    revenue: 450000,
    validation_approval_at: "2025-01-15",
  },
  {
    sl_no: 2,
    validation_file_id: "VAL-002",
    customer_name: "Tech Solutions Inc",
    customer_id: "CUST-001",
    project_name: "API Gateway",
    project_id: "PROJ-010",
    revenue_month: "2024-09",
    validation_status: "Approved",
    revenue: 340000,
    validation_approval_at: "2024-09-30",
  },
  {
    sl_no: 3,
    validation_file_id: "VAL-003",
    customer_name: "Tech Solutions Inc",
    customer_id: "CUST-001",
    project_name: "ERP Implementation",
    project_id: "PROJ-003",
    revenue_month: "2024-12",
    validation_status: "Approved",
    revenue: 680000,
    validation_approval_at: "2024-12-28",
  },
  {
    sl_no: 4,
    validation_file_id: "VAL-004",
    customer_name: "Tech Solutions Inc",
    customer_id: "CUST-001",
    project_name: "Data Analytics Platform",
    project_id: "PROJ-004",
    revenue_month: "2024-11",
    validation_status: "Pending",
    revenue: 400000,
    validation_approval_at: null,
  },
  {
    sl_no: 5,
    validation_file_id: "VAL-005",
    customer_name: "Tech Solutions Inc",
    customer_id: "CUST-001",
    project_name: "Security Audit",
    project_id: "PROJ-008",
    revenue_month: "2024-10",
    validation_status: "Pending",
    revenue: 150000,
    validation_approval_at: null,
  },
  {
    sl_no: 6,
    validation_file_id: "VAL-006",
    customer_name: "Tech Solutions Inc",
    customer_id: "CUST-001",
    project_name: "Mobile App Development",
    project_id: "PROJ-002",
    revenue_month: "2024-08",
    validation_status: "Rejected",
    revenue: 320000,
    validation_approval_at: "2024-08-20",
  },
  {
    sl_no: 7,
    validation_file_id: "VAL-007",
    customer_name: "Tech Solutions Inc",
    customer_id: "CUST-001",
    project_name: "CRM Customization",
    project_id: "PROJ-007",
    revenue_month: "2024-07",
    validation_status: "Approved",
    revenue: 280000,
    validation_approval_at: "2024-07-30",
  },
  // ROX customer data for client@demo.com login
  {
    sl_no: 8,
    validation_file_id: "VAL-008",
    customer_name: "ROX",
    customer_id: "ROX-CUST-001",
    project_name: "ROX Project Alpha",
    project_id: "ROX-PROJ-001",
    revenue_month: "2025-01",
    validation_status: "Approved",
    revenue: 650000,
    validation_approval_at: "2025-01-10",
  },
  {
    sl_no: 9,
    validation_file_id: "VAL-009",
    customer_name: "ROX",
    customer_id: "ROX-CUST-001",
    project_name: "ROX Project Beta",
    project_id: "ROX-PROJ-002",
    revenue_month: "2024-12",
    validation_status: "Pending",
    revenue: 420000,
    validation_approval_at: null,
  },
  {
    sl_no: 10,
    validation_file_id: "VAL-010",
    customer_name: "ROX",
    customer_id: "ROX-CUST-001",
    project_name: "ROX Project Gamma",
    project_id: "ROX-PROJ-003",
    revenue_month: "2024-11",
    validation_status: "Approved",
    revenue: 380000,
    validation_approval_at: "2024-11-25",
  },
];

export const leads: Lead[] = [
  {
    lead_id: "LEAD-001",
    customer_name: "Tech Solutions Inc",
    project_name: "Cloud Migration",
    status: "Approved",
    date_created: "2024-12-01",
  },
  {
    lead_id: "LEAD-002",
    customer_name: "Tech Solutions Inc",
    project_name: "API Gateway",
    status: "Approved",
    date_created: "2024-08-15",
  },
  {
    lead_id: "LEAD-003",
    customer_name: "Tech Solutions Inc",
    project_name: "ERP Implementation",
    status: "Approved",
    date_created: "2024-11-20",
  },
  {
    lead_id: "LEAD-004",
    customer_name: "Tech Solutions Inc",
    project_name: "Data Analytics Platform",
    status: "Pending",
    date_created: "2024-10-10",
  },
  {
    lead_id: "LEAD-005",
    customer_name: "Tech Solutions Inc",
    project_name: "Security Audit",
    status: "Pending",
    date_created: "2024-09-25",
  },
  {
    lead_id: "LEAD-006",
    customer_name: "Tech Solutions Inc",
    project_name: "Mobile App Development",
    status: "Rejected",
    date_created: "2024-07-05",
  },
  {
    lead_id: "LEAD-007",
    customer_name: "Tech Solutions Inc",
    project_name: "CRM Customization",
    status: "Approved",
    date_created: "2024-06-30",
  },
];

