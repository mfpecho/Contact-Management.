// Test authentication for debugging
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xbqplhqinwgcnzlqthtc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXBsaHFpbndnY256bHF0aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTMzMDcsImV4cCI6MjA1MjM2OTMwN30.eWUOcAWOEf1_vJ4YaO0Dko6FTmBh2VJhOKOMBhJhDKg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCreateAndAuthUser() {
  try {
    console.log('Creating test user...')
    
    // Create a test user
    const createResult = await supabase.rpc('create_user_simple', {
      user_email: 'testuser@example.com',
      user_password: 'testpass123',
      user_name: 'Test User',
      user_username: 'testuser',
      user_employee_number: 'EMP001',
      user_position: 'Developer',
      user_role: 'user'
    })
    
    console.log('Create result:', createResult)
    
    if (createResult.error) {
      console.error('Failed to create user:', createResult.error)
      return
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Attempting to authenticate...')
    
    // Try to authenticate
    const authResult = await supabase.rpc('authenticate_user_simple', {
      user_email: 'testuser@example.com',
      user_password: 'testpass123'
    })
    
    console.log('Auth result:', authResult)
    
    // Debug the user
    const debugResult = await supabase.rpc('debug_user_auth', {
      user_email: 'testuser@example.com'
    })
    
    console.log('Debug result:', debugResult)
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testCreateAndAuthUser()