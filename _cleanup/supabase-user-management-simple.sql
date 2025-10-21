-- Simplified Supabase User Management Functions
-- This is a more compatible version for Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Simple function to create user with validation
CREATE OR REPLACE FUNCTION create_user_simple(
    user_email text,
    user_password text,
    user_name text,
    user_username text,
    user_employee_number text,
    user_position text,
    user_role text DEFAULT 'user'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
    result json;
BEGIN
    -- Basic validation
    IF user_role NOT IN ('user', 'admin', 'superadmin') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid role');
    END IF;
    
    -- Check for duplicates
    IF EXISTS(SELECT 1 FROM users WHERE email = user_email) THEN
        RETURN json_build_object('success', false, 'error', 'Email already exists');
    END IF;
    
    IF EXISTS(SELECT 1 FROM users WHERE username = user_username) THEN
        RETURN json_build_object('success', false, 'error', 'Username already exists');
    END IF;
    
    IF EXISTS(SELECT 1 FROM users WHERE employee_number = user_employee_number) THEN
        RETURN json_build_object('success', false, 'error', 'Employee number already exists');
    END IF;
    
    -- Insert new user
    INSERT INTO users (
        email, 
        password_hash, 
        role, 
        name, 
        username, 
        employee_number, 
        "position", 
        avatar
    ) VALUES (
        user_email,
        crypt(user_password, gen_salt('bf')),
        user_role,
        user_name,
        user_username,
        user_employee_number,
        user_position,
        'https://ui-avatars.com/api/?name=' || replace(user_name, ' ', '+') || '&background=3b82f6&color=fff'
    ) RETURNING id INTO new_user_id;
    
    RETURN json_build_object(
        'success', true, 
        'user_id', new_user_id, 
        'message', 'User created successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Failed to create user: ' || SQLERRM
        );
END;
$$;

-- Simple function to update user
CREATE OR REPLACE FUNCTION update_user_simple(
    user_id uuid,
    user_email text DEFAULT NULL,
    user_name text DEFAULT NULL,
    user_username text DEFAULT NULL,
    user_employee_number text DEFAULT NULL,
    user_position text DEFAULT NULL,
    user_role text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Check if user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Validate role if provided
    IF user_role IS NOT NULL AND user_role NOT IN ('user', 'admin', 'superadmin') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid role');
    END IF;
    
    -- Update user with only non-null values
    UPDATE users SET
        email = COALESCE(user_email, email),
        name = COALESCE(user_name, name),
        username = COALESCE(user_username, username),
        employee_number = COALESCE(user_employee_number, employee_number),
        "position" = COALESCE(user_position, "position"),
        role = COALESCE(user_role, role),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN json_build_object('success', true, 'message', 'User updated successfully');
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'error', 'Duplicate entry detected');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Failed to update user: ' || SQLERRM);
END;
$$;

-- Simple function to delete user
CREATE OR REPLACE FUNCTION delete_user_simple(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Prevent self-deletion (basic check)
    IF user_id::text = auth.uid()::text THEN
        RETURN json_build_object('success', false, 'error', 'Cannot delete your own account');
    END IF;
    
    DELETE FROM users WHERE id = user_id;
    
    RETURN json_build_object('success', true, 'message', 'User deleted successfully');
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Failed to delete user: ' || SQLERRM);
END;
$$;

-- Simple function to reset password
CREATE OR REPLACE FUNCTION reset_password_simple(
    user_id uuid,
    new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update password
    UPDATE users SET
        password_hash = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN json_build_object('success', true, 'message', 'Password reset successfully');
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Failed to reset password: ' || SQLERRM);
END;
$$;

-- Simple function to generate username
CREATE OR REPLACE FUNCTION generate_username_simple(
    full_name text,
    emp_number text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    base_username text;
    final_username text;
    counter integer := 0;
BEGIN
    -- Create base username from first name + last 3 digits of employee number
    base_username := lower(
        split_part(full_name, ' ', 1) || 
        right(emp_number, 3)
    );
    
    -- Remove any non-alphanumeric characters
    base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');
    
    final_username := base_username;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS(SELECT 1 FROM users WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::text;
    END LOOP;
    
    RETURN final_username;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_simple TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_simple TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_simple TO authenticated;
GRANT EXECUTE ON FUNCTION reset_password_simple TO authenticated;
GRANT EXECUTE ON FUNCTION generate_username_simple TO authenticated;