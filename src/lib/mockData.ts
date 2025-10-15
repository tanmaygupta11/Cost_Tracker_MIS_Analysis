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
  id: string;
  leadId: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  leadName: string;
  leadValue: number;
  leadStatus: 'Pending' | 'Approved' | 'Rejected';
  validationFileId: string;
  leadFileUrl: string;
  createdAt: string;
  revenueMonth: string;
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
    id: '1',
    leadId: 'LEAD-001',
    projectId: 'PROJ-001',
    projectName: 'Cloud Migration',
    customerId: 'CUST-001',
    customerName: 'Tech Solutions Inc',
    leadName: 'AWS Infrastructure Setup',
    leadValue: 450000,
    leadStatus: 'Approved',
    validationFileId: 'VF-2025-001',
    leadFileUrl: '/files/lead-001.pdf',
    createdAt: '2024-12-01',
    revenueMonth: '2025-01'
  },
  {
    id: '2',
    leadId: 'LEAD-002',
    projectId: 'PROJ-002',
    projectName: 'Mobile App Development',
    customerId: 'CUST-002',
    customerName: 'Digital Ventures Ltd',
    leadName: 'iOS & Android App',
    leadValue: 320000,
    leadStatus: 'Pending',
    validationFileId: 'VF-2025-002',
    leadFileUrl: '/files/lead-002.pdf',
    createdAt: '2024-12-05',
    revenueMonth: '2025-01'
  },
  {
    id: '3',
    leadId: 'LEAD-003',
    projectId: 'PROJ-003',
    projectName: 'ERP Implementation',
    customerId: 'CUST-003',
    customerName: 'Enterprise Systems Co',
    leadName: 'SAP Integration',
    leadValue: 680000,
    leadStatus: 'Approved',
    validationFileId: 'VF-2025-003',
    leadFileUrl: '/files/lead-003.pdf',
    createdAt: '2024-11-20',
    revenueMonth: '2024-12'
  },
  {
    id: '4',
    leadId: 'LEAD-004',
    projectId: 'PROJ-011',
    projectName: 'Marketing Automation',
    customerId: 'CUST-001',
    customerName: 'Tech Solutions Inc',
    leadName: 'HubSpot Setup',
    leadValue: 180000,
    leadStatus: 'Pending',
    validationFileId: '',
    leadFileUrl: '/files/lead-004.pdf',
    createdAt: '2025-01-10',
    revenueMonth: '2025-01'
  },
  {
    id: '5',
    leadId: 'LEAD-005',
    projectId: 'PROJ-012',
    projectName: 'DevOps Transformation',
    customerId: 'CUST-004',
    customerName: 'Innovation Labs',
    leadName: 'CI/CD Pipeline',
    leadValue: 290000,
    leadStatus: 'Rejected',
    validationFileId: '',
    leadFileUrl: '/files/lead-005.pdf',
    createdAt: '2025-01-12',
    revenueMonth: '2025-01'
  },
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
