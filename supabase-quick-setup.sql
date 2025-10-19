-- QUICK SETUP: Copy and paste this entire script into Supabase SQL Editor
-- This will create everything needed for user management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'admin', 'superadmin')),
    name text NOT NULL,
    username text UNIQUE NOT NULL,
    employee_number text UNIQUE NOT NULL,
    "position" text NOT NULL,
    avatar text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Disable Row Level Security for testing (enable with proper policies later)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Function to create user with validation
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
    hashed_password text;
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
    
    -- Hash the password
    SELECT crypt(user_password, gen_salt('bf')) INTO hashed_password;
    
    RAISE NOTICE 'Creating user: % with email: %', user_name, user_email;
    RAISE NOTICE 'Input password length: %, hashed length: %', length(user_password), length(hashed_password);
    
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
        hashed_password,
        user_role,
        user_name,
        user_username,
        user_employee_number,
        user_position,
        'https://ui-avatars.com/api/?name=' || replace(user_name, ' ', '+') || '&background=3b82f6&color=fff'
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE 'User created successfully with ID: %', new_user_id;
    
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

-- Function to update user (SuperAdmin only)
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
    
    -- Check for duplicates if email is being updated
    IF user_email IS NOT NULL AND EXISTS(SELECT 1 FROM users WHERE email = user_email AND id != user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Email already exists');
    END IF;
    
    -- Check for duplicates if username is being updated
    IF user_username IS NOT NULL AND EXISTS(SELECT 1 FROM users WHERE username = user_username AND id != user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Username already exists');
    END IF;
    
    -- Check for duplicates if employee_number is being updated
    IF user_employee_number IS NOT NULL AND EXISTS(SELECT 1 FROM users WHERE employee_number = user_employee_number AND id != user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Employee number already exists');
    END IF;
    
    -- Role validation
    IF user_role IS NOT NULL AND user_role NOT IN ('user', 'admin', 'superadmin') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid role');
    END IF;
    
    -- Update user
    UPDATE users SET
        email = COALESCE(user_email, email),
        name = COALESCE(user_name, name),
        username = COALESCE(user_username, username),
        employee_number = COALESCE(user_employee_number, employee_number),
        "position" = COALESCE(user_position, "position"),
        role = COALESCE(user_role, role),
        updated_at = now()
    WHERE id = user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User updated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update user: ' || SQLERRM
        );
END;
$$;

-- Function to authenticate user login
CREATE OR REPLACE FUNCTION authenticate_user_simple(
    user_email text,
    user_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record users%ROWTYPE;
    is_valid boolean := false;
    stored_hash text;
    computed_hash text;
BEGIN
    -- Check if user exists and get user data
    SELECT * INTO user_record
    FROM users
    WHERE email = user_email;
    
    -- If user not found
    IF NOT FOUND THEN
        RAISE NOTICE 'User not found for email: %', user_email;
        RETURN json_build_object('success', false, 'error', 'Invalid email or password');
    END IF;
    
    -- Get the stored password hash
    SELECT password_hash INTO stored_hash
    FROM users
    WHERE email = user_email;
    
    RAISE NOTICE 'User found: % with role: %', user_record.name, user_record.role;
    RAISE NOTICE 'Stored hash length: %', length(stored_hash);
    RAISE NOTICE 'Input password length: %', length(user_password);
    
    -- Verify password using crypt
    SELECT (password_hash = crypt(user_password, password_hash)) INTO is_valid
    FROM users
    WHERE email = user_email;
    
    -- Also compute what the hash would be for debugging
    SELECT crypt(user_password, stored_hash) INTO computed_hash;
    
    RAISE NOTICE 'Password verification: %, stored: %, computed: %', is_valid, stored_hash, computed_hash;
    
    -- If password is correct
    IF is_valid THEN
        RAISE NOTICE 'Authentication successful for user: %', user_record.name;
        RETURN json_build_object(
            'success', true,
            'user', json_build_object(
                'id', user_record.id,
                'email', user_record.email,
                'name', user_record.name,
                'username', user_record.username,
                'role', user_record.role,
                'position', user_record."position",
                'employee_number', user_record.employee_number,
                'avatar', user_record.avatar
            )
        );
    ELSE
        RAISE NOTICE 'Authentication failed for user: % - password mismatch', user_record.name;
        RETURN json_build_object('success', false, 'error', 'Invalid email or password');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Exception in authentication: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication failed: ' || SQLERRM
        );
END;
$$;

-- Function to generate username
CREATE OR REPLACE FUNCTION generate_username_simple(
    full_name text,
    emp_number text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    first_name text;
    emp_suffix text;
    base_username text;
    final_username text;
    counter int := 0;
BEGIN
    -- Extract first name and employee number suffix
    first_name := lower(split_part(full_name, ' ', 1));
    emp_suffix := right(emp_number, 3);
    
    -- Create base username
    base_username := regexp_replace(first_name || emp_suffix, '[^a-z0-9]', '', 'g');
    final_username := base_username;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS(SELECT 1 FROM users WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::text;
    END LOOP;
    
    RETURN final_username;
END;
$$;

-- Grant permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION create_user_simple TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_simple TO anon;
GRANT EXECUTE ON FUNCTION update_user_simple TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_simple TO anon;
GRANT EXECUTE ON FUNCTION authenticate_user_simple TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_user_simple TO anon;
GRANT EXECUTE ON FUNCTION generate_username_simple TO authenticated;
GRANT EXECUTE ON FUNCTION generate_username_simple TO anon;

-- Test the function (optional - you can run this to verify it works)
-- SELECT create_user_simple('test@example.com', 'password123', 'Test User', 'testuser', 'TEST001', 'Test Position', 'user');

-- Test authentication function (for debugging)
-- SELECT authenticate_user_simple('superadmin@company.com', 'SuperAdmin123!');

-- Debug function to check user data and password hashes
CREATE OR REPLACE FUNCTION debug_user_auth(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record users%ROWTYPE;
    debug_info json;
BEGIN
    -- Get user data
    SELECT * INTO user_record FROM users WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object('found', false, 'email', user_email);
    END IF;
    
    RETURN json_build_object(
        'found', true,
        'email', user_record.email,
        'name', user_record.name,
        'role', user_record.role,
        'has_password_hash', CASE WHEN user_record.password_hash IS NOT NULL THEN true ELSE false END,
        'password_hash_length', length(user_record.password_hash)
    );
END;
$$;

-- Grant permission for debug function
GRANT EXECUTE ON FUNCTION debug_user_auth TO authenticated;
GRANT EXECUTE ON FUNCTION debug_user_auth TO anon;

-- Insert default users for testing (if they don't exist)
DO $$
BEGIN
    -- Insert SuperAdmin if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@company.com') THEN
        INSERT INTO users (
            email, password_hash, role, name, username, employee_number, "position", avatar
        ) VALUES (
            'superadmin@company.com',
            crypt('SuperAdmin123!', gen_salt('bf')),
            'superadmin',
            'Super Administrator',
            'superadmin',
            'SA001',
            'System Administrator',
            'https://ui-avatars.com/api/?name=Super+Administrator&background=dc2626&color=fff'
        );
    END IF;
    
    -- Insert Admin if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@company.com') THEN
        INSERT INTO users (
            email, password_hash, role, name, username, employee_number, "position", avatar
        ) VALUES (
            'admin@company.com',
            crypt('Admin123!', gen_salt('bf')),
            'admin',
            'Administrator',
            'admin',
            'ADM001',
            'Administrator',
            'https://ui-avatars.com/api/?name=Administrator&background=3b82f6&color=fff'
        );
    END IF;
    
    -- Insert User if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@company.com') THEN
        INSERT INTO users (
            email, password_hash, role, name, username, employee_number, "position", avatar
        ) VALUES (
            'user@company.com',
            crypt('User123!', gen_salt('bf')),
            'user',
            'Regular User',
            'user',
            'EMP001',
            'Employee',
            'https://ui-avatars.com/api/?name=Regular+User&background=10b981&color=fff'
        );
    END IF;
END $$;

-- Function to create a new contact
CREATE OR REPLACE FUNCTION create_contact_simple(
    contact_first_name text,
    contact_middle_name text DEFAULT '',
    contact_last_name text,
    contact_birthday date,
    contact_phone text,
    contact_company text,
    contact_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_contact_id uuid;
BEGIN
    -- Basic validation
    IF contact_first_name IS NULL OR trim(contact_first_name) = '' THEN
        RETURN json_build_object('success', false, 'error', 'First name is required');
    END IF;
    
    IF contact_last_name IS NULL OR trim(contact_last_name) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Last name is required');
    END IF;
    
    IF contact_phone IS NULL OR trim(contact_phone) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Phone number is required');
    END IF;
    
    IF contact_company IS NULL OR trim(contact_company) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Company is required');
    END IF;
    
    IF contact_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = contact_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    RAISE NOTICE 'Creating contact: % % for user: %', contact_first_name, contact_last_name, contact_user_id;
    
    -- Insert new contact
    INSERT INTO contacts (
        first_name,
        middle_name,
        last_name,
        birthday,
        phone,
        company,
        user_id
    ) VALUES (
        trim(contact_first_name),
        COALESCE(trim(contact_middle_name), ''),
        trim(contact_last_name),
        contact_birthday,
        trim(contact_phone),
        trim(contact_company),
        contact_user_id
    ) RETURNING id INTO new_contact_id;
    
    RAISE NOTICE 'Contact created successfully with ID: %', new_contact_id;
    
    RETURN json_build_object(
        'success', true,
        'contact_id', new_contact_id,
        'message', 'Contact created successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Exception in contact creation: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to create contact: ' || SQLERRM
        );
END;
$$;

-- Function to get contacts for a user
CREATE OR REPLACE FUNCTION get_contacts_simple(
    user_id_filter uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contacts_result json;
BEGIN
    -- If no user filter is provided, return all contacts (for admins)
    -- If user filter is provided, return only that user's contacts
    IF user_id_filter IS NULL THEN
        SELECT json_agg(
            json_build_object(
                'id', c.id,
                'firstName', c.first_name,
                'middleName', c.middle_name,
                'lastName', c.last_name,
                'birthday', c.birthday,
                'contactNumber', c.phone,
                'company', c.company,
                'ownerId', c.user_id,
                'ownerName', u.name,
                'createdAt', c.created_at
            ) ORDER BY c.created_at DESC
        ) INTO contacts_result
        FROM contacts c
        LEFT JOIN users u ON c.user_id = u.id;
    ELSE
        SELECT json_agg(
            json_build_object(
                'id', c.id,
                'firstName', c.first_name,
                'middleName', c.middle_name,
                'lastName', c.last_name,
                'birthday', c.birthday,
                'contactNumber', c.phone,
                'company', c.company,
                'ownerId', c.user_id,
                'ownerName', u.name,
                'createdAt', c.created_at
            ) ORDER BY c.created_at DESC
        ) INTO contacts_result
        FROM contacts c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.user_id = user_id_filter;
    END IF;
    
    -- If no contacts found, return empty array
    IF contacts_result IS NULL THEN
        contacts_result := '[]'::json;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'contacts', contacts_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to fetch contacts: ' || SQLERRM,
            'contacts', '[]'::json
        );
END;
$$;

-- Function to update a contact
CREATE OR REPLACE FUNCTION update_contact_simple(
    contact_id uuid,
    contact_first_name text DEFAULT NULL,
    contact_middle_name text DEFAULT NULL,
    contact_last_name text DEFAULT NULL,
    contact_birthday date DEFAULT NULL,
    contact_phone text DEFAULT NULL,
    contact_company text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if contact exists
    IF NOT EXISTS(SELECT 1 FROM contacts WHERE id = contact_id) THEN
        RETURN json_build_object('success', false, 'error', 'Contact not found');
    END IF;
    
    -- Update contact with provided values
    UPDATE contacts SET
        first_name = COALESCE(contact_first_name, first_name),
        middle_name = COALESCE(contact_middle_name, middle_name),
        last_name = COALESCE(contact_last_name, last_name),
        birthday = COALESCE(contact_birthday, birthday),
        phone = COALESCE(contact_phone, phone),
        company = COALESCE(contact_company, company),
        updated_at = NOW()
    WHERE id = contact_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Contact updated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update contact: ' || SQLERRM
        );
END;
$$;

-- Function to delete a contact
CREATE OR REPLACE FUNCTION delete_contact_simple(
    contact_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if contact exists
    IF NOT EXISTS(SELECT 1 FROM contacts WHERE id = contact_id) THEN
        RETURN json_build_object('success', false, 'error', 'Contact not found');
    END IF;
    
    -- Delete the contact
    DELETE FROM contacts WHERE id = contact_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Contact deleted successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to delete contact: ' || SQLERRM
        );
END;
$$;

-- Grant permissions to contact functions
GRANT EXECUTE ON FUNCTION create_contact_simple TO authenticated;
GRANT EXECUTE ON FUNCTION create_contact_simple TO anon;
GRANT EXECUTE ON FUNCTION get_contacts_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_contacts_simple TO anon;
GRANT EXECUTE ON FUNCTION update_contact_simple TO authenticated;
GRANT EXECUTE ON FUNCTION update_contact_simple TO anon;
GRANT EXECUTE ON FUNCTION delete_contact_simple TO authenticated;
GRANT EXECUTE ON FUNCTION delete_contact_simple TO anon;

-- =====================================================
-- CHANGELOG AND ACTIVITY TRACKING SYSTEM
-- =====================================================

-- Function to log all system activities to changelog table
CREATE OR REPLACE FUNCTION log_changelog(
    p_user_id UUID,
    p_user_name VARCHAR(255),
    p_user_role VARCHAR(20),
    p_action VARCHAR(20),
    p_entity VARCHAR(20),
    p_description TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_name VARCHAR(255) DEFAULT NULL,
    p_details TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    changelog_id UUID;
BEGIN
    INSERT INTO changelog (
        user_id, user_name, user_role, action, entity, 
        entity_id, entity_name, description, details
    ) VALUES (
        p_user_id, p_user_name, p_user_role, p_action, p_entity,
        p_entity_id, p_entity_name, p_description, p_details
    ) RETURNING id INTO changelog_id;
    
    RETURN changelog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get changelog entries (paginated)
CREATE OR REPLACE FUNCTION get_changelog(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL,
    p_action VARCHAR(20) DEFAULT NULL,
    p_entity VARCHAR(20) DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    entry_timestamp TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    user_name VARCHAR(255),
    user_role VARCHAR(20),
    action VARCHAR(20),
    entity VARCHAR(20),
    entity_id UUID,
    entity_name VARCHAR(255),
    description TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.timestamp,
        c.user_id,
        c.user_name,
        c.user_role,
        c.action,
        c.entity,
        c.entity_id,
        c.entity_name,
        c.description,
        c.details,
        c.created_at
    FROM changelog c
    WHERE 
        (p_user_id IS NULL OR c.user_id = p_user_id)
        AND (p_action IS NULL OR c.action = p_action)
        AND (p_entity IS NULL OR c.entity = p_entity)
        AND (p_start_date IS NULL OR c.timestamp >= p_start_date)
        AND (p_end_date IS NULL OR c.timestamp <= p_end_date)
    ORDER BY c.timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get changelog statistics
CREATE OR REPLACE FUNCTION get_changelog_stats()
RETURNS TABLE (
    total_entries BIGINT,
    today_entries BIGINT,
    this_week_entries BIGINT,
    this_month_entries BIGINT,
    most_active_user VARCHAR(255),
    most_common_action VARCHAR(20),
    most_common_entity VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE DATE(timestamp) = CURRENT_DATE) as today,
            COUNT(*) FILTER (WHERE timestamp >= DATE_TRUNC('week', CURRENT_DATE)) as this_week,
            COUNT(*) FILTER (WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)) as this_month
        FROM changelog
    ),
    user_stats AS (
        SELECT user_name, COUNT(*) as cnt
        FROM changelog 
        GROUP BY user_name 
        ORDER BY cnt DESC 
        LIMIT 1
    ),
    action_stats AS (
        SELECT action, COUNT(*) as cnt
        FROM changelog 
        GROUP BY action 
        ORDER BY cnt DESC 
        LIMIT 1
    ),
    entity_stats AS (
        SELECT entity, COUNT(*) as cnt
        FROM changelog 
        GROUP BY entity 
        ORDER BY cnt DESC 
        LIMIT 1
    )
    SELECT 
        s.total,
        s.today,
        s.this_week,
        s.this_month,
        COALESCE(u.user_name, 'N/A'),
        COALESCE(a.action, 'N/A'),
        COALESCE(e.entity, 'N/A')
    FROM stats s
    LEFT JOIN user_stats u ON true
    LEFT JOIN action_stats a ON true
    LEFT JOIN entity_stats e ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for changelog functions
GRANT EXECUTE ON FUNCTION public.log_changelog TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_changelog TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_changelog_stats TO authenticated;

-- =====================================================
-- ENHANCED CONTACT FUNCTIONS WITH AUTOMATIC LOGGING
-- =====================================================

-- Enhanced contact creation with automatic logging
CREATE OR REPLACE FUNCTION create_contact_with_logging(
    contact_first_name text,
    contact_middle_name text DEFAULT NULL,
    contact_last_name text,
    contact_birthday date DEFAULT NULL,
    contact_phone text DEFAULT NULL,
    contact_company text DEFAULT NULL,
    contact_user_id uuid,
    user_name text,
    user_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_contact_id uuid;
    result json;
BEGIN
    -- Create the contact
    INSERT INTO contacts (
        first_name, middle_name, last_name, birthday, phone, company, user_id
    ) VALUES (
        contact_first_name, contact_middle_name, contact_last_name, 
        contact_birthday, contact_phone, contact_company, contact_user_id
    ) RETURNING id INTO new_contact_id;
    
    -- Log the action
    PERFORM log_changelog(
        contact_user_id,
        user_name,
        user_role,
        'create',
        'contact',
        format('Contact %s %s created', contact_first_name, contact_last_name),
        new_contact_id,
        format('%s %s', contact_first_name, contact_last_name),
        format('Company: %s, Phone: %s', 
            COALESCE(contact_company, 'N/A'), 
            COALESCE(contact_phone, 'N/A'))
    );
    
    -- Return success with contact ID
    result := json_build_object(
        'success', true,
        'contact_id', new_contact_id,
        'message', 'Contact created successfully'
    );
    
    RETURN result;
END;
$$;

-- Enhanced contact update with automatic logging
CREATE OR REPLACE FUNCTION update_contact_with_logging(
    contact_id uuid,
    contact_first_name text DEFAULT NULL,
    contact_middle_name text DEFAULT NULL,
    contact_last_name text DEFAULT NULL,
    contact_birthday date DEFAULT NULL,
    contact_phone text DEFAULT NULL,
    contact_company text DEFAULT NULL,
    user_id uuid,
    user_name text,
    user_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_contact contacts%ROWTYPE;
    updated_fields text[];
    change_details text;
BEGIN
    -- Get the current contact data
    SELECT * INTO old_contact FROM contacts WHERE id = contact_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Contact not found');
    END IF;
    
    -- Track what fields are being updated
    updated_fields := ARRAY[]::text[];
    
    -- Update the contact with provided fields
    UPDATE contacts SET
        first_name = COALESCE(contact_first_name, first_name),
        middle_name = COALESCE(contact_middle_name, middle_name),
        last_name = COALESCE(contact_last_name, last_name),
        birthday = COALESCE(contact_birthday, birthday),
        phone = COALESCE(contact_phone, phone),
        company = COALESCE(contact_company, company),
        updated_at = NOW()
    WHERE id = contact_id;
    
    -- Build change details
    IF contact_first_name IS NOT NULL AND contact_first_name != old_contact.first_name THEN
        updated_fields := array_append(updated_fields, format('First Name: %s → %s', old_contact.first_name, contact_first_name));
    END IF;
    
    IF contact_last_name IS NOT NULL AND contact_last_name != old_contact.last_name THEN
        updated_fields := array_append(updated_fields, format('Last Name: %s → %s', old_contact.last_name, contact_last_name));
    END IF;
    
    IF contact_phone IS NOT NULL AND contact_phone != old_contact.phone THEN
        updated_fields := array_append(updated_fields, format('Phone: %s → %s', COALESCE(old_contact.phone, 'N/A'), contact_phone));
    END IF;
    
    IF contact_company IS NOT NULL AND contact_company != old_contact.company THEN
        updated_fields := array_append(updated_fields, format('Company: %s → %s', COALESCE(old_contact.company, 'N/A'), contact_company));
    END IF;
    
    change_details := array_to_string(updated_fields, ', ');
    
    -- Log the action
    PERFORM log_changelog(
        user_id,
        user_name,
        user_role,
        'update',
        'contact',
        format('Contact %s %s updated', 
            COALESCE(contact_first_name, old_contact.first_name), 
            COALESCE(contact_last_name, old_contact.last_name)),
        contact_id,
        format('%s %s', 
            COALESCE(contact_first_name, old_contact.first_name), 
            COALESCE(contact_last_name, old_contact.last_name)),
        CASE WHEN change_details = '' THEN 'No changes detected' ELSE change_details END
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Contact updated successfully'
    );
END;
$$;

-- Enhanced contact deletion with automatic logging
CREATE OR REPLACE FUNCTION delete_contact_with_logging(
    contact_id uuid,
    user_id uuid,
    user_name text,
    user_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contact_to_delete contacts%ROWTYPE;
BEGIN
    -- Get contact details before deletion
    SELECT * INTO contact_to_delete FROM contacts WHERE id = contact_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Contact not found');
    END IF;
    
    -- Log the action before deletion
    PERFORM log_changelog(
        user_id,
        user_name,
        user_role,
        'delete',
        'contact',
        format('Contact %s %s deleted', contact_to_delete.first_name, contact_to_delete.last_name),
        contact_id,
        format('%s %s', contact_to_delete.first_name, contact_to_delete.last_name),
        format('Company: %s, Phone: %s, Original Owner: %s', 
            COALESCE(contact_to_delete.company, 'N/A'), 
            COALESCE(contact_to_delete.phone, 'N/A'),
            (SELECT name FROM users WHERE id = contact_to_delete.user_id))
    );
    
    -- Delete the contact
    DELETE FROM contacts WHERE id = contact_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Contact deleted successfully'
    );
END;
$$;

-- Grant permissions for enhanced functions
GRANT EXECUTE ON FUNCTION public.create_contact_with_logging TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contact_with_logging TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_contact_with_logging TO authenticated;

-- =====================================================
-- SYSTEM ACTIVITY DASHBOARD FUNCTIONS
-- =====================================================

-- Function to get real-time system activity summary
CREATE OR REPLACE FUNCTION get_system_activity_summary()
RETURNS TABLE (
    total_users BIGINT,
    total_contacts BIGINT,
    total_changelog_entries BIGINT,
    users_logged_in_today BIGINT,
    contacts_created_today BIGINT,
    contacts_updated_today BIGINT,
    contacts_deleted_today BIGINT,
    most_active_user_today VARCHAR(255),
    most_active_user_today_count BIGINT,
    last_login_time TIMESTAMP WITH TIME ZONE,
    last_login_user VARCHAR(255),
    last_contact_created TIMESTAMP WITH TIME ZONE,
    last_contact_created_by VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    WITH today_start AS (
        SELECT CURRENT_DATE::TIMESTAMP WITH TIME ZONE as start_time
    ),
    user_counts AS (
        SELECT COUNT(*) as total_users FROM users
    ),
    contact_counts AS (
        SELECT COUNT(*) as total_contacts FROM contacts
    ),
    changelog_counts AS (
        SELECT COUNT(*) as total_entries FROM changelog
    ),
    today_logins AS (
        SELECT COUNT(DISTINCT user_id) as logins_today
        FROM changelog c, today_start t
        WHERE c.action = 'login' AND c.timestamp >= t.start_time
    ),
    today_contacts AS (
        SELECT 
            COUNT(*) FILTER (WHERE action = 'create') as created_today,
            COUNT(*) FILTER (WHERE action = 'update') as updated_today,
            COUNT(*) FILTER (WHERE action = 'delete') as deleted_today
        FROM changelog c, today_start t
        WHERE c.entity = 'contact' AND c.timestamp >= t.start_time
    ),
    most_active_today AS (
        SELECT user_name, COUNT(*) as activity_count
        FROM changelog c, today_start t
        WHERE c.timestamp >= t.start_time
        GROUP BY user_name
        ORDER BY activity_count DESC
        LIMIT 1
    ),
    last_login AS (
        SELECT timestamp, user_name
        FROM changelog
        WHERE action = 'login'
        ORDER BY timestamp DESC
        LIMIT 1
    ),
    last_contact AS (
        SELECT timestamp, user_name
        FROM changelog
        WHERE action = 'create' AND entity = 'contact'
        ORDER BY timestamp DESC
        LIMIT 1
    )
    SELECT 
        uc.total_users,
        cc.total_contacts,
        clc.total_entries,
        tl.logins_today,
        tc.created_today,
        tc.updated_today,
        tc.deleted_today,
        COALESCE(ma.user_name, 'No activity'),
        COALESCE(ma.activity_count, 0),
        ll.timestamp,
        ll.user_name,
        lc.timestamp,
        lc.user_name
    FROM user_counts uc
    CROSS JOIN contact_counts cc
    CROSS JOIN changelog_counts clc
    CROSS JOIN today_logins tl
    CROSS JOIN today_contacts tc
    LEFT JOIN most_active_today ma ON true
    LEFT JOIN last_login ll ON true
    LEFT JOIN last_contact lc ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity timeline
CREATE OR REPLACE FUNCTION get_user_activity_timeline(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    activity_timestamp TIMESTAMP WITH TIME ZONE,
    user_name VARCHAR(255),
    action VARCHAR(20),
    entity VARCHAR(20),
    description TEXT,
    entity_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.timestamp,
        c.user_name,
        c.action,
        c.entity,
        c.description,
        c.entity_name
    FROM changelog c
    WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
    ORDER BY c.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get hourly activity chart data
CREATE OR REPLACE FUNCTION get_hourly_activity_chart(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    hour_of_day INTEGER,
    day_date DATE,
    activity_count BIGINT,
    login_count BIGINT,
    contact_activity_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM c.timestamp)::INTEGER as hour_of_day,
        DATE(c.timestamp) as day_date,
        COUNT(*) as activity_count,
        COUNT(*) FILTER (WHERE c.action = 'login') as login_count,
        COUNT(*) FILTER (WHERE c.entity = 'contact') as contact_activity_count
    FROM changelog c
    WHERE c.timestamp >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY EXTRACT(HOUR FROM c.timestamp), DATE(c.timestamp)
    ORDER BY day_date DESC, hour_of_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for dashboard functions
GRANT EXECUTE ON FUNCTION public.get_system_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hourly_activity_chart TO authenticated;

-- Success message
SELECT 'Setup complete! Contact management and changelog functions are now available.' as status;