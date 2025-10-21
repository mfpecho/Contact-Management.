// Test the new admin user functions
// Run this in browser console after applying admin-user-view-permissions.sql

console.log('🧪 Testing Admin User Functions...')

// Test 1: Check if user is admin
async function testIsAdmin() {
  console.log('\n🔍 Test 1: Checking if current user is admin...')
  
  try {
    const { data, error } = await supabase.rpc('is_admin_user')
    
    if (error) {
      console.error('❌ is_admin_user error:', error)
      return false
    }
    
    console.log('✅ is_admin_user result:', data)
    return data
  } catch (error) {
    console.error('❌ is_admin_user failed:', error)
    return false
  }
}

// Test 2: Get users for admin
async function testGetUsersForAdmin() {
  console.log('\n👥 Test 2: Getting users for admin...')
  
  try {
    const { data, error } = await supabase.rpc('get_users_for_admin')
    
    if (error) {
      console.error('❌ get_users_for_admin error:', error)
      return null
    }
    
    console.log('✅ get_users_for_admin result:')
    console.log('  - Success:', data?.success)
    console.log('  - Count:', data?.count)
    console.log('  - Users:', data?.users?.length || 0)
    
    if (data?.users && data.users.length > 0) {
      console.log('👤 Sample users:')
      data.users.slice(0, 3).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      })
    }
    
    return data
  } catch (error) {
    console.error('❌ get_users_for_admin failed:', error)
    return null
  }
}

// Test 3: Create test user (only if superadmin)
async function testCreateUser() {
  console.log('\n🆕 Test 3: Creating test user...')
  
  try {
    // Check if superadmin first
    const { data: isSuperAdmin, error: checkError } = await supabase.rpc('is_superadmin_user')
    
    if (checkError) {
      console.error('❌ Cannot check superadmin status:', checkError)
      return null
    }
    
    if (!isSuperAdmin) {
      console.warn('⚠️ Not a superadmin - skipping user creation test')
      return null
    }
    
    const testUserData = {
      p_name: 'Test User',
      p_email: `test.user.${Date.now()}@company.com`,
      p_username: `testuser${Date.now()}`,
      p_password_hash: '$2b$10$example_hash_for_testing',
      p_role: 'user',
      p_employee_number: `TEST${Date.now()}`,
      p_position: 'Test Position',
      p_avatar: null
    }
    
    console.log('Creating test user with data:', testUserData)
    
    const { data, error } = await supabase.rpc('create_user_by_admin', testUserData)
    
    if (error) {
      console.error('❌ create_user_by_admin error:', error)
      return null
    }
    
    console.log('✅ Test user created successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Test user creation failed:', error)
    return null
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running All Admin User Function Tests\n')
  
  const isAdmin = await testIsAdmin()
  
  if (!isAdmin) {
    console.log('❌ Current user is not admin - cannot run user management tests')
    return
  }
  
  const users = await testGetUsersForAdmin()
  
  if (users && users.success) {
    console.log(`\n📊 Current user count in database: ${users.count}`)
  }
  
  // Only test user creation if we're superadmin
  await testCreateUser()
  
  // Test users again to see if count increased
  console.log('\n🔄 Checking users again after test...')
  await testGetUsersForAdmin()
  
  console.log('\n✅ All tests completed!')
}

// Export functions for manual testing
window.adminUserTests = {
  testIsAdmin,
  testGetUsersForAdmin,
  testCreateUser,
  runAllTests
}

console.log(`
🎯 Admin User Function Tests Ready!

Usage:
- adminUserTests.runAllTests() - Run all tests
- adminUserTests.testIsAdmin() - Check if current user is admin
- adminUserTests.testGetUsersForAdmin() - Get all users
- adminUserTests.testCreateUser() - Create test user (superadmin only)

🔧 Expected Results:
✅ is_admin_user should return true for admin/superadmin
✅ get_users_for_admin should return user list with success: true
✅ create_user_by_admin should create users successfully (superadmin only)

🐛 If functions fail:
- Make sure admin-user-view-permissions.sql has been applied to Supabase
- Check that you're logged in as admin/superadmin
- Verify Supabase connection is working
`)

// Auto-run basic tests
console.log('🔍 Running basic admin check...')
testIsAdmin().then(isAdmin => {
  if (isAdmin) {
    console.log('✅ User has admin privileges - you can run user management tests')
  } else {
    console.log('⚠️ User does not have admin privileges')
  }
})