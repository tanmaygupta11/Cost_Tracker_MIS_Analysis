// ✅ Mock data for Client Dashboard - Supabase integration to be added later

export interface ValidationFile {
  sl_no: number;
  validation_file_id: string;
  customer_name: string;
  customer_id: string;
  project_name: string;
  project_id: string;
  revenue_month: string;
  validation_status: string;
  revenue: number;
  validation_approval_at: string | null;
}

export interface Lead {
  lead_id: string;
  customer_name: string;
  project_name: string;
  status: string;
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

export interface MonthlyDashboardData {
  month: string;  // YYYY-MM format
  totalProjects: number;
  totalRevenue: number;
  approvedValidations: number;
  pendingValidations: number;
}

export const dashboardSummary = {
  totalProjects: 5,
  totalRevenue: 1870000,
  approvedValidations: 3,
  pendingValidations: 2,
};

export const monthlyDashboardData: MonthlyDashboardData[] = [
  { "month": "2024-01", "totalProjects": 3, "totalRevenue": 245000, "approvedValidations": 5, "pendingValidations": 2 },
  { "month": "2024-02", "totalProjects": 4, "totalRevenue": 310000, "approvedValidations": 6, "pendingValidations": 1 },
  { "month": "2024-03", "totalProjects": 5, "totalRevenue": 382000, "approvedValidations": 8, "pendingValidations": 3 },
  { "month": "2024-04", "totalProjects": 3, "totalRevenue": 8750000, "approvedValidations": 2, "pendingValidations": 0 },
  { "month": "2024-05", "totalProjects": 5, "totalRevenue": 398000, "approvedValidations": 8, "pendingValidations": 1 },
  { "month": "2024-06", "totalProjects": 7, "totalRevenue": 465000, "approvedValidations": 10, "pendingValidations": 2 },
  { "month": "2024-07", "totalProjects": 6, "totalRevenue": 432000, "approvedValidations": 9, "pendingValidations": 3 },
  { "month": "2024-08", "totalProjects": 8, "totalRevenue": 520000, "approvedValidations": 12, "pendingValidations": 2 },
  { "month": "2024-09", "totalProjects": 9, "totalRevenue": 578000, "approvedValidations": 13, "pendingValidations": 3 },
  { "month": "2024-10", "totalProjects": 7, "totalRevenue": 489000, "approvedValidations": 11, "pendingValidations": 2 },
  { "month": "2024-11", "totalProjects": 8, "totalRevenue": 534000, "approvedValidations": 12, "pendingValidations": 1 },
  { "month": "2024-12", "totalProjects": 10, "totalRevenue": 612000, "approvedValidations": 14, "pendingValidations": 2 },
  { "month": "2025-01", "totalProjects": 9, "totalRevenue": 590000, "approvedValidations": 13, "pendingValidations": 3 },
  { "month": "2025-02", "totalProjects": 7, "totalRevenue": 475000, "approvedValidations": 11, "pendingValidations": 2 },
  { "month": "2025-03", "totalProjects": 8, "totalRevenue": 512000, "approvedValidations": 12, "pendingValidations": 2 },
  { "month": "2025-04", "totalProjects": 6, "totalRevenue": 455000, "approvedValidations": 9, "pendingValidations": 1 },
  { "month": "2025-05", "totalProjects": 8, "totalRevenue": 538000, "approvedValidations": 12, "pendingValidations": 3 },
  { "month": "2025-06", "totalProjects": 9, "totalRevenue": 598000, "approvedValidations": 14, "pendingValidations": 2 },
  { "month": "2025-07", "totalProjects": 10, "totalRevenue": 635000, "approvedValidations": 15, "pendingValidations": 1 },
  { "month": "2025-08", "totalProjects": 11, "totalRevenue": 662000, "approvedValidations": 16, "pendingValidations": 2 },
  { "month": "2025-09", "totalProjects": 9, "totalRevenue": 578000, "approvedValidations": 13, "pendingValidations": 3 },
  { "month": "2025-10", "totalProjects": 10, "totalRevenue": 620000, "approvedValidations": 14, "pendingValidations": 2 },
  { "month": "2025-11", "totalProjects": 8, "totalRevenue": 548000, "approvedValidations": 12, "pendingValidations": 1 },
  { "month": "2025-12", "totalProjects": 11, "totalRevenue": 675000, "approvedValidations": 16, "pendingValidations": 2 }
];

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

