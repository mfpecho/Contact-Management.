import { createClient } from '@supabase/supabase-js'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
// Using fallback values for development - replace with your actual Supabase credentials
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://orzsfqxcllonmokdnnbb.supabase.co'
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yenNmcXhjbGxvbm1va2RubmJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjc1OTMsImV4cCI6MjA3MzYwMzU5M30.W_v8JfJJn9M3Ud_3d-oKnPACdtfI-LW_1SniVt0YGDY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')
    
    // Test basic table access
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Supabase table access test failed:', error)
      
      // Test RPC function
      console.log('Testing RPC function...')
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_simple', {
        user_email: 'test@test.com',
        user_password: 'test123',
        user_name: 'Test User',
        user_username: 'testuser',
        user_employee_number: 'TEST001',
        user_position: 'Test Position',
        user_role: 'user'
      })
      console.log('RPC test result:', { data: rpcData, error: rpcError })
      
      return false
    }
    console.log('Supabase connection test successful:', data)
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Database table names
export const TABLES = {
  USERS: 'users',
  CONTACTS: 'contacts', 
  CHANGELOG: 'changelog'
} as const

// Database types
export interface DatabaseUser {
  id: string
  email: string
  password_hash: string
  role: 'user' | 'admin' | 'superadmin'
  name: string
  username: string
  employee_number: string
  position: string
  avatar: string
  created_at: string
  updated_at: string
}

export interface DatabaseContact {
  id: string
  first_name: string
  middle_name: string
  last_name: string
  birthday: string
  phone: string
  company: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface DatabaseChangelog {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_role: 'user' | 'admin' | 'superadmin'
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'download'
  entity: 'contact' | 'user' | 'system'
  entity_id?: string
  entity_name?: string
  description: string
  details?: string
  created_at: string
}

// Authentication functions
export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw error
    }
    
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      throw error
    }
    return session
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      throw error
    }
    return user
  },

  // Subscribe to auth changes
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// User database functions
export const userService = {
  // Get user profile by auth user ID
  async getUserProfile(authUserId: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', authUserId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  },

  // Get user profile by email
  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }
    
    return data
  },

  // Create user profile
  async createUserProfile(userData: Omit<DatabaseUser, 'created_at' | 'updated_at'>): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([userData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
    
    return data
  },

  // Update user profile
  async updateUserProfile(id: string, updates: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
    
    return data
  }
}

// SuperAdmin-specific user management functions
export const superAdminService = {
  // Create new user (SuperAdmin only)
  async createUser(userData: {
    email: string
    password: string
    name: string
    username: string
    employee_number: string
    position: string
    role: 'user' | 'admin' | 'superadmin'
    avatar?: string
  }) {
    console.log('Supabase createUser called with userData:', userData)
    
    const rpcParams = {
      user_email: userData.email,
      user_password: userData.password,
      user_name: userData.name,
      user_username: userData.username,
      user_employee_number: userData.employee_number,
      user_position: userData.position,
      user_role: userData.role
    }
    
    console.log('Calling RPC create_user_simple with params:', rpcParams)
    
    const { data, error } = await supabase.rpc('create_user_simple', rpcParams)
    
    console.log('RPC create_user_simple response - data:', data, 'error:', error)
    
    if (error) {
      console.error('Error creating user:', error)
      throw error
    }
    
    return data
  },

  // Update user (SuperAdmin only)
  async updateUser(userId: string, updates: {
    email?: string
    name?: string
    username?: string
    employee_number?: string
    position?: string
    role?: 'user' | 'admin' | 'superadmin'
    avatar?: string
  }) {
    const { data, error } = await supabase.rpc('update_user_simple', {
      user_id: userId,
      user_email: updates.email,
      user_name: updates.name,
      user_username: updates.username,
      user_employee_number: updates.employee_number,
      user_position: updates.position,
      user_role: updates.role
    })
    
    if (error) {
      console.error('Error updating user:', error)
      throw error
    }
    
    return data
  },

  // Delete user (SuperAdmin only)
  async deleteUser(userId: string) {
    const { data, error } = await supabase.rpc('delete_user_simple', {
      user_id: userId
    })
    
    if (error) {
      console.error('Error deleting user:', error)
      throw error
    }
    
    return data
  },

  // Get all users (SuperAdmin and Admin only)
  async getAllUsers(): Promise<DatabaseUser[]> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
    
    return data || []
  },

  // Reset user password (SuperAdmin only)
  async resetUserPassword(userId: string, newPassword: string) {
    const { data, error } = await supabase.rpc('reset_password_simple', {
      user_id: userId,
      new_password: newPassword
    })
    
    if (error) {
      console.error('Error resetting password:', error)
      throw error
    }
    
    return data
  },

  // Generate username suggestion
  async generateUsername(name: string, employeeNumber: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_username_simple', {
      full_name: name,
      emp_number: employeeNumber
    })
    
    if (error) {
      console.error('Error generating username:', error)
      throw error
    }
    
    return data
  },

  // Authenticate user against database
  async authenticateUser(email: string, password: string) {
    console.log('Authenticating user via Supabase:', email)
    console.log('Password length:', password.length)
    console.log('Email trimmed:', email.trim())
    
    const { data, error } = await supabase.rpc('authenticate_user_simple', {
      user_email: email.trim(),
      user_password: password
    })
    
    console.log('Authentication result:', { data, error })
    
    if (error) {
      console.error('Error authenticating user:', error)
      throw error
    }
    
    // If authentication successful, set the authentication context
    if (data && data.success && data.user && data.user.id) {
      console.log('Setting authentication context for user:', data.user.id)
      try {
        await supabase.rpc('set_auth_context', {
          user_id: data.user.id
        })
        console.log('Authentication context set successfully')
      } catch (contextError) {
        console.warn('Failed to set authentication context:', contextError)
        // Don't fail authentication if context setting fails
      }
    }
    
    return data
  },

  // Debug function to check user data
  async debugUserAuth(email: string) {
    console.log('Debugging user auth for:', email)
    
    const { data, error } = await supabase.rpc('debug_user_auth', {
      user_email: email
    })
    
    console.log('Debug result:', { data, error })
    
    if (error) {
      console.error('Error debugging user:', error)
      throw error
    }
    
    return data
  },

  // Contact management functions
  createContact: async (contactData: {
    firstName: string
    middleName: string
    lastName: string
    birthday: string
    contactNumber: string
    company: string
    userId: string
  }) => {
    console.log('Supabase createContact called with:', contactData)
    
    // Enhanced data validation and cleaning before sending to database
    const cleanedData = {
      firstName: contactData.firstName?.trim() || '',
      middleName: contactData.middleName?.trim() || '',
      lastName: contactData.lastName?.trim() || '',
      birthday: contactData.birthday?.trim() || '',
      contactNumber: contactData.contactNumber?.trim() || '',
      company: contactData.company?.trim() || '',
      userId: contactData.userId?.trim() || ''
    }
    
    // Validate required fields before sending
    if (!cleanedData.firstName) {
      throw new Error('First name is required')
    }
    if (!cleanedData.lastName) {
      throw new Error('Last name is required')
    }
    if (!cleanedData.birthday) {
      throw new Error('Birthday is required')
    }
    if (!cleanedData.contactNumber) {
      throw new Error('Contact number is required')
    }
    if (!cleanedData.company) {
      throw new Error('Company is required')
    }
    if (!cleanedData.userId) {
      throw new Error('User ID is required')
    }
    
    // Validate birthday format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(cleanedData.birthday)) {
      throw new Error('Birthday must be in YYYY-MM-DD format')
    }
    
    const rpcParams = {
      contact_first_name: cleanedData.firstName,
      contact_last_name: cleanedData.lastName,
      contact_birthday: cleanedData.birthday,
      contact_phone: cleanedData.contactNumber,
      contact_company: cleanedData.company,
      contact_user_id: cleanedData.userId,
      contact_middle_name: cleanedData.middleName
    }
    
    console.log('Calling RPC create_contact_simple with validated params:', rpcParams)
    
    const { data, error } = await supabase.rpc('create_contact_simple', rpcParams)
    
    console.log('RPC create_contact_simple response - data:', data, 'error:', error)
    
    if (error) {
      console.error('Error creating contact:', error)
      throw error
    }
    
    return data
  },

  getContacts: async (userId?: string) => {
    console.log('Supabase getContacts called with userId:', userId)
    
    try {
      // Try collaborative function first (works for all user types)
      console.log('Attempting collaborative contact fetch...')
      
      try {
        const { data: collaborativeData, error: collaborativeError } = await supabase.rpc('get_all_contacts_collaborative')
        
        console.log('RPC get_all_contacts_collaborative response - data:', collaborativeData, 'error:', collaborativeError)
        
        if (!collaborativeError && collaborativeData && collaborativeData.success) {
          console.log('✅ Collaborative contact fetch successful:', collaborativeData.count, 'contacts')
          return collaborativeData
        }
      } catch (collaborativeErr) {
        console.log('Collaborative function error:', collaborativeErr)
      }
      
      // Fallback 1: Try superadmin function
      console.log('Collaborative function failed, trying superadmin function...')
      
      try {
        const { data: superadminData, error: superadminError } = await supabase.rpc('get_contacts_for_superadmin')
        
        console.log('RPC get_contacts_for_superadmin response - data:', superadminData, 'error:', superadminError)
        
        if (!superadminError && superadminData && superadminData.success) {
          console.log('✅ Superadmin contact fetch successful:', superadminData.count, 'contacts')
          return superadminData
        }
      } catch (superadminErr) {
        console.log('Superadmin function error:', superadminErr)
      }
      
      // Fallback 2: Try the original function with safe userId
      console.log('Advanced functions failed, trying original get_contacts_simple...')
      
      // Ensure userId is properly handled (convert empty string to null)
      const safeUserId = userId && userId.trim() !== '' ? userId : null
      console.log('Using safe userId:', safeUserId, '(original:', userId, ')')
      
      const { data, error } = await supabase.rpc('get_contacts_simple', {
        user_id_filter: safeUserId
      })
      
      console.log('RPC get_contacts_simple response - data:', data, 'error:', error)
      
      if (error) {
        console.warn('RPC function failed, trying direct table query fallback:', error)
        throw error // This will trigger the fallback
      }
      
      if (data && data.success) {
        console.log('✅ Original function successful:', data.count || 0, 'contacts')
        return data
      }
      
      console.warn('Original function returned unsuccessful result:', data)
      throw new Error('All RPC functions failed')  
    } catch (rpcError) {
      console.log('RPC function failed, using direct table query fallback')
      
      try {
        // Fallback: Direct table query with JOIN
        let query = supabase
          .from('contacts')
          .select(`
            id,
            first_name,
            middle_name,
            last_name,
            birthday,
            phone,
            company,
            user_id,
            created_at,
            users!contacts_user_id_fkey (
              name
            )
          `)
          .order('created_at', { ascending: false })
        
        // Apply user filter if specified
        if (userId) {
          query = query.eq('user_id', userId)
          console.log('Applying user filter for userId:', userId)
        } else {
          console.log('Fetching all contacts (no user filter)')
        }
        
        const { data: contactsData, error: queryError } = await query
        
        console.log('Direct table query response - data count:', contactsData?.length, 'error:', queryError)
        
        if (queryError) {
          console.error('Direct table query also failed:', queryError)
          return {
            success: false,
            error: 'Failed to fetch contacts: ' + queryError.message,
            contacts: []
          }
        }
        
        // Transform the data to match the expected format
        const transformedContacts = (contactsData || []).map(contact => {
          const userData = Array.isArray(contact.users) ? contact.users[0] : contact.users
          return {
            id: contact.id,
            firstName: contact.first_name || '',
            middleName: contact.middle_name || '',
            lastName: contact.last_name || '',
            birthday: contact.birthday || '',
            contactNumber: contact.phone || '',
            company: contact.company || '',
            ownerId: contact.user_id || '',
            ownerName: userData?.name || 'Unknown User',
            createdAt: contact.created_at || ''
          }
        })
        
        console.log('✅ Fallback successful - transformed contacts:', transformedContacts.length)
        
        return {
          success: true,
          contacts: transformedContacts,
          count: transformedContacts.length
        }
      } catch (fallbackError) {
        console.error('Both RPC and direct query failed:', fallbackError)
        return {
          success: false,
          error: 'All contact fetch methods failed: ' + (fallbackError as Error).message,
          contacts: []
        }
      }
    }
  },

  updateContact: async (contactId: string, contactData: {
    firstName?: string
    middleName?: string
    lastName?: string
    birthday?: string
    contactNumber?: string
    company?: string
  }) => {
    console.log('Supabase updateContact called with:', { contactId, contactData })
    
    const rpcParams = {
      contact_id: contactId,
      contact_first_name: contactData.firstName || null,
      contact_middle_name: contactData.middleName || null,
      contact_last_name: contactData.lastName || null,
      contact_birthday: contactData.birthday || null,
      contact_phone: contactData.contactNumber || null,
      contact_company: contactData.company || null
    }
    
    console.log('Calling RPC update_contact_simple with params:', rpcParams)
    
    const { data, error } = await supabase.rpc('update_contact_simple', rpcParams)
    
    console.log('RPC update_contact_simple response - data:', data, 'error:', error)
    
    if (error) {
      console.error('Error updating contact:', error)
      throw error
    }
    
    return data
  },

  deleteContact: async (contactId: string) => {
    console.log('Supabase deleteContact called with contactId:', contactId)
    
    const { data, error } = await supabase.rpc('delete_contact_simple', {
      contact_id: contactId
    })
    
    console.log('RPC delete_contact_simple response - data:', data, 'error:', error)
    
    if (error) {
      console.error('Error deleting contact:', error)
      throw error
    }
    
    return data
  }
}