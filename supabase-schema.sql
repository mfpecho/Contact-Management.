-- Supabase Database Schema for Contacts Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'admin', 'superadmin')) DEFAULT 'user',
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  position VARCHAR(100) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  birthday DATE,
  phone VARCHAR(20),
  company VARCHAR(200),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Changelog table
CREATE TABLE changelog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(20) CHECK (user_role IN ('user', 'admin', 'superadmin')) NOT NULL,
  action VARCHAR(20) CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'export', 'download')) NOT NULL,
  entity VARCHAR(20) CHECK (entity IN ('contact', 'user', 'system')) NOT NULL,
  entity_id UUID,
  entity_name VARCHAR(255),
  description TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_employee_number ON users(employee_number);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_changelog_user_id ON changelog(user_id);
CREATE INDEX idx_changelog_action ON changelog(action);
CREATE INDEX idx_changelog_entity ON changelog(entity);
CREATE INDEX idx_changelog_timestamp ON changelog(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile and admins/superadmins can see all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Users can view their own contacts
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (user_id::text = auth.uid()::text);

-- Admins and superadmins can view all contacts
CREATE POLICY "Admins can view all contacts" ON contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts" ON contacts
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts" ON contacts
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (user_id::text = auth.uid()::text);

-- Changelog policies - only admins and superadmins can view changelog
CREATE POLICY "Admins can view changelog" ON changelog
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Only system can insert into changelog (through functions)
CREATE POLICY "System can insert changelog" ON changelog
    FOR INSERT WITH CHECK (true);

-- Insert sample superadmin user (password should be hashed in real implementation)
-- Note: In a real app, you should hash passwords properly
INSERT INTO users (email, password_hash, role, name, username, employee_number, position, avatar) VALUES
('admin@company.com', '$2b$10$example_hashed_password', 'superadmin', 'System Administrator', 'admin', 'EMP001', 'System Administrator', 'https://ui-avatars.com/api/?name=System+Administrator&background=3b82f6&color=fff');

-- Function to log changelog entries
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