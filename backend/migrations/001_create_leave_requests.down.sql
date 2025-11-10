-- Drop trigger
DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_leave_requests_created_at;
DROP INDEX IF EXISTS idx_leave_requests_status;
DROP INDEX IF EXISTS idx_leave_requests_employee_id;

-- Drop table
DROP TABLE IF EXISTS leave_requests;

