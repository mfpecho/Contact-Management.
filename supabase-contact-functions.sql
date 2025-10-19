-- Contact Management Functions for Supabase
-- Copy and paste this into Supabase SQL Editor if the main file has issues

-- Function to create a new contact (Enhanced for data accuracy)
CREATE OR REPLACE FUNCTION create_contact_simple(
    contact_first_name text,
    contact_last_name text,
    contact_birthday date,
    contact_phone text,
    contact_company text,
    contact_user_id uuid,
    contact_middle_name text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_contact_id uuid;
    cleaned_first_name text;
    cleaned_middle_name text;
    cleaned_last_name text;
    cleaned_phone text;
    cleaned_company text;
BEGIN
    -- Enhanced data cleaning and validation
    cleaned_first_name := trim(COALESCE(contact_first_name, ''));
    cleaned_middle_name := trim(COALESCE(contact_middle_name, ''));
    cleaned_last_name := trim(COALESCE(contact_last_name, ''));
    cleaned_phone := trim(COALESCE(contact_phone, ''));
    cleaned_company := trim(COALESCE(contact_company, ''));
    
    -- Log input data for debugging
    RAISE NOTICE 'Creating contact with data: FirstName=%, MiddleName=%, LastName=%, Birthday=%, Phone=%, Company=%, UserID=%', 
        cleaned_first_name, cleaned_middle_name, cleaned_last_name, contact_birthday, cleaned_phone, cleaned_company, contact_user_id;
    
    -- Enhanced validation
    IF cleaned_first_name = '' THEN
        RETURN json_build_object('success', false, 'error', 'First name is required and cannot be empty');
    END IF;
    
    IF cleaned_last_name = '' THEN
        RETURN json_build_object('success', false, 'error', 'Last name is required and cannot be empty');
    END IF;
    
    IF cleaned_phone = '' THEN
        RETURN json_build_object('success', false, 'error', 'Phone number is required and cannot be empty');
    END IF;
    
    IF cleaned_company = '' THEN
        RETURN json_build_object('success', false, 'error', 'Company is required and cannot be empty');
    END IF;
    
    IF contact_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    IF contact_birthday IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Birthday is required');
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = contact_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'User not found with ID: ' || contact_user_id);
    END IF;
    
    RAISE NOTICE 'All validations passed, inserting contact: % %', cleaned_first_name, cleaned_last_name;
    
    -- Insert new contact with cleaned data
    INSERT INTO contacts (
        first_name,
        middle_name,
        last_name,
        birthday,
        phone,
        company,
        user_id
    ) VALUES (
        cleaned_first_name,
        cleaned_middle_name,
        cleaned_last_name,
        contact_birthday,
        cleaned_phone,
        cleaned_company,
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

-- Function to get contacts for a user (Enhanced for data accuracy)
CREATE OR REPLACE FUNCTION get_contacts_simple(
    user_id_filter uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contacts_result json;
    contact_count integer;
BEGIN
    -- Log the request for debugging
    RAISE NOTICE 'get_contacts_simple called with user_id_filter: %', user_id_filter;
    
    -- If no user filter is provided, return all contacts (for admins)
    -- If user filter is provided, return only that user's contacts
    IF user_id_filter IS NULL THEN
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts;
        RAISE NOTICE 'Fetching all % contacts from database', contact_count;
        
        -- Fixed: Remove ORDER BY from json_agg and use a subquery instead
        WITH ordered_contacts AS (
            SELECT 
                c.id,
                c.first_name,
                c.middle_name,
                c.last_name,
                c.birthday,
                c.phone,
                c.company,
                c.user_id,
                c.created_at,
                u.name as user_name
            FROM contacts c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        )
        SELECT json_agg(
            json_build_object(
                'id', oc.id::text,
                'firstName', COALESCE(oc.first_name, ''),
                'middleName', COALESCE(oc.middle_name, ''),
                'lastName', COALESCE(oc.last_name, ''),
                'birthday', COALESCE(oc.birthday::text, ''),
                'contactNumber', COALESCE(oc.phone, ''),
                'company', COALESCE(oc.company, ''),
                'ownerId', COALESCE(oc.user_id::text, ''),
                'ownerName', COALESCE(oc.user_name, 'Unknown User'),
                'createdAt', COALESCE(oc.created_at::text, '')
            )
        ) INTO contacts_result
        FROM ordered_contacts oc;
    ELSE
        -- Get count first for logging
        SELECT COUNT(*) INTO contact_count FROM contacts WHERE user_id = user_id_filter;
        RAISE NOTICE 'Fetching % contacts for user %', contact_count, user_id_filter;
        
        -- Fixed: Remove ORDER BY from json_agg and use a subquery instead
        WITH ordered_contacts AS (
            SELECT 
                c.id,
                c.first_name,
                c.middle_name,
                c.last_name,
                c.birthday,
                c.phone,
                c.company,
                c.user_id,
                c.created_at,
                u.name as user_name
            FROM contacts c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.user_id = user_id_filter
            ORDER BY c.created_at DESC
        )
        SELECT json_agg(
            json_build_object(
                'id', oc.id::text,
                'firstName', COALESCE(oc.first_name, ''),
                'middleName', COALESCE(oc.middle_name, ''),
                'lastName', COALESCE(oc.last_name, ''),
                'birthday', COALESCE(oc.birthday::text, ''),
                'contactNumber', COALESCE(oc.phone, ''),
                'company', COALESCE(oc.company, ''),
                'ownerId', COALESCE(oc.user_id::text, ''),
                'ownerName', COALESCE(oc.user_name, 'Unknown User'),
                'createdAt', COALESCE(oc.created_at::text, '')
            )
        ) INTO contacts_result
        FROM ordered_contacts oc;
    END IF;
    
    -- If no contacts found, return empty array
    IF contacts_result IS NULL THEN
        contacts_result := '[]'::json;
        RAISE NOTICE 'No contacts found, returning empty array';
    ELSE
        RAISE NOTICE 'Returning % contacts', json_array_length(contacts_result);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'contacts', contacts_result,
        'count', COALESCE(json_array_length(contacts_result), 0)
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

-- Test the functions
SELECT 'Contact management functions created successfully!' as status;