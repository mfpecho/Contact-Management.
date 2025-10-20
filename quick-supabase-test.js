// QUICK SUPABASE CONNECTION TEST
// Run this in your browser console to test basic connectivity

async function quickConnectionTest() {
  console.log('🔗 SUPABASE CONNECTION TEST');
  console.log('='.repeat(40));
  
  // Test 1: Check if supabase client exists
  console.log('1️⃣ Checking Supabase client...');
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found! Check if it\'s loaded.');
    return;
  } else {
    console.log('✅ Supabase client found');
  }
  
  // Test 2: Test basic query
  console.log('\n2️⃣ Testing basic table query...');
  try {
    const { data, error, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ Query Error:', error);
      console.log('🔧 Possible fixes:');
      console.log('   - Check RLS policies');
      console.log('   - Verify table permissions');
      console.log('   - Check authentication');
    } else {
      console.log(`✅ Query successful! Found ${count} contacts in database`);
    }
  } catch (err) {
    console.error('💥 Connection failed:', err);
  }
  
  // Test 3: Test RPC function
  console.log('\n3️⃣ Testing RPC function...');
  try {
    const { data, error } = await supabase.rpc('get_contacts_simple', {
      user_id_filter: null
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      console.log('🔧 Possible fixes:');
      console.log('   - Check if function exists');
      console.log('   - Verify function permissions');
      console.log('   - Check function parameters');
    } else {
      console.log('✅ RPC function works!');
      console.log('📊 RPC returned:', Array.isArray(data) ? `${data.length} contacts` : data);
    }
  } catch (err) {
    console.error('💥 RPC failed:', err);
  }
  
  // Test 4: Check authentication
  console.log('\n4️⃣ Checking authentication...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth Error:', error);
    } else if (session) {
      console.log('✅ User authenticated:', session.user.email);
    } else {
      console.log('⚠️ No active session (using anon access)');
    }
  } catch (err) {
    console.error('💥 Auth check failed:', err);
  }
  
  console.log('\n🏁 Connection test complete!');
}

// Auto-run the test
quickConnectionTest();

// Make available for manual testing
window.quickConnectionTest = quickConnectionTest;
console.log('\n💡 Run quickConnectionTest() anytime to retest connection');