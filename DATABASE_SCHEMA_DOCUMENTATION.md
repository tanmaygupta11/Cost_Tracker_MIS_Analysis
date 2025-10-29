# Database Schema Documentation

This document provides a detailed overview of all database tables used in the Cost Tracker MIS Analysis application.

## Table Overview

The application uses **5 main tables**:

1. **clients** - Customer/client information
2. **projects** - Project information linked to customers
3. **validations** - Validation file records with revenue information
4. **leads** - Individual lead/worker records linked to projects
5. **profiles** - Links Supabase auth users to customer/client records

---

## 1. CLIENTS Table

**Purpose:** Stores customer/client information

**Primary Key:** `customer_id`

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| customer_id | TEXT | NOT NULL | Primary key - Unique customer identifier (e.g., "C137", "C65") |
| customer_name | TEXT | NOT NULL | Customer name (e.g., "BlackBuck", "TCS") |
| customer_since | TEXT | NULL | Date when customer relationship started |

**Relationships:**
- Referenced by: `projects.customer_id`, `profiles.customer_id`, `validations.customer_id`

---

## 2. PROJECTS Table

**Purpose:** Stores project information linked to customers

**Primary Key:** `project_id`

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| project_id | TEXT | NOT NULL | Primary key - Unique project identifier |
| project_name | TEXT | NULL | Project name |
| customer_id | TEXT | NULL | Foreign key to `clients.customer_id` |
| created_at | TIMESTAMP WITH TIME ZONE | NULL | Timestamp when record was created (defaults to NOW()) |

**Indexes:**
- `idx_projects_customer_id` on `customer_id`

**Relationships:**
- Foreign Key: `customer_id` → `clients.customer_id`
- Referenced by: `leads.project_id`, `validations.project_id`

---

## 3. VALIDATIONS Table

**Purpose:** Stores validation file records with revenue information

**Primary Key:** `validation_file_id`

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| validation_file_id | TEXT | NOT NULL | Primary key - Unique validation file identifier (e.g., "VAL-0001ABCD") |
| sl_no | INTEGER | NOT NULL | Serial number for ordering/display |
| customer_id | TEXT | NULL | Foreign key to `clients.customer_id` |
| customer_name | TEXT | NULL | Customer name (denormalized for performance) |
| project_id | TEXT | NULL | Foreign key to `projects.project_id` |
| project_name | TEXT | NULL | Project name (denormalized for performance) |
| rev_month | TEXT | NULL | Revenue month in format YYYY-MM-DD or YYYY-MM |
| revenue | NUMERIC | NULL | Revenue amount |
| validation_status | TEXT | NOT NULL | Status: 'Pending', 'Approved', 'Rejected' |
| validation_approval_at | TIMESTAMP WITH TIME ZONE | NULL | Timestamp when validation was approved/rejected (auto-set by trigger) |
| LOB | TEXT | NULL | Line of Business |
| Validation_completed | TEXT | NULL | Completion status: 'Complete', 'Incomplete', etc. |
| created_at | TIMESTAMP WITH TIME ZONE | NULL | Timestamp when record was created (defaults to NOW()) |

**Indexes:**
- `idx_validations_customer_id` on `customer_id`
- `idx_validations_project_id` on `project_id`
- `idx_validations_rev_month` on `rev_month`
- `idx_validations_validation_status` on `validation_status`
- `idx_validations_sl_no` on `sl_no`

**Relationships:**
- Foreign Keys: `customer_id` → `clients.customer_id`, `project_id` → `projects.project_id`
- Referenced by: `leads.validation_file_id`

**Functions & Triggers:**
- Trigger `set_validation_approval_timestamp` automatically sets `validation_approval_at` when status changes to 'Approved' or 'Rejected'

---

## 4. LEADS Table

**Purpose:** Stores individual lead/worker records linked to projects

**Primary Key:** `lead_id`

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| lead_id | TEXT | NOT NULL | Primary key - Unique lead identifier |
| project_id | TEXT | NOT NULL | Foreign key to `projects.project_id` |
| project_name | TEXT | NOT NULL | Project name (denormalized) |
| final_work_completion_date | TEXT | NULL | Work completion date (format: YYYY-MM-DD) |
| revisied_work_completion_date | TEXT | NULL | Revised work completion date (format: YYYY-MM-DD) |
| unit_basis_commercial | NUMERIC | NULL | Commercial value per unit |
| project_incharge_approval | TEXT | NULL | Approval status: 'Approved', 'Rejected', 'Pending' |
| project_incharge_approval_date | TEXT | NULL | Date when project incharge approved (format: YYYY-MM-DD or ISO timestamp) |
| client_incharge_approval | TEXT | NULL | Approval status: 'Approved', 'Rejected', 'Pending' |
| client_incharge_approval_date | TEXT | NULL | Date when client incharge approved (format: YYYY-MM-DD or ISO timestamp) |
| Original_Work_Completion_Date | TEXT | NULL | Original work completion date (format: YYYY-MM-DD) |
| projectid | TEXT | NULL | Alternative project ID field |
| Zone | TEXT | NULL | Geographic zone |
| City | TEXT | NULL | City name |
| State | TEXT | NULL | State name |
| TC Code | TEXT | NULL | TC (Territory Code?) |
| Role | TEXT | NULL | Worker role |
| Shift | TEXT | NULL | Shift timing |
| status | TEXT | NULL | Lead status |
| validation_file_id | TEXT | NULL | Links to `validations.validation_file_id` |

**Indexes:**
- `idx_leads_project_id` on `project_id`
- `idx_leads_validation_file_id` on `validation_file_id`
- `idx_leads_final_work_completion_date` on `final_work_completion_date`

**Relationships:**
- Foreign Key: `project_id` → `projects.project_id`

**Note:** Some columns use quoted identifiers (e.g., "Zone", "City", "State", "TC Code", "Role", "Shift", "Original_Work_Completion_Date") due to reserved words or special characters in column names.

---

## 5. PROFILES Table

**Purpose:** Links Supabase auth users to customer/client records

**Primary Key:** `id`

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| id | UUID | NOT NULL | Primary key - References `auth.users(id)` |
| customer_id | TEXT | NULL | Foreign key to `clients.customer_id` |
| created_at | TIMESTAMP WITH TIME ZONE | NULL | Timestamp when profile was created (defaults to NOW()) |
| updated_at | TIMESTAMP WITH TIME ZONE | NULL | Timestamp when profile was last updated (defaults to NOW()) |

**Indexes:**
- `idx_profiles_customer_id` on `customer_id`

**Relationships:**
- Foreign Key: `id` → `auth.users(id)` (Supabase Auth users table)
- Foreign Key: `customer_id` → `clients.customer_id`

**Functions & Triggers:**
- Trigger `on_auth_user_created` automatically creates a profile when a new user signs up

---

## Sequences

### validation_file_seq
- **Purpose:** Generates sequential numbers for validation file IDs
- **Usage:** Used by `generate_validation_id()` function to create IDs like "VAL-0001ABCD"
- **Format:** Starts at 1, increments by 1

---

## Functions

### generate_validation_id()
**Returns:** TEXT  
**Purpose:** Generates a unique validation file ID  
**Format:** `VAL-{4-digit-sequence}{4-character-random-suffix}`  
**Example:** `VAL-0001ABCD`

### handle_new_user()
**Returns:** TRIGGER  
**Purpose:** Automatically creates a profile record when a new user signs up  
**Trigger:** Fires on `auth.users` INSERT

### update_validation_approval_timestamp()
**Returns:** TRIGGER  
**Purpose:** Automatically sets `validation_approval_at` timestamp when validation status changes to 'Approved' or 'Rejected'  
**Trigger:** Fires on `validations` UPDATE

---

## Row Level Security (RLS)

All tables have RLS enabled for security:

- **clients:** Authenticated users can view all clients
- **projects:** Authenticated users can view all projects
- **validations:** Users can only view/update validations for their own customer (based on profile)
- **leads:** Users can only view leads for their own customer (based on profile)
- **profiles:** Users can only view/update their own profile

---

## Important Notes

1. **Date Formats:** The application stores dates in TEXT format (YYYY-MM-DD), not as DATE types. This allows flexibility for different date formats.

2. **Denormalization:** Tables like `validations` and `leads` store denormalized data (e.g., `customer_name`, `project_name`) for better query performance.

3. **Case Sensitivity:** Text filters in the application perform case-insensitive substring matching.

4. **Column Naming:** Some columns in `leads` table use quoted identifiers (e.g., "Zone", "City") - these must be referenced with quotes in SQL queries.

5. **Foreign Key Constraints:** 
   - Deleting a customer will set related `project.customer_id` and `profile.customer_id` to NULL
   - Deleting a project will CASCADE delete related leads
   - Deleting a user will CASCADE delete their profile

---

## Usage Instructions

1. **Run the SQL file:** Execute `database_schema.sql` in your Supabase SQL editor or via Supabase CLI
2. **Verify tables:** Check that all 5 tables are created successfully
3. **Test RLS:** Verify that RLS policies are working as expected
4. **Import data:** Import your data into the tables using Supabase dashboard or CSV import

---

## Future Enhancements

When you connect to a new Supabase account with additional columns:
1. Add new columns using `ALTER TABLE` statements
2. Update the TypeScript types file (`src/integrations/supabase/types.ts`)
3. Update any affected queries in `src/lib/supabase.ts`
4. Test that existing functionality still works

---

Generated: Based on current codebase analysis  
Last Updated: See git history for latest changes

