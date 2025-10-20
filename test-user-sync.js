// Test User Sync Functionality
// This file tests the new get_users_simple function and user synchronization

console.log('🧪 Starting User Sync Test Suite...')

// Test 1: Check if get_users_simple function exists
async function testGetUsersSimpleFunction() {
  console.log('\n📋 Test 1: Testing get_users_simple function...')
  
  try {
    const { createClient } = supabase
    const supabaseUrl = 'YOUR_SUPABASE_URL'
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
    const client = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await client.rpc('get_users_simple')
    
    if (error) {
      console.error('❌ get_users_simple function error:', error)
      return false
    }
    
    if (data && data.success) {
      console.log('✅ get_users_simple function works correctly')
      console.log(`📊 Users found: ${data.count}`)
      
      if (data.users && data.users.length > 0) {
        console.log('👥 Sample users:')
        data.users.slice(0, 3).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
        })
        
        // Check role distribution
        const roleCount = data.users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {})
        
        console.log('🏷️ Role distribution:')
        Object.entries(roleCount).forEach(([role, count]) => {
          console.log(`  - ${role}: ${count} users`)
        })
        
        return true
      } else {
        console.warn('⚠️ No users returned from function')
        return false
      }
    } else {
      console.error('❌ Function returned failure:', data?.error || 'Unknown error')
      return false
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Test 2: Check user sync in DatabaseContext
async function testUserSyncInContext() {
  console.log('\n🔄 Test 2: Testing user sync in DatabaseContext...')
  
  try {
    // Check if DatabaseContext is available
    if (typeof useDatabaseContext === 'undefined') {
      console.warn('⚠️ DatabaseContext not available in this environment')
      return false
    }
    
    const { users, refreshUsers, usersLoading } = useDatabaseContext()
    
    console.log('Current users in context:', users.length)
    console.log('Loading state:', usersLoading)
    
    // Test refresh functionality
    console.log('🔄 Testing refreshUsers function...')
    await refreshUsers()
    
    console.log('✅ refreshUsers completed successfully')
    console.log(`📊 Users after refresh: ${users.length}`)
    
    if (users.length > 0) {
      console.log('👥 Users in context:')
      users.slice(0, 3).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
      })
      return true
    } else {
      console.warn('⚠️ No users found in context after refresh')
      return false
    }
  } catch (error) {
    console.error('❌ Context test failed:', error)
    return false
  }
}

// Test 3: Check session storage sync
function testSessionStorageSync() {
  console.log('\n💾 Test 3: Testing session storage sync...')
  
  try {
    const usersData = sessionStorage.getItem('users')
    const lastSync = sessionStorage.getItem('lastUserSync')
    
    if (usersData) {
      const users = JSON.parse(usersData)
      console.log('✅ Users found in session storage:', users.length)
      
      if (lastSync) {
        const syncTime = new Date(lastSync)
        console.log('📅 Last sync time:', syncTime.toLocaleString())
        
        // Check if sync is recent (within last hour)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        if (syncTime > hourAgo) {
          console.log('✅ Recent sync detected')
        } else {
          console.warn('⚠️ Sync is older than 1 hour')
        }
      }
      
      // Check user structure
      if (users.length > 0) {
        const sampleUser = users[0]
        const hasRequiredFields = sampleUser.id && sampleUser.name && sampleUser.email && sampleUser.role
        
        if (hasRequiredFields) {
          console.log('✅ User structure is valid')
        } else {
          console.warn('⚠️ User structure is missing required fields')
        }
      }
      
      return true
    } else {
      console.warn('⚠️ No users found in session storage')
      return false
    }
  } catch (error) {
    console.error('❌ Session storage test failed:', error)
    return false
  }
}

// Test 4: Check database permissions
async function testDatabasePermissions() {
  console.log('\n🔐 Test 4: Testing database permissions...')
  
  try {
    const { createClient } = supabase
    const supabaseUrl = 'YOUR_SUPABASE_URL'
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
    const client = createClient(supabaseUrl, supabaseKey)
    
    // Test function permissions
    const { data, error } = await client.rpc('get_users_simple')
    
    if (error) {
      if (error.message.includes('permission denied') || error.message.includes('not allowed')) {
        console.error('❌ Permission denied for get_users_simple function')
        console.log('💡 Run this SQL to fix permissions:')
        console.log('GRANT EXECUTE ON FUNCTION get_users_simple TO authenticated;')
        console.log('GRANT EXECUTE ON FUNCTION get_users_simple TO anon;')
        return false
      } else {
        console.warn('⚠️ Other error occurred:', error.message)
        return false
      }
    } else {
      console.log('✅ Function permissions are correctly configured')
      return true
    }
  } catch (error) {
    console.error('❌ Permission test failed:', error)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running Complete User Sync Test Suite\n')
  
  const results = {
    functionTest: await testGetUsersSimpleFunction(),
    contextTest: await testUserSyncInContext(),
    sessionTest: testSessionStorageSync(),
    permissionTest: await testDatabasePermissions()
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase()
    console.log(`${status} - ${testName}`)
  })
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! User sync is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.')
    console.log('\n🛠️ Next steps:')
    console.log('1. Run fix-database-function-errors.sql in Supabase SQL Editor')
    console.log('2. Check database permissions are properly set')
    console.log('3. Verify Supabase connection configuration')
    console.log('4. Test again after fixes are applied')
  }
}

// Instructions for manual testing
console.log(`
🔧 Manual Testing Instructions:
==============================

1. Open your browser's Developer Console
2. Navigate to your app with an admin or superadmin account
3. Copy and paste this entire file into the console
4. Run: runAllTests()
5. Check the test results and follow any suggested fixes

📝 Expected Behavior:
- All users (not just superadmin) should be visible in the user management interface
- User data should sync from the database to the frontend
- Session storage should contain user data for offline access
- All user roles should be properly represented

🐛 If tests fail:
- First, ensure you've run the fix-database-function-errors.sql script
- Check that your Supabase connection is working
- Verify database permissions are correctly set
- Look for any console errors during the sync process
`)

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected. You can run: runAllTests()')
}