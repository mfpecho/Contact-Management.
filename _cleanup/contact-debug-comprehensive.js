// COMPREHENSIVE CONTACT DEBUGGING SCRIPT
// Paste this in your browser console while your app is running

async function testAll() {
  console.log('🔍 COMPREHENSIVE CONTACT DEBUG STARTING...');
  console.log('='.repeat(50));
  
  // Test 1: Direct RPC call
  console.log('1️⃣ Testing RPC function directly...');
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_contacts_simple', {
      user_id_filter: null
    });
    console.log('✅ RPC Result (all contacts):', rpcData);
    console.log('❌ RPC Error:', rpcError);
    
    if (rpcData && Array.isArray(rpcData)) {
      console.log(`📊 Found ${rpcData.length} contacts via RPC`);
    }
  } catch (error) {
    console.error('💥 RPC Test Failed:', error);
  }
  
  // Test 2: Direct table query
  console.log('\n2️⃣ Testing direct table access...');
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('contacts')
      .select('*')
      .limit(10);
    console.log('✅ Table Result:', tableData);
    console.log('❌ Table Error:', tableError);
    
    if (tableData) {
      console.log(`📊 Found ${tableData.length} contacts via direct table`);
    }
  } catch (error) {
    console.error('💥 Table Test Failed:', error);
  }
  
  // Test 3: Your app's getContacts function
  console.log('\n3️⃣ Testing app getContacts function...');
  try {
    if (typeof superAdminService !== 'undefined' && superAdminService.getContacts) {
      const appData = await superAdminService.getContacts();
      console.log('✅ App Result:', appData);
      
      if (appData && Array.isArray(appData)) {
        console.log(`📊 Found ${appData.length} contacts via app function`);
      }
    } else {
      console.log('⚠️ superAdminService.getContacts not available');
    }
  } catch (error) {
    console.error('💥 App Test Failed:', error);
  }
  
  // Test 4: Count contacts in database
  console.log('\n4️⃣ Counting total contacts...');
  try {
    const { count, error } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });
    console.log('✅ Total contacts count:', count);
    console.log('❌ Count error:', error);
  } catch (error) {
    console.error('💥 Count Test Failed:', error);
  }
  
  // Test 5: Check for NULL user_id values
  console.log('\n5️⃣ Checking for NULL user_id values...');
  try {
    const { data: nullCheck, error: nullError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, user_id')
      .is('user_id', null)
      .limit(5);
    console.log('✅ Contacts with NULL user_id:', nullCheck);
    console.log('❌ NULL check error:', nullError);
    
    if (nullCheck && nullCheck.length > 0) {
      console.log('⚠️ FOUND CONTACTS WITH NULL USER_ID - This is likely the problem!');
    }
  } catch (error) {
    console.error('💥 NULL Check Failed:', error);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 DEBUG COMPLETE');
}

// Quick individual tests
async function testRPC() {
  const { data, error } = await supabase.rpc('get_contacts_simple', { user_id_filter: null });
  console.log('RPC Data:', data);
  console.log('RPC Error:', error);
  return data;
}

async function testTable() {
  const { data, error } = await supabase.from('contacts').select('*').limit(5);
  console.log('Table Data:', data);
  console.log('Table Error:', error);
  return data;
}

// Instructions
console.log(`
🚀 CONTACT DEBUGGING LOADED!

Run these commands:
1. testAll() - Run comprehensive tests
2. testRPC() - Test RPC function only  
3. testTable() - Test table access only

If you see "NULL user_id" contacts, that's your problem!
`);

// Make functions available globally
window.testAll = testAll;
window.testRPC = testRPC;
window.testTable = testTable;