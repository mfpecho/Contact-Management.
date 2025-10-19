-- Enhanced Supabase User Management Schema
-- This script provides comprehensive user management for SuperAdmin role

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "SuperAdmin can create users" ON users;
DROP POLICY IF EXISTS "SuperAdmin can update users" ON users;
DROP POLICY IF EXISTS "SuperAdmin can delete users" ON users;

-- Enhanced User Management Policies for SuperAdmin

-- SuperAdmin can create new users
CREATE POLICY "SuperAdmin can create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'superadmin'
        )
    );

-- SuperAdmin can update any user
CREATE POLICY "SuperAdmin can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'superadmin'
        )
    );

-- SuperAdmin can delete users (except themselves)
CREATE POLICY "SuperAdmin can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'superadmin'
        )
        AND id::text != auth.uid()::text  -- Prevent self-deletion
    );

-- Function to create a new user (SuperAdmin only)
CREATE OR REPLACE FUNCTION public.create_user_by_superadmin(
    p_email VARCHAR(255),
    p_password TEXT,
    p_name VARCHAR(255),
    p_username VARCHAR(100),
    p_employee_number VARCHAR(50),
    p_position VARCHAR(100),
    p_role VARCHAR(20) DEFAULT 'user',
    p_avatar TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    current_user_role VARCHAR(20);
    current_user_name VARCHAR(255);
    password_hash TEXT;
    result JSON;
BEGIN
    -- Check if current user is superadmin
    SELECT role, name INTO current_user_role, current_user_name
    FROM users 
    WHERE id::text = auth.uid()::text;
    
    IF current_user_role != 'superadmin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Only SuperAdmin can create users'
        );
    END IF;
    
    -- Validate role
    IF p_role NOT IN ('user', 'admin', 'superadmin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid role. Must be user, admin, or superadmin'
        );
    END IF;
    
    -- Hash the password
    password_hash := crypt(p_password, gen_salt('bf'));
    
    -- Generate avatar if not provided
    IF p_avatar IS NULL THEN
        p_avatar := 'https://ui-avatars.com/api/?name=' || replace(p_name, ' ', '+') || '&background=3b82f6&color=fff';
    END IF;
    
    -- Insert new user
    BEGIN
        INSERT INTO users (
            email, password_hash, role, name, username, 
            employee_number, "position", avatar
        ) VALUES (
            p_email, password_hash, p_role, p_name, p_username,
            p_employee_number, p_position, p_avatar
        ) RETURNING id INTO new_user_id;
        
        -- Log the action
        PERFORM log_changelog(
            auth.uid(),
            current_user_name,
            'superadmin',
            'create',
            'user',
            'Created new ' || p_role || ' user: ' || p_name,
            new_user_id,
            p_name,
            json_build_object(
                'email', p_email,
                'role', p_role,
                'employee_number', p_employee_number,
                'position', p_position
            )::text
        );
        
        result := json_build_object(
            'success', true,
            'user_id', new_user_id,
            'message', 'User created successfully'
        );
        
    EXCEPTION
        WHEN unique_violation THEN
            IF POSITION('users_email_key' IN SQLERRM) > 0 THEN
                result := json_build_object(
                    'success', false,
                    'error', 'Email already exists'
                );
            ELSIF POSITION('users_username_key' IN SQLERRM) > 0 THEN
                result := json_build_object(
                    'success', false,
                    'error', 'Username already exists'
                );
            ELSIF POSITION('users_employee_number_key' IN SQLERRM) > 0 THEN
                result := json_build_object(
                    'success', false,
                    'error', 'Employee number already exists'
                );
            ELSE
                result := json_build_object(
                    'success', false,
                    'error', 'Duplicate entry detected'
                );
            END IF;
        WHEN OTHERS THEN
            result := json_build_object(
                'success', false,
                'error', 'Failed to create user: ' || SQLERRM
            );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user by SuperAdmin
CREATE OR REPLACE FUNCTION public.update_user_by_superadmin(
    p_user_id UUID,
    p_email VARCHAR(255) DEFAULT NULL,
    p_name VARCHAR(255) DEFAULT NULL,
    p_username VARCHAR(100) DEFAULT NULL,
    p_employee_number VARCHAR(50) DEFAULT NULL,
    p_position VARCHAR(100) DEFAULT NULL,
    p_role VARCHAR(20) DEFAULT NULL,
    p_avatar TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_user_role VARCHAR(20);
    current_user_name VARCHAR(255);
    target_user_name VARCHAR(255);
    old_values JSON;
    result JSON;
BEGIN
    -- Check if current user is superadmin
    SELECT role, name INTO current_user_role, current_user_name
    FROM users 
    WHERE id::text = auth.uid()::text;
    
    IF current_user_role != 'superadmin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Only SuperAdmin can update users'
        );
    END IF;
    
    -- Get current user data for logging
    SELECT name, row_to_json(users.*) INTO target_user_name, old_values
    FROM users 
    WHERE id = p_user_id;
    
    IF target_user_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Validate role if provided
    IF p_role IS NOT NULL AND p_role NOT IN ('user', 'admin', 'superadmin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid role. Must be user, admin, or superadmin'
        );
    END IF;
    
    -- Update user
    BEGIN
        UPDATE users SET
            email = COALESCE(p_email, email),
            name = COALESCE(p_name, name),
            username = COALESCE(p_username, username),
            employee_number = COALESCE(p_employee_number, employee_number),
            "position" = COALESCE(p_position, "position"),
            role = COALESCE(p_role, role),
            avatar = COALESCE(p_avatar, avatar),
            updated_at = NOW()
        WHERE id = p_user_id;
        
        -- Log the action
        PERFORM log_changelog(
            auth.uid(),
            current_user_name,
            'superadmin',
            'update',
            'user',
            'Updated user: ' || target_user_name,
            p_user_id,
            target_user_name,
            json_build_object(
                'old_values', old_values,
                'updated_fields', json_build_object(
                    'email', p_email,
                    'name', p_name,
                    'username', p_username,
                    'employee_number', p_employee_number,
                    'position', p_position,
                    'role', p_role,
                    'avatar', p_avatar
                )
            )::text
        );
        
        result := json_build_object(
            'success', true,
            'message', 'User updated successfully'
        );
        
    EXCEPTION
        WHEN unique_violation THEN
            IF POSITION('users_email_key' IN SQLERRM) > 0 THEN
                result := json_build_object(
                    'success', false,
                    'error', 'Email already exists'
                );
            ELSIF POSITION('users_username_key' IN SQLERRM) > 0 THEN
                result := json_build_object(
                    'success', false,
                    'error', 'Username already exists'
                );
            ELSIF POSITION('users_employee_number_key' IN SQLERRM) > 0 THEN
                result := json_build_object(
                    'success', false,
                    'error', 'Employee number already exists'
                );
            ELSE
                result := json_build_object(
                    'success', false,
                    'error', 'Duplicate entry detected'
                );
            END IF;
        WHEN OTHERS THEN
            result := json_build_object(
                'success', false,
                'error', 'Failed to update user: ' || SQLERRM
            );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user by SuperAdmin
CREATE OR REPLACE FUNCTION public.delete_user_by_superadmin(
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    current_user_role VARCHAR(20);
    current_user_name VARCHAR(255);
    target_user_name VARCHAR(255);
    target_user_data JSON;
    result JSON;
BEGIN
    -- Check if current user is superadmin
    SELECT role, name INTO current_user_role, current_user_name
    FROM users 
    WHERE id::text = auth.uid()::text;
    
    IF current_user_role != 'superadmin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Only SuperAdmin can delete users'
        );
    END IF;
    
    -- Prevent self-deletion
    IF p_user_id::text = auth.uid()::text THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot delete your own account'
        );
    END IF;
    
    -- Get user data for logging
    SELECT name, row_to_json(users.*) INTO target_user_name, target_user_data
    FROM users 
    WHERE id = p_user_id;
    
    IF target_user_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Delete user
    BEGIN
        DELETE FROM users WHERE id = p_user_id;
        
        -- Log the action
        PERFORM log_changelog(
            auth.uid(),
            current_user_name,
            'superadmin',
            'delete',
            'user',
            'Deleted user: ' || target_user_name,
            p_user_id,
            target_user_name,
            target_user_data::text
        );
        
        result := json_build_object(
            'success', true,
            'message', 'User deleted successfully'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            result := json_build_object(
                'success', false,
                'error', 'Failed to delete user: ' || SQLERRM
            );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users (SuperAdmin and Admin only)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    role VARCHAR(20),
    name VARCHAR(255),
    username VARCHAR(100),
    employee_number VARCHAR(50),
    "position" VARCHAR(100),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    current_user_role VARCHAR(20);
BEGIN
    -- Check if current user is admin or superadmin
    SELECT users.role INTO current_user_role
    FROM users 
    WHERE users.id::text = auth.uid()::text;
    
    IF current_user_role NOT IN ('admin', 'superadmin') THEN
        RAISE EXCEPTION 'Unauthorized: Only Admin and SuperAdmin can view all users';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id, u.email, u.role, u.name, u.username, 
        u.employee_number, u."position", u.avatar, 
        u.created_at, u.updated_at
    FROM users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset user password (SuperAdmin only)
CREATE OR REPLACE FUNCTION public.reset_user_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
    current_user_role VARCHAR(20);
    current_user_name VARCHAR(255);
    target_user_name VARCHAR(255);
    password_hash TEXT;
    result JSON;
BEGIN
    -- Check if current user is superadmin
    SELECT role, name INTO current_user_role, current_user_name
    FROM users 
    WHERE id::text = auth.uid()::text;
    
    IF current_user_role != 'superadmin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Only SuperAdmin can reset passwords'
        );
    END IF;
    
    -- Get target user name
    SELECT name INTO target_user_name
    FROM users 
    WHERE id = p_user_id;
    
    IF target_user_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Hash the new password
    password_hash := crypt(p_new_password, gen_salt('bf'));
    
    -- Update password
    BEGIN
        UPDATE users SET
            password_hash = password_hash,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        -- Log the action
        PERFORM log_changelog(
            auth.uid(),
            current_user_name,
            'superadmin',
            'update',
            'user',
            'Reset password for user: ' || target_user_name,
            p_user_id,
            target_user_name,
            'Password reset'
        );
        
        result := json_build_object(
            'success', true,
            'message', 'Password reset successfully'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            result := json_build_object(
                'success', false,
                'error', 'Failed to reset password: ' || SQLERRM
            );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate username from name and employee number
CREATE OR REPLACE FUNCTION public.generate_username(
    p_name VARCHAR(255),
    p_employee_number VARCHAR(50)
)
RETURNS VARCHAR(100) AS $$
DECLARE
    base_username VARCHAR(100);
    final_username VARCHAR(100);
    counter INTEGER := 0;
BEGIN
    -- Create base username from first name + last 3 digits of employee number
    base_username := lower(
        split_part(p_name, ' ', 1) || 
        right(p_employee_number, 3)
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
$$ LANGUAGE plpgsql;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_by_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_by_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_username TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_changelog TO authenticated;

-- Create an initial SuperAdmin user if it doesn't exist
DO $$
DECLARE
    superadmin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE role = 'superadmin') INTO superadmin_exists;
    
    IF NOT superadmin_exists THEN
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
            'superadmin@company.com',
            crypt('SuperAdmin123!', gen_salt('bf')), -- Default password, should be changed
            'superadmin',
            'Super Administrator',
            'superadmin',
            'SA001',
            'System Super Administrator',
            'https://ui-avatars.com/api/?name=Super+Administrator&background=dc2626&color=fff'
        );
        
        RAISE NOTICE 'SuperAdmin user created with email: superadmin@company.com and password: SuperAdmin123!';
        RAISE NOTICE 'Please change the default password immediately after first login!';
    END IF;
END
$$;