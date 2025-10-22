-- Alternative fix: Insert leads without project references
-- This removes the foreign key constraint issue by setting project_id to NULL

-- Example of how to modify your leads data to avoid foreign key constraint
-- Instead of:
-- project_id: 'PROJ-001'

-- Use:
-- project_id: null

-- This way the foreign key constraint won't be violated
-- since NULL values are allowed in foreign key columns









