// Debug script to test contact retrieval from Supabase
// Run this in browser console to debug contact issues

async function debugContacts() {
  console.log('=== CONTACT DEBUG SCRIPT ===');
  
  // Check if we have access to the supabase client
  if (typeof supabase === 'undefined') {
    console.error('Supabase client not available');
    return;
  }
  
  try {
    console.log('1. Testing basic table access...');
    const { data: tableTest, error: tableError } = await supabase
      .from('contacts')
      .select('count');
    
    console.log('Table test result:', { data: tableTest, error: tableError });
    
    console.log('2. Testing direct contact query...');
    const { data: directContacts, error: directError } = await supabase
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
        users!inner(name)
      `);
    
    console.log('Direct contacts query:', { data: directContacts, error: directError });
    
    console.log('3. Testing RPC function...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_contacts_simple', {
      user_id_filter: null
    });
    
    console.log('RPC contacts result:', { data: rpcResult, error: rpcError });
    
    console.log('4. Testing with specific user filter...');
    // Get current user from localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      console.log('Current user:', currentUser);
      
      const { data: userRpcResult, error: userRpcError } = await supabase.rpc('get_contacts_simple', {
        user_id_filter: currentUser.id
      });
      
      console.log('User-specific contacts result:', { data: userRpcResult, error: userRpcError });
    } else {
      console.log('No current user found in localStorage');
    }
    
    console.log('5. Checking localStorage...');
    const storedContacts = localStorage.getItem('contacts');
    if (storedContacts) {
      const contacts = JSON.parse(storedContacts);
      console.log('Contacts in localStorage:', contacts);
    } else {
      console.log('No contacts in localStorage');
    }
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
  
  console.log('=== DEBUG COMPLETE ===');
}

// Auto-run the debug function
debugContacts();