// User Management Debug Script
// Run this in your browser console to diagnose user loading issues

console.log('🔍 Starting User Management Debug Diagnostics...')

// Test 1: Check if get_users_simple function exists and works
async function testGetUsersSimpleFunction() {
  console.log('\n📋 Test 1: Testing get_users_simple function...')
  
  try {
    const { data, error } = await supabase.rpc('get_users_simple')
    
    if (error) {
      console.error('❌ get_users_simple function error:', error)
      console.log('💡 This means the database functions have not been applied yet!')
      console.log('🔧 SOLUTION: Run fix-database-function-errors.sql in Supabase SQL Editor')
      return false
    }
    
    if (data && data.success) {
      console.log('✅ get_users_simple function works correctly')
      console.log(`📊 Users in database: ${data.count}`)
      
      if (data.users && data.users.length > 0) {
        console.log('👥 Users from database:')
        data.users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
        })
        return data.users
      } else {
        console.warn('⚠️ Function works but no users returned')
        return []
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

// Test 2: Check context state
function testContextState() {
  console.log('\n🔄 Test 2: Checking context state...')
  
  try {
    const { users, usersLoading, currentUser } = useDatabaseContext()
    
    console.log('Context state:')
    console.log(`  - Current user: ${currentUser?.name} (${currentUser?.role})`)
    console.log(`  - Users loading: ${usersLoading}`)
    console.log(`  - Users in context: ${users.length}`)
    
    if (users.length > 0) {
      console.log('👥 Users in context:')
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
      })
    } else {
      console.warn('⚠️ No users in context - this is the problem!')
    }
    
    return { users, usersLoading, currentUser }
  } catch (error) {
    console.error('❌ Context test failed:', error)
    return null
  }
}

// Test 3: Check session storage
function testSessionStorage() {
  console.log('\n💾 Test 3: Checking session storage...')
  
  try {
    const usersData = sessionStorage.getItem('users')
    const lastSync = sessionStorage.getItem('lastUserSync')
    
    if (usersData) {
      const users = JSON.parse(usersData)
      console.log('✅ Users found in session storage:', users.length)
      
      if (lastSync) {
        console.log('📅 Last sync:', new Date(lastSync).toLocaleString())
      }
      
      if (users.length > 0) {
        console.log('👥 Session storage users:')
        users.slice(0, 3).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
        })
      }
      
      return users
    } else {
      console.warn('⚠️ No users in session storage')
      return null
    }
  } catch (error) {
    console.error('❌ Session storage test failed:', error)
    return null
  }
}

// Test 4: Manual refresh users
async function testManualRefresh() {
  console.log('\n🔄 Test 4: Testing manual user refresh...')
  
  try {
    const { refreshUsers } = useDatabaseContext()
    console.log('Calling refreshUsers manually...')
    
    await refreshUsers()
    console.log('✅ Manual refresh completed')
    
    // Check state after refresh
    const { users } = useDatabaseContext()
    console.log(`Users after refresh: ${users.length}`)
    
    return users
  } catch (error) {
    console.error('❌ Manual refresh failed:', error)
    return null
  }
}

// Test 5: Direct database query
async function testDirectDatabaseQuery() {
  console.log('\n🗄️ Test 5: Direct database query...')
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) {
      console.error('❌ Direct query error:', error)
      return null
    }
    
    console.log('✅ Direct database query successful')
    console.log(`📊 Users in database table: ${data.length}`)
    
    if (data.length > 0) {
      console.log('👥 Direct query users:')
      data.slice(0, 3).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
      })
    }
    
    return data
  } catch (error) {
    console.error('❌ Direct query failed:', error)
    return null
  }
}

// Test 6: Check user creation flow
function testUserCreationFlow() {
  console.log('\n👤 Test 6: User creation flow analysis...')
  
  // Check if createUserBySuperAdmin is available
  try {
    const { createUserBySuperAdmin } = useDatabaseContext()
    console.log('✅ createUserBySuperAdmin function is available')
    
    console.log('💡 To test user creation:')
    console.log('   1. Add a user through the UI')
    console.log('   2. Watch console for creation logs')
    console.log('   3. Check if refreshUsers is called after creation')
    console.log('   4. Verify users appear and stay visible')
    
    return true
  } catch (error) {
    console.error('❌ User creation function not available:', error)
    return false
  }
}

// Run comprehensive diagnostics
async function runComprehensiveUserDiagnostics() {
  console.log('🚀 Running Comprehensive User Management Diagnostics\n')
  
  const results = {
    databaseFunction: await testGetUsersSimpleFunction(),
    contextState: testContextState(),
    sessionStorage: testSessionStorage(),
    directQuery: await testDirectDatabaseQuery(),
    userCreation: testUserCreationFlow()
  }
  
  console.log('\n📊 Diagnostic Results Summary:')
  console.log('================================')
  
  // Database function test
  if (results.databaseFunction === false) {
    console.log('❌ Database function: FAILED - Functions not applied')
    console.log('🔧 ACTION REQUIRED: Run fix-database-function-errors.sql in Supabase')
  } else if (Array.isArray(results.databaseFunction)) {
    console.log(`✅ Database function: WORKING (${results.databaseFunction.length} users)`)
  }
  
  // Context state test
  if (results.contextState && results.contextState.users.length > 0) {
    console.log(`✅ Context state: WORKING (${results.contextState.users.length} users)`)
  } else {
    console.log('❌ Context state: NO USERS - This is the main issue')
  }
  
  // Direct query test
  if (Array.isArray(results.directQuery)) {
    console.log(`✅ Database table: ${results.directQuery.length} users exist`)
  } else {
    console.log('❌ Database table: Query failed')
  }
  
  console.log('\n🎯 Root Cause Analysis:')
  
  if (results.databaseFunction === false) {
    console.log('🚨 PRIMARY ISSUE: Database functions not applied')
    console.log('   Solution: Run the SQL script in Supabase SQL Editor')
  } else if (Array.isArray(results.directQuery) && results.directQuery.length > 0 && 
             (!results.contextState || results.contextState.users.length === 0)) {
    console.log('🚨 PRIMARY ISSUE: Users exist in database but not loading to frontend')
    console.log('   This suggests a sync issue between database and context')
  } else if (!Array.isArray(results.directQuery) || results.directQuery.length === 0) {
    console.log('🚨 PRIMARY ISSUE: No users in database table')
    console.log('   Users might not be saving to database during creation')
  }
  
  console.log('\n🛠️ Recommended Actions:')
  console.log('1. First: Apply fix-database-function-errors.sql to Supabase')
  console.log('2. Test: Run testManualRefresh() to see if users load')
  console.log('3. If still failing: Check Supabase logs for errors')
  console.log('4. Verify: User creation is actually saving to database')
  
  return results
}

// Quick fix function
async function quickFixUserLoading() {
  console.log('🔧 Attempting quick fix for user loading...')
  
  try {
    // Try manual refresh
    await testManualRefresh()
    
    // Check if it worked
    const { users } = useDatabaseContext()
    if (users.length > 0) {
      console.log('✅ Quick fix successful! Users are now loading.')
      return true
    } else {
      console.log('❌ Quick fix failed. Need to apply database functions.')
      return false
    }
  } catch (error) {
    console.error('❌ Quick fix failed:', error)
    return false
  }
}

// Instructions
console.log(`
🔧 User Management Debug Commands:
==================================

1. Run full diagnostics:
   runComprehensiveUserDiagnostics()

2. Quick fix attempt:
   quickFixUserLoading()

3. Test individual components:
   - testGetUsersSimpleFunction()
   - testContextState()
   - testManualRefresh()
   - testDirectDatabaseQuery()

4. If users appear briefly then disappear:
   - This usually means database functions aren't applied
   - Or there's a sync conflict between local and database state

📝 Expected Behavior:
- Users should stay visible after creation
- refreshUsers should successfully load all users
- Database function should return actual users from database

🐛 If diagnostics show function errors:
- CRITICAL: Run fix-database-function-errors.sql in Supabase SQL Editor
- This is the most common cause of user loading issues
`)

// Auto-run basic check
console.log('🔍 Running basic check...')
testContextState()
testSessionStorage()

// Export functions for manual use
window.userDebug = {
  runComprehensiveUserDiagnostics,
  quickFixUserLoading,
  testGetUsersSimpleFunction,
  testContextState,
  testManualRefresh,
  testDirectDatabaseQuery
}