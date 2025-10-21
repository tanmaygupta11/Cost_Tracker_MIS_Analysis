export interface ValidationFile {
  id: string;
  validationFileId: string;
  customerName: string;
  customerId: string;
  projectName: string;
  projectId: string;
  revenueMonth: string;
  validationStatus: 'Approved' | 'Pending' | 'Rejected';
  revenue: number;
  validationApprovalAt: string;
  fileUrl: string;
}

export interface Lead {
  lead_id: string;
  project_id: string;
  project_name: string;
  final_work_completion_date: string | null;
  revisied_work_completion_date: string | null;
  unit_basis_commercial: number | null;
  project_incharge_approval: string | null;
  project_incharge_approval_date: string | null;
  client_incharge_approval: string | null;
  client_incharge_approval_date: string | null;
  "Original_Work_Completion_Date": string | null;
  projectid: string | null;
  "Zone": string | null;
  "City": string | null;
  "State": string | null;
  "TC Code": string | null;
  "Role": string | null;
  "Shift": string | null;
}

export interface ProjectData {
  month: string;
  projects: number;
  revenue: number;
}

export interface RevenueShare {
  name: string;
  value: number;
}

export const mockValidationFiles: ValidationFile[] = [
  {
    id: '1',
    validationFileId: 'VF-2025-001',
    customerName: 'Tech Solutions Inc',
    customerId: 'CUST-001',
    projectName: 'Cloud Migration',
    projectId: 'PROJ-001',
    revenueMonth: '2025-01',
    validationStatus: 'Approved',
    revenue: 450000,
    validationApprovalAt: '2025-01-15',
    fileUrl: '/files/validation-001.pdf'
  },
  {
    id: '2',
    validationFileId: 'VF-2025-002',
    customerName: 'Digital Ventures Ltd',
    customerId: 'CUST-002',
    projectName: 'Mobile App Development',
    projectId: 'PROJ-002',
    revenueMonth: '2025-01',
    validationStatus: 'Pending',
    revenue: 320000,
    validationApprovalAt: '2025-01-20',
    fileUrl: '/files/validation-002.pdf'
  },
  {
    id: '3',
    validationFileId: 'VF-2025-003',
    customerName: 'Enterprise Systems Co',
    customerId: 'CUST-003',
    projectName: 'ERP Implementation',
    projectId: 'PROJ-003',
    revenueMonth: '2024-12',
    validationStatus: 'Approved',
    revenue: 680000,
    validationApprovalAt: '2024-12-28',
    fileUrl: '/files/validation-003.pdf'
  },
  {
    id: '4',
    validationFileId: 'VF-2025-004',
    customerName: 'Tech Solutions Inc',
    customerId: 'CUST-001',
    projectName: 'Data Analytics Platform',
    projectId: 'PROJ-004',
    revenueMonth: '2024-12',
    validationStatus: 'Rejected',
    revenue: 0,
    validationApprovalAt: '2024-12-30',
    fileUrl: '/files/validation-004.pdf'
  },
  {
    id: '5',
    validationFileId: 'VF-2024-105',
    customerName: 'Innovation Labs',
    customerId: 'CUST-004',
    projectName: 'AI Integration',
    projectId: 'PROJ-005',
    revenueMonth: '2024-11',
    validationStatus: 'Approved',
    revenue: 520000,
    validationApprovalAt: '2024-11-25',
    fileUrl: '/files/validation-005.pdf'
  },
  {
    id: '6',
    validationFileId: 'VF-2024-106',
    customerName: 'Digital Ventures Ltd',
    customerId: 'CUST-002',
    projectName: 'E-commerce Platform',
    projectId: 'PROJ-006',
    revenueMonth: '2024-11',
    validationStatus: 'Approved',
    revenue: 395000,
    validationApprovalAt: '2024-11-28',
    fileUrl: '/files/validation-006.pdf'
  },
  {
    id: '7',
    validationFileId: 'VF-2024-107',
    customerName: 'Enterprise Systems Co',
    customerId: 'CUST-003',
    projectName: 'CRM Customization',
    projectId: 'PROJ-007',
    revenueMonth: '2024-10',
    validationStatus: 'Approved',
    revenue: 280000,
    validationApprovalAt: '2024-10-30',
    fileUrl: '/files/validation-007.pdf'
  },
  {
    id: '8',
    validationFileId: 'VF-2024-108',
    customerName: 'Tech Solutions Inc',
    customerId: 'CUST-001',
    projectName: 'Security Audit',
    projectId: 'PROJ-008',
    revenueMonth: '2024-10',
    validationStatus: 'Pending',
    revenue: 150000,
    validationApprovalAt: '2024-10-25',
    fileUrl: '/files/validation-008.pdf'
  },
  {
    id: '9',
    validationFileId: 'VF-2024-109',
    customerName: 'Innovation Labs',
    customerId: 'CUST-004',
    projectName: 'Blockchain POC',
    projectId: 'PROJ-009',
    revenueMonth: '2024-09',
    validationStatus: 'Approved',
    revenue: 420000,
    validationApprovalAt: '2024-09-28',
    fileUrl: '/files/validation-009.pdf'
  },
  {
    id: '10',
    validationFileId: 'VF-2024-110',
    customerName: 'Digital Ventures Ltd',
    customerId: 'CUST-002',
    projectName: 'API Gateway',
    projectId: 'PROJ-010',
    revenueMonth: '2024-09',
    validationStatus: 'Approved',
    revenue: 340000,
    validationApprovalAt: '2024-09-30',
    fileUrl: '/files/validation-010.pdf'
  },
];

export const mockLeads: Lead[] = [
  {
    lead_id: 'LEAD-001',
    project_id: 'PROJ-001',
    project_name: 'Cloud Migration',
    final_work_completion_date: '15-01-2025',
    revisied_work_completion_date: '20-01-2025',
    unit_basis_commercial: 450000.00,
    project_incharge_approval: 'Approved',
    project_incharge_approval_date: '22-01-2025',
    client_incharge_approval: 'Approved',
    client_incharge_approval_date: '25-01-2025',
    "Original_Work_Completion_Date": '10-01-2025',
    projectid: 'PROJ-001',
    "Zone": 'North',
    "City": 'Delhi',
    "State": 'Delhi',
    "TC Code": 'TC001',
    "Role": 'Developer',
    "Shift": 'Day'
  },
  {
    lead_id: 'LEAD-002',
    project_id: 'PROJ-002',
    project_name: 'Mobile App Development',
    final_work_completion_date: null,
    revisied_work_completion_date: '05-02-2025',
    unit_basis_commercial: 320000.00,
    project_incharge_approval: 'Pending',
    project_incharge_approval_date: null,
    client_incharge_approval: 'Pending',
    client_incharge_approval_date: null,
    "Original_Work_Completion_Date": '01-02-2025',
    projectid: 'PROJ-002',
    "Zone": 'South',
    "City": 'Bangalore',
    "State": 'Karnataka',
    "TC Code": 'TC002',
    "Role": 'Designer',
    "Shift": 'Night'
  },
  {
    lead_id: 'LEAD-003',
    project_id: 'PROJ-003',
    project_name: 'ERP Implementation',
    final_work_completion_date: '28-12-2024',
    revisied_work_completion_date: '30-12-2024',
    unit_basis_commercial: 680000.00,
    project_incharge_approval: 'Approved',
    project_incharge_approval_date: '02-01-2025',
    client_incharge_approval: 'Approved',
    client_incharge_approval_date: '05-01-2025',
    "Original_Work_Completion_Date": '25-12-2024',
    projectid: 'PROJ-003',
    "Zone": 'West',
    "City": 'Mumbai',
    "State": 'Maharashtra',
    "TC Code": 'TC003',
    "Role": 'Analyst',
    "Shift": 'Day'
  },
  {
    lead_id: 'LEAD-004',
    project_id: 'PROJ-001',
    project_name: 'Cloud Migration',
    final_work_completion_date: null,
    revisied_work_completion_date: null,
    unit_basis_commercial: 400000.00,
    project_incharge_approval: 'Rejected',
    project_incharge_approval_date: '10-01-2025',
    client_incharge_approval: 'Pending',
    client_incharge_approval_date: null,
    "Original_Work_Completion_Date": '15-02-2025',
    projectid: 'PROJ-001',
    "Zone": 'North',
    "City": 'Delhi',
    "State": 'Delhi',
    "TC Code": 'TC001',
    "Role": 'Developer',
    "Shift": 'Day'
  },
  {
    lead_id: 'LEAD-005',
    project_id: 'PROJ-010',
    project_name: 'API Gateway',
    final_work_completion_date: '10-11-2024',
    revisied_work_completion_date: '12-11-2024',
    unit_basis_commercial: 180000.00,
    project_incharge_approval: 'Approved',
    project_incharge_approval_date: '15-11-2024',
    client_incharge_approval: 'Rejected',
    client_incharge_approval_date: '18-11-2024',
    "Original_Work_Completion_Date": '08-11-2024',
    projectid: 'PROJ-010',
    "Zone": 'East',
    "City": 'Kolkata',
    "State": 'West Bengal',
    "TC Code": 'TC010',
    "Role": 'Architect',
    "Shift": 'Day'
  },
  {
    lead_id: 'LEAD-006',
    project_id: 'PROJ-001',
    project_name: 'Cloud Migration',
    final_work_completion_date: null,
    revisied_work_completion_date: null,
    unit_basis_commercial: 250000.00,
    project_incharge_approval: 'Pending',
    project_incharge_approval_date: null,
    client_incharge_approval: 'Pending',
    client_incharge_approval_date: null,
    "Original_Work_Completion_Date": '20-02-2025',
    projectid: 'PROJ-001',
    "Zone": 'North',
    "City": 'Delhi',
    "State": 'Delhi',
    "TC Code": 'TC001',
    "Role": 'Developer',
    "Shift": 'Day'
  }
];

export const mockProjectData: ProjectData[] = [
  { month: 'Sep', projects: 8, revenue: 2450000 },
  { month: 'Oct', projects: 12, revenue: 3200000 },
  { month: 'Nov', projects: 15, revenue: 4100000 },
  { month: 'Dec', projects: 18, revenue: 4850000 },
  { month: 'Jan', projects: 14, revenue: 3900000 },
];

export const mockRevenueShare: RevenueShare[] = [
  { name: 'Cloud Migration', value: 450000 },
  { name: 'Mobile App Development', value: 320000 },
  { name: 'ERP Implementation', value: 680000 },
  { name: 'AI Integration', value: 520000 },
  { name: 'E-commerce Platform', value: 395000 },
  { name: 'CRM Customization', value: 280000 },
  { name: 'Blockchain POC', value: 420000 },
  { name: 'API Gateway', value: 340000 },
];
