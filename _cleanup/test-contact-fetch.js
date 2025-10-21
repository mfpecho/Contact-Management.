// Test Contact Fetching with Fallback
// Run this in browser console to test the new contact fetching mechanism

async function testContactFetch() {
  console.log('🧪 Testing Contact Fetch with Fallback Mechanism...')
  
  try {
    // Test if we have access to the superAdminService
    if (typeof window.superAdminService === 'undefined') {
      console.error('❌ superAdminService not available in window object')
      return
    }
    
    console.log('✅ superAdminService found')
    
    // Test 1: Fetch all contacts (admin/superadmin view)
    console.log('\n📋 Test 1: Fetching all contacts...')
    const allContactsResult = await window.superAdminService.getContacts()
    console.log('All contacts result:', allContactsResult)
    
    if (allContactsResult && allContactsResult.success) {
      console.log(`✅ Successfully fetched ${allContactsResult.contacts.length} contacts (all)`)
      if (allContactsResult.contacts.length > 0) {
        console.log('Sample contact:', allContactsResult.contacts[0])
      }
    } else {
      console.log('❌ Failed to fetch all contacts:', allContactsResult?.error)
    }
    
    // Test 2: Fetch contacts for a specific user (if we have a current user)
    if (typeof window.currentUser !== 'undefined' && window.currentUser?.id) {
      console.log(`\n👤 Test 2: Fetching contacts for user ${window.currentUser.id}...`)
      const userContactsResult = await window.superAdminService.getContacts(window.currentUser.id)
      console.log('User contacts result:', userContactsResult)
      
      if (userContactsResult && userContactsResult.success) {
        console.log(`✅ Successfully fetched ${userContactsResult.contacts.length} contacts for user`)
        if (userContactsResult.contacts.length > 0) {
          console.log('Sample user contact:', userContactsResult.contacts[0])
        }
      } else {
        console.log('❌ Failed to fetch user contacts:', userContactsResult?.error)
      }
    } else {
      console.log('\n⚠️ No current user available for user-specific test')
    }
    
    // Test 3: Test direct Supabase connection
    console.log('\n🔌 Test 3: Testing direct Supabase table access...')
    try {
      const directResult = await window.superAdminService.supabase
        .from('contacts')
        .select('id, first_name, last_name, user_id')
        .limit(5)
      
      console.log('Direct table query result:', directResult)
      
      if (directResult.data) {
        console.log(`✅ Direct access successful - found ${directResult.data.length} contacts`)
      } else {
        console.log('❌ Direct access failed:', directResult.error)
      }
    } catch (directError) {
      console.log('❌ Direct access error:', directError)
    }
    
    console.log('\n🏁 Contact fetch test completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
console.log('🚀 Contact Fetch Test Loaded!')
console.log('Run testContactFetch() to start the test')

// Auto-run if this is executed directly
if (typeof window !== 'undefined') {
  window.testContactFetch = testContactFetch
}