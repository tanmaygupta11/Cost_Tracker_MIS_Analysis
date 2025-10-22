-- Fix for foreign key constraint violation: fk_project
-- Insert the missing projects that leads reference

-- Insert projects that are referenced in leads data
INSERT INTO public.projects (project_id, project_name, customer_id, created_at) VALUES
('PROJ-001', 'Cloud Migration', 'CUST-001', NOW()),
('PROJ-002', 'Mobile App Development', 'CUST-001', NOW()),
('PROJ-003', 'ERP Implementation', 'CUST-001', NOW()),
('PROJ-004', 'Data Analytics Platform', 'CUST-001', NOW()),
('PROJ-007', 'CRM Customization', 'CUST-001', NOW()),
('PROJ-008', 'Security Audit', 'CUST-001', NOW()),
('PROJ-010', 'API Gateway', 'CUST-001', NOW()),
('ROX-PROJ-001', 'ROX Project Alpha', 'ROX-CUST-001', NOW()),
('ROX-PROJ-002', 'ROX Project Beta', 'ROX-CUST-001', NOW()),
('ROX-PROJ-003', 'ROX Project Gamma', 'ROX-CUST-001', NOW())
ON CONFLICT (project_id) DO NOTHING;

-- Verify projects were inserted
SELECT project_id, project_name, customer_id FROM public.projects ORDER BY project_id;









